import { useEffect, useState } from 'react'
import './App.css'

interface Problem {
  rating: number
  tags: string[]
  verdict: string
}

interface RatingChange {
  contest_rank: number
  new_rating: number
  old_rating: number
}

interface UserInfo {
  handle: string
  maxRating: number
  rank: string
  rating: number
}

interface APIResponse {
  problem_history: Problem[]
  rating_history: RatingChange[]
  user_info: UserInfo
}

function App() {
  const [handle, setHandle] = useState('')
  const [data, setData] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchUserData = async () => {
    if (!handle.trim()) return

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch(`http://localhost:5000/get_user_info?handle=${handle}`)
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const json: APIResponse = await response.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>AI Codeforces Coach</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter Codeforces handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <button onClick={fetchUserData}>Submit</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <>
          <section className="user-info">
            <h2>User Info</h2>
            <p><strong>Handle:</strong> {data.user_info.handle}</p>
            <p><strong>Rating:</strong> {data.user_info.rating}</p>
            <p><strong>Max Rating:</strong> {data.user_info.maxRating}</p>
            <p><strong>Rank:</strong> {data.user_info.rank}</p>
          </section>

          <section className="rating-history">
            <h2>Rating History</h2>
            <ul>
              {data.rating_history.map((entry, index) => (
                <li key={index}>
                  Rank: {entry.contest_rank}, Rating: {entry.old_rating} → {entry.new_rating}
                </li>
              ))}
            </ul>
          </section>

          <section className="problem-history">
            <h2>Problem History</h2>
            <ul>
              {data.problem_history.map((prob, index) => (
                <li key={index}>
                  ✅ {prob.verdict} — {prob.rating} — {prob.tags.join(', ')}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

export default App
