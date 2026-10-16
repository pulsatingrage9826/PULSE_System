/**
 * Gemini AI Executive Summary Generator
 * Generates comprehensive executive summaries and action plans
 * based on survey data for a specific barangay
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase';
import { getCachedOrCompute } from '@/lib/ml-cache';
import { getGeminiApiKey, logTokenUsage, estimateTokens, checkTokenLimit } from '@/lib/gemini-config';
import { calculateServiceFunnelMetrics, ServiceFunnelMetrics } from '@/lib/funnel-calculations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barangayId, cycleId, forceRefresh } = body;

    if (!barangayId || !cycleId) {
      return NextResponse.json(
        { error: 'barangayId and cycleId are required' },
        { status: 400 }
      );
    }

    console.log(`🤖 [GEMINI] Generating executive summary for Barangay ${barangayId}, Cycle ${cycleId}`);

    // Check if survey is complete by counting actual completed/submitted responses
    // against the target — avoids reading the stale survey_target.percentage column.
    const { data: targetRow, error: targetError } = await supabaseAdmin
      .from('survey_target')
      .select('target')
      .eq('barangay_id', barangayId)
      .eq('survey_cycle_id', cycleId)
      .single();

    if (targetError && targetError.code !== 'PGRST116') {
      console.error('Error checking survey target:', targetError);
    }

    const { count: achievedCount } = await supabaseAdmin
      .from('survey_response')
      .select('*', { count: 'exact', head: true })
      .eq('barangay_id', barangayId)
      .eq('survey_cycle_id', cycleId)
      .in('status', ['completed', 'submitted']);

    const target = targetRow?.target || 0;
    const progress = target > 0 ? Math.min(100, Math.round(((achievedCount || 0) / target) * 100)) : 0;

    // If survey is not complete, return a special response
    if (progress < 100) {
      console.log(`⏳ [GEMINI] Survey not complete for barangay ${barangayId} - Progress: ${progress}%`);
      return NextResponse.json({
        success: false,
        surveyIncomplete: true,
        progress: progress,
        message: `Survey is ${progress}% complete. Executive summary will be available when survey reaches 100% completion.`,
        barangay_id: barangayId,
        cycle_id: cycleId
      });
    }

    console.log(`✅ [GEMINI] Survey complete (${progress}%) - Proceeding with AI generation`);

    // Use caching with 7-day TTL (executive summaries don't change often)
    const result = await getCachedOrCompute(
      'ai-executive-summary',
      { barangayId: parseInt(barangayId), cycleId: parseInt(cycleId) },
      async () => {
        // Fetch all necessary data for the barangay
        const data = await fetchBarangayData(barangayId, cycleId);

        // Generate AI summary using Gemini
        const aiSummary = await generateAISummary(data);

        return {
          barangay_id: barangayId,
          cycle_id: cycleId,
          ...aiSummary,
          generated_at: new Date().toISOString()
        };
      },
      {
        ttl: 604800, // 7 days
        staleWhileRevalidate: true,
        forceRefresh: forceRefresh || false
      }
    );

    console.log(`✅ [GEMINI] Executive summary ${result.cached ? 'retrieved from cache' : 'generated'}`);

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
    console.error('❌ [GEMINI] Error generating executive summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate executive summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchBarangayData(barangayId: number, cycleId: number) {
  console.log(`📊 [GEMINI] Fetching data for Barangay ${barangayId}...`);

  // Fetch barangay info
  const { data: barangay, error: barangayError } = await supabaseAdmin
    .from('barangay')
    .select('*')
    .eq('barangay_id', barangayId)
    .single();

  if (barangayError) throw new Error('Failed to fetch barangay data');

  // Fetch survey responses
  const { data: responses, error: responsesError } = await supabaseAdmin
    .from('survey_response')
    .select(`
      response_id,
      status,
      submitted_at,
      respondent_age,
      respondent_gender,
      respondent_educational_attainment,
      respondent_household_income,
      survey_section (
        section_key,
        data
      )
    `)
    .eq('barangay_id', barangayId)
    .eq('survey_cycle_id', cycleId)
    .in('status', ['completed', 'submitted']);

  if (responsesError) throw new Error('Failed to fetch survey responses');

  // Fetch cycle info
  const { data: cycle, error: cycleError } = await supabaseAdmin
    .from('survey_cycle')
    .select('*')
    .eq('cycle_id', cycleId)
    .single();

  if (cycleError) throw new Error('Failed to fetch cycle data');

  // Analyze survey data
  const analysis = analyzeSurveyData(responses || []);

  return {
    barangay,
    cycle,
    responses: responses || [],
    responseCount: responses?.length || 0,
    analysis
  };
}

function analyzeSurveyData(responses: any[]) {
  const serviceAreas = ['financial', 'disaster', 'safety', 'social', 'business', 'environmental'];
  const analysis: any = {
    demographics: {
      totalRespondents: responses.length,
      ageGroups: {},
      genderDistribution: {},
      educationLevels: {},
      incomeGroups: {}
    },
    serviceScores: {},
    commonIssues: [],
    strengths: []
  };

  // Analyze demographics
  responses.forEach(r => {
    if (r.respondent_age) {
      const ageGroup = getAgeGroup(r.respondent_age);
      analysis.demographics.ageGroups[ageGroup] = (analysis.demographics.ageGroups[ageGroup] || 0) + 1;
    }
    if (r.respondent_gender) {
      analysis.demographics.genderDistribution[r.respondent_gender] = 
        (analysis.demographics.genderDistribution[r.respondent_gender] || 0) + 1;
    }
    if (r.respondent_educational_attainment) {
      analysis.demographics.educationLevels[r.respondent_educational_attainment] = 
        (analysis.demographics.educationLevels[r.respondent_educational_attainment] || 0) + 1;
    }
    if (r.respondent_household_income) {
      analysis.demographics.incomeGroups[r.respondent_household_income] = 
        (analysis.demographics.incomeGroups[r.respondent_household_income] || 0) + 1;
    }
  });

  // Analyze service areas
  serviceAreas.forEach(service => {
    const serviceResponses = responses.filter(r => 
      r.survey_section?.some((s: any) => s.section_key === service)
    );

    if (serviceResponses.length > 0) {
      const scores = calculateServiceScores(serviceResponses, service);
      analysis.serviceScores[service] = scores;

      // Identify issues and strengths based on satisfaction percentage
      const satisfactionPct = scores.satisfaction.percentage;
      if (satisfactionPct !== null) {
        if (satisfactionPct < 60) {
          analysis.commonIssues.push({
            service,
            score: satisfactionPct,
            severity: 'high'
          });
        } else if (satisfactionPct >= 75) {
          analysis.strengths.push({
            service,
            score: satisfactionPct
          });
        }
      }
    }
  });

  return analysis;
}

function getAgeGroup(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
}

function calculateServiceScores(responses: any[], serviceKey: string): ServiceFunnelMetrics {
  // Use the shared funnel calculation logic
  return calculateServiceFunnelMetrics(responses, serviceKey);
}

async function generateAISummary(data: any) {
  console.log(`🤖 [GEMINI] Calling Gemini AI...`);

  // Check token limit before generating
  const limitCheck = await checkTokenLimit();
  if (!limitCheck.withinLimit) {
    throw new Error(`Token limit reached: ${limitCheck.tokensUsed}/${limitCheck.tokensLimit} tokens used`);
  }

  // Get API key from database or environment
  const apiKey = await getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  // Use gemini-2.5-flash - the latest stable model
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Prepare service data with MoE for the prompt
  const serviceDataWithMoE = Object.entries(data.analysis.serviceScores).map(([service, scores]: [string, any]) => {
    const satisfactionScore = scores.satisfaction.percentage !== null ? scores.satisfaction.percentage / 100 : null;
    const needForActionScore = scores.needForAction?.percentage !== null ? scores.needForAction.percentage / 100 : null;
    const sampleSize = scores.satisfaction.total || 0;
    const moe = sampleSize > 0 ? 0.98 / Math.sqrt(sampleSize) : 0;

    return {
      service_indicator: service,
      satisfaction: {
        score: satisfactionScore,
        moe: moe
      },
      need_for_action: {
        score: needForActionScore,
        moe: moe
      },
      sample_size: sampleSize
    };
  });

  const prompt = `### ROLE ###
You are a data analyst writing a direct, actionable report for barangay officials. Your job is to tell them what's working, what needs fixing, and what to do about it. No fluff, no technical jargon.

### LANGUAGE REQUIREMENT ###
Write the ENTIRE report in Bisaya (Cebuano). Use natural Cebuano expressions and terminology appropriate for local government and barangay services. The report should be easily understood by barangay officials who speak Bisaya as their primary language.

### CONTEXT ###
This is a citizen satisfaction survey report for barangay officials. They want to know:
1. What services are residents happy with
2. What services need immediate attention
3. What specific actions they should take

### ANALYSIS METHODOLOGY ###
(Internal - do not mention in the summary)

Use the Dynamic Cut-Off Rule to classify scores:
- Calculate Cut-off = 0.50 + MoE for each score
- Score ≥ Cut-off = "High", Score < Cut-off = "Low"

Action Grid Quadrants (use for prioritization, but don't mention the technical names):
- Low Satisfaction + High Need for Action = URGENT - Fix immediately
- High Satisfaction + High Need for Action = IMPORTANT - Maintain and improve
- High Satisfaction + Low Need for Action = STRENGTH - Keep doing what you're doing
- Low Satisfaction + Low Need for Action = MONITOR - Watch for changes

### TASK ###
Write a direct, no-nonsense executive summary for barangay officials. Structure:

1. **Opening (1-2 sentences)**: State the overall performance based on ${data.responseCount} resident responses.

2. **What's Working Well (if any)**: List services where residents are satisfied and don't see urgent need for improvement. Be specific about what they're doing right.

3. **What Needs Immediate Attention (if any)**: List services where residents are dissatisfied OR see urgent need for improvement. Be blunt about the problems.

4. **What To Do Next**: Give 3-5 specific, actionable recommendations prioritized by urgency.

WRITING STYLE:
- Write EVERYTHING in Bisaya (Cebuano) - this is critical
- Direct and conversational, like you're briefing them in person
- No formal greetings or closings
- No mentions of "CSIS", "Dynamic Cut-Off", "Action Grid", or technical methodology
- Use simple Bisaya language - avoid bureaucratic terms
- Focus on ACTIONS, not analysis
- Be honest - if something is bad, say it clearly in Bisaya

### BARANGAY INFORMATION ###
- Name: ${data.barangay.barangay_name}
- Population: ${data.barangay.population?.toLocaleString() || 'N/A'}
- Households: ${data.barangay.households?.toLocaleString() || 'N/A'}
- Survey Cycle: ${data.cycle.name} (${data.cycle.year})
- Total Respondents: ${data.responseCount}

### DATA FOR ANALYSIS ###
${JSON.stringify(serviceDataWithMoE, null, 2)}

Note: The MoE is calculated as 0.98 / sqrt(n), where n is the sample size for each service indicator.

### OUTPUT FORMAT ###
Provide your analysis in the following JSON format. ALL TEXT CONTENT MUST BE IN BISAYA (CEBUANO):

{
  "executiveSummary": "Direct, 2-3 paragraph summary IN BISAYA following the structure above. Start with overall performance, then what's working, then what needs fixing. No greetings, no technical terms, no fluff. WRITE IN BISAYA.",
  "keyFindings": [
    "Brief, specific finding IN BISAYA about resident satisfaction or concerns",
    "Another key finding IN BISAYA",
    "Another key finding IN BISAYA"
  ],
  "criticalIssues": [
    {
      "issue": "Specific problem residents identified (IN BISAYA)",
      "impact": "Taas/Tunga/Ubos (High/Medium/Low in Bisaya)",
      "affectedArea": "Service name (IN BISAYA)",
      "recommendation": "Specific action to fix it (IN BISAYA)"
    }
  ],
  "actionPlan": {
    "immediate": [
      {
        "action": "Specific action to take NOW (within 1-3 months) - IN BISAYA",
        "priority": "Taas (High)",
        "resources": "What you need to do it - IN BISAYA",
        "expectedOutcome": "What will improve - IN BISAYA"
      }
    ],
    "shortTerm": [
      {
        "action": "Action to take in 3-6 months - IN BISAYA",
        "priority": "Tunga (Medium)",
        "resources": "What you need - IN BISAYA",
        "expectedOutcome": "Expected result - IN BISAYA"
      }
    ],
    "longTerm": [
      {
        "action": "Action to take in 6-12 months - IN BISAYA",
        "priority": "Ubos (Low)",
        "resources": "What you need - IN BISAYA",
        "expectedOutcome": "Expected result - IN BISAYA"
      }
    ]
  },
  "recommendations": {
    "governance": ["Specific governance recommendation IN BISAYA", "Another recommendation IN BISAYA"],
    "serviceDelivery": ["Specific service improvement IN BISAYA", "Another improvement IN BISAYA"],
    "communityEngagement": ["Specific engagement action IN BISAYA", "Another action IN BISAYA"]
  },
  "successMetrics": [
    {
      "metric": "Measurable indicator of success - IN BISAYA",
      "target": "Specific target to achieve - IN BISAYA",
      "timeline": "When to achieve it - IN BISAYA"
    }
  ]
}

Provide ONLY the JSON response, no additional text.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  console.log(`✅ [GEMINI] AI response received`);

  // Estimate and log token usage
  const estimatedTokens = estimateTokens(prompt + text);
  await logTokenUsage(
    'executive-summary',
    estimatedTokens,
    data.barangay.barangay_id,
    data.cycle.cycle_id,
    'generation'
  );
  console.log(`📊 [GEMINI] Estimated tokens used: ${estimatedTokens}`);

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiResponse = JSON.parse(cleanText);
    return aiResponse;
  } catch (parseError) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Failed to parse AI response');
  }
}
