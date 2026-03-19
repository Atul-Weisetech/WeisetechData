import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import AddEmployee from "./pages/AddEmployee";
import AddHR from "./pages/AddHR";
import WelcomeEmployee from "./pages/WelcomeEmployee";
import EditEmployee from "./pages/EditEmployee";
import AddPayroll from "./pages/AddPayroll";
import { useLocation } from "react-router-dom";
import EditPayroll from "./pages/EditPayroll";
import EmployeePayrolls from "./pages/EmployeePayrolls";
import EmployeeLeaves from "./pages/EmployeeLeaves";
import EmployeeDetail from "./pages/EmployeeDetail";
import { NotificationProvider } from "./contexts/NotificationContext";
// import AddPayrollBreakdown from "./pages/AddPayrollBreakdown";

function App() {
  const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const role = localStorage.getItem("role");
    const isAuthenticated = !!localStorage.getItem("email");

    if (!isAuthenticated || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children;
  };

  return (
    <NotificationProvider>
      <Router>
        <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected HR/Admin Dashboard */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <Welcome />
            </ProtectedRoute>
          }
        />

        {/* Employee Welcome Page (unprotected or protect as needed) */}
        <Route path="/home" element={<WelcomeEmployee />} />

        {/* Admin/HR-only Routes */}
        <Route
          path="/add-employee"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <AddEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-hr"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddHR />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-employee/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <EditEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-payroll"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <AddPayroll />
            </ProtectedRoute>
          }
        />
{/* 
        <Route
          path="/add-payroll-breakdown/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <AddPayrollBreakdown />
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="/edit-payroll/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <EditPayroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/:id/payrolls"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <EmployeePayrolls />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/:id/leaves"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <EmployeeLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "hr"]}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />

        {/* Fallback route for unmatched URLs */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </NotificationProvider>
  );
}

export default App;
