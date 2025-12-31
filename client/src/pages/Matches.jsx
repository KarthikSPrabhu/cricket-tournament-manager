import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy, FaPlay } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './Matches.css';

// Mock API service - Replace with your actual API service
const api = {
  matches: {
    getAll: async () => {
      // Simulating API call - replace with your actual API endpoint
      return [
        {
          _id: '1',
          matchId: 'MAT001',
          matchNumber: 1,
          team1: { 
            _id: '1', 
            name: 'Team Alpha', 
            shortName: 'TA', 
            logo: null 
          },
          team2: { 
            _id: '2', 
            name: 'Team Beta', 
            shortName: 'TB', 
            logo: null 
          },
          date: '2024-10-15',
          startTime: '10:00',
          venue: 'Main Stadium',
          status: 'completed',
          matchType: 'group',
          overs: 20,
          result: { 
            winner: 'Team Alpha', 
            margin: '24 runs',
            winBy: 'runs',
            description: 'Team Alpha won by 24 runs'
          },
          toss: { 
            winner: 'Team Alpha', 
            decision: 'bat'
          }
        },
        {
          _id: '2',
          matchId: 'MAT002',
          matchNumber: 2,
          team1: { 
            _id: '3', 
            name: 'Team Gamma', 
            shortName: 'TG', 
            logo: null 
          },
          team2: { 
            _id: '4', 
            name: 'Team Delta', 
            shortName: 'TD', 
            logo: null 
          },
          date: '2024-10-15',
          startTime: '14:00',
          venue: 'Ground 2',
          status: 'live',
          matchType: 'group',
          overs: 20,
          score: { 
            team1: { runs: 145, wickets: 3, overs: 15.2 },
            team2: { runs: 120, wickets: 7, overs: 15.2 },
            currentInnings: 2,
            battingTeam: 'Team Delta',
            bowlingTeam: 'Team Gamma'
          },
          toss: { 
            winner: 'Team Gamma', 
            decision: 'field'
          }
        },
        {
          _id: '3',
          matchId: 'MAT003',
          matchNumber: 3,
          team1: { 
            _id: '5', 
            name: 'Team Epsilon', 
            shortName: 'TE', 
            logo: null 
          },
          team2: { 
            _id: '6', 
            name: 'Team Zeta', 
            shortName: 'TZ', 
            logo: null 
          },
          date: '2024-10-16',
          startTime: '10:00',
          venue: 'Main Stadium',
          status: 'scheduled',
          matchType: 'group',
          overs: 20,
          toss: null
        },
        {
          _id: '4',
          matchId: 'MAT004',
          matchNumber: 4,
          team1: { 
            _id: '1', 
            name: 'Team Alpha', 
            shortName: 'TA', 
            logo: null 
          },
          team2: { 
            _id: '3', 
            name: 'Team Gamma', 
            shortName: 'TG', 
            logo: null 
          },
          date: '2024-10-17',
          startTime: '10:00',
          venue: 'Ground 3',
          status: 'scheduled',
          matchType: 'group',
          overs: 20
        },
        {
          _id: '5',
          matchId: 'MAT005',
          matchNumber: 5,
          team1: { 
            _id: '2', 
            name: 'Team Beta', 
            shortName: 'TB', 
            logo: null 
          },
          team2: { 
            _id: '4', 
            name: 'Team Delta', 
            shortName: 'TD', 
            logo: null 
          },
          date: '2024-10-16',
          startTime: '14:00',
          venue: 'Main Stadium',
          status: 'completed',
          matchType: 'group',
          overs: 20,
          result: { 
            winner: 'Team Beta', 
            margin: '5 wickets',
            winBy: 'wickets',
            description: 'Team Beta won by 5 wickets'
          },
          toss: { 
            winner: 'Team Delta', 
            decision: 'bat'
          }
        }
      ];
    },
    getLive: async () => {
      const allMatches = await api.matches.getAll();
      return allMatches.filter(match => match.status === 'live');
    },
    getUpcoming: async () => {
      const allMatches = await api.matches.getAll();
      return allMatches.filter(match => match.status === 'scheduled');
    },
    getCompleted: async () => {
      const allMatches = await api.matches.getAll();
      return allMatches.filter(match => match.status === 'completed');
    }
  }
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Fetch matches based on filter
        let matchesData;
        if (filter === 'live') {
          matchesData = await api.matches.getLive();
        } else if (filter === 'upcoming') {
          matchesData = await api.matches.getUpcoming();
        } else if (filter === 'completed') {
          matchesData = await api.matches.getCompleted();
        } else {
          matchesData = await api.matches.getAll();
        }
        
        // Format matches data
        const formattedMatches = matchesData.map(match => ({
          id: match._id,
          matchId: match.matchId,
          matchNumber: match.matchNumber,
          team1: { 
            name: match.team1?.name || 'Team 1', 
            shortName: match.team1?.shortName || 'T1',
            logo: match.team1?.logo 
          },
          team2: { 
            name: match.team2?.name || 'Team 2', 
            shortName: match.team2?.shortName || 'T2',
            logo: match.team2?.logo 
          },
          date: match.date,
          time: match.startTime,
          venue: match.venue,
          status: match.status,
          matchType: match.matchType,
          overs: match.overs,
          toss: match.toss,
          result: match.result,
          score: match.score
        }));
        
        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load matches');
        
        // Fallback to mock data if API fails
        const fallbackMatches = [
          {
            id: 1,
            team1: { name: 'Team Alpha', shortName: 'TA' },
            team2: { name: 'Team Beta', shortName: 'TB' },
            date: '2024-10-15',
            time: '10:00',
            venue: 'Main Stadium',
            status: 'completed',
            overs: 20,
            result: { winner: 'Team Alpha', margin: '24 runs', winBy: 'runs' }
          },
          {
            id: 2,
            team1: { name: 'Team Gamma', shortName: 'TG' },
            team2: { name: 'Team Delta', shortName: 'TD' },
            date: '2024-10-15',
            time: '14:00',
            venue: 'Ground 2',
            status: 'live',
            overs: 20,
            score: { 
              team1: '145/3', 
              team2: '120/7', 
              overs: '15.2',
              battingTeam: 'Team Delta'
            }
          },
          {
            id: 3,
            team1: { name: 'Team Epsilon', shortName: 'TE' },
            team2: { name: 'Team Zeta', shortName: 'TZ' },
            date: '2024-10-16',
            time: '10:00',
            venue: 'Main Stadium',
            status: 'scheduled',
            overs: 20
          }
        ];
        setMatches(fallbackMatches);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [filter]);

  const formatTime = (timeString) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatScore = (score) => {
    if (!score) return null;
    return `${score.team1.runs}/${score.team1.wickets} (${score.team1.overs})`;
  };

  const getTeamLogo = (team) => {
    if (team.logo) {
      return <img src={team.logo} alt={team.name} className="team-logo-img" />;
    }
    return <div className="team-logo-letter">{team.shortName.charAt(0)}</div>;
  };

  const getLiveMatchInfo = (match) => {
    if (!match.score) return null;
    
    const { score } = match;
    const target = score.team1.runs + 1;
    const runsNeeded = target - score.team2.runs;
    const ballsRemaining = Math.floor((match.overs - score.team2.overs) * 6);
    
    if (runsNeeded <= 0) {
      return `${match.team2.name} is winning by ${Math.abs(runsNeeded) + 1} runs`;
    }
    
    return `${match.team2.name} needs ${runsNeeded} runs in ${ballsRemaining} balls`;
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'live': return 'live';
      case 'completed': return 'completed';
      case 'scheduled': return 'scheduled';
      case 'toss': return 'toss';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'live': return 'LIVE';
      case 'completed': return 'COMPLETED';
      case 'scheduled': return 'UPCOMING';
      case 'toss': return 'TOSS';
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h1>Matches</h1>
            <p className="subtitle">Tournament fixtures and results</p>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{matches.length}</span>
              <span className="stat-label">Total Matches</span>
            </div>
            <div className="stat">
              <span className="stat-value">{matches.filter(m => m.status === 'live').length}</span>
              <span className="stat-label">Live Now</span>
            </div>
            <div className="stat">
              <span className="stat-value">{matches.filter(m => m.status === 'completed').length}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Matches
          <span className="count-badge">{matches.length}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
          <span className="count-badge">{matches.filter(m => m.status === 'live').length}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
          <span className="count-badge">{matches.filter(m => m.status === 'scheduled').length}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
          <span className="count-badge">{matches.filter(m => m.status === 'completed').length}</span>
        </button>
      </div>

      <div className="matches-container">
        <div className="matches-grid">
          {matches.map(match => (
            <div key={match.id} className={`match-card ${getStatusBadgeClass(match.status)}`}>
              <div className="match-header">
                <div className="match-meta">
                  <span className={`status-badge ${getStatusBadgeClass(match.status)}`}>
                    {getStatusText(match.status)}
                    {match.status === 'live' && <span className="live-dot"></span>}
                  </span>
                  <span className="match-id">#{match.matchNumber || match.id}</span>
                  {match.matchType && (
                    <span className="match-type">{match.matchType.replace('-', ' ')}</span>
                  )}
                </div>
                
                <div className="match-details">
                  <div className="detail">
                    <FaCalendarAlt /> {formatDate(match.date)}
                  </div>
                  <div className="detail">
                    <FaClock /> {formatTime(match.time)}
                  </div>
                  <div className="detail">
                    <FaMapMarkerAlt /> {match.venue}
                  </div>
                </div>
                
                {match.toss && (
                  <div className="toss-info">
                    <span className="toss-label">Toss:</span>
                    <span className="toss-result">
                      {match.toss.winner} chose to {match.toss.decision}
                    </span>
                  </div>
                )}
              </div>

              <div className="teams-container">
                <div className="teams">
                  <div className="team team-left">
                    <div className="team-info">
                      <div className="team-logo">
                        {getTeamLogo(match.team1)}
                      </div>
                      <div className="team-details">
                        <div className="team-name">{match.team1.name}</div>
                        <div className="team-short-name">{match.team1.shortName}</div>
                      </div>
                    </div>
                    {match.status === 'live' && match.score && (
                      <div className="team-score">
                        <div className="score">{match.score.team1.runs}/{match.score.team1.wickets}</div>
                        <div className="overs">({match.score.team1.overs})</div>
                      </div>
                    )}
                    {match.status === 'completed' && match.result && (
                      <div className={`team-result ${match.result.winner === match.team1.name ? 'winner' : 'loser'}`}>
                        {match.result.winner === match.team1.name ? <FaTrophy className="trophy-icon" /> : 'L'}
                      </div>
                    )}
                  </div>
                  
                  <div className="vs-section">
                    <div className="vs">VS</div>
                    <div className="match-format">{match.overs} overs</div>
                    {match.status === 'live' && match.score && (
                      <div className="live-button">
                        <FaPlay /> Watch Live
                      </div>
                    )}
                  </div>
                  
                  <div className="team team-right">
                    {match.status === 'completed' && match.result && (
                      <div className={`team-result ${match.result.winner === match.team2.name ? 'winner' : 'loser'}`}>
                        {match.result.winner === match.team2.name ? <FaTrophy className="trophy-icon" /> : 'L'}
                      </div>
                    )}
                    {match.status === 'live' && match.score && (
                      <div className="team-score">
                        <div className="score">{match.score.team2.runs}/{match.score.team2.wickets}</div>
                        <div className="overs">({match.score.team2.overs})</div>
                      </div>
                    )}
                    <div className="team-info">
                      <div className="team-logo">
                        {getTeamLogo(match.team2)}
                      </div>
                      <div className="team-details">
                        <div className="team-name">{match.team2.name}</div>
                        <div className="team-short-name">{match.team2.shortName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {match.status === 'completed' && match.result && (
                <div className="match-result">
                  <FaTrophy className="trophy-icon" />
                  <div className="result-text">
                    <strong>{match.result.winner}</strong> won by {match.result.margin}
                  </div>
                  <div className="result-description">
                    {match.result.description}
                  </div>
                </div>
              )}

              {match.status === 'live' && match.score && (
                <div className="live-info">
                  <div className="live-header">
                    <div className="live-indicator">
                      <span className="pulse"></span>
                      <span>LIVE</span>
                    </div>
                    <div className="current-inning">
                      {match.score.battingTeam} batting
                    </div>
                  </div>
                  <div className="match-progress">
                    <div className="progress-info">
                      {getLiveMatchInfo(match)}
                    </div>
                    <div className="required-rate">
                      Required: {(match.score.team2.runs / Math.max(0.1, match.score.team2.overs)).toFixed(1)} runs/over
                    </div>
                  </div>
                </div>
              )}

              <div className="match-footer">
                <button className="view-btn">
                  View Full Scorecard →
                </button>
                {match.status === 'live' && (
                  <button className="live-btn">
                    <FaPlay /> Follow Live
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="no-matches">
            <div className="no-matches-icon">
              <FaCalendarAlt />
            </div>
            <h3>No Matches Found</h3>
            <p>No matches found for the selected filter.</p>
            <button 
              className="view-all-btn"
              onClick={() => setFilter('all')}
            >
              View All Matches
            </button>
          </div>
        )}
      </div>

      <div className="matches-footer">
        <div className="tournament-info">
          <h3>Cricket Premier League 2024</h3>
          <p>Group Stage Matches • {matches.length} matches scheduled</p>
        </div>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default Matches;