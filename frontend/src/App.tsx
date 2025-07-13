import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import './App.css';
import ContestAdvice from './contest_advice';

interface UserInfo {
  handle: string;
  maxRating: number;
  rating: number;
  rank: string;
  maxRank: string;
  avatar: string;
  registrationTime: string;
  days_on_site: number;
}

interface RatingChange {
  contest_name: string;
  new_rating: number;
  old_rating?: number;
  solved: string | number;
  division: string;
}

function App() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [ratingData, setRatingData] = useState<RatingChange[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ week: string, count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
  }, [darkMode]);

  const fetchUserData = async () => {
    if (!handle.trim()) return;
    localStorage.setItem("cf_handle", handle);
    setLoading(true);
    setError('');
    setUserInfo(null);
    setRatingData([]);
    setWeeklyData([]);
    setSubmitted(true);

    try {
      const infoRes = await fetch(`http://localhost:5000/user/info?handle=${handle}`);
      const ratingRes = await fetch(`http://localhost:5000/user/rating-history?handle=${handle}`);
      const weeklyRes = await fetch(`http://localhost:5000/user/weekly-progress?handle=${handle}`);

      if (!infoRes.ok || !ratingRes.ok || !weeklyRes.ok) throw new Error("Failed to fetch data");

      const infoData = await infoRes.json();
      const ratingJson = await ratingRes.json();
      const weeklyJson = await weeklyRes.json();

      const chartData = ratingJson.map((r: RatingChange, index: number) => ({
        contest_name: index + 1,
        new_rating: r.new_rating,
        old_rating: index > 0 ? ratingJson[index - 1].new_rating : r.new_rating,
        solved: r.solved ?? "N/A",
        division: r.division
      }));

      const weeks = weeklyJson.map((count: number, index: number) => ({
        week: `Week ${index + 1}`,
        count,
      }));

      setUserInfo(infoData);
      setRatingData(chartData);
      setWeeklyData(weeks);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {!submitted && (
        <div className="center-box">
          <input
            type="text"
            placeholder="Enter Codeforces handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUserData()}
          />
          <button onClick={fetchUserData}>Start</button>
        </div>
      )}

      {loading && <p className="loading">⏳ Loading...</p>}
      {error && <p className="error">{error}</p>}

      {userInfo && (
        <>
          <div className="user-card">
            <img src={userInfo.avatar} alt="Avatar" />
            <div className="info">
              <h2>{userInfo.handle}</h2>
              <p><strong>Rank:</strong> {userInfo.rank}</p>
              <p><strong>Max Rank:</strong> {userInfo.maxRank}</p>
              <p><strong>Rating:</strong> {userInfo.rating}</p>
              <p><strong>Max Rating:</strong> {userInfo.maxRating}</p>
              <p><strong>Joined:</strong> {userInfo.registrationTime}</p>
              <p><strong>Days on site:</strong> {userInfo.days_on_site}</p>
            </div>
          </div>

          <div className="chart-section">
            <h2>📈 Rating Over Contests</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ratingData}>
                <XAxis dataKey="contest_name" />
                <YAxis />
                <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const delta = data.new_rating - data.old_rating;

                    return (
                      <div className="custom-tooltip" style={{ background: "#fff", padding: "8px", border: "1px solid #ccc" }}>
                        <p><strong>{data.division}</strong></p>
                        <p><strong>New Rating:</strong> {data.new_rating}</p>
                        <p><strong>Old Rating:</strong> {data.old_rating}</p>
                        <p><strong>Change:</strong> {delta >= 0 ? '+' : ''}{delta}</p>
                        <p><strong>Problems Solved:</strong> {data.solved}</p>
                      </div>
                    );
                  }
                  return null;
                }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="new_rating"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <h2>📊 Weekly Problems Solved</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
