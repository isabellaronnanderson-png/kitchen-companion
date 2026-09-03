# The Kitchen Companion

A meal-prep and dinner-planning hub: a photo-friendly recipe gallery, a
"to try" clippings drawer, a weekday/weekend meal plan with a rough calorie
and macro tracker, a pantry that tracks what you have on hand, and a
shareable shopping list generator — now with account login and cloud sync.

## One-time setup: Supabase

This app uses Supabase for login and cloud storage. The client is already
pointed at your project (see `src/supabaseClient.js`), but you need to
create the table it stores data in.

1. Go to your Supabase project → **SQL Editor → New query**.
2. Paste in the contents of `supabase_setup.sql` (included in this project)
   and run it. This creates a `kitchen_companion_data` table — named
   specifically for this app so it won't collide with tables from your other
   projects in the same Supabase instance — with Row Level Security so each
   user can only ever see or edit their own row.
3. Go to **Authentication → URL Configuration** and set the **Site URL** to
   your deployed Vercel URL (e.g. `https://your-app.vercel.app`). This is
   what the confirmation email link will send people back to — if it's left
   as `localhost`, confirmation links won't work once deployed.
4. Email confirmation is on by default in Supabase, which is what powers the
   "check your email" screen after signup. If you'd rather skip email
   confirmation entirely (not recommended for a real login flow), you can
   turn it off under **Authentication → Providers → Email**.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## How the app works

- Add recipes to the Bank (with an optional photo) and tag each one with
  where it fits (weekday breakfast, mealprep lunch, weekend dinner, etc).
- On the Meal Plan tab, scroll the Recipe Gallery and tap **"Plan for this
  week"** on any recipe to slot it in — or just type a quick note directly
  into an empty slot for meals you don't want to formally track.
- The Shopping List tab builds a list from what's currently planned,
  subtracting anything already in your Pantry, and lets you check items off
  (which asks how much you bought and adds it to your Pantry).
- The Pantry tab shows what you've got on hand — filled in automatically
  from purchases, and manually editable any time.

## Login & cloud sync

- The whole app is gated behind email/password sign-in. New accounts get a
  "check your email" screen and need to click the confirmation link before
  they can sign in.
- Once signed in, your data lives in Supabase and is also cached in
  `localStorage` for speed. Supabase is the source of truth after the first
  login: if you already had data in the browser before creating an account
  (from before login was added, or from another visit), that gets pushed up
  to the cloud the first time you log in rather than being overwritten.
- A small "Saving… / Saved to cloud" indicator appears near the top-right
  after changes.

## Backup / restore

The **Backup** menu in the top-right lets you:
- **Download backup** — exports all your data (recipes, plan, pantry, etc.)
  as a JSON file.
- **Restore from file** — loads data back in from a previously exported
  file. This overwrites your current recipes, plan, pantry, and shopping
  list state, and syncs the restored data up to the cloud.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New... → Project** → import that repo.
3. Vercel auto-detects Vite; leave the default build settings and click
   **Deploy**.
4. Don't forget the Supabase **Site URL** setting mentioned above once you
   have your real deployed URL.
