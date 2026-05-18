import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="layout-shell">
      <header className="topbar">
        <button className="brand-lockup" onClick={() => navigate('/')}>
          <span className="brand-mark">CF</span>
          <span>
            <strong>AI Coach Rebuilt</strong>
            <small>deep analysis edition</small>
          </span>
        </button>

        <nav className="topbar-nav">
          <button
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('/')}
          >
            Dashboard
          </button>
          <button
            className={location.pathname === '/advice' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('/advice')}
          >
            AI Report
          </button>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
