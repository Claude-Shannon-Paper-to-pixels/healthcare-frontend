// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

function Navbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePortalClick = () => {
    const role = user?.role?.name || '';
    // Normalize some common role names
    if (role === 'Administrator') return navigate('/hub-dashboard');
    if (role === 'Doctor') return navigate('/doctor-dashboard');
    if (role === 'Hospital_staff' || role === 'Hospital Staff') return navigate('/hub-dashboard');
    // fallback
    navigate('/dashboard');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={handlePortalClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePortalClick(); }}>
        <h2 style={{ margin: 0 }}>Hospital Operation Portal</h2>
        {/* Voice widget removed from header; it will be rendered in dashboard filters */}
      </div>
      
      <div className="navbar-menu">
        <span className="navbar-user">
          {user?.first_name} {user?.last_name} ({user?.role?.name})
        </span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
