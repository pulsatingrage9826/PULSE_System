import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveCycleId } from '@/utils/surveyCycleHelpers'
import { getCachedOrCompute } from '@/lib/ml-cache'

/**
 * GET /api/community-voice
 * Analyze survey comments to generate community voice insights
 * Query params: barangayId (optional)
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const barangayId = searchParams.get('barangayId')
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    // Use provided cycleId if given, otherwise fall back to active cycle
    const cycleIdParam = searchParams.get('cycleId')
    const activeCycleId = cycleIdParam ? parseInt(cycleIdParam) : await getActiveCycleId()
    if (!activeCycleId) {
      return NextResponse.json({ error: 'No active survey cycle found' }, { status: 400 })
    }

    console.log(`🔊 [COMMUNITY VOICE] Request for Barangay: ${barangayId || 'All'}, Cycle: ${activeCycleId}, Refresh: ${forceRefresh}`);

    // Use caching with 12-hour TTL for community voice analysis
    const result = await getCachedOrCompute(
      'community-voice-analysis',
      { barangayId: barangayId ? parseInt(barangayId) : 0, cycleId: activeCycleId },
      async () => {
        return await performCommunityVoiceAnalysis(barangayId, activeCycleId);
      },
      {
        ttl: 43200, // 12 hours
        staleWhileRevalidate: true,
        forceRefresh
      }
    );

    console.log(`✅ [COMMUNITY VOICE] Returned ${result.cached ? (result.stale ? 'stale cached' : 'fresh cached') : 'newly computed'} data`);

    return NextResponse.json({
      success: true,
      data: result.data,
      _cache: {
        cached: result.cached,
        stale: result.stale,
        computedAt: result.computedAt,
        expiresAt: result.expiresAt
      }
    });

  } catch (error) {
    console.error('Community voice analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze community voice' },
      { status: 500 }
    )
  }
}

/**
 * Perform community voice analysis (expensive operation)
 */
