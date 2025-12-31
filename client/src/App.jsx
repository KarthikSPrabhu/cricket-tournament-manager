import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Matches from './pages/Matches';
import PointsTable from './pages/PointsTable';
import Statistics from './pages/Statistics';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TeamManagement from './pages/admin/TeamManagement';
import PlayerManagement from './pages/admin/PlayerManagement';
import MatchManagement from './pages/admin/MatchManagement';
import TournamentManagement from './pages/admin/TournamentManagement';
import ScoringDashboard from './components/scoring/ScoringDashboard';
import './App.css';

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

function App() {
  return (
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
          }}
        />
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/points-table" element={<PointsTable />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/admin/login" element={<AdminLogin />} />
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;