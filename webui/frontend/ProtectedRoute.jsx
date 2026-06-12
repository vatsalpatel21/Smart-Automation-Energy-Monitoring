import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const redirect = user.role === 'manager' ? '/dashboard/manager' : '/dashboard/user';
        return <Navigate to={redirect} replace />;
    }

    return children;
}
