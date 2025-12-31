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
  FaHome,
  FaUserPlus,
  FaGamepad,
  FaTable,
  FaBullhorn,
  FaFileExport
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    statistics: {
      totalTeams: 0,
      totalPlayers: 0,
      totalMatches: 0,
      liveMatches: 0,
      completedMatches: 0,
      upcomingMatches: 0
    },
    pointsTable: [],
    liveMatches: [],
    recentActivity: []
  });
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

      if (response.status === 401) {
        localStorage.clear();
        navigate('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Dashboard error:', error);
      // For development, use mock data
      setStats({
        statistics: {
          totalTeams: 8,
          totalPlayers: 96,
          totalMatches: 15,
          liveMatches: 2,
          completedMatches: 10,
          upcomingMatches: 3
        },
        pointsTable: [
          { _id: '1', name: 'Team Alpha', matchesPlayed: 5, matchesWon: 4, matchesLost: 1, points: 8, netRunRate: 1.25 },
          { _id: '2', name: 'Team Beta', matchesPlayed: 5, matchesWon: 3, matchesLost: 2, points: 6, netRunRate: 0.75 },
          { _id: '3', name: 'Team Gamma', matchesPlayed: 5, matchesWon: 3, matchesLost: 2, points: 6, netRunRate: 0.45 },
          { _id: '4', name: 'Team Delta', matchesPlayed: 5, matchesPlayed: 5, matchesWon: 2, matchesLost: 3, points: 4, netRunRate: -0.15 },
          { _id: '5', name: 'Team Epsilon', matchesPlayed: 5, matchesWon: 2, matchesLost: 3, points: 4, netRunRate: -0.35 },
          { _id: '6', name: 'Team Zeta', matchesPlayed: 5, matchesWon: 1, matchesLost: 4, points: 2, netRunRate: -0.85 }
        ],
        liveMatches: [
          { _id: '1', team1: { name: 'Team Alpha', score: '145/3' }, team2: { name: 'Team Beta', score: '120/7' }, status: 'live', overs: '15.2' },
          { _id: '2', team1: { name: 'Team Gamma', score: '89/2' }, team2: { name: 'Team Delta', score: '210/5' }, status: 'live', overs: '35.0' }
        ],
        recentActivity: [
          { id: 1, action: 'Match scheduled', details: 'Team Alpha vs Team Beta', time: '2 hours ago' },
          { id: 2, action: 'Player added', details: 'John Doe added to Team Gamma', time: '4 hours ago' },
          { id: 3, action: 'Team registered', details: 'New team "Team Zeta" registered', time: '1 day ago' },
          { id: 4, action: 'Match completed', details: 'Team Delta won by 45 runs', time: '2 days ago' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const quickActions = [
    { icon: 'team', label: 'Manage Teams', path: '/admin/teams', color: '#4CAF50' },
    { icon: 'player', label: 'Manage Players', path: '/admin/players', color: '#2196F3' },
    { icon: 'match', label: 'Schedule Match', path: '/admin/matches/create', color: '#FF9800' },
    { icon: 'toss', label: 'Update Toss', path: '/admin/matches/toss', color: '#9C27B0' },
    { icon: 'scoring', label: 'Live Scoring', path: '/admin/scoring', color: '#F44336' },
    { icon: 'fixtures', label: 'View Fixtures', path: '/admin/fixtures', color: '#607D8B' },
    { icon: 'points', label: 'Points Table', path: '/admin/points-table', color: '#009688' },
    { icon: 'announce', label: 'Announcements', path: '/admin/announcements', color: '#795548' }
  ];

  const getIconComponent = (iconName) => {
    switch(iconName) {
      case 'team': return <FaUsers />;
      case 'player': return <FaUserFriends />;
      case 'match': return <FaCalendarAlt />;
      case 'toss': return <FaTrophy />;
      case 'scoring': return <FaChartLine />;
      case 'fixtures': return <FaTable />;
      case 'points': return <FaTable />;
      case 'announce': return <FaBullhorn />;
      default: return <FaCog />;
    }
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
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="admin-info">
            <h3>{user?.username || 'Administrator'}</h3>
            <span className="admin-badge">Admin</span>
            <span className="admin-email">{user?.email || 'admin@example.com'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine /> <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('teams');
              navigate('/admin/teams');
            }}
          >
            <FaUsers /> <span>Teams</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('players');
              navigate('/admin/players');
            }}
          >
            <FaUserFriends /> <span>Players</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => navigate('/admin/matches')}
          >
            <FaCalendarAlt /> <span>Matches</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'tournament' ? 'active' : ''}`}
            onClick={() => navigate('/admin/tournament')}
          >
            <FaTrophy /> <span>Tournament</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              navigate('/admin/settings');
            }}
          >
            <FaCog /> <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate('/')}>
            <FaHome /> <span>Home Page</span>
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <header className="content-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <div className="breadcrumb">
              <span>Dashboard</span>
              {activeTab !== 'overview' && <span> / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>}
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn secondary"
              onClick={() => navigate('/admin/export')}
            >
              <FaFileExport /> Export Data
            </button>
            <button className="action-btn primary" onClick={() => navigate('/admin/quick-create')}>
              <FaPlus /> Quick Create
            </button>
            <span className="last-login">
              Last login: {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card" onClick={() => navigate('/admin/teams')}>
                <div className="stat-icon teams">
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <h3>Total Teams</h3>
                  <p className="stat-value">{stats.statistics.totalTeams}</p>
                  <span className="stat-change">+2 this week</span>
                </div>
              </div>
              
              <div className="stat-card" onClick={() => navigate('/admin/players')}>
                <div className="stat-icon players">
                  <FaUserFriends />
                </div>
                <div className="stat-info">
                  <h3>Total Players</h3>
                  <p className="stat-value">{stats.statistics.totalPlayers}</p>
                  <span className="stat-change">+12 this week</span>
                </div>
              </div>
              
              <div className="stat-card" onClick={() => navigate('/admin/matches')}>
                <div className="stat-icon matches">
                  <FaCalendarAlt />
                </div>
                <div className="stat-info">
                  <h3>Total Matches</h3>
                  <p className="stat-value">{stats.statistics.totalMatches}</p>
                  <div className="match-breakdown">
                    <span className="completed">{stats.statistics.completedMatches} completed</span>
                    <span className="upcoming">{stats.statistics.upcomingMatches} upcoming</span>
                  </div>
                </div>
              </div>
              
              <div className="stat-card" onClick={() => navigate('/admin/scoring')}>
                <div className="stat-icon live">
                  <FaGamepad />
                </div>
                <div className="stat-info">
                  <h3>Live Matches</h3>
                  <p className="stat-value">{stats.statistics.liveMatches}</p>
                  <span className="live-indicator">● LIVE</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
              <div className="section-header">
                <h2>Quick Actions</h2>
                <button 
                  className="view-all"
                  onClick={() => navigate('/admin/actions')}
                >
                  View All →
                </button>
              </div>
              <div className="actions-grid">
                {quickActions.map((action, index) => (
                  <button 
                    key={index}
                    className="action-card"
                    onClick={() => navigate(action.path)}
                    style={{ '--action-color': action.color }}
                  >
                    <div className="action-icon">
                      {getIconComponent(action.icon)}
                    </div>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="content-columns">
              {/* Left Column - Live Matches */}
              <div className="column">
                <div className="section">
                  <div className="section-header">
                    <h2>Live Matches</h2>
                    <button 
                      className="view-all"
                      onClick={() => navigate('/admin/live-matches')}
                    >
                      View All →
                    </button>
                  </div>
                  {stats.liveMatches.length > 0 ? (
                    <div className="matches-list">
                      {stats.liveMatches.map(match => (
                        <div 
                          key={match._id} 
                          className="match-card live"
                          onClick={() => navigate(`/admin/scoring/${match._id}`)}
                        >
                          <div className="match-teams">
                            <div className="team">
                              <span className="team-name">{match.team1.name}</span>
                              <span className="team-score">{match.team1.score}</span>
                            </div>
                            <div className="vs">vs</div>
                            <div className="team">
                              <span className="team-name">{match.team2.name}</span>
                              <span className="team-score">{match.team2.score}</span>
                            </div>
                          </div>
                          <div className="match-status">
                            <span className="status-badge">LIVE</span>
                            <span className="match-info">{match.overs} overs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <p>No live matches at the moment</p>
                      <button 
                        className="action-btn secondary"
                        onClick={() => navigate('/admin/matches/create')}
                      >
                        Schedule a Match
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="section">
                  <h2>Recent Activity</h2>
                  <div className="activity-list">
                    {stats.recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          <div className="icon-circle">
                            {activity.action.includes('Match') ? <FaGamepad /> : 
                             activity.action.includes('Player') ? <FaUserPlus /> :
                             activity.action.includes('Team') ? <FaUsers /> : <FaTrophy />}
                          </div>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">
                            <strong>{activity.action}</strong>
                            <span className="activity-time">{activity.time}</span>
                          </div>
                          <p className="activity-details">{activity.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Points Table */}
              <div className="column">
                <div className="section">
                  <div className="section-header">
                    <h2>Current Points Table</h2>
                    <button 
                      className="view-all"
                      onClick={() => navigate('/admin/points-table')}
                    >
                      Full Table →
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="points-table">
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Team</th>
                          <th>P</th>
                          <th>W</th>
                          <th>L</th>
                          <th>Pts</th>
                          <th>NRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.pointsTable.map((team, index) => (
                          <tr 
                            key={team._id}
                            onClick={() => navigate(`/admin/teams/${team._id}`)}
                            className={index < 4 ? 'qualification-zone' : ''}
                          >
                            <td className="position-cell">
                              <span className={`position ${index < 4 ? 'top-four' : ''}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td>
                              <div className="team-row">
                                <span className="team-name">{team.name}</span>
                              </div>
                            </td>
                            <td>{team.matchesPlayed}</td>
                            <td>{team.matchesWon}</td>
                            <td>{team.matchesLost}</td>
                            <td className="points">{team.points}</td>
                            <td className={`nrr ${team.netRunRate >= 0 ? 'positive' : 'negative'}`}>
                              {team.netRunRate.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="table-footer">
                    <div className="legend">
                      <span className="legend-item">
                        <span className="legend-color top-four"></span> Top 4 (Qualification)
                      </span>
                      <span className="legend-item">
                        <span className="legend-color positive"></span> Positive NRR
                      </span>
                      <span className="legend-item">
                        <span className="legend-color negative"></span> Negative NRR
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs - Show placeholder or redirect */}
        {activeTab !== 'overview' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h2>
              <button className="action-btn primary" onClick={() => navigate(`/admin/${activeTab}/create`)}>
                <FaPlus /> Add New
              </button>
            </div>
            <div className="redirect-notice">
              <p>You are being redirected to the {activeTab} management page...</p>
              <button className="action-btn secondary" onClick={() => navigate(`/admin/${activeTab}`)}>
                Go to {activeTab} page
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;