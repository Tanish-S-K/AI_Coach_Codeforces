import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Problem {
  index: string;
  name: string;
  rating: string | number;
  tags: string[];
  total_submissions: number;
  wrong_submissions: number;
  first_ac_time: string;
}

interface ContestSummary {
  contest_id: number;
  contest_name: string;
  date: string;
  delta: number;
  division: string;
  rank: number;
  old_rating: number;
  new_rating: number;
  accuracy: string;
  problems_attempted: number;
  problems_solved: number;
  duration_between_first_last_ac_mins: number | string;
  first_ac_time: string;
  last_ac_time: string;
  solved_tags: string[];
  solved_difficulties: (number | string)[];
  solved_problems: Problem[];
  unsolved_problems: Problem[];
  upsolved_problems: Problem[];
}


const ContestAdvice = () => {
  const navigate = useNavigate(); // 👈 for redirection
  const [handle, setHandle] = useState<string>('');
  const [data, setData] = useState<null | {
    advice: string;
    contest_summary: ContestSummary[];
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cf_handle");
    if (!stored) {
      navigate("/overview"); // 👈 redirect to Overview if handle not set
    } else {
      setHandle(stored);
      fetchAdvice(stored);
    }
  }, [navigate]);

  const fetchAdvice = async (userHandle: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`http://localhost:5000/user/contest-advice?handle=${userHandle}`);
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contest-advice">
      <h1>🧠 AI Contest Advice</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <div className="advice-section">
          <div className="ai-advice">
            <h2>Coach's Feedback:</h2>
            <p>{data.advice}</p>
          </div>

          <div className="contest-summary">
            <h2>📊 Recent Contests</h2>
            {data.contest_summary.map((contest, i) => (
              <div key={i} className="contest-card">
                <h3>{contest.contest_name} ({contest.division})</h3>
                <p><strong>Date:</strong> {contest.date}</p>
                <p><strong>Rank:</strong> {contest.rank}</p>
                <p><strong>Rating:</strong> {contest.old_rating} → {contest.new_rating} ({contest.delta >= 0 ? '+' : ''}{contest.delta})</p>
                <p><strong>Accuracy:</strong> {contest.accuracy}</p>
                <p><strong>Problems Solved:</strong> {contest.problems_solved}</p>
                <p><strong>Duration:</strong> {contest.duration_between_first_last_ac_mins} mins</p>

                {contest.solved_problems.length > 0 && (
                  <div>
                    <h4>✅ Solved Problems</h4>
                    <ul>
                      {contest.solved_problems.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.index}:</strong> {p.name} ({p.rating}) — {p.total_submissions} attempts, {p.wrong_submissions} WAs
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {contest.upsolved_problems.length > 0 && (
                  <div>
                    <h4>📈 Upsolved Problems</h4>
                    <ul>
                      {contest.upsolved_problems.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.index}:</strong> {p.name} ({p.rating}) — {p.total_submissions} attempts, {p.wrong_submissions} WAs
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {contest.unsolved_problems.length > 0 && (
                  <div>
                    <h4>❌ Unsolved Problems</h4>
                    <ul>
                      {contest.unsolved_problems.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.index}:</strong> {p.name} ({p.rating}) — {p.total_submissions} attempts, {p.wrong_submissions} WAs
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestAdvice;