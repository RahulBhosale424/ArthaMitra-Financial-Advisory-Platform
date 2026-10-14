import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import ExpertDirectoryPage from './pages/ExpertDirectoryPage';
import ExpertProfilePage from './pages/ExpertProfilePage';
import BookingsPage from './pages/BookingsPage';
import ExpertDashboardPage from './pages/ExpertDashboardPage';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/chat" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/experts"
        element={
          <ProtectedRoute>
            <ExpertDirectoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/experts/:id"
        element={
          <ProtectedRoute>
            <ExpertProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute role="client">
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert-dashboard"
        element={
          <ProtectedRoute role="expert">
            <ExpertDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app-shell">
            <Navbar />
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
