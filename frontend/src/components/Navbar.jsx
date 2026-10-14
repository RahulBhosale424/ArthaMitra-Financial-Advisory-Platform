import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div>
        <Link className="brand" to="/">ArthaMitra</Link>
      </div>
      <div>
        {user ? (
          <>
            <Link to="/chat">Health Check</Link>
            <Link to="/experts">Find an Expert</Link>
            {user.role === 'client' && <Link to="/bookings">My Bookings</Link>}
            {user.role === 'expert' && <Link to="/expert-dashboard">Dashboard</Link>}
            <button className="btn secondary" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
