import { useState, useEffect } from 'react';
import { FaTrophy, FaUser, FaChartLine, FaFire } from 'react-icons/fa';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batting');

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      setStats({
        topBatsmen: [
          { name: 'John Smith', runs: 345, avg: 57.5, sr: 145.2, team: 'Team A' },
          { name: 'Mike Johnson', runs: 320, avg: 53.3, sr: 138.5, team: 'Team B' },
          { name: 'David Lee', runs: 298, avg: 49.6, sr: 142.8, team: 'Team C' },
          { name: 'Robert Brown', runs: 285, avg: 47.5, sr: 135.4, team: 'Team D' },
          { name: 'James Wilson', runs: 265, avg: 44.1, sr: 140.2, team: 'Team E' }
        ],
        topBowlers: [
          { name: 'Chris Green', wickets: 15, avg: 12.4, econ: 6.8, team: 'Team A' },
          { name: 'Sam Miller', wickets: 14, avg: 14.2, econ: 7.2, team: 'Team B' },
          { name: 'Alex Turner', wickets: 13, avg: 15.8, econ: 6.5, team: 'Team C' },
          { name: 'Tom Harris', wickets: 12, avg: 16.5, econ: 7.8, team: 'Team D' },
          { name: 'Ben Clark', wickets: 11, avg: 18.2, econ: 7.0, team: 'Team E' }
        ],
        tournamentStats: {
          totalRuns: 2450,
          totalWickets: 145,
          totalSixes: 85,
          totalFours: 320,
          highestScore: 89,
          bestBowling: '5/12',
          mostRuns: 'John Smith (345)',
          mostWickets: 'Chris Green (15)'
        },
        milestones: [
          { player: 'John Smith', milestone: 'Fastest century (45 balls)', match: 'vs Team B' },
          { player: 'Chris Green', milestone: 'Hat-trick', match: 'vs Team D' },
          { player: 'Mike Johnson', milestone: '200 tournament runs', match: 'vs Team C' },
          { player: 'Sam Miller', milestone: '10 wickets in tournament', match: 'vs Team A' }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <header className="page-header">
        <h1>Statistics</h1>
        <p className="subtitle">Tournament stats and player performances</p>
      </header>

      <div className="stats-tabs">
        <button 
          className={`tab-btn ${activeTab === 'batting' ? 'active' : ''}`}
          onClick={() => setActiveTab('batting')}
        >
          <FaUser /> Batting
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bowling' ? 'active' : ''}`}
          onClick={() => setActiveTab('bowling')}
        >
          <FaTrophy /> Bowling
        </button>
        <button 
          className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          <FaChartLine /> Overall
        </button>
        <button 
          className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          <FaFire /> Milestones
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'batting' && (
          <div className="stats-section">
            <h2>Top Batsmen</h2>
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Runs</th>
                    <th>Average</th>
                    <th>Strike Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBatsmen.map((player, index) => (
                    <tr key={index}>
                      <td className="player-cell">
                        <div className="player-rank">{index + 1}</div>
                        <div className="player-info">
                          <div className="player-name">{player.name}</div>
                        </div>
                      </td>
                      <td>{player.team}</td>
                      <td className="highlight">{player.runs}</td>
                      <td>{player.avg}</td>
                      <td>{player.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bowling' && (
          <div className="stats-section">
            <h2>Top Bowlers</h2>
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Wickets</th>
                    <th>Average</th>
                    <th>Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBowlers.map((player, index) => (
                    <tr key={index}>
                      <td className="player-cell">
                        <div className="player-rank">{index + 1}</div>
                        <div className="player-info">
                          <div className="player-name">{player.name}</div>
                        </div>
                      </td>
                      <td>{player.team}</td>
                      <td className="highlight">{player.wickets}</td>
                      <td>{player.avg}</td>
                      <td>{player.econ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'overall' && (
          <div className="overall-stats">
            <h2>Tournament Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.totalRuns}</div>
                <div className="stat-label">Total Runs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.totalWickets}</div>
                <div className="stat-label">Total Wickets</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.totalSixes}</div>
                <div className="stat-label">Total Sixes</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.totalFours}</div>
                <div className="stat-label">Total Fours</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.highestScore}</div>
                <div className="stat-label">Highest Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tournamentStats.bestBowling}</div>
                <div className="stat-label">Best Bowling</div>
              </div>
            </div>
            
            <div className="leaders">
              <div className="leader-card">
                <h3>🏏 Most Runs</h3>
                <div className="leader-info">
                  <div className="leader-name">{stats.tournamentStats.mostRuns}</div>
                </div>
              </div>
              
              <div className="leader-card">
                <h3>🎯 Most Wickets</h3>
                <div className="leader-info">
                  <div className="leader-name">{stats.tournamentStats.mostWickets}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-section">
            <h2>Tournament Milestones</h2>
            <div className="milestones-grid">
              {stats.milestones.map((milestone, index) => (
                <div key={index} className="milestone-card">
                  <div className="milestone-icon">
                    <FaFire />
                  </div>
                  <div className="milestone-content">
                    <h3>{milestone.milestone}</h3>
                    <div className="milestone-info">
                      <span className="player">{milestone.player}</span>
                      <span className="match">{milestone.match}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
