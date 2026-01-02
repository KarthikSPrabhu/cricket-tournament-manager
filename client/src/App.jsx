import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';

// Layout Components
import Navbar from './components/Navbar';

// Public Pages
import Home from './pages/Home';
import Matches from './pages/Matches';
import PointsTable from './pages/PointsTable';
import Statistics from './pages/Statistics';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TeamManagement from './pages/admin/TeamManagement';
import PlayerManagement from './pages/admin/PlayerManagement';
import MatchManagement from './pages/admin/MatchManagement';
import TournamentManagement from './pages/admin/TournamentManagement';
import ScoringDashboard from './components/scoring/ScoringDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/admin/login" />;
  }
  
  try {
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      return <Navigate to="/" />;
    }
  } catch {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // If user is already logged in, redirect to dashboard
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'admin') {
        return <Navigate to="/admin/dashboard" />;
      }
    } catch (error) {
      // Clear invalid tokens
      localStorage.clear();
    }
  }
  
  return children;
};

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 4000,
              },
              loading: {
                duration: 3000,
              },
            }}
          />
          <Navbar />
          <main className="container">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/points-table" element={<PointsTable />} />
              <Route path="/statistics" element={<Statistics />} />
              
              {/* Admin Login (Public but redirects if already logged in) */}
              <Route 
                path="/admin/login" 
                element={
                  <PublicRoute>
                    <AdminLogin />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/teams" 
                element={
                  <ProtectedRoute>
                    <TeamManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/players" 
                element={
                  <ProtectedRoute>
                    <PlayerManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/matches" 
                element={
                  <ProtectedRoute>
                    <MatchManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tournament" 
                element={
                  <ProtectedRoute>
                    <TournamentManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/scoring/:matchId" 
                element={
                  <ProtectedRoute>
                    <ScoringDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <p>© 2024 Cricket Tournament Manager. All rights reserved.</p>
              <div className="footer-links">
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/contact">Contact Us</a>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;