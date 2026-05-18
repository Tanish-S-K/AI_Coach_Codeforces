import { useEffect, useState } from 'react';
import './App.css';
import type { DeepAnalysis } from './types';

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function ContestAdvice() {
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = localStorage.getItem('cf_handle');
    if (!handle) {
      setError('Run an analysis from the main page first so the coach has a handle to inspect.');
      return;
    }

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/user/deep-analysis?handle=${encodeURIComponent(handle)}`);
        const payload = (await response.json()) as DeepAnalysis | { error: string };
        if (!response.ok || 'error' in payload) {
          throw new Error('error' in payload ? payload.error : 'Failed to load advice');
        }
        setAnalysis(payload);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="page-shell advice-shell">
      <section className="card advice-hero">
        <p className="eyebrow">AI Report</p>
        <h1>Coaching narrative</h1>
        <p className="hero-text">
          This page turns the structured performance model into a coach-style review. If Gemini
          is unavailable, the app falls back to a deterministic report instead of failing.
        </p>
      </section>

      {loading ? <div className="status-banner">Generating coach feedback...</div> : null}
      {error ? <div className="status-banner error-banner">{error}</div> : null}

      {analysis ? (
        <>
          <section className="card ai-report-card">
            <div className="report-header">
              <div>
                <p className="eyebrow">Provider</p>
                <h2>{analysis.ai_report.provider}</h2>
              </div>
              <span className={`provider-pill ${analysis.ai_report.status}`}>
                {analysis.ai_report.status}
              </span>
            </div>

            <div className="report-copy">
              {splitParagraphs(analysis.ai_report.report).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="plan-grid">
            <article className="card">
              <p className="eyebrow">Priority Focus</p>
              <h3>This week</h3>
              <ul className="clean-list">
                {analysis.training_plan.weekly_focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="card">
              <p className="eyebrow">Tag Targets</p>
              <h3>Deliberate practice</h3>
              <div className="chip-wrap">
                {analysis.training_plan.next_tag_targets.map((tag) => (
                  <span key={tag} className="chip positive-chip">{tag}</span>
                ))}
              </div>
            </article>

            <article className="card">
              <p className="eyebrow">Recent Contests</p>
              <h3>Quick scan</h3>
              <ul className="clean-list">
                {analysis.recent_contests.slice(0, 5).map((contest) => (
                  <li key={contest.contest_id}>
                    {contest.contest_name}: {contest.headline}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
