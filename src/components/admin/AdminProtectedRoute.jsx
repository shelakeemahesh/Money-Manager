import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== "ADMIN") {
      return <Navigate to="/unauthorized" replace />;
    }
    if (user.status !== "ACTIVE") {
      return <Navigate to="/admin/login" replace />;
    }
    return <Outlet />;
  } catch {
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminProtectedRoute;
