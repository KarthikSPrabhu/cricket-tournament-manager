import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy } from 'react-icons/fa';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      const mockMatches = [
        {
          id: 1,
          team1: { name: 'Team A', logo: 'A' },
          team2: { name: 'Team B', logo: 'B' },
          date: '2023-10-15',
          time: '10:00 AM',
          venue: 'Main Stadium',
          status: 'completed',
          result: { winner: 'Team A', margin: '24 runs' }
        },
        {
          id: 2,
          team1: { name: 'Team C', logo: 'C' },
          team2: { name: 'Team D', logo: 'D' },
          date: '2023-10-15',
          time: '2:00 PM',
          venue: 'Ground 2',
          status: 'live',
          score: { team1: '145/3', team2: '120/7', overs: '15.2' }
        },
        {
          id: 3,
          team1: { name: 'Team E', logo: 'E' },
          team2: { name: 'Team F', logo: 'F' },
          date: '2023-10-16',
          time: '10:00 AM',
          venue: 'Main Stadium',
          status: 'scheduled'
        }
      ];
      setMatches(mockMatches);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'live') return match.status === 'live';
    if (filter === 'upcoming') return match.status === 'scheduled';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

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
        <h1>Matches</h1>
        <p className="subtitle">Tournament fixtures and results</p>
      </header>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Matches
        </button>
        <button 
          className={`filter-btn ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="matches-grid">
        {filteredMatches.map(match => (
          <div key={match.id} className={`match-card ${match.status}`}>
            <div className="match-header">
              <span className={`status-badge ${match.status}`}>
                {match.status.toUpperCase()}
              </span>
              <div className="match-details">
                <div className="detail">
                  <FaCalendarAlt /> {match.date}
                </div>
                <div className="detail">
                  <FaClock /> {match.time}
                </div>
                <div className="detail">
                  <FaMapMarkerAlt /> {match.venue}
                </div>
              </div>
            </div>

            <div className="teams">
              <div className="team">
                <div className="team-logo">{match.team1.logo}</div>
                <div className="team-name">{match.team1.name}</div>
                {match.score && (
                  <div className="team-score">{match.score.team1}</div>
                )}
              </div>
              
              <div className="vs">vs</div>
              
              <div className="team">
                <div className="team-logo">{match.team2.logo}</div>
                <div className="team-name">{match.team2.name}</div>
                {match.score && (
                  <div className="team-score">{match.score.team2}</div>
                )}
              </div>
            </div>

            {match.status === 'completed' && match.result && (
              <div className="match-result">
                <FaTrophy className="trophy-icon" />
                <div className="result-text">
                  <strong>{match.result.winner}</strong> won by {match.result.margin}
                </div>
              </div>
            )}

            {match.status === 'live' && match.score && (
              <div className="live-info">
                <div className="live-indicator"></div>
                <div className="score-info">
                  {match.team1.name} needs 26 runs in 28 balls
                </div>
                <div className="current-over">
                  Current over: {match.score.overs}
                </div>
              </div>
            )}

            <button className="view-btn">
              View Details →
            </button>
          </div>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="no-matches">
          <p>No matches found for the selected filter.</p>
        </div>
      )}
    </div>
  );
};

export default Matches;