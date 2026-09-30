// import { Navigate, useLocation } from "react-router-dom";
// import type { ReactNode } from "react";
// import { useAuth, type Role } from "../hooks/useAuth";

// interface Props {
//   roles: Role[];
//   children: ReactNode;
//   unauthorizedTo?: string;
// }

// export default function ProtectedRoute({ roles, children, unauthorizedTo = "/partner/unauthorized" }: Props) {
//   const { user } = useAuth();
//   const location = useLocation();
//   if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
//   if (!roles.includes(user.role)) return <Navigate to={unauthorizedTo} replace />;
//   return <>{children}</>;
// }
