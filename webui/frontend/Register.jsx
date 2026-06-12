import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim() || !email.trim() || !mobile.trim() || !password.trim()) {
            setError('All fields are required.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register(fullName.trim(), email.trim(), mobile.trim(), password.trim());
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">⚡</div>
                    <h1>Create Account</h1>
                    <p>Join the EnergyIQ Platform</p>
                </div>

                {error && (
                    <div className="form-error" role="alert">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div style={{ padding: '10px', border: '1px solid #228B22', color: '#228B22', background: '#eaffea', marginBottom: '12px', textAlign: 'center', fontSize: '13px' }}>
                        Registration successful! Redirecting to login...
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            className="form-input"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="mobile">Mobile Number</label>
                        <input
                            id="mobile"
                            className="form-input"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            className="form-input"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary btn-login" type="submit" disabled={loading || success}>
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </form>

                <div className="login-footer">
                    <p style={{ marginTop: '12px' }}>
                        Already have an account? <a href="/login" style={{ color: '#333', fontWeight: 600, textDecoration: 'underline' }}>Log in here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
