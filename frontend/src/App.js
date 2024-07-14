import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import Navbar from './components/Navbar';

const Home = lazy(() => import('./pages/Home'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const ResourceDetailsPage = lazy(() => import('./pages/ResourceDetailsPage'));
const AccessDenied = lazy(() => import('./pages/AccessDenied'));

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

function ErrorHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'access_denied') {
      navigate('/access-denied');
    }
    if (!isLoading && !isAuthenticated) {
      const redirectPath = localStorage.getItem('redirectAfterLogout');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogout');
        navigate(redirectPath);
      }
    }
  }, [location, navigate, isAuthenticated, isLoading]);

  return null;
}

function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <div className="container mt-4">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/resources/:id" element={<ResourceDetailsPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: `${window.location.origin}`,
          audience: process.env.REACT_APP_AUTH0_AUDIENCE
        }}
        onRedirectCallback={(appState) => {
          window.history.replaceState(
            {},
            document.title,
            appState?.returnTo || window.location.pathname
          );
        }}
      >

        <ErrorHandler />
        <AppContent />
      </Auth0Provider>
    </BrowserRouter>
  );
}

export default App;