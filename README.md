# The Kitchen Companion

A meal-prep and dinner-planning hub: recipe bank, a "to try" clippings drawer,
a weekday/weekend meal plan with a rough calorie & macro tracker, and a
shareable shopping list generator.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## Data storage

All data (recipes, plan, shopping settings) is saved in your browser's
`localStorage`, scoped to whatever domain the site is running on. That means:

- Data is per-browser, per-device — it won't sync between your phone and
  laptop unless you add a real backend later.
- Clearing your browser data / site data will wipe it.
- It's private to you; nothing is sent to a server.

## Deploy to Vercel

See the deployment walkthrough your Claude conversation — the short version:

1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New... → Project** → import that repo.
3. Vercel auto-detects Vite; leave the default build settings and click **Deploy**.
