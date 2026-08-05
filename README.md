# The Kitchen Companion

A meal-prep and dinner-planning hub: recipe bank, a "to try" clippings drawer,
a weekday/weekend meal plan with a rough calorie & macro tracker, and a
shareable shopping list generator — plus AI-assisted recipe entry (paste
text, a screenshot, or a link and it fills in the details for you).

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173). Note: the
AI auto-fill feature needs the serverless function in `/api`, which plain
`npm run dev` (Vite) does **not** run. To test auto-fill locally, install the
Vercel CLI and run `vercel dev` instead (see below).

## AI auto-fill setup (required for the "Fill in automatically" feature)

The app calls a small serverless function at `/api/extract-recipe.js`, which
holds your Anthropic API key on the server so it's never exposed in the
browser.

1. Get an API key at https://console.anthropic.com/settings/keys
2. In your Vercel project: **Settings → Environment Variables**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key
   - Apply to Production (and Preview/Development if you want it there too)
3. Redeploy (or push a commit) so the new environment variable takes effect.

For local testing:
```bash
npm install -g vercel
vercel link          # links this folder to your Vercel project (one-time)
vercel env pull .env.local   # pulls the ANTHROPIC_API_KEY you set in step 2
vercel dev            # runs the app AND the /api function together
```

Anthropic API usage is billed per request on your own account — the amounts
here are small (a few cents at most per recipe), but it's real usage against
your key.

## Data storage

All data (recipes, plan, shopping settings) is saved in your browser's
`localStorage`, scoped to whatever domain the site is running on. That means:

- Data is per-browser, per-device — it won't sync between your phone and
  laptop unless you add a real backend later.
- Clearing your browser data / site data will wipe it.
- It's private to you; nothing is sent to a server except the recipe
  auto-fill requests (screenshot/link/text you explicitly submit) which go to
  Anthropic's API via your own key.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New... → Project** → import that repo.
3. Vercel auto-detects Vite; leave the default build settings.
4. Add the `ANTHROPIC_API_KEY` environment variable (see above) *before* or
   *after* the first deploy — just redeploy once it's set.
5. Click **Deploy**.
