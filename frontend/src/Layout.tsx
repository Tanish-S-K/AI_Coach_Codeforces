import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';

export default function Layout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(document.body.classList.contains('dark'));

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
  }, [darkMode]);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🏆 AI Codeforces Coach</h1>
          <div className="nav-links">
            <button className="nav-btn" onClick={() => navigate('/advice')}>Contest Advice</button>
            <button className="nav-btn" onClick={() => navigate('/')}>Overview</button>
            <button className="nav-btn" onClick={() => navigate('/progress')}>Progress</button>
          </div>
          <button className="toggle-btn" onClick={() => setDarkMode(prev => !prev)}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
