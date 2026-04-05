import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

// yo this is where the flask homie lives
const FLASK_HOMIE = "https://ai-coach-codeforces.onrender.com";

// each rank gets its own drip color
const RANK_DRIP = {
  "newbie": "#808080",
  "pupil": "#008000",
  "specialist": "#03a89e",
  "expert": "#0000ff",
  "candidate master": "#aa00aa",
  "master": "#ff8c00",
  "international master": "#ff8c00",
  "grandmaster": "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
  "unranked": "#999"
};

// gimme the color for whatever rank this guy is
const getTheirDrip = (rank = "") => RANK_DRIP[rank.toLowerCase()] || "#999";

// the whole vibe of the app lives here
const VIBE = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceAlt: "#1a1a26",
  border: "#2a2a3d",
  accent: "#7c6aff",
  accentGlow: "#7c6aff44",
  accentSoft: "#a89cff",
  gold: "#f5c842",
  green: "#3ecf8e",
  red: "#ff5757",
  text: "#e8e8f0",
  muted: "#7070a0",
};

// all the css swag in one place, no separate files needed
const allTheStyling = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: ${VIBE.bg};
    --surface: ${VIBE.surface};
    --surface-alt: ${VIBE.surfaceAlt};
    --border: ${VIBE.border};
    --accent: ${VIBE.accent};
    --accent-glow: ${VIBE.accentGlow};
    --accent-soft: ${VIBE.accentSoft};
    --gold: ${VIBE.gold};
    --green: ${VIBE.green};
    --red: ${VIBE.red};
    --text: ${VIBE.text};
    --muted: ${VIBE.muted};
  }

  html, body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; }

  /* scrollbar lookin clean */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .whole-app { min-height: 100vh; display: flex; flex-direction: column; }

  /* the top bar that stays put */
  .sticky-topbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 2rem;
    padding: 0 2rem; height: 60px;
    background: rgba(10,10,15,0.85); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
  .logo-text {
    font-family: 'Space Mono', monospace; font-size: 1rem; font-weight: 700;
    color: var(--accent); letter-spacing: -0.02em; white-space: nowrap;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .logo-lil-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
  .page-switcher-row { display: flex; gap: 0.25rem; margin-left: auto; }
  .page-switcher-btn {
    padding: 0.4rem 1rem; border-radius: 6px; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 600;
    background: transparent; color: var(--muted); transition: all 0.2s;
    letter-spacing: 0.02em;
  }
  .page-switcher-btn:hover { color: var(--text); background: var(--surface-alt); }
  .page-switcher-btn.im-active { background: var(--accent); color: #fff; box-shadow: 0 0 20px var(--accent-glow); }

  /* the big welcome screen before u search anyone */
  .landing-screen {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 6rem 2rem 4rem; text-align: center; position: relative; overflow: hidden;
  }
  .landing-screen::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, #7c6aff18, transparent 70%);
    pointer-events: none;
  }
  .big-heading {
    font-size: clamp(2.5rem, 7vw, 5rem); font-weight: 800; line-height: 1.05;
    letter-spacing: -0.04em; margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 30%, var(--accent-soft) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .lil-desc { color: var(--muted); font-size: 1.05rem; margin-bottom: 2.5rem; max-width: 520px; line-height: 1.7; }

  /* where u type the handle */
  .handle-input-zone { display: flex; gap: 0.75rem; width: 100%; max-width: 480px; }
  .text-box {
    flex: 1; background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 0.85rem 1.25rem;
    font-family: 'Space Mono', monospace; font-size: 0.95rem; color: var(--text);
    outline: none; transition: border 0.2s, box-shadow 0.2s;
  }
  .text-box:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .text-box::placeholder { color: var(--muted); }
  .go-btn {
    background: var(--accent); color: #fff; border: none; border-radius: 10px;
    padding: 0.85rem 1.5rem; font-family: 'Syne', sans-serif; font-size: 0.9rem;
    font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .go-btn:hover { filter: brightness(1.15); box-shadow: 0 0 24px var(--accent-glow); }
  .go-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* the main content wrapper */
  .main-content-zone { flex: 1; padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }

  /* the dude's profile at the top */
  .their-profile {
    display: flex; align-items: center; gap: 1.5rem;
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.5rem; margin-bottom: 2rem; position: relative; overflow: hidden;
  }
  .their-profile::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--accent-glow), transparent 60%);
    pointer-events: none;
  }
  .their-pfp { width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--border); object-fit: cover; }
  .their-username { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
  .their-rank-text { font-size: 0.85rem; font-weight: 700; margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 0.08em; }
  .rating-numbers-zone { display: flex; gap: 2rem; margin-left: auto; }
  .one-number-block { text-align: right; }
  .the-big-number { font-family: 'Space Mono', monospace; font-size: 1.4rem; font-weight: 700; }
  .number-caption { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.1rem; }

  /* layout grids */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .four-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }
  @media (max-width: 700px) { .four-col { grid-template-columns: repeat(2, 1fr); } }

  /* generic card box */
  .info-box {
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 1.5rem; transition: border-color 0.2s;
  }
  .info-box:hover { border-color: #3a3a55; }
  .box-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin-bottom: 1.2rem; font-weight: 700; }

  /* lil number tile */
  .number-tile {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;
  }
  .tile-number { font-family: 'Space Mono', monospace; font-size: 1.6rem; font-weight: 700; }
  .tile-caption { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

  /* topic / tag pill */
  .topic-pill {
    display: inline-block; padding: 0.2rem 0.6rem; border-radius: 6px;
    font-size: 0.72rem; font-weight: 700; background: var(--surface-alt);
    color: var(--muted); border: 1px solid var(--border); margin: 0.2rem;
  }
  .topic-pill.lit { background: var(--accent-glow); color: var(--accent-soft); border-color: var(--accent); }

  /* section title like "Contest History" */
  .section-title { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1.5rem; }

  /* the table for contests / problems */
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .data-table th { text-align: left; padding: 0.6rem 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); border-bottom: 1px solid var(--border); }
  .data-table td { padding: 0.7rem 1rem; border-bottom: 1px solid #1e1e2e; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: var(--surface-alt); }

  /* the +/- rating change chip */
  .rating-change { font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 5px; }
  .rating-change.went-up { background: #3ecf8e22; color: var(--green); }
  .rating-change.went-down { background: #ff575722; color: var(--red); }
  .rating-change.stayed-same { background: #80808022; color: var(--muted); }

  /* the bouncing dots when waiting for data */
  .loading-vibes { display: flex; align-items: center; justify-content: center; padding: 4rem; gap: 0.5rem; }
  .bounce-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: doBounce 1.2s infinite ease-in-out; }
  .bounce-dot:nth-child(2) { animation-delay: 0.2s; }
  .bounce-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes doBounce { 0%,80%,100% { transform: scale(0); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }

  /* when something goes sideways */
  .uh-oh-box { background: #ff575712; border: 1px solid #ff575740; border-radius: 10px; padding: 1rem 1.5rem; color: var(--red); font-size: 0.9rem; }

  /* ai advice page top banner */
  .ai-banner {
    background: linear-gradient(135deg, #1a1a2e, #12121a);
    border: 1px solid var(--border); border-radius: 16px;
    padding: 2rem; margin-bottom: 2rem; position: relative; overflow: hidden;
  }
  .ai-banner::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, #7c6aff33, transparent 70%);
  }
  .ai-banner-heading { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
  .ai-banner-sub { color: var(--muted); font-size: 0.9rem; line-height: 1.7; }

  /* each contest accordion thingy */
  .contest-drop {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    overflow: hidden; margin-bottom: 1.5rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .contest-drop:hover { border-color: var(--accent); box-shadow: 0 0 30px var(--accent-glow); }
  .contest-drop-header {
    display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border); background: var(--surface-alt);
    cursor: pointer; transition: background 0.2s;
  }
  .contest-drop-header:hover { background: #1e1e30; }

  /* the lil C1 C2 badge */
  .contest-badge {
    width: 36px; height: 36px; border-radius: 10px; background: var(--accent-glow);
    border: 1px solid var(--accent); display: flex; align-items: center; justify-content: center;
    font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; color: var(--accent);
    flex-shrink: 0;
  }
  .contest-name-chunk { flex: 1; min-width: 0; }
  .contest-full-name { font-weight: 700; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .contest-when { font-size: 0.75rem; color: var(--muted); margin-top: 0.1rem; }
  .contest-right-chips { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
  .contest-drop-body { padding: 1.5rem; animation: slideDown 0.3s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  /* the ai coach text block */
  .coach-says {
    font-size: 0.92rem; line-height: 1.85; color: var(--text);
    font-family: 'Syne', sans-serif; white-space: pre-wrap;
  }
  .coach-says-box {
    background: var(--surface-alt); border-radius: 10px; padding: 1.25rem;
    border-left: 3px solid var(--accent); margin-bottom: 1.25rem;
  }
  .coach-label {
    font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--accent); font-weight: 700; margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .coach-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* the lil stat chips in the contest body */
  .stat-chips-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .one-stat-chip {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 0.4rem 0.85rem; font-size: 0.78rem;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .one-stat-chip b { font-family: 'Space Mono', monospace; color: var(--text); }
  .one-stat-chip span { color: var(--muted); }

  /* nothing here state */
  .nothing-here { text-align: center; padding: 4rem; color: var(--muted); }
  .nothing-icon { font-size: 3rem; margin-bottom: 1rem; }
  .nothing-text { font-size: 1rem; }

  /* tag bar chart rows */
  .tag-bar-row { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem; }
  .tag-name-label { font-size: 0.78rem; color: var(--muted); width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag-bar-track { flex: 1; height: 6px; background: var(--surface-alt); border-radius: 3px; overflow: hidden; }
  .tag-bar-fill { height: 100%; border-radius: 3px; background: var(--accent); }
  .tag-bar-count { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--muted); width: 24px; text-align: right; }

  /* the lil green pulsing dot */
  .alive-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); position: relative; }
  .alive-dot::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; background: var(--green); opacity: 0.4; animation: doPulse 1.5s infinite; }
  @keyframes doPulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }

  .thin-line { height: 1px; background: var(--border); margin: 1.5rem 0; }

  /* problem badges: solved / upsolved / rip */
  .solved-it { display: inline-flex; align-items: center; gap: 0.35rem; background: #3ecf8e18; color: var(--green); border: 1px solid #3ecf8e40; border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 700; }
  .couldnt-do-it { display: inline-flex; align-items: center; gap: 0.35rem; background: #ff575718; color: var(--red); border: 1px solid #ff575740; border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 700; }
  .did-it-after { display: inline-flex; align-items: center; gap: 0.35rem; background: #f5c84218; color: var(--gold); border: 1px solid #f5c84240; border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 700; }
`;

// ── lil helper to hit the backend ──────────────────────────────────
const askFlask = async (endpoint) => {
  const resp = await fetch(FLASK_HOMIE + endpoint);
  if (!resp.ok) throw new Error(`bruh ${resp.status} ${resp.statusText}`);
  return resp.json();
};

// ── the loading animation while we wait ───────────────────────────
const WaitingForData = () => (
  <div className="loading-vibes">
    <div className="bounce-dot" />
    <div className="bounce-dot" />
    <div className="bounce-dot" />
  </div>
);

// ── shows when smth goes wrong ────────────────────────────────────
const WentWrong = ({ msg }) => <div className="uh-oh-box">⚠ {msg}</div>;

// ── shows the +/- rating change ───────────────────────────────────
const RatingFlip = ({ howMuch }) => {
  if (howMuch > 0) return <span className="rating-change went-up">+{howMuch}</span>;
  if (howMuch < 0) return <span className="rating-change went-down">{howMuch}</span>;
  return <span className="rating-change stayed-same">0</span>;
};

// ── custom tooltip so charts look clean ──────────────────────────
const NiceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: VIBE.surface, border: `1px solid ${VIBE.border}`, borderRadius: 8, padding: "0.6rem 1rem", fontSize: "0.8rem" }}>
      <div style={{ color: VIBE.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, idx) => (
        <div key={idx} style={{ color: p.color || VIBE.accent, fontFamily: "'Space Mono', monospace" }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

// ── shows the guy's profile at the top of every page ─────────────
const TheirProfileCard = ({ theirInfo }) => (
  <div className="their-profile">
    {theirInfo.avatar && <img className="their-pfp" src={theirInfo.avatar} alt={theirInfo.handle} />}
    <div>
      <div className="their-username">{theirInfo.handle}</div>
      <div className="their-rank-text" style={{ color: getTheirDrip(theirInfo.rank) }}>
        {theirInfo.rank || "Unranked"}
      </div>
      <div style={{ fontSize: "0.75rem", color: VIBE.muted, marginTop: "0.4rem" }}>
        Joined {theirInfo.registrationTime} · {theirInfo.days_on_site} days grinding
      </div>
    </div>
    <div className="rating-numbers-zone">
      <div className="one-number-block">
        <div className="the-big-number" style={{ color: getTheirDrip(theirInfo.rank) }}>
          {theirInfo.rating ?? "—"}
        </div>
        <div className="number-caption">Rating rn</div>
      </div>
      <div className="one-number-block">
        <div className="the-big-number" style={{ color: getTheirDrip(theirInfo.maxRank) }}>
          {theirInfo.maxRating ?? "—"}
        </div>
        <div className="number-caption">Peak rating</div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════
//  DASHBOARD - the main stats page when u first load someone
// ════════════════════════════════════════════════════════════════════
const DashboardPage = ({ whoWeChecking }) => {
  const [theirInfo, setTheirInfo] = useState(null);
  const [ratingJourney, setRatingJourney] = useState(null);
  const [weeklyGrind, setWeeklyGrind] = useState(null);
  const [everySolve, setEverySolve] = useState(null);
  const [stillLoading, setStillLoading] = useState(true);
  const [somethingBroke, setSomethingBroke] = useState(null);

  // fetch everything at once when the handle changes
  useEffect(() => {
    if (!whoWeChecking) return;
    setStillLoading(true);
    setSomethingBroke(null);
    Promise.all([
      askFlask(`/user/info?handle=${whoWeChecking}`),
      askFlask(`/user/rating-history?handle=${whoWeChecking}`),
      askFlask(`/user/weekly-progress?handle=${whoWeChecking}`),
      askFlask(`/user/problem-history?handle=${whoWeChecking}`),
    ])
      .then(([info, ratings, weekly, problems]) => {
        setTheirInfo(info);
        setRatingJourney(ratings);
        setWeeklyGrind(weekly);
        setEverySolve(problems);
        setStillLoading(false);
      })
      .catch(err => { setSomethingBroke(err.message); setStillLoading(false); });
  }, [whoWeChecking]);

  if (!whoWeChecking) return (
    <div className="nothing-here">
      <div className="nothing-icon">🏆</div>
      <div className="nothing-text">type someone's cf handle up top to see their stats</div>
    </div>
  );
  if (stillLoading) return <WaitingForData />;
  if (somethingBroke) return <WentWrong msg={somethingBroke} />;

  // ── crunch the rating chart data ──
  const ratingChartPoints = ratingJourney?.slice(-30).map(c => ({
    contestShortName: c.contest_name?.slice(0, 18) + "…",
    ratingAfter: c.new_rating,
    howManySolved: c.solved,
  })) || [];

  // ── make weekly labels like W3/12 ──
  const weekTags = weeklyGrind?.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (weeklyGrind.length - 1 - i) * 7);
    return `W${d.getMonth() + 1}/${d.getDate()}`;
  }) || [];
  const weeklyChartData = weeklyGrind?.map((howMany, i) => ({
    weekTag: weekTags[i],
    solvedThatWeek: howMany
  })) || [];

  // ── count how many times each tag appears ──
  const tagFrequency = {};
  everySolve?.forEach(prob => prob.tags?.forEach(t => {
    tagFrequency[t] = (tagFrequency[t] || 0) + 1;
  }));
  const topTagsSorted = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tagName, timesAppeared]) => ({ tagName, timesAppeared }));

  // ── bucket problems by difficulty (rounded to nearest 200) ──
  const difficultyBuckets = {};
  everySolve?.forEach(prob => {
    if (prob.rating && prob.rating !== "Unrated") {
      const nearestBucket = Math.floor(prob.rating / 200) * 200;
      difficultyBuckets[nearestBucket] = (difficultyBuckets[nearestBucket] || 0) + 1;
    }
  });
  const difficultyChartData = Object.entries(difficultyBuckets)
    .sort((a, b) => +a[0] - +b[0])
    .map(([diffLevel, count]) => ({ diffLevel, count }));

  // ── radar chart uses top 6 tags ──
  const radarPoints = topTagsSorted.slice(0, 6).map(t => ({
    shortTag: t.tagName.slice(0, 12),
    freq: t.timesAppeared
  }));

  // ── the 4 summary numbers at the top ──
  const totalEverSolved = everySolve?.length || 0;
  const solvedThisWeek = weeklyGrind?.slice(-1)[0] || 0;
  const solvedLastMonth = weeklyGrind?.slice(-4).reduce((sum, n) => sum + n, 0) || 0;
  const onlyRatedProbs = everySolve?.filter(p => typeof p.rating === "number") || [];
  const avgDifficultyTheyDo = onlyRatedProbs.length
    ? Math.round(onlyRatedProbs.reduce((sum, p) => sum + p.rating, 0) / onlyRatedProbs.length)
    : 0;

  const tallestTagBar = topTagsSorted[0]?.timesAppeared || 1;

  return (
    <div>
      <TheirProfileCard theirInfo={theirInfo} />

      {/* 4 lil number tiles */}
      <div className="four-col" style={{ marginBottom: "2rem" }}>
        {[
          { num: totalEverSolved, caption: "Total Solved", color: VIBE.accent },
          { num: solvedThisWeek, caption: "This Week", color: VIBE.green },
          { num: solvedLastMonth, caption: "Last 30 Days", color: VIBE.gold },
          { num: avgDifficultyTheyDo || "—", caption: "Avg Difficulty", color: VIBE.accentSoft },
        ].map(tile => (
          <div className="number-tile" key={tile.caption}>
            <div className="tile-number" style={{ color: tile.color }}>{tile.num}</div>
            <div className="tile-caption">{tile.caption}</div>
          </div>
        ))}
      </div>

      {/* rating over time area chart */}
      <div className="info-box" style={{ marginBottom: "1.5rem" }}>
        <div className="box-label">Rating Journey</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={ratingChartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={VIBE.accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={VIBE.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={VIBE.border} />
            <XAxis dataKey="contestShortName" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: VIBE.muted, fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<NiceTooltip />} />
            <Area
              type="monotone" dataKey="ratingAfter"
              stroke={VIBE.accent} strokeWidth={2}
              fill="url(#ratingGrad)" name="Rating"
              dot={false} activeDot={{ r: 5, fill: VIBE.accent }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="two-col" style={{ marginBottom: "1.5rem" }}>
        {/* how many problems per week */}
        <div className="info-box">
          <div className="box-label">Weekly Grind (last 24 weeks)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={VIBE.border} vertical={false} />
              <XAxis dataKey="weekTag" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: VIBE.muted, fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<NiceTooltip />} />
              <Bar dataKey="solvedThatWeek" fill={VIBE.accent} radius={[3, 3, 0, 0]} name="Solved">
                {weeklyChartData.map((entry, i) => (
                  // color the bars by how productive the week was
                  <Cell
                    key={i}
                    fill={entry.solvedThatWeek > 5 ? VIBE.accent : entry.solvedThatWeek > 2 ? VIBE.accentSoft : VIBE.border}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* what difficulty do they usually solve */}
        <div className="info-box">
          <div className="box-label">Difficulty Sweet Spot</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={difficultyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={VIBE.border} vertical={false} />
              <XAxis dataKey="diffLevel" tick={{ fill: VIBE.muted, fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: VIBE.muted, fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<NiceTooltip />} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Problems">
                {difficultyChartData.map((entry, i) => {
                  // green = easy, purple = mid, gold = hard, red = tryhard territory
                  const diff = +entry.diffLevel;
                  const barColor = diff < 1200 ? VIBE.green : diff < 1600 ? VIBE.accentSoft : diff < 2000 ? VIBE.gold : VIBE.red;
                  return <Cell key={i} fill={barColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        {/* the tags they grind the most */}
        <div className="info-box">
          <div className="box-label">Their Favorite Topics</div>
          {topTagsSorted.map(t => (
            <div className="tag-bar-row" key={t.tagName}>
              <div className="tag-name-label">{t.tagName}</div>
              <div className="tag-bar-track">
                <div className="tag-bar-fill" style={{ width: `${(t.timesAppeared / tallestTagBar) * 100}%` }} />
              </div>
              <div className="tag-bar-count">{t.timesAppeared}</div>
            </div>
          ))}
        </div>

        {/* radar for top 6 topics - shows balance or lack thereof lol */}
        <div className="info-box">
          <div className="box-label">Topic Balance (top 6)</div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarPoints}>
              <PolarGrid stroke={VIBE.border} />
              <PolarAngleAxis dataKey="shortTag" tick={{ fill: VIBE.muted, fontSize: 10, fontFamily: "Syne" }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar name="Count" dataKey="freq" stroke={VIBE.accent} fill={VIBE.accent} fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  CONTESTS PAGE - full list of every contest they've done
// ════════════════════════════════════════════════════════════════════
const ContestsPage = ({ whoWeChecking }) => {
  const [allTheirContests, setAllTheirContests] = useState(null);
  const [stillLoading, setStillLoading] = useState(true);
  const [somethingBroke, setSomethingBroke] = useState(null);

  useEffect(() => {
    if (!whoWeChecking) return;
    setStillLoading(true);
    setSomethingBroke(null);
    askFlask(`/user/rating-history?handle=${whoWeChecking}`)
      .then(data => { setAllTheirContests(data); setStillLoading(false); })
      .catch(err => { setSomethingBroke(err.message); setStillLoading(false); });
  }, [whoWeChecking]);

  if (!whoWeChecking) return <div className="nothing-here"><div className="nothing-icon">📋</div><div className="nothing-text">enter a handle first bro</div></div>;
  if (stillLoading) return <WaitingForData />;
  if (somethingBroke) return <WentWrong msg={somethingBroke} />;

  // newest first
  const newestFirst = [...(allTheirContests || [])].reverse();

  return (
    <div>
      <div className="section-title">
        Contest History{" "}
        <span style={{ color: VIBE.muted, fontWeight: 400, fontSize: "0.85rem" }}>
          ({newestFirst.length} contests total)
        </span>
      </div>
      <div className="info-box" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contest Name</th>
              <th>Div</th>
              <th>Rank</th>
              <th>Was</th>
              <th>Now</th>
              <th>Change</th>
              <th>Solved</th>
            </tr>
          </thead>
          <tbody>
            {newestFirst.map((contest, i) => (
              <tr key={contest.contest_id}>
                <td style={{ color: VIBE.muted, fontFamily: "Space Mono", fontSize: "0.75rem" }}>
                  {newestFirst.length - i}
                </td>
                <td style={{ maxWidth: 280 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contest.contest_name}
                  </div>
                </td>
                <td><span className="topic-pill">{contest.division}</span></td>
                <td style={{ fontFamily: "Space Mono", fontSize: "0.85rem" }}>{contest.rank}</td>
                <td style={{ fontFamily: "Space Mono", fontSize: "0.85rem", color: VIBE.muted }}>{contest.old_rating}</td>
                <td style={{ fontFamily: "Space Mono", fontSize: "0.85rem" }}>{contest.new_rating}</td>
                <td><RatingFlip howMuch={contest.new_rating - contest.old_rating} /></td>
                <td style={{ fontFamily: "Space Mono", fontSize: "0.85rem", color: VIBE.accent }}>{contest.solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  PROBLEMS PAGE - every problem they've ever solved
// ════════════════════════════════════════════════════════════════════
const ProblemsPage = ({ whoWeChecking }) => {
  const [allSolvedProbs, setAllSolvedProbs] = useState(null);
  const [stillLoading, setStillLoading] = useState(true);
  const [somethingBroke, setSomethingBroke] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickedTag, setPickedTag] = useState("");

  useEffect(() => {
    if (!whoWeChecking) return;
    setStillLoading(true);
    setSomethingBroke(null);
    askFlask(`/user/problem-history?handle=${whoWeChecking}`)
      .then(data => { setAllSolvedProbs(data); setStillLoading(false); })
      .catch(err => { setSomethingBroke(err.message); setStillLoading(false); });
  }, [whoWeChecking]);

  if (!whoWeChecking) return <div className="nothing-here"><div className="nothing-icon">📝</div><div className="nothing-text">enter a handle first bro</div></div>;
  if (stillLoading) return <WaitingForData />;
  if (somethingBroke) return <WentWrong msg={somethingBroke} />;

  // all unique tags for the dropdown
  const everyTagEver = [...new Set(allSolvedProbs?.flatMap(p => p.tags || []))].sort();

  // filter by search and tag
  const afterFiltering = allSolvedProbs?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!pickedTag || p.tags?.includes(pickedTag))
  ) || [];

  return (
    <div>
      <div className="section-title">
        Problems Solved{" "}
        <span style={{ color: VIBE.muted, fontWeight: 400, fontSize: "0.85rem" }}>
          ({allSolvedProbs?.length} total)
        </span>
      </div>

      {/* search + filter row */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          className="text-box"
          style={{ maxWidth: 300, padding: "0.6rem 1rem", fontSize: "0.85rem" }}
          placeholder="search by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="text-box"
          style={{ maxWidth: 200, padding: "0.6rem 1rem", fontSize: "0.85rem" }}
          value={pickedTag}
          onChange={e => setPickedTag(e.target.value)}
        >
          <option value="">All Topics</option>
          {everyTagEver.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ color: VIBE.muted, fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
          {afterFiltering.length} showing
        </div>
      </div>

      <div className="info-box" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Problem Name</th>
              <th>Index</th>
              <th>Rating</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            {afterFiltering.slice(0, 200).map((prob, i) => {
              // color-code by how hard it is
              const diffColor = typeof prob.rating === "number"
                ? prob.rating < 1200 ? VIBE.green
                : prob.rating < 1600 ? VIBE.accentSoft
                : prob.rating < 2000 ? VIBE.gold
                : VIBE.red
                : VIBE.muted;

              return (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{prob.name}</td>
                  <td style={{ fontFamily: "Space Mono", fontSize: "0.8rem", color: VIBE.muted }}>
                    {prob.index?.toUpperCase()}
                  </td>
                  <td style={{ fontFamily: "Space Mono", fontSize: "0.85rem", color: diffColor, fontWeight: 700 }}>
                    {prob.rating || "—"}
                  </td>
                  <td>{prob.tags?.slice(0, 3).map(t => <span className="topic-pill" key={t}>{t}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {afterFiltering.length > 200 && (
          <div style={{ padding: "0.75rem 1rem", color: VIBE.muted, fontSize: "0.8rem", borderTop: `1px solid ${VIBE.border}` }}>
            only showing 200 of {afterFiltering.length} — filter it down a bit
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  COACH ADVICE PAGE - performance insights
// ════════════════════════════════════════════════════════════════════

// takes the big blob of ai text and chops it into per-contest pieces
const chopAdvicePerContest = (fullAdviceBlob, contestList) => {
  if (!fullAdviceBlob || !contestList?.length) return [];
  const nonEmptyLines = fullAdviceBlob.split("\n").filter(line => line.trim());
  const linesPerContest = Math.ceil(nonEmptyLines.length / contestList.length);
  return contestList.map((contest, i) => ({
    ...contest,
    coachWordsForThis: nonEmptyLines
      .slice(i * linesPerContest, (i + 1) * linesPerContest)
      .join("\n")
  }));
};

// one accordion card per contest with metrics + ai words
const OneContestAdviceBlock = ({ contestData, positionNum, totalContests }) => {
  const [isOpen, setIsOpen] = useState(positionNum === 0); // first one open by default
  const ratingSwing = contestData.delta || (contestData.new_rating - contestData.old_rating);

  return (
    <div className="contest-drop">
      {/* clickable header row */}
      <div className="contest-drop-header" onClick={() => setIsOpen(prev => !prev)}>
        <div className="contest-badge">C{totalContests - positionNum}</div>
        <div className="contest-name-chunk">
          <div className="contest-full-name">{contestData.contest_name}</div>
          <div className="contest-when">{contestData.date} · {contestData.division}</div>
        </div>
        <div className="contest-right-chips">
          <RatingFlip howMuch={ratingSwing} />
          {typeof contestData.problems_solved === "number" && (
            <span className="topic-pill">
              {contestData.problems_solved}/{contestData.problems_attempted} solved
            </span>
          )}
          {/* lil arrow that flips when open */}
          <span style={{ color: VIBE.muted, transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>
            ▾
          </span>
        </div>
      </div>

      {/* the body that shows when u click */}
      {isOpen && (
        <div className="contest-drop-body">

          {/* quick stats chips */}
          <div className="stat-chips-row">
            <div className="one-stat-chip">
              <b>{contestData.old_rating}</b>
              <span>→</span>
              <b style={{ color: ratingSwing >= 0 ? VIBE.green : VIBE.red }}>{contestData.new_rating}</b>
            </div>
            <div className="one-stat-chip"><span>Rank</span><b>#{contestData.rank}</b></div>
            {contestData.first_ac_time && contestData.first_ac_time !== "N/A" && (
              <div className="one-stat-chip"><span>First solve</span><b>{contestData.first_ac_time}</b></div>
            )}
            {contestData.duration_between_first_last_ac_mins !== "N/A" && (
              <div className="one-stat-chip">
                <span>Active for</span><b>{contestData.duration_between_first_last_ac_mins}m</b>
              </div>
            )}
            {contestData.accuracy && (
              <div className="one-stat-chip"><span>Hit rate</span><b>{contestData.accuracy}</b></div>
            )}
          </div>

          {/* which problems they got, missed, or did later */}
          {(contestData.solved_problems?.length > 0 ||
            contestData.upsolved_problems?.length > 0 ||
            contestData.unsolved_problems?.length > 0) && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {contestData.solved_problems?.map(p => (
                <span key={p.index} className="solved-it">✓ {p.index?.toUpperCase()} ({p.rating || "?"})</span>
              ))}
              {contestData.upsolved_problems?.map(p => (
                <span key={p.index} className="did-it-after">↑ {p.index?.toUpperCase()} ({p.rating || "?"})</span>
              ))}
              {contestData.unsolved_problems?.map(p => (
                <span key={p.index} className="couldnt-do-it">✗ {p.index?.toUpperCase()} ({p.rating || "?"})</span>
              ))}
            </div>
          )}

          {/* tags they encountered */}
          {contestData.solved_tags?.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              {contestData.solved_tags.map(t => (
                <span className="topic-pill lit" key={t}>{t}</span>
              ))}
            </div>
          )}

          {/* the actual coaching words */}
          {contestData.coachWordsForThis && (
            <div className="coach-says-box">
              <div className="coach-label">📝 What the coach says</div>
              <div className="coach-says">{contestData.coachWordsForThis}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// the full ai advice page
const AIAdvicePage = ({ whoWeChecking }) => {
  const [theirInfo, setTheirInfo] = useState(null);
  const [advicePayload, setAdvicePayload] = useState(null);
  const [stillLoading, setStillLoading] = useState(false);
  const [somethingBroke, setSomethingBroke] = useState(null);

  // hit both endpoints at once
  const goFetchTheAdvice = () => {
    if (!whoWeChecking) return;
    setStillLoading(true);
    setSomethingBroke(null);
    setAdvicePayload(null);
    Promise.all([
      askFlask(`/user/info?handle=${whoWeChecking}`),
      askFlask(`/user/contest-advice?handle=${whoWeChecking}`),
    ])
      .then(([info, advice]) => {
        setTheirInfo(info);
        setAdvicePayload(advice);
        setStillLoading(false);
      })
      .catch(err => { setSomethingBroke(err.message); setStillLoading(false); });
  };

  // auto-fetch when the handle changes
  useEffect(() => { if (whoWeChecking) goFetchTheAdvice(); }, [whoWeChecking]);

  if (!whoWeChecking) return (
    <div className="nothing-here">
      <div className="nothing-icon">📝</div>
      <div className="nothing-text">enter a handle to get your performance feedback</div>
    </div>
  );

  const contestsFromApi = advicePayload?.contest_summary || [];
  const bigAdviceBlob = advicePayload?.advice || "";

  // split the advice blob into per-contest chunks
  const contestsWithAdvice = chopAdvicePerContest(bigAdviceBlob, contestsFromApi);

  // first few lines = overall vibe summary
  const overallVibeLines = bigAdviceBlob.split("\n").slice(0, 4).join("\n");

  return (
    <div>
      {/* top banner */}
      <div className="ai-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div className="alive-dot" />
          <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: VIBE.muted }}>
            Coach is online
          </span>
        </div>
        <div className="ai-banner-heading">
          {theirInfo ? `${theirInfo.handle}'s Performance Report` : "Getting your report ready..."}
        </div>
        <div className="ai-banner-sub">
          Breaking down your last {contestsFromApi.length} contests — what you're nailing and what needs work.
        </div>
        {!stillLoading && (
          <button className="go-btn" style={{ marginTop: "1rem" }} onClick={goFetchTheAdvice}>
            ↻ Regenerate Analysis
          </button>
        )}
      </div>

      {/* loading state with a lil message */}
      {stillLoading && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <WaitingForData />
          <div style={{ color: VIBE.muted, fontSize: "0.85rem", marginTop: "1rem" }}>
            analyzing your submissions… give it a few seconds
          </div>
        </div>
      )}

      {somethingBroke && <WentWrong msg={somethingBroke} />}

      {advicePayload && !stillLoading && (
        <>
          {/* overall summary card up top */}
          {bigAdviceBlob && (
            <div className="info-box" style={{ marginBottom: "2rem", borderColor: VIBE.accent + "60" }}>
              <div className="box-label">Overall Vibe Check</div>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* their current numbers */}
                {theirInfo && (
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontFamily: "Space Mono", fontSize: "2rem", fontWeight: 700, color: getTheirDrip(theirInfo.rank) }}>
                      {theirInfo.rating}
                    </div>
                    <div style={{ color: VIBE.muted, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {theirInfo.rank}
                    </div>
                    <div className="thin-line" style={{ margin: "0.75rem 0" }} />
                    <div style={{ color: VIBE.muted, fontSize: "0.78rem" }}>
                      Peak:{" "}
                      <span style={{ color: VIBE.text, fontFamily: "Space Mono" }}>{theirInfo.maxRating}</span>
                    </div>
                    <div style={{ color: VIBE.muted, fontSize: "0.78rem", marginTop: "0.25rem" }}>
                      Peak rank:{" "}
                      <span style={{ color: getTheirDrip(theirInfo.maxRank) }}>{theirInfo.maxRank}</span>
                    </div>
                  </div>
                )}
                {/* the coach's general thoughts */}
                <div style={{ flex: 1 }}>
                  <div className="coach-label">📝 Big picture</div>
                  <div className="coach-says" style={{ fontSize: "0.9rem" }}>{overallVibeLines}</div>
                </div>
              </div>
            </div>
          )}

          {/* per-contest breakdown */}
          <div className="section-title">
            Contest by Contest{" "}
            <span style={{ color: VIBE.muted, fontWeight: 400, fontSize: "0.85rem" }}>
              ({contestsWithAdvice.length} contests)
            </span>
          </div>

          {contestsWithAdvice.length === 0 && (
            <div className="nothing-here">
              <div className="nothing-icon">📭</div>
              <div className="nothing-text">no contest data found for this handle</div>
            </div>
          )}

          {contestsWithAdvice.map((contest, i) => (
            <OneContestAdviceBlock
              key={contest.contest_id || i}
              contestData={contest}
              positionNum={i}
              totalContests={contestsWithAdvice.length}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  ROOT APP - ties everything together
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [lockedInHandle, setLockedInHandle] = useState(""); // the handle we're actually viewing
  const [typingHandle, setTypingHandle] = useState("");     // what's in the input box rn
  const [currentPage, setCurrentPage] = useState("dashboard");

  // lock in the handle and go to dashboard
  const lockInAndGo = () => {
    if (typingHandle.trim()) {
      setLockedInHandle(typingHandle.trim());
      setCurrentPage("dashboard");
    }
  };

  const notSearchedYet = !lockedInHandle;

  return (
    <>
      <style>{allTheStyling}</style>
      <div className="whole-app">

        {/* sticky top nav bar */}
        <nav className="sticky-topbar">
          <div className="logo-text">
            <div className="logo-lil-dot" />
            CF Coach
          </div>

          {/* show the active handle with a pulse dot */}
          {lockedInHandle && (
            <div style={{ fontFamily: "Space Mono", fontSize: "0.78rem", color: VIBE.muted, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="alive-dot" style={{ width: 6, height: 6 }} />
              {lockedInHandle}
            </div>
          )}

          {/* page switcher tabs - only show after a handle is searched */}
          {lockedInHandle && (
            <div className="page-switcher-row">
              {[
                ["dashboard", "Dashboard"],
                ["contests", "Contests"],
                ["problems", "Problems"],
                ["ai", "Coach's Notes"],
              ].map(([pageId, pageLabel]) => (
                <button
                  key={pageId}
                  className={`page-switcher-btn ${currentPage === pageId ? "im-active" : ""}`}
                  onClick={() => setCurrentPage(pageId)}
                >
                  {pageLabel}
                </button>
              ))}
            </div>
          )}

          {/* X button to clear and start over */}
          {lockedInHandle && (
            <button
              className="page-switcher-btn"
              style={{ marginLeft: "0.5rem", color: VIBE.muted }}
              onClick={() => { setLockedInHandle(""); setTypingHandle(""); setCurrentPage("dashboard"); }}
            >
              ✕
            </button>
          )}
        </nav>

        {/* big landing screen before any search */}
        {notSearchedYet && (
          <div className="landing-screen">
            <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.2em", color: VIBE.accent, marginBottom: "1.5rem", fontWeight: 700 }}>
              ⚡ Codeforces Coach
            </div>
            <div className="big-heading">
              Level Up Your<br />Competitive Game
            </div>
            <div className="lil-desc">
              Drop your CF handle and get deep stats on your performance, plus personalized coaching based on your actual contest history.
            </div>
            <div className="handle-input-zone">
              <input
                className="text-box"
                placeholder="CF handle (e.g. tourist)"
                value={typingHandle}
                onChange={e => setTypingHandle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lockInAndGo()}
              />
              <button className="go-btn" onClick={lockInAndGo} disabled={!typingHandle.trim()}>
                Analyze →
              </button>
            </div>
            {/* lil feature hints */}
            <div style={{ marginTop: "3rem", display: "flex", gap: "2rem", color: VIBE.muted, fontSize: "0.8rem", flexWrap: "wrap", justifyContent: "center" }}>
              {["📊 Rating Charts", "🏆 Contest History", "🧩 Problem Stats", "📝 Coach Feedback"].map(feat => (
                <span key={feat}>{feat}</span>
              ))}
            </div>
          </div>
        )}

        {/* once a handle is locked in, show the actual pages */}
        {lockedInHandle && (
          <div className="main-content-zone">
            {/* lil inline handle changer */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", alignItems: "center" }}>
              <input
                className="text-box"
                style={{ maxWidth: 280, padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                value={typingHandle}
                onChange={e => setTypingHandle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lockInAndGo()}
                placeholder="switch handle..."
              />
              <button className="go-btn" style={{ padding: "0.6rem 1rem" }} onClick={lockInAndGo}>
                Go
              </button>
            </div>

            {/* render whichever page is active */}
            {currentPage === "dashboard" && <DashboardPage whoWeChecking={lockedInHandle} />}
            {currentPage === "contests"  && <ContestsPage  whoWeChecking={lockedInHandle} />}
            {currentPage === "problems"  && <ProblemsPage  whoWeChecking={lockedInHandle} />}
            {currentPage === "ai"        && <AIAdvicePage  whoWeChecking={lockedInHandle} />}
          </div>
        )}

      </div>
    </>
  );
}
