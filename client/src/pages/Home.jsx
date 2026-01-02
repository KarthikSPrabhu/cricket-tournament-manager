import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaCricketBall, 
  FaTrophy, 
  FaUsers, 
  FaArrowRight,
  FaFire,
  FaChartLine,
  FaUserAlt,
  FaStar
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentHighlights, setRecentHighlights] = useState([]);
  
  const socket = useSocket();

  useEffect(() => {
    fetchHomeData();
    
    // Listen for live score updates via WebSocket
    const handleBallUpdated = (data) => {
      console.log('Received live match update:', data);
      
      // Update live matches if this match is in the list
      setLiveMatches(prevMatches => 
        prevMatches.map(match => {
          if (match._id === data.matchId) {
            return {
              ...match,
              currentScore: `${data.currentScore.runs}/${data.currentScore.wickets}`,
              currentOver: data.currentScore.overs,
              lastUpdate: new Date(),
              // Update batsman info if available
              ...(data.batsman && {
                topBatsman: {
                  name: data.batsman.name,
                  runs: data.batsman.runs,
                  balls: data.batsman.balls
                }
              })
            };
          }
          return match;
        })
      );
      
      // Add to recent highlights for quick events
      if (data.ball && (data.ball.runs === 4 || data.ball.runs === 6 || data.ball.wicket)) {
        const highlight = {
          id: Date.now(),
          type: data.ball.runs === 4 ? 'FOUR' : data.ball.runs === 6 ? 'SIX' : 'WICKET',
          matchId: data.matchId,
          player: data.batsman?.name || 'Unknown',
          description: data.ball.runs === 4 ? 'Boundary!' : 
                      data.ball.runs === 6 ? 'Maximum!' : 'Wicket!',
          timestamp: new Date()
        };
        
        setRecentHighlights(prev => [highlight, ...prev.slice(0, 4)]);
        
        // Show toast for important events
        if (data.emittedBy !== 'self') {
          toast.success(`${highlight.type}: ${highlight.description}`, {
            icon: highlight.type === 'SIX' ? '🚀' : 
                  highlight.type === 'FOUR' ? '🎯' : '🎳',
            duration: 3000
          });
        }
      }
    };

    const handleMatchStatusUpdated = (data) => {
      console.log('Received match status update:', data);
      
      if (data.newStatus === 'live') {
        // Match started, add to live matches
        fetchLiveMatches();
        toast.info('New match started!', {
          icon: '🏏',
          duration: 3000
        });
      } else if (data.newStatus === 'completed') {
        // Match completed, remove from live matches
        setLiveMatches(prev => prev.filter(m => m._id !== data.matchId));
        fetchHomeData(); // Refresh all data
        toast.success('Match completed!', {
          icon: '🎉',
          duration: 4000
        });
      }
    };

    const handleHighlightEvent = (data) => {
      if (data.type === 'SIX' || data.type === 'FOUR' || data.type === 'WICKET') {
        const highlight = {
          id: Date.now(),
          type: data.type,
          matchId: data.matchId,
          player: data.player,
          description: data.description,
          timestamp: new Date()
        };
        
        setRecentHighlights(prev => [highlight, ...prev.slice(0, 4)]);
      }
    };

    // Add WebSocket listeners
    socket.addListener('ball-updated', handleBallUpdated);
    socket.addListener('match-status-updated', handleMatchStatusUpdated);
    socket.addListener('highlight-event', handleHighlightEvent);

    // Join tournament room for global updates
    socket.joinTournamentRoom('global');

    // Auto-refresh data every 60 seconds
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHomeData();
      }
    }, 60000);

    return () => {
      // Cleanup
      socket.removeListener('ball-updated', handleBallUpdated);
      socket.removeListener('match-status-updated', handleMatchStatusUpdated);
      socket.removeListener('highlight-event', handleHighlightEvent);
      socket.leaveTournamentRoom('global');
      clearInterval(refreshInterval);
    };
  }, [socket]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      const [liveMatchesRes, upcomingMatchesRes, statsRes, highlightsRes] = await Promise.all([
        api.matches.getLive(),
        api.matches.getUpcoming(),
        api.tournament.getCurrent(),
        api.matches.getRecentHighlights(5)
      ]);

      setLiveMatches(liveMatchesRes);
      setUpcomingMatches(upcomingMatchesRes.slice(0, 4)); // Show only 4 upcoming
      setTournamentStats(statsRes);
      setRecentHighlights(highlightsRes);
    } catch (error) {
      console.error('Error fetching home data:', error);
      toast.error('Failed to load home data');
      
      // Fallback to mock data for development
      setLiveMatches([
        {
          _id: '1',
          team1: { name: 'Team Alpha', shortName: 'TA' },
          team2: { name: 'Team Beta', shortName: 'TB' },
          currentScore: '145/3',
          currentOver: 15.2,
          venue: 'Main Stadium',
          date: new Date(),
          requiredRate: 8.5,
          matchType: 'group'
        }
      ]);
      
      setUpcomingMatches([
        {
          _id: '2',
          team1: { name: 'Team Gamma', shortName: 'TG' },
          team2: { name: 'Team Delta', shortName: 'TD' },
          date: new Date(Date.now() + 86400000),
          startTime: '10:00',
          venue: 'Ground 2',
          matchType: 'group'
        }
      ]);
      
      setTournamentStats({
        totalTeams: 8,
        totalMatches: 28,
        completedMatches: 10,
        liveMatches: 2,
        leaderTeam: { name: 'Team Alpha', points: 16 },
        topBatsman: { name: 'Virat Kohli', runs: 345, team: 'Team Alpha' },
        topBowler: { name: 'Jasprit Bumrah', wickets: 15, team: 'Team Alpha' }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMatches = async () => {
    try {
      const liveMatches = await api.matches.getLive();
      setLiveMatches(liveMatches);
    } catch (error) {
      console.error('Error fetching live matches:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">
            Cricket Tournament Manager 2024
          </h1>
          <p className="hero-subtitle">
            Live scores, real-time updates, and comprehensive tournament statistics
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">{tournamentStats?.totalTeams || 0}</div>
              <div className="stat-label">Teams</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">{tournamentStats?.totalMatches || 0}</div>
              <div className="stat-label">Matches</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">{tournamentStats?.completedMatches || 0}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">{liveMatches.length}</div>
              <div className="stat-label">Live Now</div>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="connection-status">
            <div className={`status-indicator ${socket.isConnected() ? 'connected' : 'disconnected'}`}>
              {socket.isConnected() ? '● Live Updates Connected' : '○ Updates Offline'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="home-content-grid">
        {/* Left Column - Live Matches & Highlights */}
        <div className="left-column">
          {/* Live Matches Section */}
          <section className="home-section">
            <div className="section-header">
              <h2>
                <FaCricketBall className="section-icon" />
                Live Matches
                {liveMatches.length > 0 && (
                  <span className="live-count">{liveMatches.length} Live</span>
                )}
              </h2>
              <button 
                className="refresh-btn"
                onClick={fetchLiveMatches}
                title="Refresh live matches"
              >
                <FaArrowRight />
              </button>
            </div>

            {liveMatches.length > 0 ? (
              <div className="live-matches-grid">
                {liveMatches.map(match => (
                  <Link 
                    key={match._id} 
                    to={`/matches/${match._id}`}
                    className="live-match-card"
                  >
                    <div className="live-match-header">
                      <span className="match-type">{match.matchType || 'Group Stage'}</span>
                      <span className="live-badge">
                        <span className="pulse"></span>
                        LIVE
                      </span>
                    </div>
                    
                    <div className="teams-score">
                      <div className="team team-left">
                        <div className="team-info">
                          <div className="team-logo">
                            {match.team1?.shortName?.charAt(0) || 'T'}
                          </div>
                          <div className="team-name">{match.team1?.name}</div>
                        </div>
                        <div className="team-score">{match.currentScore?.split('/')[0] || '0'}</div>
                      </div>
                      
                      <div className="match-center">
                        <div className="vs">VS</div>
                        <div className="current-over">
                          {match.currentOver || '0.0'} overs
                        </div>
                        {match.requiredRate && (
                          <div className="required-rate">
                            RR: {match.requiredRate}
                          </div>
                        )}
                      </div>
                      
                      <div className="team team-right">
                        <div className="team-score">{match.currentScore?.split('/')[1] || '0'}</div>
                        <div className="team-info">
                          <div className="team-name">{match.team2?.name}</div>
                          <div className="team-logo">
                            {match.team2?.shortName?.charAt(0) || 'T'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="match-footer">
                      <div className="venue-info">
                        <FaMapMarkerAlt /> {match.venue}
                      </div>
                      <div className="match-progress">
                        {match.requiredRate ? 'Chasing' : 'Batting first'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-live-matches">
                <FaCricketBall className="empty-icon" />
                <h3>No Live Matches</h3>
                <p>There are no matches being played at the moment</p>
                <Link to="/matches" className="btn primary">
                  View All Matches
                </Link>
              </div>
            )}
          </section>

          {/* Recent Highlights */}
          {recentHighlights.length > 0 && (
            <section className="home-section">
              <div className="section-header">
                <h2>
                  <FaFire className="section-icon" />
                  Recent Highlights
                </h2>
              </div>
              
              <div className="highlights-grid">
                {recentHighlights.map(highlight => (
                  <div key={highlight.id} className="highlight-card">
                    <div className={`highlight-icon ${highlight.type.toLowerCase()}`}>
                      {highlight.type === 'SIX' ? '6' : 
                       highlight.type === 'FOUR' ? '4' : 'W'}
                    </div>
                    <div className="highlight-content">
                      <div className="highlight-title">{highlight.type}</div>
                      <div className="highlight-description">{highlight.description}</div>
                      <div className="highlight-meta">
                        <span className="player">{highlight.player}</span>
                        <span className="time">{getTimeAgo(highlight.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Stats & Upcoming */}
        <div className="right-column">
          {/* Tournament Leaders */}
          <section className="home-section">
            <div className="section-header">
              <h2>
                <FaTrophy className="section-icon" />
                Tournament Leaders
              </h2>
            </div>
            
            <div className="leaders-grid">
              <div className="leader-card">
                <div className="leader-header">
                  <h3>Points Table Leader</h3>
                  <FaChartLine className="leader-icon" />
                </div>
                <div className="leader-content">
                  <div className="leader-team">
                    {tournamentStats?.leaderTeam?.name || '--'}
                  </div>
                  <div className="leader-stats">
                    <span className="stat">{tournamentStats?.leaderTeam?.points || 0} points</span>
                  </div>
                </div>
              </div>
              
              <div className="leader-card">
                <div className="leader-header">
                  <h3>Top Batsman</h3>
                  <FaUserAlt className="leader-icon" />
                </div>
                <div className="leader-content">
                  <div className="leader-player">
                    {tournamentStats?.topBatsman?.name || '--'}
                  </div>
                  <div className="leader-stats">
                    <span className="stat">{tournamentStats?.topBatsman?.runs || 0} runs</span>
                    <span className="team">{tournamentStats?.topBatsman?.team || ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="leader-card">
                <div className="leader-header">
                  <h3>Top Bowler</h3>
                  <FaCricketBall className="leader-icon" />
                </div>
                <div className="leader-content">
                  <div className="leader-player">
                    {tournamentStats?.topBowler?.name || '--'}
                  </div>
                  <div className="leader-stats">
                    <span className="stat">{tournamentStats?.topBowler?.wickets || 0} wickets</span>
                    <span className="team">{tournamentStats?.topBowler?.team || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Matches */}
          <section className="home-section">
            <div className="section-header">
              <h2>
                <FaCalendarAlt className="section-icon" />
                Upcoming Matches
              </h2>
              <Link to="/matches" className="view-all">
                View All
              </Link>
            </div>
            
            {upcomingMatches.length > 0 ? (
              <div className="upcoming-matches-list">
                {upcomingMatches.map(match => (
                  <Link 
                    key={match._id} 
                    to={`/matches/${match._id}`}
                    className="upcoming-match-item"
                  >
                    <div className="match-date">
                      <div className="date">{formatDate(new Date(match.date))}</div>
                      <div className="time">
                        <FaClock /> {match.startTime}
                      </div>
                    </div>
                    
                    <div className="match-teams">
                      <div className="team">
                        <div className="team-logo-small">
                          {match.team1?.shortName?.charAt(0) || 'T'}
                        </div>
                        <div className="team-name">{match.team1?.name}</div>
                      </div>
                      
                      <div className="vs-small">vs</div>
                      
                      <div className="team">
                        <div className="team-name">{match.team2?.name}</div>
                        <div className="team-logo-small">
                          {match.team2?.shortName?.charAt(0) || 'T'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="match-venue">
                      <FaMapMarkerAlt /> {match.venue}
                    </div>
                    
                    <div className="match-type-badge">
                      {match.matchType || 'Group'}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-upcoming-matches">
                <p>No upcoming matches scheduled</p>
              </div>
            )}
          </section>

          {/* Quick Links */}
          <section className="home-section">
            <div className="section-header">
              <h2>Quick Links</h2>
            </div>
            
            <div className="quick-links">
              <Link to="/points-table" className="quick-link">
                <div className="link-icon">
                  <FaChartLine />
                </div>
                <div className="link-content">
                  <h3>Points Table</h3>
                  <p>Current standings</p>
                </div>
              </Link>
              
              <Link to="/statistics" className="quick-link">
                <div className="link-icon">
                  <FaStar />
                </div>
                <div className="link-content">
                  <h3>Statistics</h3>
                  <p>Player performances</p>
                </div>
              </Link>
              
              <Link to="/matches" className="quick-link">
                <div className="link-icon">
                  <FaCalendarAlt />
                </div>
                <div className="link-content">
                  <h3>All Matches</h3>
                  <p>Schedule & results</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Tournament Info Footer */}
      <footer className="tournament-info-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Tournament Info</h3>
            <ul>
              <li>Format: Group Stage + Playoffs</li>
              <li>Overs: 20 per innings</li>
              <li>Total Prize: $50,000</li>
              <li>Organizer: Cricket Association</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li>Email: info@cricket-tournament.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Venue: National Cricket Stadium</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Live Updates</h3>
            <div className="live-update-status">
              <div className={`update-status ${socket.isConnected() ? 'active' : 'inactive'}`}>
                {socket.isConnected() ? 'Live updates active' : 'Updates paused'}
              </div>
              <div className="last-refresh">
                Last refresh: {formatTime(new Date())}
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 Cricket Tournament Manager. All rights reserved.</p>
          <p className="version">v1.0.0 • Real-time scoring enabled</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;