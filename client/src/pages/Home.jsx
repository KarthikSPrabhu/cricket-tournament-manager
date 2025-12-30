import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [liveMatch, setLiveMatch] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API calls later
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLiveMatch({
        id: 1,
        team1: { name: 'Team A', score: '145/3', overs: '15.2' },
        team2: { name: 'Team B', score: '120/7', overs: '14.0' },
        status: 'Live',
        venue: 'Main Stadium',
        time: '2:30 PM',
      });

      setUpcomingMatches([
        {
          id: 2,
          team1: 'Team C',
          team2: 'Team D',
          date: '2023-10-15',
          time: '10:00 AM',
          venue: 'Ground 2',
        },
        {
          id: 3,
          team1: 'Team E',
          team2: 'Team F',
          date: '2023-10-15',
          time: '2:00 PM',
          venue: 'Main Stadium',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <h1>Welcome to Cricket Tournament 2023</h1>
        <p className="subtitle">Live scores, match updates, and tournament statistics</p>
      </header>

      {liveMatch && (
        <section className="live-match-section">
          <div className="section-header">
            <h2>
              <span className="live-indicator"></span>
              Live Match
            </h2>
          </div>
          <div className="live-match-card">
            <div className="match-info">
              <div className="venue">
                <FaMapMarkerAlt /> {liveMatch.venue}
              </div>
              <div className="time">
                <FaClock /> {liveMatch.time}
              </div>
            </div>
            
            <div className="teams-score">
              <div className="team">
                <div className="team-name">{liveMatch.team1.name}</div>
                <div className="team-score">{liveMatch.team1.score}</div>
                <div className="team-overs">({liveMatch.team1.overs} overs)</div>
              </div>
              
              <div className="vs">vs</div>
              
              <div className="team">
                <div className="team-name">{liveMatch.team2.name}</div>
                <div className="team-score">{liveMatch.team2.score}</div>
                <div className="team-overs">({liveMatch.team2.overs} overs)</div>
              </div>
            </div>
            
            <div className="match-status">
              <span className="status-badge live">LIVE</span>
              <p>Team A needs 26 runs in 28 balls</p>
            </div>
          </div>
        </section>
      )}

      <section className="upcoming-matches">
        <div className="section-header">
          <h2>
            <FaCalendarAlt /> Upcoming Matches
          </h2>
        </div>
        
        <div className="matches-grid">
          {upcomingMatches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-teams">
                <div className="team">
                  <div className="team-name">{match.team1}</div>
                </div>
                <div className="vs">vs</div>
                <div className="team">
                  <div className="team-name">{match.team2}</div>
                </div>
              </div>
              
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
          ))}
        </div>
      </section>

      <section className="tournament-info">
        <div className="info-cards">
          <div className="info-card">
            <h3>Total Teams</h3>
            <p className="info-value">8</p>
          </div>
          <div className="info-card">
            <h3>Total Matches</h3>
            <p className="info-value">28</p>
          </div>
          <div className="info-card">
            <h3>Tournament Format</h3>
            <p className="info-value">Group + Knockout</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;