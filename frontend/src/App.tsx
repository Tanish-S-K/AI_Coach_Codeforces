import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';
import type { ContestInsight, DeepAnalysis } from './types';

const RATING_COLORS = ['#1f7aec', '#1db6a2', '#f29e38', '#ea5d5d'];

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta}`;
}

function metricTone(value: number): 'up' | 'down' | 'neutral' {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

function miniProblemList(items: ContestInsight['solved_problems']) {
  return items.slice(0, 3).map((problem) => `${problem.index} ${problem.name}`).join(' • ');
}

export default function App() {
  const [handle, setHandle] = useState('');
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedHandle = localStorage.getItem('cf_handle');
    if (storedHandle) {
      setHandle(storedHandle);
      void fetchAnalysis(storedHandle);
    }
  }, []);

  async function fetchAnalysis(nextHandle: string) {
    const trimmed = nextHandle.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    localStorage.setItem('cf_handle', trimmed);

    try {
      const response = await fetch(`/user/deep-analysis?handle=${encodeURIComponent(trimmed)}`);
      const payload = (await response.json()) as DeepAnalysis | { error: string };
      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'Failed to load analysis');
      }
      setAnalysis(payload);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unknown error';
      setError(message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  const ratingData = analysis?.rating_history.map((item, index) => ({
    ...item,
    label: `C${index + 1}`,
  })) ?? [];

  const tagChartData = analysis?.profile.tag_mastery ?? [];
  const skillMap = analysis?.skill_map ?? [];
  const contests = analysis?.recent_contests ?? [];
  const profile = analysis?.profile;
  const overview = analysis?.overview;

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Codeforces Performance Lab</p>
          <h1>AI Coach that diagnoses contest behavior, not just rating graphs.</h1>
          <p className="hero-text">
            This version builds a richer player model from rating history, tag exposure,
            weekly consistency, pressure handling, post-contest recovery, and recent contest
            execution. The LLM is now the last layer, not the whole product.
          </p>
        </div>

        <div className="search-panel">
          <label htmlFor="handle-input">Codeforces handle</label>
          <div className="search-row">
            <input
              id="handle-input"
              type="text"
              placeholder="tourist, Benq, your_handle..."
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void fetchAnalysis(handle);
                }
              }}
            />
            <button onClick={() => void fetchAnalysis(handle)} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Deeply'}
            </button>
          </div>
          <p className="search-hint">The backend combines deterministic coaching heuristics with Gemini when available.</p>
        </div>
      </section>

      {error ? <div className="status-banner error-banner">{error}</div> : null}
      {loading && !analysis ? <div className="status-banner">Building your coaching profile...</div> : null}

      {analysis && profile && overview ? (
        <>
          <section className="profile-grid">
            <article className="profile-card card">
              <img src={profile.avatar} alt={`${profile.handle} avatar`} className="avatar" />
              <div>
                <p className="eyebrow">Player Identity</p>
                <h2>{profile.handle}</h2>
                <p className="identity-line">{profile.rank} • max {profile.max_rank}</p>
                <div className="stat-pills">
                  <span>Rating {profile.rating}</span>
                  <span>Peak {profile.max_rating}</span>
                  <span>{overview.contests_played} contests</span>
                  <span>{overview.solved_this_year} solves this year</span>
                </div>
                <p className="meta-line">
                  Joined {profile.registration_time} • {profile.days_on_site} days on site
                </p>
              </div>
            </article>

            <article className="coach-card card">
              <p className="eyebrow">Coach Score</p>
              <div className="score-ring">
                <div>
                  <strong>{overview.coach_score}</strong>
                  <span>/100</span>
                </div>
              </div>
              <p className="coach-summary">
                Built from rating level, recent contest execution, weekly consistency, problem depth,
                and whether you actually finish the learning loop with upsolves.
              </p>
            </article>
          </section>

          <section className="metrics-grid">
            <article className="metric-card card">
              <p>5-contest trend</p>
              <strong className={metricTone(overview.rating_trend_5)}>{formatDelta(overview.rating_trend_5)}</strong>
            </article>
            <article className="metric-card card">
              <p>20-contest trend</p>
              <strong className={metricTone(overview.rating_trend_20)}>{formatDelta(overview.rating_trend_20)}</strong>
            </article>
            <article className="metric-card card">
              <p>Average weekly solves</p>
              <strong>{overview.average_weekly_solves}</strong>
            </article>
            <article className="metric-card card">
              <p>Average solved rating</p>
              <strong>{overview.average_problem_rating}</strong>
            </article>
            <article className="metric-card card">
              <p>Hardest solved</p>
              <strong>{overview.hardest_solved}</strong>
            </article>
            <article className="metric-card card">
              <p>Active practice weeks</p>
              <strong>{overview.active_weeks}/24</strong>
            </article>
          </section>

          <section className="insight-grid">
            <article className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Trajectory</p>
                  <h3>Rating journey</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#91a3b0" />
                  <YAxis stroke="#91a3b0" />
                  <Tooltip
                    contentStyle={{ background: '#111a23', border: '1px solid #29404e', borderRadius: 16 }}
                    formatter={(value: number) => [value, 'Rating']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.contest_name ?? 'Contest'}
                  />
                  <Line type="monotone" dataKey="new_rating" stroke="#5cc8ff" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </article>

            <article className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Consistency</p>
                  <h3>Weekly grind profile</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analysis.weekly_progress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#91a3b0" />
                  <YAxis stroke="#91a3b0" />
                  <Tooltip contentStyle={{ background: '#111a23', border: '1px solid #29404e', borderRadius: 16 }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {analysis.weekly_progress.map((week, index) => (
                      <Cell key={week.label} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>

          <section className="insight-grid">
            <article className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Skill Model</p>
                  <h3>Competitive programming radar</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={skillMap}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#dce7ef', fontSize: 12 }} />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.12)" tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#f29e38" fill="#f29e38" fillOpacity={0.35} />
                  <Tooltip contentStyle={{ background: '#111a23', border: '1px solid #29404e', borderRadius: 16 }} />
                </RadarChart>
              </ResponsiveContainer>
            </article>

            <article className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Tag Exposure</p>
                  <h3>What you actually practice</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart layout="vertical" data={tagChartData} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="#91a3b0" />
                  <YAxis type="category" dataKey="tag" width={120} stroke="#91a3b0" />
                  <Tooltip contentStyle={{ background: '#111a23', border: '1px solid #29404e', borderRadius: 16 }} />
                  <Legend />
                  <Bar dataKey="count" fill="#1db6a2" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>

          <section className="insight-grid">
            <article className="card callout-card">
              <p className="eyebrow">Strengths</p>
              <h3>What the model trusts about you</h3>
              <div className="chip-wrap">
                {profile.strengths.map((item) => (
                  <span key={item} className="chip positive-chip">{item}</span>
                ))}
              </div>
            </article>

            <article className="card callout-card">
              <p className="eyebrow">Focus Areas</p>
              <h3>Where the next rating jump is hiding</h3>
              <div className="chip-wrap">
                {profile.focus_areas.map((item) => (
                  <span key={item} className="chip warning-chip">{item}</span>
                ))}
              </div>
            </article>
          </section>

          <section className="card plan-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Training Plan</p>
                <h3>One-week improvement block</h3>
              </div>
            </div>
            <div className="plan-grid">
              <div>
                <h4>Weekly focus</h4>
                <ul className="clean-list">
                  {analysis.training_plan.weekly_focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Drills</h4>
                <ul className="clean-list">
                  {analysis.training_plan.drills.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Milestones</h4>
                <ul className="clean-list">
                  {analysis.training_plan.milestones.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Contest Diagnostics</p>
                <h3>Recent contest breakdown</h3>
              </div>
            </div>
            <div className="contest-grid">
              {contests.map((contest) => (
                <article key={contest.contest_id} className="contest-card">
                  <div className="contest-topline">
                    <div>
                      <h4>{contest.contest_name}</h4>
                      <p>{contest.date} • {contest.division}</p>
                    </div>
                    <span className={`delta-pill ${metricTone(contest.delta)}`}>{formatDelta(contest.delta)}</span>
                  </div>
                  <p className="headline">{contest.headline}</p>
                  <div className="contest-metrics">
                    <span>{contest.problems_solved}/{contest.problems_attempted} solved</span>
                    <span>{contest.accuracy_percent}% accuracy</span>
                    <span>{contest.wrong_submissions} wrong tries</span>
                    <span>Pressure {contest.pressure_score}</span>
                  </div>
                  <div className="contest-columns">
                    <div>
                      <h5>Strength signals</h5>
                      <ul className="clean-list compact-list">
                        {contest.strengths.length > 0 ? contest.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        )) : <li>No strong signal extracted.</li>}
                      </ul>
                    </div>
                    <div>
                      <h5>Leak points</h5>
                      <ul className="clean-list compact-list">
                        {contest.issues.length > 0 ? contest.issues.map((item) => (
                          <li key={item}>{item}</li>
                        )) : <li>No major contest leak detected.</li>}
                      </ul>
                    </div>
                  </div>
                  <p className="problem-line">
                    Solved set: {contest.solved_problems.length > 0 ? miniProblemList(contest.solved_problems) : 'No solved problems recorded.'}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
