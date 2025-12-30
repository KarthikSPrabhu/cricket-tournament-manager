import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaUserFriends, 
  FaTrophy, 
  FaChartLine,
  FaCalendarAlt,
  FaCog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSignOutAlt,
  FaHome
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/admin/login');
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      if (userData.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        navigate('/');
        return;
      }
      setUser(userData);
      fetchDashboardData();
    } catch (error) {
      localStorage.clear();
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="admin-avatar">
            <FaUserFriends />
          </div>
          <div className="admin-info">
            <h3>{user?.username}</h3>
            <span className="admin-badge">Administrator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine /> Overview
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <FaUsers /> Teams
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            <FaUserFriends /> Players
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <FaCalendarAlt /> Matches
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'tournament' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournament')}
          >
            <FaTrophy /> Tournament
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog /> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate('/')}>
            <FaHome /> Home
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <header className="content-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <button className="action-btn primary">
              <FaPlus /> Quick Action
            </button>
            <span className="last-login">
              Last login: {new Date().toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="tab-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon teams">
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <h3>Total Teams</h3>
                  <p className="stat-value">{stats.statistics.totalTeams}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon players">
                  <FaUserFriends />
                </div>
                <div className="stat-info">
                  <h3>Total Players</h3>
                  <p className="stat-value">{stats.statistics.totalPlayers}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon matches">
                  <FaCalendarAlt />
                </div>
                <div className="stat-info">
                  <h3>Total Matches</h3>
                  <p className="stat-value">{stats.statistics.totalMatches}</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon live">
                  <FaTrophy />
                </div>
                <div className="stat-info">
                  <h3>Live Matches</h3>
                  <p className="stat-value">{stats.statistics.liveMatches}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                {stats.quickActions?.map((action, index) => (
                  <button 
                    key={index}
                    className="action-card"
                    onClick={() => navigate(action.path)}
                  >
                    <div className="action-icon">
                      {action.icon === 'team' && <FaUsers />}
                      {action.icon === 'player' && <FaUserFriends />}
                      {action.icon === 'match' && <FaCalendarAlt />}
                      {action.icon === 'toss' && <FaTrophy />}
                      {action.icon === 'scoring' && <FaChartLine />}
                      {action.icon === 'fixtures' && <FaCog />}
                    </div>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Matches */}
            <div className="section">
              <h2>Live Matches</h2>
              {stats.liveMatches.length > 0 ? (
                <div className="matches-list">
                  {stats.liveMatches.map(match => (
                    <div key={match._id} className="match-card live">
                      <div className="match-teams">
                        <div className="team">
                          <span className="team-name">{match.team1.name}</span>
                          <span className="team-score">145/3</span>
                        </div>
                        <div className="vs">vs</div>
                        <div className="team">
                          <span className="team-name">{match.team2.name}</span>
                          <span className="team-score">120/7</span>
                        </div>
                      </div>
                      <div className="match-status">
                        <span className="status-badge">LIVE</span>
                        <span className="match-info">15.2 overs</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No live matches at the moment</p>
              )}
            </div>

            {/* Points Table */}
            <div className="section">
              <h2>Current Points Table</h2>
              <div className="table-container">
                <table className="points-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Played</th>
                      <th>Won</th>
                      <th>Lost</th>
                      <th>Points</th>
                      <th>NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pointsTable?.map((team, index) => (
                      <tr key={team._id}>
                        <td>
                          <div className="team-row">
                            <span className="position">{index + 1}</span>
                            <span className="team-name">{team.name}</span>
                          </div>
                        </td>
                        <td>{team.matchesPlayed}</td>
                        <td>{team.matchesWon}</td>
                        <td>{team.matchesLost}</td>
                        <td className="points">{team.points}</td>
                        <td className="nrr">{team.netRunRate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Team Management</h2>
              <button className="action-btn primary">
                <FaPlus /> Add Team
              </button>
            </div>
            <p>Teams management interface coming soon...</p>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Player Management</h2>
              <button className="action-btn primary">
                <FaPlus /> Add Player
              </button>
            </div>
            <p>Players management interface coming soon...</p>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Match Management</h2>
              <button className="action-btn primary">
                <FaPlus /> Schedule Match
              </button>
            </div>
            <p>Match management interface coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;