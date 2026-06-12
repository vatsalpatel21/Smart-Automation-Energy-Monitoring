import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

/* ── Error Boundary ─────────────────────────────────
   Catches render-time crashes and shows a recovery UI
   instead of a blank white screen.
   ──────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('EnergyIQ Error Boundary caught an error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    padding: '2rem',
                }}>
                    <div style={{
                        background: 'white',
                        border: '1px solid #ddd',
                        padding: '2rem',
                        maxWidth: '480px',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>Something went wrong</h2>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '1.5rem' }}>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#eee',
                                color: '#333',
                                border: '1px solid #999',
                                padding: '8px 24px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function RootRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'manager' ? '/dashboard/manager' : '/dashboard/user'} replace />;
}

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/dashboard/user"
                            element={
                                <ProtectedRoute allowedRoles={['user']}>
                                    <UserDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard/manager"
                            element={
                                <ProtectedRoute allowedRoles={['manager']}>
                                    <ManagerDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<RootRedirect />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    );
}
