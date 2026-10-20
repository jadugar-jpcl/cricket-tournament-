JPCL TOP 10 BATSMEN AND TOP 10 BOWLERS UPDATE

Only one website file needs updating: index.html.
This is the complete latest version, including Rules, group-wise points tables,
manual NRR, editable pages, all admin features, and the full JPCL logo.

In GitHub, replace your repository's index.html with the one in this ZIP,
then commit. Render will usually deploy automatically.

ADMIN INSTRUCTIONS
1. Admin Login > Players: register players and assign each to their team.
2. Admin > Player Stats: enter batting stats or bowling stats for a player.
3. Save; that player enters the corresponding leaderboard.
4. Edit or remove their entry any time. Only the top 10 sorted by runs / wickets show publicly.
5. Batting: M, INN, Runs, Balls, 4s, 6s, HS, Outs; AVG and SR are calculated.
6. Bowling: M, INN, Overs, Runs conceded, Wickets, Maidens, Best figures;
   Bowling AVG and Economy are calculated. Use 4.3 for 4 overs and 3 balls.

Catches do not appear on the public Player Stats page or Admin forms.
Past match records remain intact. Existing per-match runs and wickets editor is
still available, but the two Top 10 lists are editable independently.

No SQL changes needed. Uses existing editor JSON in Supabase site_settings.
