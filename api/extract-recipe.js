// Vercel serverless function: POST /api/extract-recipe
// Keeps the Anthropic API key on the server — the browser never sees it.
//
// Requires an ANTHROPIC_API_KEY environment variable set in
// Vercel → Project Settings → Environment Variables.

const TAG_KEY_LIST = [
  'weekdayBreakfast', 'mealprepLunch', 'mealprepDinner', 'weekdaySnack',
  'weekendBreakfast', 'weekendLunch', 'weekendDinner', 'weekendSnack',
].join(', ');

const CATEGORY_LIST = 'Produce, Dairy & Eggs, Pantry, Protein, Frozen, Bakery, Other';

export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Quick diagnostic: visiting this URL directly in a browser (GET) tells you
  // whether the server can see your API key at all, without spending a request.
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, hasKey: !!apiKey, keyLength: apiKey ? apiKey.length : 0 });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({
      error: 'Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy.',
    });
    return;
  }

  try {
    const { imageBase64, imageMediaType, url, pastedText } = req.body || {};

    if (!imageBase64 && !url && !pastedText) {
      res.status(400).json({ error: 'Provide an image, a URL, or pasted text.' });
      return;
    }

    const content = [];
    if (imageBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: imageMediaType || 'image/png', data: imageBase64 },
      });
    }

    let prompt = `You are helping fill in a recipe card. Read the recipe from the ${imageBase64 ? 'attached screenshot' : url ? 'linked page' : 'pasted text'} below and respond with ONLY raw JSON, no markdown fences, no commentary, matching exactly this shape:
{"name":string,"servings":number,"calories":number,"protein":number,"carbs":number,"veggieServings":number,"vegetarian":boolean,"tags":string[],"ingredients":[{"name":string,"qty":number,"unit":string,"category":string}],"instructions":string,"prepAhead":string}

Rules:
- calories/protein/carbs are PER SERVING best estimates (numbers, not strings).
- veggieServings is a rough per-serving count of vegetable servings (can be a decimal like 1.5).
- tags: choose any that reasonably fit from exactly these keys: ${TAG_KEY_LIST}.
- ingredients[].category must be one of: ${CATEGORY_LIST}.
- instructions should be a short, clear method in a few sentences.
- prepAhead: one short sentence on what can be made ahead, or "" if not applicable.
- If exact nutrition isn't stated, estimate sensibly from the ingredients rather than leaving fields at 0.
- Never leave "ingredients" empty if any are visible or inferable.`;
    if (url) prompt += `\n\nURL: ${url}`;
    if (pastedText) prompt += `\n\nRecipe text:\n${pastedText}`;
    content.push({ type: 'text', text: prompt });

    const body = {
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content }],
    };
    if (url) body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      console.error('Anthropic API error:', anthropicRes.status, JSON.stringify(data));
      res.status(anthropicRes.status).json({ error: data?.error?.message || `Anthropic API error (HTTP ${anthropicRes.status})` });
      return;
    }
    res.status(200).json(data);
  } catch (e) {
    console.error('extract-recipe handler crashed:', e);
    res.status(500).json({ error: e.message || 'Request failed' });
  }
}
