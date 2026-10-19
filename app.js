(() => {
  'use strict';
  const cfg = window.RCL_CONFIG || {};
  const DEMO = {
    teams: [
      {id:'t1',name:'Nova Titans',short_name:'NVT',color:'#c6fb63'},
      {id:'t2',name:'Crimson Hawks',short_name:'CHK',color:'#ff967b'},
      {id:'t3',name:'Shadow Strikers',short_name:'SHS',color:'#a4a2ff'},
      {id:'t4',name:'Royal Blazers',short_name:'RBL',color:'#7cdbef'},
      {id:'t5',name:'Thunder Wolves',short_name:'THW',color:'#ffc86e'},
      {id:'t6',name:'Apex Warriors',short_name:'APW',color:'#f49ad6'}
    ],
    matches: [
      {id:'m1',team1_id:'t1',team2_id:'t2',stage:'League · Match 01',status:'completed',team1_runs:88,team1_wickets:3,team2_runs:82,team2_wickets:5,winner_id:'t1',result_summary:'Nova Titans won by 6 runs',scheduled_at:'2026-10-12T14:30:00Z'},
      {id:'m2',team1_id:'t3',team2_id:'t4',stage:'League · Match 02',status:'completed',team1_runs:91,team1_wickets:4,team2_runs:94,team2_wickets:2,winner_id:'t4',result_summary:'Royal Blazers won by 8 wickets',scheduled_at:'2026-10-13T14:30:00Z'},
      {id:'m3',team1_id:'t5',team2_id:'t6',stage:'League · Match 03',status:'completed',team1_runs:76,team1_wickets:7,team2_runs:71,team2_wickets:6,winner_id:'t5',result_summary:'Thunder Wolves won by 5 runs',scheduled_at:'2026-10-14T14:30:00Z'},
      {id:'m4',team1_id:'t1',team2_id:'t3',stage:'League · Match 04',status:'upcoming',scheduled_at:null},
      {id:'m5',team1_id:'t2',team2_id:'t5',stage:'League · Match 05',status:'upcoming',scheduled_at:null},
      {id:'m6',team1_id:'t4',team2_id:'t6',stage:'League · Match 06',status:'upcoming',scheduled_at:null}
    ],
    players: [
      {id:'p1',team_id:'t1',name:'Aarav',role:'Captain'},
      {id:'p2',team_id:'t2',name:'Rohan',role:'Player'},
      {id:'p3',team_id:'t4',name:'Arjun',role:'Captain'},
      {id:'p4',team_id:'t5',name:'Ishan',role:'Player'},
      {id:'p5',team_id:'t3',name:'Dev',role:'Player'}
    ],
    player_performances:[
      {id:'s1',match_id:'m1',player_id:'p1',runs:54,wickets:1,catches:0},
      {id:'s2',match_id:'m1',player_id:'p2',runs:37,wickets:2,catches:0},
      {id:'s3',match_id:'m2',player_id:'p3',runs:61,wickets:1,catches:0},
      {id:'s4',match_id:'m2',player_id:'p5',runs:46,wickets:0,catches:1},
      {id:'s5',match_id:'m3',player_id:'p4',runs:43,wickets:3,catches:1}
    ]
  };
  const state={page:'overview', matchFilter:'all', adminTab:'results', menu:false, mode:'demo', admin:false, session:null, selectedMatchId:'', editTeamId:'', flash:'', flashType:'ok', ...DEMO};
  let db=null;
  const $=id=>document.getElementById(id);
  const e = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeColor=v=>/^#[0-9A-Fa-f]{6}$/.test(v||'')?v:'#c6fb63';
  const team=id=>state.teams.find(t=>t.id===id)||{name:'Unknown team',short_name:'?',color:'#ddd'};
  const sortedMatches=()=>[...state.matches].sort((a,b)=>{
    if(a.scheduled_at&&b.scheduled_at) return new Date(a.scheduled_at)-new Date(b.scheduled_at);
    return (a.created_at||'').localeCompare(b.created_at||'');
  });
  const completed=()=>sortedMatches().filter(m=>m.status==='completed').reverse();
  const upcoming=()=>sortedMatches().filter(m=>m.status==='upcoming'||m.status==='live');
  const dateLabel=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date TBA';
  const dayLabel=v=>v?new Date(v).toLocaleDateString(undefined,{day:'2-digit'}):'--';
  const monthLabel=v=>v?new Date(v).toLocaleDateString(undefined,{month:'short'}):'TBA';
  const timeLabel=v=>v?new Date(v).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}):'Time TBA';
  const score=(m,n)=>m[`team${n}_runs`]==null?'—':`${m[`team${n}_runs`]}/${m[`team${n}_wickets`]??0}`;
  const initials=s=>String(s||'').split(/\s+/).map(x=>x[0]).slice(0,3).join('').toUpperCase();
  const crest=(t,cls='')=>`<div class="team-crest ${cls}" style="--team-color:${safeColor(t.color)}">${e(t.short_name||initials(t.name))}</div>`;
  const stats=()=>{
    const rows=state.teams.map(t=>({team:t,played:0,won:0,lost:0,tied:0,points:0}));
    for(const m of completed()){
      const a=rows.find(x=>x.team.id===m.team1_id),b=rows.find(x=>x.team.id===m.team2_id);
      if(!a||!b)continue;
      a.played++;b.played++;
      if(m.winner_id===a.team.id){a.won++;a.points+=2;b.lost++;}
      else if(m.winner_id===b.team.id){b.won++;b.points+=2;a.lost++;}
      else{a.tied++;b.tied++;a.points++;b.points++;}
    }
    return rows.sort((a,b)=>b.points-a.points||b.won-a.won||a.team.name.localeCompare(b.team.name));
  };
  const playerStats=()=>state.players.map(p=>{
    const perf=state.player_performances.filter(x=>x.player_id===p.id);
    return {player:p,matches:perf.length,runs:perf.reduce((a,x)=>a+(x.runs||0),0),wickets:perf.reduce((a,x)=>a+(x.wickets||0),0),catches:perf.reduce((a,x)=>a+(x.catches||0),0)};
  });
  const header=()=>`<header class="topbar"><div class="container top-inner">
    <a class="brand" href="#overview" data-page="overview"><div class="brand-mark"><span>${e((cfg.shortName||'RCL').slice(0,2))}</span></div><div class="brand-txt"><b>${e(cfg.name||'ROOM CRICKET LEAGUE')}</b><small>${e(cfg.tagline||'Jadugar Paltalk Cricket League').toUpperCase()}</small></div></a>
    <nav class="nav ${state.menu?'open':''}" aria-label="Main navigation">${[['overview','Home'],['matches','Matches'],['standings','Points Table'],['teams','Teams'],['players','Player Stats']].map(([id,label])=>`<button data-page="${id}" class="${state.page===id?'active':''}">${label}</button>`).join('')}</nav>
    <div class="top-actions"><button class="btn ${state.page==='admin'?'primary':'glass'} small" data-page="admin">${state.admin?'⚙ Dashboard':'⇥ Admin Login'}</button><button class="menu-btn" data-action="toggle-menu" aria-label="Toggle navigation">☰</button></div>
    </div></header>${state.mode==='demo'?`<div class="demo-ribbon"><b>DEMO PREVIEW</b> Example teams and scores only. Connect Supabase to publish your real tournament.</div>`:''}`;
  const footer=()=>`<footer class="footer"><div class="container footer-in"><div><strong>${e(cfg.shortName||'RCL')}.</strong><p>${e(cfg.tagline||'The home of chatroom cricket')} · ${e(cfg.season||'SEASON 01')}</p></div><span class="made">Made for your tournament. Managed by you.</span></div></footer>`;
  const feature=()=>{
    const m=upcoming()[0]||completed()[0],a=m?team(m.team1_id):null,b=m?team(m.team2_id):null;
    if(!m)return `<div class="feature-card"><div class="micro">THE MATCH CENTER</div><div class="empty" style="color:#dbe6f5"><div class="big">🏏</div>Add your first fixture to get started</div></div>`;
    return `<div class="panel-glow"></div><div class="feature-card"><div class="feature-top"><span class="micro">${e(m.stage||'THE MATCH CENTER')}</span><span class="pill ${m.status==='live'?'red':'lime'}">${m.status==='completed'?'FINAL':m.status==='live'?'● LIVE':'● UPCOMING'}</span></div>
    <div class="feature-versus"><div class="feature-team">${crest(a)}<strong>${e(a.name)}</strong><small>${m.status==='completed'?e(score(m,1)):'READY TO PLAY'}</small></div><span class="vs">VS</span><div class="feature-team">${crest(b)}<strong>${e(b.name)}</strong><small>${m.status==='completed'?e(score(m,2)):'READY TO PLAY'}</small></div></div>
    <div class="feature-footer"><span>◷ ${e(dateLabel(m.scheduled_at))} · ${e(timeLabel(m.scheduled_at))}</span><strong>${m.status==='completed'?'MATCH RESULT':'MATCHDAY'} ↗</strong></div></div>`;
  };
  const metrics=()=>`<div class="container metrics">${[['▦',state.teams.length,'Teams'],['⚑',state.matches.length,'Total matches'],['✓',completed().length,'Completed'],['◷',upcoming().length,'To play']].map(([i,n,l])=>`<div class="metric"><div class="metric-icon">${i}</div><div><strong>${n}</strong><span>${l}</span></div></div>`).join('')}</div>`;
  const matchCard=m=>{
    const a=team(m.team1_id),b=team(m.team2_id),done=m.status==='completed';
    return `<article class="match-card"><div class="match-card-head"><span class="match-meta">${e(m.stage||'League match')} · ${e(dateLabel(m.scheduled_at))}</span><span class="pill ${done?'gray':m.status==='live'?'red':'lime'}">${done?'Final':m.status==='live'?'Live':'Upcoming'}</span></div>
      <div class="match-line"><div class="match-side">${crest(a)}<div><strong>${e(a.name)}</strong><small>${done?(m.winner_id===a.id?'Winner':'Completed'):e(a.short_name)}</small>${done?`<small class="mobile-score">${e(score(m,1))}</small>`:''}</div></div><div class="match-center">${done?`<span class="score-num desktop-score">${e(score(m,1))} <span style="color:#b2bbc9">:</span> ${e(score(m,2))}</span><b class="mobile-vs">:</b>`:'<b>VS</b>'}</div><div class="match-side">${crest(b)}<div><strong>${e(b.name)}</strong><small>${done?(m.winner_id===b.id?'Winner':'Completed'):e(b.short_name)}</small>${done?`<small class="mobile-score">${e(score(m,2))}</small>`:''}</div></div></div>
      <div class="match-summary">${done?e(m.result_summary||'Result recorded'):(m.status==='live'?'Match in progress':'◷ '+e(timeLabel(m.scheduled_at)))}</div></article>`;
  };
  const tableMarkup=(rows=stats(),compact=false)=>`<div class="standings-wrap ${compact?'compact':''}"><table class="points-table"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th>${compact?'':'<th>L</th><th>T</th>'}<th>PTS</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><div class="team-cell">${crest(r.team)}<span>${e(r.team.name)}</span></div></td><td>${r.played}</td><td>${r.won}</td>${compact?'':`<td>${r.lost}</td><td>${r.tied}</td>`}<td class="pts">${r.points}</td></tr>`).join('')||`<tr><td colspan="${compact?5:7}" class="empty">Add teams to start the points table</td></tr>`}</tbody></table></div>`;
  const section=(kick,title,right='')=>`<div class="section-head"><div><div class="kicker">${e(kick)}</div><h2>${e(title)}</h2></div>${right}</div>`;
  const empty=(msg='Nothing here yet')=>`<div class="empty"><div class="big">🏏</div>${e(msg)}</div>`;
  const scheduleRow=m=>{const a=team(m.team1_id),b=team(m.team2_id);return `<div class="schedule-row"><div class="schedule-date"><strong>${dayLabel(m.scheduled_at)}</strong><small>${monthLabel(m.scheduled_at)}</small></div><div class="schedule-detail"><b>${e(a.short_name)} vs ${e(b.short_name)}</b><span>${e(m.stage||'League match')} · ${e(timeLabel(m.scheduled_at))}</span></div><span class="pill ${m.status==='live'?'red':'gray'}">${m.status==='live'?'Live':'Scheduled'}</span></div>`};
  const home=()=>`<section class="hero"><div class="container hero-in"><div><div class="eyebrow">${e(cfg.season||'SEASON 01')} · ONLINE CRICKET</div><h1>EVERY RUN.<br>EVERY RIVALRY.<br><em>EVERY RESULT.</em></h1><p>The official tournament hub for Jadugar Paltalk Cricket League. Follow fixtures, match results, teams, and the points table right here.</p><div class="hero-buttons"><button class="btn primary" data-page="matches">Explore matches <span>↗</span></button><button class="btn glass" data-page="standings">View points table →</button></div></div><div class="hero-panel">${feature()}</div></div>${metrics()}</section>
    <main class="main"><div class="container"><div class="layout-two"><div>${section('The action','Recent results',`<button class="view-all" data-page="matches">ALL MATCHES ↗</button>`)}<div class="match-list">${completed().slice(0,3).map(matchCard).join('')||empty('No completed matches yet')}</div></div><div>${section('The race','League standings',`<button class="view-all" data-page="standings">FULL TABLE ↗</button>`)}<div class="card">${tableMarkup(stats().slice(0,6),true)}<div class="highlight-box"><strong>🏆 Road to the top</strong><p>Standings update automatically when you save a completed match result.</p></div></div></div></div>
    <div class="section-gap">${section('Coming up','Next fixtures',`<button class="view-all" data-page="matches">VIEW SCHEDULE ↗</button>`)}<div class="schedule-stack">${upcoming().slice(0,3).map(scheduleRow).join('')||empty('Fixtures will appear here soon')}</div></div>
    ${banner()}</div></main>`;
  const banner=()=>`<div class="banner"><div><h3>YOUR TOURNAMENT. YOUR SCOREBOARD.</h3><p>Scores and results are entered by your league admin. No chatroom automation needed.</p></div><button class="btn primary" data-page="admin">Manage results ↗</button></div>`;
  const matchesPage=()=>`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">The match centre</div><h1>FIXTURES & RESULTS</h1><p>Every showdown from the first match to the final whistle. Results are published after the admin saves them.</p></div><div class="filter-bar">${[['all','All matches'],['upcoming','Upcoming'],['completed','Results'],['live','Live']].map(([k,v])=>`<button data-filter="${k}" class="${state.matchFilter===k?'selected':''}">${v}</button>`).join('')}</div><div class="match-list">${sortedMatches().filter(m=>state.matchFilter==='all'||(state.matchFilter==='upcoming'?['upcoming','live'].includes(m.status):m.status===state.matchFilter)).map(matchCard).join('')||empty('No matches in this category')}</div>${banner()}</div></main>`;
  const standingsPage=()=>`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">League rankings</div><h1>THE POINTS TABLE</h1><p>Win = 2 points. Tie or no winner = 1 point each. Rankings update automatically from completed results.</p></div><div class="card">${tableMarkup()}</div><div class="highlight-box" style="margin:17px 0 0"><strong>How it works</strong><p>Played (P), Won (W), Lost (L), Tied / No winner (T), and Points (PTS). Teams tied on points are ordered by wins, then name. Custom league rules can be added later.</p></div>${banner()}</div></main>`;
  const teamsPage=()=>`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">Meet the competitors</div><h1>OUR TEAMS</h1><p>The crews battling for the title. Each team is managed by the tournament admin.</p></div><div class="team-grid">${state.teams.map(t=>`<div class="team-tile">${crest(t)}<div><b>${e(t.name)}</b><small>${e(t.short_name)} · ${state.players.filter(p=>p.team_id===t.id).length} player(s)</small></div></div>`).join('')||empty('Teams will appear here')}</div>${banner()}</div></main>`;
  const ranking=(field,label)=>{const rows=playerStats().sort((a,b)=>b[field]-a[field]||a.player.name.localeCompare(b.player.name));return `<div class="card"><div class="ranking-header"><h3>${e(label)}</h3><span>${field==='runs'?'RUNS':'WICKETS'}</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Rank</th><th>Player</th><th>Team</th><th>${field==='runs'?'Runs':'Wkts'}</th></tr></thead><tbody>${rows.slice(0,10).map((r,i)=>`<tr><td class="rank-num">${String(i+1).padStart(2,'0')}</td><td>${e(r.player.name)}</td><td>${e(team(r.player.team_id).short_name)}</td><td class="rank-points">${r[field]}</td></tr>`).join('')||'<tr><td colspan="4">No player statistics yet</td></tr>'}</tbody></table></div></div>`};
  const playersPage=()=>`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">The individual battles</div><h1>PLAYER LEADERBOARDS</h1><p>Track runs and wickets entered by the tournament admin. Rankings reflect saved match performances.</p></div><div class="layout-two">${ranking('runs','Top run scorers')}${ranking('wickets','Top wicket takers')}</div><div class="section-gap">${section('Meet the squad','Registered players')}<div class="card table-scroll"><table class="data-table"><thead><tr><th>Player</th><th>Team</th><th>Matches</th><th>Runs</th><th>Wickets</th></tr></thead><tbody>${playerStats().map(p=>`<tr><td>${e(p.player.name)}</td><td>${e(team(p.player.team_id).name)}</td><td>${p.matches}</td><td>${p.runs}</td><td>${p.wickets}</td></tr>`).join('')||'<tr><td colspan="5">No players yet</td></tr>'}</tbody></table></div></div></div></main>`;
  const optionTeams=(selected='')=>`<option value="">Select team</option>${state.teams.map(t=>`<option value="${e(t.id)}" ${t.id===selected?'selected':''}>${e(t.name)}</option>`).join('')}`;
  const optionMatches=(selected='')=>`<option value="">Select match</option>${sortedMatches().map(m=>`<option value="${e(m.id)}" ${m.id===selected?'selected':''}>${e(team(m.team1_id).short_name)} vs ${e(team(m.team2_id).short_name)} · ${e(m.stage||'Match')}</option>`).join('')}`;
  const field=(label,name,value='',type='text',more='')=>`<div class="field"><label for="f-${e(name)}">${e(label)}</label><input id="f-${e(name)}" name="${e(name)}" type="${e(type)}" value="${e(value)}" ${more}></div>`;
  const selectField=(label,name,opts)=>`<div class="field"><label for="f-${e(name)}">${e(label)}</label><select id="f-${e(name)}" name="${e(name)}">${opts}</select></div>`;
  const formBtn=label=>`<div class="form-actions"><button type="submit" class="btn primary">${e(label)} ↗</button></div>`;
  const alertMarkup=()=>state.flash?`<div role="status" class="alert ${state.flashType==='error'?'error':'ok'}">${e(state.flash)}</div>`:'';
  const login=()=>`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">Private control room</div><h1>ADMIN LOGIN</h1><p>Only approved tournament admins can add or change scores, teams and fixtures.</p></div><div class="login-grid"><div class="login-art"><div class="lock">🔐</div><h2>YOU RUN<br>THE SHOW.</h2><p>Enter scores after your chatroom matches finish. The public tournament website updates as soon as you save.</p></div><div class="login-card"><h3>Welcome back.</h3><p>Sign in using the account you created in Supabase.</p>${alertMarkup()}${!db?'<div class="alert">Demo mode: admin login is disabled until you connect Supabase. Open README.md for setup instructions.</div>':''}<form id="login-form">${field('Admin email','email','','email','required autocomplete="email"')}${field('Password','password','','password','required autocomplete="current-password"')}${formBtn('Sign in securely')}</form></div></div></div></main>`;
  const adminResults=()=>{
    const m=state.matches.find(x=>x.id===state.selectedMatchId)||state.matches[0];
    if(m&&!state.selectedMatchId)state.selectedMatchId=m.id;
    return `<div class="form-card"><h3>Update match scores</h3><p>Select a fixture, enter the final numbers, choose the winner, then publish.</p>
       ${selectField('Select a match','pick_match',optionMatches(state.selectedMatchId))}
       ${m?`<form id="results-form"><input type="hidden" name="match_id" value="${e(m.id)}"><div class="form-grid" style="margin-top:15px">
         ${field(`${team(m.team1_id).short_name} runs`,'team1_runs',m.team1_runs??'','number','min="0" max="9999"')}
         ${field(`${team(m.team1_id).short_name} wickets`,'team1_wickets',m.team1_wickets??'','number','min="0" max="10"')}
         ${field(`${team(m.team2_id).short_name} runs`,'team2_runs',m.team2_runs??'','number','min="0" max="9999"')}
         ${field(`${team(m.team2_id).short_name} wickets`,'team2_wickets',m.team2_wickets??'','number','min="0" max="10"')}
         ${selectField('Match status','status', ['upcoming','live','completed'].map(s=>`<option ${m.status===s?'selected':''} value="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join(''))}
         ${selectField('Winner','winner_id',`<option value="">Tie / no winner / undecided</option><option ${m.winner_id===m.team1_id?'selected':''} value="${e(m.team1_id)}">${e(team(m.team1_id).name)}</option><option ${m.winner_id===m.team2_id?'selected':''} value="${e(m.team2_id)}">${e(team(m.team2_id).name)}</option>`)}
         <div class="wide">${field('Result summary (shown publicly)','result_summary',m.result_summary||'','text','placeholder="e.g. Nova Titans won by 6 runs"')}</div>
       </div>${formBtn('Save and publish result')}</form>`:'<div class="alert">Add a match under the Fixtures tab first.</div>'}</div>`;
  };
  const adminFixtures=()=>`<div class="form-card"><h3>Add a new fixture</h3><p>Schedule a match for two teams, or leave the date blank to announce it later.</p><form id="match-form"><div class="form-grid">${selectField('Team A','team1_id',optionTeams())}${selectField('Team B','team2_id',optionTeams())}${field('Match stage / round','stage','League match','text','required maxlength="80"')}${field('Date and time (optional)','scheduled_at','','datetime-local')}</div>${formBtn('Add fixture')}</form></div><div class="form-card"><h3>Existing fixtures</h3><p>Choose Edit result to score a match.</p><div class="admin-list">${sortedMatches().map(m=>`<div class="admin-list-item"><div><strong>${e(team(m.team1_id).short_name)} vs ${e(team(m.team2_id).short_name)}</strong><small>${e(m.stage)} · ${e(m.status)} · ${e(dateLabel(m.scheduled_at))}</small></div><div class="controls"><button class="tiny-btn" data-edit-match="${e(m.id)}">Edit result</button><button class="tiny-btn danger" data-delete-match="${e(m.id)}">Delete</button></div></div>`).join('')||'<div class="notice">No matches yet</div>'}</div></div>`;
  const adminTeams=()=>{
    const t=state.teams.find(t=>t.id===state.editTeamId);
    return `<div class="form-card"><h3>${t?'Edit team':'Add a new team'}</h3><p>Choose the short code and colour displayed on fixtures and standings.</p><form id="team-form"><div class="form-grid">${field('Team name','name',t?.name||'','text','required maxlength="70"')}${field('Short code (2–5 letters)','short_name',t?.short_name||'','text','required minlength="2" maxlength="5"')}${field('Team colour','color',t?.color||'#c6fb63','color')}</div>${formBtn(t?'Save team changes':'Add team')}</form>${t?'<button class="tiny-btn" style="margin-top:12px" data-action="cancel-edit-team">Cancel edit</button>':''}</div><div class="form-card"><h3>Teams (${state.teams.length})</h3><p>You can delete teams only if they are not used by existing matches.</p><div class="admin-list">${state.teams.map(t=>`<div class="admin-list-item"><div class="team-cell">${crest(t)}<div><strong>${e(t.name)}</strong><small>${e(t.short_name)}</small></div></div><div class="controls"><button class="tiny-btn" data-edit-team="${e(t.id)}">Edit</button><button class="tiny-btn danger" data-delete-team="${e(t.id)}">Delete</button></div></div>`).join('')||'<div class="notice">Add your first team</div>'}</div></div>`;
  };
  const adminPlayers=()=>`<div class="form-card"><h3>Add a player</h3><p>Register players for leaderboards and match statistics.</p><form id="player-form"><div class="form-grid">${field('Player name','name','','text','required maxlength="70"')}${selectField('Team','team_id',optionTeams())}${field('Role (optional)','role','Player','text','maxlength="40"')}</div>${formBtn('Add player')}</form></div><div class="form-card"><h3>Registered players (${state.players.length})</h3><div class="admin-list">${state.players.map(p=>`<div class="admin-list-item"><div><strong>${e(p.name)}</strong><small>${e(team(p.team_id).name)} · ${e(p.role)}</small></div><button class="tiny-btn danger" data-delete-player="${e(p.id)}">Delete</button></div>`).join('')||'<div class="notice">No players yet</div>'}</div></div>`;
  const adminStats=()=>`<div class="form-card"><h3>Player performance</h3><p>Enter or correct a player's numbers for a match. Saving the same player and match updates the existing record.</p><form id="stat-form"><div class="form-grid">${selectField('Match','match_id',optionMatches())}${selectField('Player','player_id',`<option value="">Select player</option>${state.players.map(p=>`<option value="${e(p.id)}">${e(p.name)} (${e(team(p.team_id).short_name)})</option>`).join('')}`)}${field('Runs','runs',0,'number','required min="0"')}${field('Wickets','wickets',0,'number','required min="0" max="10"')}${field('Catches','catches',0,'number','required min="0" max="10"')}</div>${formBtn('Save player numbers')}</form></div><div class="form-card"><h3>Saved performances</h3><div class="admin-list">${state.player_performances.map(r=>{const p=state.players.find(p=>p.id===r.player_id);return `<div class="admin-list-item"><div><strong>${e(p?.name||'Player')} · ${e(team(p?.team_id).short_name)}</strong><small>${e(state.matches.find(m=>m.id===r.match_id)?.stage||'Match')} · ${r.runs} runs · ${r.wickets} wickets</small></div><button class="tiny-btn danger" data-delete-stat="${e(r.id)}">Delete</button></div>`}).join('')||'<div class="notice">No stats added</div>'}</div></div>`;
  const adminPage=()=>!state.admin?login():`<main class="main"><div class="container"><div class="page-heading"><div class="kicker">Tournament control centre</div><h1>ADMIN DASHBOARD</h1><p>Manage results, fixtures, teams, and player performances. Changes publish to the public pages.</p></div>${alertMarkup()}<div class="stat-grid" style="margin-bottom:24px">${[['Teams',state.teams.length],['Matches',state.matches.length],['Completed',completed().length]].map(([k,v])=>`<div class="stat-card"><b>${v}</b><span>${k}</span></div>`).join('')}</div><div class="admin-shell"><div class="admin-menu">${[['results','🏏 Match results'],['fixtures','▦ Fixtures'],['teams','⚑ Teams'],['players','♙ Players'],['stats','◈ Player stats']].map(([k,v])=>`<button data-admin-tab="${k}" class="${state.adminTab===k?'active':''}">${v}</button>`).join('')}<button data-action="logout">⇤ Sign out</button></div><div class="admin-main"><div class="admin-header"><h2>${e(({results:'MATCH RESULTS',fixtures:'FIXTURES',teams:'TEAMS',players:'PLAYERS',stats:'PLAYER STATS'})[state.adminTab])}</h2><span class="pill gray">ADMIN ONLY</span></div>${({results:adminResults,fixtures:adminFixtures,teams:adminTeams,players:adminPlayers,stats:adminStats})[state.adminTab]()}</div></div></div></main>`;
  function render(){
    const pages={overview:home,matches:matchesPage,standings:standingsPage,teams:teamsPage,players:playersPage,admin:adminPage};
    document.title=`${cfg.shortName||'RCL'} | ${state.page==='overview'?'Tournament Hub':state.page.charAt(0).toUpperCase()+state.page.slice(1)}`;
    $('app').innerHTML=header()+pages[state.page]()+footer();
  }
  function go(page){state.page=page;state.menu=false;state.flash='';render();window.scrollTo({top:0,behavior:'instant'});}
  function flash(msg,type='ok'){state.flash=msg;state.flashType=type;render();}
  const nullNum=v=>v===''||v==null?null:Number(v);
  const errorMessage=err=>err?.message||'Something went wrong. Please retry.';
  async function refresh(){
    if(!db){render();return;}
    try{
      const keys=['teams','matches','players','player_performances'];
      const fetched=await Promise.all(keys.map(k=>db.from(k).select('*')));
      const bad=fetched.find(r=>r.error);
      if(bad)throw bad.error;
      keys.forEach((k,i)=>state[k]=fetched[i].data||[]);
      state.mode='live';render();
    }catch(err){state.mode='demo';state.flash=`Could not load live data: ${errorMessage(err)}`;state.flashType='error';render();}
  }
  async function checkAdmin(){
    if(!db)return;
    const {data:{session},error}=await db.auth.getSession();
    if(error||!session){state.session=null;state.admin=false;return;}
    state.session=session;
    const {data,error:adminError}=await db.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
    state.admin=!!data&&!adminError;
  }
  async function actionWrite(fn,success){
    if(!state.admin||!db){flash('Admin access required.','error');return;}
    try{
      const res=await fn();if(res.error)throw res.error;
      await refresh();flash(success);
    }catch(err){flash(errorMessage(err),'error');}
  }
  async function onSubmit(form){
    const data=Object.fromEntries(new FormData(form));
    if(form.id==='login-form'){
      if(!db){flash('Connect Supabase first to enable admin login.','error');return;}
      const {error}=await db.auth.signInWithPassword({email:data.email,password:data.password});
      if(error){flash(error.message,'error');return;}
      await checkAdmin();
      if(!state.admin){await db.auth.signOut();flash('This account does not have administrator access.','error');return;}
      await refresh();flash('Signed in successfully. Welcome to your control room.');return;
    }
    if(!state.admin){flash('Please log in as an admin first.','error');return;}
    if(form.id==='team-form'){
      const payload={name:String(data.name||'').trim(),short_name:String(data.short_name||'').trim().toUpperCase(),color:safeColor(data.color)};
      if(!payload.name||payload.short_name.length<2||payload.short_name.length>5){flash('Enter a valid team name and 2–5 character short code.','error');return;}
      const edit=state.editTeamId;
      await actionWrite(()=>edit?db.from('teams').update(payload).eq('id',edit):db.from('teams').insert(payload),'Team saved.');state.editTeamId='';return;
    }
    if(form.id==='match-form'){
      if(!data.team1_id||!data.team2_id||data.team1_id===data.team2_id){flash('Choose two different teams.','error');return;}
      const payload={team1_id:data.team1_id,team2_id:data.team2_id,stage:data.stage.trim()||'League match',scheduled_at:data.scheduled_at?new Date(data.scheduled_at).toISOString():null};
      await actionWrite(()=>db.from('matches').insert(payload),'Fixture created.');return;
    }
    if(form.id==='results-form'){
      const m=state.matches.find(m=>m.id===data.match_id);if(!m){flash('Select a match.','error');return;}
      const payload={team1_runs:nullNum(data.team1_runs),team1_wickets:nullNum(data.team1_wickets),team2_runs:nullNum(data.team2_runs),team2_wickets:nullNum(data.team2_wickets),status:data.status,winner_id:data.winner_id||null,result_summary:String(data.result_summary||'').trim()};
      if(Object.entries(payload).some(([k,v])=>['team1_runs','team1_wickets','team2_runs','team2_wickets'].includes(k)&&v!==null&&(!Number.isInteger(v)||v<0||(['team1_wickets','team2_wickets'].includes(k)&&v>10)))){flash('Runs and wickets must be valid non-negative whole numbers (maximum 10 wickets).','error');return;}
      if(payload.status==='completed'&&(payload.team1_runs===null||payload.team2_runs===null)){flash('Enter both teams’ runs for a completed match.','error');return;}
      await actionWrite(()=>db.from('matches').update(payload).eq('id',data.match_id),'Result saved and published. Points table updated.');return;
    }
    if(form.id==='player-form'){
      if(!data.name.trim()||!data.team_id){flash('Choose a team and player name.','error');return;}
      await actionWrite(()=>db.from('players').insert({name:data.name.trim(),team_id:data.team_id,role:data.role?.trim()||'Player'}),'Player added.');return;
    }
    if(form.id==='stat-form'){
      if(!data.match_id||!data.player_id){flash('Choose a match and player.','error');return;}
      const m=state.matches.find(m=>m.id===data.match_id),p=state.players.find(p=>p.id===data.player_id);
      if(!m||!p||![m.team1_id,m.team2_id].includes(p.team_id)){flash('This player does not belong to either team in that match.','error');return;}
      const payload={match_id:data.match_id,player_id:data.player_id,runs:Number(data.runs),wickets:Number(data.wickets),catches:Number(data.catches)};
      if([payload.runs,payload.wickets,payload.catches].some(n=>!Number.isInteger(n)||n<0)){flash('Enter non-negative whole numbers.','error');return;}
      await actionWrite(()=>db.from('player_performances').upsert(payload,{onConflict:'match_id,player_id'}),'Player performance saved.');return;
    }
  }
  document.addEventListener('click',async event=>{
    const t=event.target.closest('button,a');if(!t)return;
    if(t.dataset.page){event.preventDefault();go(t.dataset.page);return;}
    if(t.dataset.filter){state.matchFilter=t.dataset.filter;render();return;}
    if(t.dataset.adminTab){state.adminTab=t.dataset.adminTab;state.flash='';render();return;}
    if(t.dataset.action==='toggle-menu'){state.menu=!state.menu;render();return;}
    if(t.dataset.action==='cancel-edit-team'){state.editTeamId='';render();return;}
    if(t.dataset.action==='logout'){if(db)await db.auth.signOut();state.admin=false;state.session=null;go('overview');return;}
    if(t.dataset.editTeam){state.editTeamId=t.dataset.editTeam;state.adminTab='teams';render();return;}
    if(t.dataset.editMatch){state.selectedMatchId=t.dataset.editMatch;state.adminTab='results';render();return;}
    const deleteMap=[['deleteMatch','matches','match'],['deleteTeam','teams','team'],['deletePlayer','players','player'],['deleteStat','player_performances','performance']];
    for(const [attr,table,label] of deleteMap){if(t.dataset[attr]){
      if(!confirm(`Delete this ${label}? This cannot be undone.`))return;
      await actionWrite(()=>db.from(table).delete().eq('id',t.dataset[attr]),`${label.charAt(0).toUpperCase()+label.slice(1)} deleted.`);return;
    }}
  });
  document.addEventListener('change',event=>{
    if(event.target.name==='pick_match'){state.selectedMatchId=event.target.value;render();}
  });
  document.addEventListener('submit',async event=>{
    if(!event.target.matches('form'))return;
    event.preventDefault();const submit=event.target.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Saving…';}
    try{await onSubmit(event.target);}catch(err){flash(errorMessage(err),'error');}finally{if(submit?.isConnected){submit.disabled=false;submit.textContent='Save';}}
  });
  async function init(){
    render();
    if(cfg.supabaseUrl&&cfg.supabaseAnonKey){
      if(!window.supabase){state.flash='Supabase library did not load. Check your internet connection.';state.flashType='error';render();return;}
      try{db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);await refresh();await checkAdmin();render();}
      catch(err){state.flash=errorMessage(err);state.flashType='error';render();}
    }
  }
  init();
})();
