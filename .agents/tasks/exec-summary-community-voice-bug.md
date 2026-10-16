# Investigation Report: Executive Summary & Community Voice Not Working

## Summary Answer

Both features fail for the same root cause: **the `survey_target.percentage` column is stale/unreliable**, so the executive summary API gates on 0% progress even when the survey is actually 100% complete. The community voice feature has a secondary issue: **the `.venv` Python virtual environment does not exist on this machine**, so ML analysis always falls back to a basic (non-ML) mode. There is also a latent bug in the community voice API's error-handling path that could silently corrupt cached data.

---

## Bug #1 — Executive Summary: Reads Stale `survey_target.percentage`

**File:** `src/app/api/ai/executive-summary/route.ts` lines 29–53

```ts
const { data: surveyTarget, error: targetError } = await supabaseAdmin
  .from('survey_target')
  .select('percentage')         // ← reads the stale percentage column
  .eq('barangay_id', barangayId)
  .eq('survey_cycle_id', cycleId)
  .single();

const progress = surveyTarget?.percentage || 0;

if (progress < 100) {
  return NextResponse.json({ success: false, surveyIncomplete: true, progress, ... });
}
```

The `survey_target.percentage` column is a **denormalized cache** that only gets updated by specific write paths (the sync route, the mock data tools, and the delete tools). The funnel-analysis route was already fixed to avoid this column (see comment at `src/app/api/ml/funnel-analysis/route.ts` line 39):

```ts
// Check if survey is complete by counting actual completed/submitted responses
// against the target — avoids reading the stale survey_target.percentage column.
```

That route fetches `survey_target.target` (the goal number) and then counts live survey responses to compute progress. The executive summary route never received this fix.

**Consequence:** Because `percentage` is 0 for barangay 15 cycle 25 (as confirmed in the browser log: `"progress": 0, "message": 'Survey is 0% complete.'`), the executive summary API always returns `{ surveyIncomplete: true }` and never calls Gemini. The `ExecutiveSummarySection` component renders the amber "Survey Data Collection In Progress" banner instead of the actual AI-generated content.

**Evidence from browser log:**
```
BarangaySatisfactionIndex.tsx:112 📊 Received funnel data: {surveyIncomplete: true, progress: 0, ...}
```
This is from a different component (the funnel analysis path) hitting the same stale-percentage gate on the exec-summary endpoint.

**Fix:** Replace the `SELECT 'percentage'` pattern in the executive summary route with the same live-count pattern used in the funnel route:

1. Query `survey_target` for `target` only (not `percentage`).
2. `COUNT(*)` from `survey_response` where `barangay_id = barangayId`, `survey_cycle_id = cycleId`, and `status IN ('completed', 'submitted')`.
3. Compute `progress = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0`.

---

## Bug #2 — Community Voice: Python `.venv` Does Not Exist

**File:** `src/app/api/community-voice/route.ts` lines 203–211

```ts
const venvPython = process.platform === 'win32'
  ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
  : path.join(process.cwd(), '.venv', 'bin', 'python');

const { stdout, stderr } = await execAsync(
  `"${venvPython}" "${scriptPath}" "${tempInputFile}" "${tempOutputFile}"`, ...
)
```

**Verified:** `C:\Users\Eugene\Desktop\coding\BrgyPULSE-System\.venv` does **not exist**. Python is also not on the system `PATH`. Running the exec command will throw immediately.

**Consequence:** The catch block at line 246 fires every time:

```ts
} catch (mlError) {
  console.error('ML script execution error:', mlError)
  // Fallback: basic analysis without ML
  const basicAnalysis = {
    ...
    ml_service_available: false
  }
  return { ...basicAnalysis, cycle_id: activeCycleId, comments_by_barangay: commentsByBarangay }
}
```

The fallback **does work** — it returns a valid object with `total_comments`, `insights`, `categories`, `sample_comments`. The API then wraps it in `{ success: true, data: ... }` and the UI renders. So community voice shows something, but it only shows the raw count and a single generic insight ("X comments collected"), not ML-categorized themes or sentiment distribution.

**However**, this means: if the survey for barangay 15 has **no text comments** (only radio/checkbox answers), then `allComments.length === 0` and the route returns early with `total_comments: 0`. The UI at `page.tsx:2176` renders `"No community feedback available yet"`.

**Root issue:** The `.venv` was never set up on this development machine. The ML script at `ml/analyze_community_voice_standalone.py` exists but is unreachable.

**Fix options:**
- **Short-term:** Create the `.venv` and install `ml/requirements.txt`. This restores full ML analysis.
- **Medium-term:** The fallback path already works well enough for basic display. Improve the fallback to do rudimentary keyword-based theming so it's more useful even without ML.

---

## Bug #3 — Community Voice: `return NextResponse.json(...)` Inside Compute Callback (Latent Bug)

**File:** `src/app/api/community-voice/route.ts` lines 99–106

```ts
async function performCommunityVoiceAnalysis(barangayId, activeCycleId) {
    ...
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({    // ← BUG: this is inside getCachedOrCompute's callback
        error: 'Failed to fetch survey data',
        details: error.message
      }, { status: 500 })
    }
```

`performCommunityVoiceAnalysis` is called as the `computeFn` argument to `getCachedOrCompute`. That function (`src/lib/ml-cache.ts`) simply calls `await computeFn()` and stores whatever it returns in the database cache:

```ts
const data = await computeFn()
await saveToCache(cacheKey, endpoint, params, data, ttl)
```

