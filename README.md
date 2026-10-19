# Room Cricket League – GCL-inspired tournament website

A mobile-friendly, **originally branded** website for a chatroom cricket league. No automatic scoring and no RTF upload required: the organizer enters scores in an admin dashboard. Visitors see fixtures, results, league standings, teams, and player leaderboards.

## What works

- Home, matches (upcoming / results / live), points table, teams, player leaderboards.
- Secure admin sign-in with Supabase Auth and database row-level security.
- Admin can add/edit/remove teams, add/delete fixtures, save/update scores, mark winner, add/remove players, enter or correct individual statistics.
- Auto-updated points table (2 for a win, 1 for a tie/no-winner, 0 for a loss) and player leaderboards.
- **Default preview is only a demo** with clearly labeled fictional teams and results. The example scores aren't connected to your league.

## Preview locally (no account needed)

In this folder run:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. The dashboard is visible, but admin login is disabled until connected to Supabase. (Viewing the HTML file directly may work, but a local server is recommended.)

## Go live — one-time setup

1. Create a free [Supabase](https://supabase.com) project. Copy the **Project URL** and **anon / publishable key** (not the secret service-role key).
2. In Supabase **SQL Editor**, paste and run `supabase-schema.sql`. This sets up the tables and RLS permissions.
3. In Supabase **Authentication → Users**, create an admin account with your email and a strong password (use **Add user**). Confirm the user is created.
4. In **SQL Editor**, run this one-time query, changing the email to your own:

   ```sql
   insert into public.admin_users(user_id)
   select id from auth.users where email = 'YOUR_EMAIL@example.com'
   on conflict (user_id) do nothing;
   ```

   **Only whitelist email addresses you trust.** Anyone not in `admin_users` can read public data but cannot change it.
5. In `config.js`, set `supabaseUrl` and `supabaseAnonKey` and change the league name, code, season and tagline. The anon key is safe to expose **because RLS protects writes**; never include your service-role/secret key in client code.
6. Upload all files to a GitHub repository. On [Render](https://render.com), create a **Static Site** connected to that repo. Build command can be blank or `echo 'Ready'`; publish directory is `.`. `render.yaml` is supplied for Blueprint-style deployment if supported.
7. Open your Render address (`...onrender.com`), select **Admin Login**, and sign in. Add real teams, then fixtures and results. Your live data is in Supabase, not in Render's temporary filesystem.

**Note:** Supabase project URL/anon key are configured at build-time in `config.js`. Publish changes to `config.js` by pushing to your GitHub repository. Render static hosting is independent from Supabase storage. Availability and hosting prices/plans change; check each provider before choosing a plan.

## Daily scoring workflow

1. Finish a match in your chatroom.
2. Open your tournament site → **Admin Login**.
3. Go to **Match results** → choose the match → enter runs and wickets (and optional result summary) → choose winning team → set status **Completed** → **Save and publish**.
4. Public match result and points table immediately use the new saved values. Enter individual runs/wickets later from **Player stats** if you want player rankings.

## Notes / limitations

- Uses the tournament's **own identity**, not GCL's logos, names, imagery or private source code. The reference URL was inaccessible while preparing this first version. To match its exact layout, compare a screenshot later.
- General chatroom-cricket scoring rules may differ. The demo does **not** calculate winners from scores; the admin selects the winner. The standings formula is configurable in `app.js` (`stats()` function) after your rules are known.
- For chatroom matches, individual innings/overs aren't required in this starter; admin enters team totals and wickets. Player performances are optional and entered per match.
- Authenticated admins are approved by Supabase SQL. No hardcoded password, no secret keys in the browser. Supabase RLS is essential; do not disable it.
- Deleting a player also deletes linked player performances; deleting a match deletes linked performances. Teams already used in matches cannot be deleted.
- All real content belongs to your project. Back up your Supabase project and use hosting tiers suitable for production traffic.

## Files

- `index.html` – page shell
- `styles.css` – mobile-friendly design
- `app.js` – interface, calculations, and admin logic
- `config.js` – branding and Supabase settings
- `supabase-schema.sql` – database tables, RLS, admin allowlist
- `render.yaml` – Render deploy template
