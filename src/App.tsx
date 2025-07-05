// client/src/App.tsx
import React from 'react';
import {
  Link,
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom';

// Page Components
import DashboardPage from './pages/DashboardPage';
import DocumentViewerPage from './pages/DocumentViewerPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SignDocumentPage from './pages/SignDocumentPage'; // <--- ADDED: Import SignDocumentPage
import UploadDocumentPage from './pages/UploadDocumentPage';

// Header Component
const Header: React.FC = () => {
  const navigate = useNavigate();
  // Using a state to react to localStorage changes for the header
  const [userToken, setUserToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkToken = () => {
      setUserToken(localStorage.getItem('userToken'));
    };
    checkToken(); // Initial check

    // Listen for storage changes (e.g., from other tabs, or direct localStorage manipulation)
    window.addEventListener('storage', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setUserToken(null); // Update state to reflect logout immediately
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-700 to-purple-800 p-4 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide hover:text-indigo-200 transition duration-300"
        >
          DocuSignify
        </Link>
        <div className="flex space-x-6">
          <Link
            to="/"
            className="text-lg font-medium hover:text-indigo-200 transition duration-300"
          >
            Home
          </Link>
          {userToken ? (
            <>
              <Link
                to="/dashboard"
                className="text-lg font-medium hover:text-indigo-200 transition duration-300"
              >
                Dashboard
              </Link>
              <Link
                to="/upload"
                className="text-lg font-medium hover:text-indigo-200 transition duration-300"
              >
                Upload
              </Link>
              <button
                onClick={handleLogout}
                className="text-lg font-medium bg-red-600 hover:bg-red-700 px-4 py-1 rounded-full shadow-md transition duration-300 transform hover:scale-105"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-lg font-medium hover:text-indigo-200 transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-lg font-medium hover:text-indigo-200 transition duration-300"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Use Outlet for nested routes
};

const App: React.FC = () => {
  const userToken = localStorage.getItem('userToken');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={userToken ? <Navigate to="/dashboard" replace /> : <HomePage />}
            />
            <Route
              path="/login"
              element={userToken ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={userToken ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/upload" element={<UploadDocumentPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/document/:id" element={<DocumentViewerPage />} />
              <Route path="/sign-document/:id" element={<SignDocumentPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center">
                  <h2 className="text-6xl font-extrabold text-gray-800 mb-4">404</h2>
                  <p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
                  <Link
                    to="/"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg transition duration-300"
                  >
                    Go to Home
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DocuSignify. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;