If a database error occurs, `performCommunityVoiceAnalysis` returns a `NextResponse` object — not a plain data object. `getCachedOrCompute` stores this `NextResponse` as `result.data` in `ml_cache`. The outer handler then tries to send `{ success: true, data: <NextResponse object> }` to the client, which silently fails or sends a malformed payload.

**Current impact:** Only triggers when the `survey_response` query itself errors (e.g., a Supabase connection issue). It's not the direct cause of the current symptoms. But it's a ticking time bomb — once it fires, the bad `NextResponse` object gets cached for 12 hours.

**Fix:** Replace `return NextResponse.json(...)` with `throw new Error(...)` inside `performCommunityVoiceAnalysis`.

---

## Bug #4 — Community Voice: Does Not Accept `cycleId` Query Parameter

**File:** `src/app/api/community-voice/route.ts` line 24

```ts
const activeCycleId = await getActiveCycleId()
```

The route ignores any `cycleId` URL parameter. The report card passes `barangayId` but no `cycleId`, so the endpoint always fetches the **active cycle**, which is correct for the current use case. But if the active cycle changes, or if this endpoint is called for a historical report card, it would return the wrong data.

This is not the immediate cause of the current bug but is worth noting.

---

## How the Report Card Calls These APIs

`src/app/reportcard/page.tsx` `fetchDetailedAnalytics()` (line 511) fires **four parallel fetches**:

1. `GET /api/ml/funnel-analysis?barangayId=X&cycleId=Y` — funnel + service scores
2. `POST /api/ai/executive-summary` with body `{ barangayId, cycleId }` — AI summary
3. `GET /api/community-voice?barangayId=X` — community comments/themes
4. `GET /api/survey-analytics?format=detailed&barangayId=X` — analytics

Executive summary data is stored in `funnelData.executive_summary` (line 576) and passed as `cachedSummary` to `<ExecutiveSummarySection>` at line 2134. Community voice data is stored directly in `communityVoiceData` state (line 601) and rendered at lines 2148–2244.

The `ExecutiveSummarySection` component also has its own internal `fetchExecutiveSummary()` fallback that fires if no `cachedSummary` is provided (line 44). Both paths hit the same broken endpoint.

---

## Executive Summary Component Rendering Path

`src/app/reportcard/page.tsx` lines 2131–2136:
```tsx
<ExecutiveSummarySection
  barangayId={barangayData.barangayId}
  cycleId={barangayData.cycleId || activeCycle?.cycle_id || 0}
  cachedSummary={funnelData?.executive_summary}
/>
```

Because the API returns `{ surveyIncomplete: true, progress: 0 }`, `funnelData.executive_summary` is set to `{ surveyIncomplete: true, progress: 0, message: '...' }`. The component's render path at line 237 (`if (summary.surveyIncomplete)`) renders the amber warning box — this is the "not working" symptom the user sees.

---

## Gemini API Key & Model

- `GEMINI_API_KEY` is **set** in `.env.local` (non-empty).
- The `gemini-config.ts` also tries the `gemini_settings` table first (fallback to env var). The table schema exists at `database/gemini-settings-table.sql`.
- Model used: `gemini-2.5-flash` (line 256 of executive-summary route). This model identifier should be verified against the current Google AI SDK; it may need to be `gemini-2.0-flash` or `gemini-1.5-flash`.
- None of the Gemini/key issues are the cause of the current failure — the code gates on survey progress before ever calling Gemini.

---

## Conclusions & Recommended Fixes

### Fix 1 (Critical — Executive Summary)
In `src/app/api/ai/executive-summary/route.ts`, replace the `SELECT 'percentage'` query with the live-count pattern from `src/app/api/ml/funnel-analysis/route.ts` lines 41–62. Specifically:

```ts
// BEFORE (broken — reads stale column):
const { data: surveyTarget } = await supabaseAdmin
  .from('survey_target')
  .select('percentage')
  .eq('barangay_id', barangayId)
  .eq('survey_cycle_id', cycleId)
  .single();
const progress = surveyTarget?.percentage || 0;

// AFTER (correct — counts live responses):
const { data: targetRow } = await supabaseAdmin
  .from('survey_target')
  .select('target')
  .eq('barangay_id', barangayId)
  .eq('survey_cycle_id', cycleId)
  .single();
const { count: achievedCount } = await supabaseAdmin
  .from('survey_response')
  .select('*', { count: 'exact', head: true })
  .eq('barangay_id', barangayId)
  .eq('survey_cycle_id', cycleId)
  .in('status', ['completed', 'submitted']);
const target = targetRow?.target || 0;
const progress = target > 0 ? Math.min(100, Math.round(((achievedCount || 0) / target) * 100)) : 0;
```

This is the only change needed to unblock the executive summary.

### Fix 2 (Important — Community Voice ML)
Create the `.venv` in the project root and install dependencies:
```
python -m venv .venv
.venv\Scripts\activate
pip install -r ml/requirements.txt
```
Without this, community voice will always use the basic fallback (no theming, no sentiment distribution).

### Fix 3 (Safety — Community Voice Error Path)
In `src/app/api/community-voice/route.ts`, replace the `return NextResponse.json(...)` inside `performCommunityVoiceAnalysis` (line 100) with `throw new Error(error.message)` so the outer try/catch in the GET handler handles it properly and the cache is never poisoned.

### Fix 4 (Minor — Community Voice Cycle Parameter)
Accept an optional `cycleId` query parameter in the community voice route, defaulting to `getActiveCycleId()` when not provided. This future-proofs the feature for historical report cards.
