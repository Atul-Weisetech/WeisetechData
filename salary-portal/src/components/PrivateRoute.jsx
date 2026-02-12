// components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");

  if (!email || !role) {
    return <Navigate to="/" />;
  }

  return children;
}
