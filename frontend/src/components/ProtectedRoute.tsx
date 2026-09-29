import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const {
    isAuthenticated,
    user,
    loading,
  } = useAuth();

  // Wait until authentication is checked
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4338ca]" />

          <p className="mt-4 text-sm text-gray-600">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but doesn't have permission
  if (
    allowedRoles &&
    (!user || !allowedRoles.includes(user.role || ""))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has permission
  return <Outlet />;
};

export default ProtectedRoute;