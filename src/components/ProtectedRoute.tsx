import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute() {
	const location = useLocation();
	const accessToken = useAuthStore((s) => s.accessToken);
	const isAuthenticated = !!accessToken;

	if (!isAuthenticated) {
		return <Navigate to="/auth/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
}
