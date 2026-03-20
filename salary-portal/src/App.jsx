import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import MainLayout from "./layouts/MainLayout";
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

          {/* Employee Route — MainLayout reads role and shows Employee header */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<WelcomeEmployee />} />
          </Route>

          {/* HR / Admin Routes — protected + MainLayout shows HR header + sidebar */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/edit-employee/:id" element={<EditEmployee />} />
            <Route path="/add-payroll" element={<AddPayroll />} />
            <Route path="/edit-payroll/:id" element={<EditPayroll />} />
            <Route path="/employee/:id/payrolls" element={<EmployeePayrolls />} />
            <Route path="/employee/:id/leaves" element={<EmployeeLeaves />} />
            <Route path="/employee/:id" element={<EmployeeDetail />} />
            <Route
              path="/add-hr"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AddHR />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />
    </NotificationProvider>
  );
}

export default App;