async function performCommunityVoiceAnalysis(barangayId: string | null, activeCycleId: number) {
    // Build query to get survey responses with section data
    let surveyQuery = supabaseAdmin
      .from('survey_response')
      .select(`
        response_id,
        barangay_id,
        respondent_name,
        submitted_at,
        survey_section (
          section_name,
          data
        ),
        barangay (
          barangay_name
        )
      `)
      .eq('survey_cycle_id', activeCycleId)
      .in('status', ['completed', 'submitted'])
      .order('submitted_at', { ascending: false })

    // Filter by barangay if specified
    if (barangayId) {
      surveyQuery = surveyQuery.eq('barangay_id', parseInt(barangayId))
    }

    const { data: surveyData, error } = await surveyQuery

    if (error) {
      console.error('Database error:', error)
      // Throw instead of returning NextResponse — this function is called inside
      // getCachedOrCompute's callback, so returning a NextResponse object would
      // cause it to be stored in ml_cache and served as data, poisoning the cache.
      throw new Error(error.message || 'Failed to fetch survey data')
    }

    console.log(`Fetched ${surveyData?.length || 0} survey responses for community voice analysis`)

    // Extract all comments and suggestions from the data JSON, filtering out empty ones
    const allComments: string[] = []
    const commentsByBarangay: { [key: string]: string[] } = {}
    
    surveyData?.forEach((row: any) => {
      const barangayName = row.barangay?.barangay_name || 'Unknown'
      
      if (!commentsByBarangay[barangayName]) {
        commentsByBarangay[barangayName] = []
      }
      
      // Process survey sections (could be multiple per response)
      const sections = Array.isArray(row.survey_section) ? row.survey_section : (row.survey_section ? [row.survey_section] : [])
      
      sections.forEach((section: any) => {
        // Parse the data JSON field
        let sectionData: any = {}
        try {
          if (typeof section?.data === 'string') {
            sectionData = JSON.parse(section.data)
          } else if (typeof section?.data === 'object') {
            sectionData = section.data
          }
        } catch (e) {
          console.warn('Failed to parse section data:', e)
          return
        }
        
        // Extract all fields that contain suggestions or comments
        Object.entries(sectionData).forEach(([key, value]) => {
          // Look for suggestion fields (suggestionsProjects, suggestionsFinancial, etc.)
          if (key.toLowerCase().includes('suggestion') && typeof value === 'string' && value.trim() !== '') {
            allComments.push(value.trim())
            commentsByBarangay[barangayName].push(value.trim())
          }
          // Look for comment fields
          else if (key.toLowerCase().includes('comment') && typeof value === 'string' && value.trim() !== '') {
            allComments.push(value.trim())
            commentsByBarangay[barangayName].push(value.trim())
          }
          // Look for details fields (like detailsCorruption)
          else if (key.toLowerCase().includes('details') && typeof value === 'string' && value.trim() !== '') {
            allComments.push(value.trim())
            commentsByBarangay[barangayName].push(value.trim())
          }
        })
      })
    })

    console.log(`Extracted ${allComments.length} comments from ${surveyData?.length || 0} responses`)

    if (allComments.length === 0) {
      return {
        barangay_id: barangayId,
        total_comments: 0,
        processed_comments: 0,
        message: 'No comments found for analysis',
        insights: [],
        themes: { counts: {}, percentages: {}, top_themes: [] },
        categories: { counts: { positive: 0, negative: 0, neutral: 0 }, percentages: { positive: 0, negative: 0, neutral: 0 } },
        cycle_id: activeCycleId,
        comments_by_barangay: commentsByBarangay
      }
    }

    // Call Python ML script directly (on-demand execution)
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      const path = require('path')
      const fs = require('fs').promises
      const os = require('os')
      
      // Prepare input data
      const inputData = {
        comments: allComments,
        barangay_id: barangayId ? parseInt(barangayId) : null
      }
      
      // Write input to temporary file (avoids command line length limits)
      const tempDir = os.tmpdir()
      const tempInputFile = path.join(tempDir, `cv_input_${Date.now()}.json`)
      const tempOutputFile = path.join(tempDir, `cv_output_${Date.now()}.json`)
      
      await fs.writeFile(tempInputFile, JSON.stringify(inputData), 'utf8')
      
      // Get the project root directory
      const projectRoot = path.join(process.cwd())
      const scriptPath = path.join(projectRoot, 'ml', 'analyze_community_voice_standalone.py')
      
      console.log(`Executing Python ML script: ${scriptPath}`)
      console.log(`Input file: ${tempInputFile}`)
      console.log(`Output file: ${tempOutputFile}`)
      
      // Use the virtual environment's Python interpreter
      const venvPython = process.platform === 'win32' 
        ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
        : path.join(process.cwd(), '.venv', 'bin', 'python');
      
      // Execute Python script with file paths
      const { stdout, stderr } = await execAsync(
        `"${venvPython}" "${scriptPath}" "${tempInputFile}" "${tempOutputFile}"`,
        { 
          timeout: 60000, // 60 second timeout for large datasets
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      )
      
      if (stderr) {
        console.warn('Python script warnings:', stderr)
      }
      
      // Read the output file
      const outputContent = await fs.readFile(tempOutputFile, 'utf8')
      const mlResult = JSON.parse(outputContent)
      
      // Clean up temporary files
      try {
        await fs.unlink(tempInputFile)
        await fs.unlink(tempOutputFile)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError)
      }
      
      if (!mlResult.success) {
        throw new Error(mlResult.error || 'ML analysis failed')
      }
      
      console.log('ML analysis completed successfully')
      
      return {
        ...mlResult,
        cycle_id: activeCycleId,
        comments_by_barangay: commentsByBarangay,
        ml_service_available: true
      }
      
    } catch (mlError) {
      console.error('ML script execution error:', mlError)
      
      // Fallback: basic analysis without ML
      const basicAnalysis = {
        barangay_id: barangayId,
        total_comments: allComments.length,
        processed_comments: allComments.length,
        themes: {
          counts: { general: allComments.length },
          percentages: { general: 100 },
          top_themes: [['general', 100]]
        },
        categories: {
          counts: { neutral: allComments.length },
          percentages: { neutral: 100 }
        },
        insights: [{
          type: 'info',
          title: 'Community Feedback Available',
          description: `${allComments.length} comments collected from community members`,
          priority: 'medium'
        }],
        sample_comments: allComments.slice(0, 3),
        ml_service_available: false
      }
      
      return {
        ...basicAnalysis,
        cycle_id: activeCycleId,
        comments_by_barangay: commentsByBarangay
      }
    }
}