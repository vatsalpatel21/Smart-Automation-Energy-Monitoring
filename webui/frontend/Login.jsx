import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!email.trim()) { setError('Please enter your email address.'); return; }
        if (!password.trim()) { setError('Please enter your password.'); return; }

        setLoading(true);
        try {
            const data = await apiLogin(email.trim(), password.trim());
            loginUser({ email: data.email, username: data.email, role: data.role }, data.token);
            navigate(data.role === 'manager' ? '/dashboard/manager' : '/dashboard/user');
        } catch (err) {
            // Show the exact backend message
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">⚡</div>
                    <h1>EnergyIQ</h1>
                    <p>IoT Energy Optimization Platform</p>
                </div>

                {error && (
                    <div className="form-error" id="login-error" role="alert">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-login"
                        type="submit"
                        disabled={loading}
                        id="login-submit"
                    >
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <div className="login-footer">
                    <p style={{ marginBottom: '6px', fontWeight: 600 }}>Demo Accounts</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <span>operator@system.com / operator123</span>
                        <span>manager@system.com / manager123</span>
                    </div>
                    <p style={{ marginTop: '12px' }}>
                        Don't have an account? <a href="/register" style={{ color: '#333', fontWeight: 600, textDecoration: 'underline' }}>Register here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
