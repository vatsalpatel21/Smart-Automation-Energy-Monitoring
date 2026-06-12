import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isManager = user?.role === 'manager';
    const initials = (user?.email || user?.username || 'U').charAt(0).toUpperCase();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="navbar-logo">⚡</div>
                <div>
                    <div className="navbar-title">EnergyIQ</div>
                    <div className="navbar-subtitle">IoT Energy Platform</div>
                </div>
            </div>

            <div className="navbar-right">
                <span className={`badge ${isManager ? 'badge-primary' : 'badge-success'}`}>
                    {isManager ? '📊 Manager' : '🔧 Operator'}
                </span>

                <div className="navbar-user">
                    <div className="navbar-avatar">{initials}</div>
                    <div className="navbar-user-info">
                        <span className="navbar-username">{user?.email || user?.username}</span>
                        <span className="navbar-role">{user?.role}</span>
                    </div>
                </div>

                <button className="btn btn-outline btn-sm" onClick={handleLogout} id="logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
}
