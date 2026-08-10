# The Kitchen Companion

A meal-prep and dinner-planning hub: a photo-friendly recipe gallery, a
"to try" clippings drawer, a weekday/weekend meal plan with a rough calorie
and macro tracker, and a shareable shopping list generator.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## How planning works

- Add recipes to the Bank (with an optional photo) and tag each one with
  where it fits (weekday breakfast, mealprep lunch, weekend dinner, etc).
  A recipe can carry more than one tag.
- On the Meal Plan tab, scroll the Recipe Gallery and tap **"Plan for this
  week"** on any recipe — it'll show you which slots it's eligible for
  and drop it straight in. No dropdowns to hunt through.
- **Generate Suggestions** auto-fills the whole week's plan from recipes
  that match your current filters (vegetarian-only, etc).
- The Shopping List tab builds an aggregated, categorized list from
  whatever's currently planned, scaled to how many times each recipe is
  planned for, ready to share to your phone.

## Data storage

All data (recipes, plan, shopping settings, and recipe photos) is saved in
your browser's `localStorage`, scoped to whatever domain the site is running
on. That means:

- Data is per-browser, per-device — it won't sync between your phone and
  laptop unless you add a real backend later.
- Clearing your browser data / site data will wipe it.
- Everything is private to you; nothing is sent to a server.
- Recipe photos are resized client-side before saving to keep storage usage
  reasonable — very large photo libraries may eventually bump into browser
  storage limits (typically 5–10MB per site).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New... → Project** → import that repo.
3. Vercel auto-detects Vite; leave the default build settings and click
   **Deploy**.
