import { useState, useEffect } from 'react';
import { FaTrophy, FaUser, FaChartLine, FaFire, FaCrown, FaBolt, FaBullseye, FaStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './Statistics.css';

// Mock API service - Replace with your actual API service
const api = {
  players: {
    getLeaderboard: async (type, limit) => {
      // Simulating API call - replace with your actual API endpoint
      if (type === 'batting-runs') {
        return [
          {
            _id: '1',
            name: 'Virat Kohli',
            team: 'Team Alpha',
            teamShortName: 'TA',
            runs: 421,
            innings: 8,
            average: 60.14,
            strikeRate: 148.75,
            highestScore: 89,
            fours: 42,
            sixes: 18
          },
          {
            _id: '2',
            name: 'Rohit Sharma',
            team: 'Team Beta',
            teamShortName: 'TB',
            runs: 385,
            innings: 8,
            average: 55.00,
            strikeRate: 152.38,
            highestScore: 78,
            fours: 38,
            sixes: 21
          },
          {
            _id: '3',
            name: 'KL Rahul',
            team: 'Team Gamma',
            teamShortName: 'TG',
            runs: 356,
            innings: 8,
            average: 50.86,
            strikeRate: 145.90,
            highestScore: 82,
            fours: 36,
            sixes: 15
          },
          {
            _id: '4',
            name: 'Suryakumar Yadav',
            team: 'Team Delta',
            teamShortName: 'TD',
            runs: 328,
            innings: 8,
            average: 46.86,
            strikeRate: 162.38,
            highestScore: 91,
            fours: 32,
            sixes: 24
          },
          {
            _id: '5',
            name: 'Rishabh Pant',
            team: 'Team Epsilon',
            teamShortName: 'TE',
            runs: 295,
            innings: 8,
            average: 42.14,
            strikeRate: 158.60,
            highestScore: 75,
            fours: 28,
            sixes: 19
          }
        ];
      } else if (type === 'bowling-wickets') {
        return [
          {
            _id: '6',
            name: 'Jasprit Bumrah',
            team: 'Team Alpha',
            teamShortName: 'TA',
            wickets: 18,
            innings: 8,
            average: 12.44,
            economy: 6.82,
            bestFigures: '5/12',
            overs: 32,
            maidens: 2
          },
          {
            _id: '7',
            name: 'Mohammed Shami',
            team: 'Team Beta',
            teamShortName: 'TB',
            wickets: 16,
            innings: 8,
            average: 14.25,
            economy: 7.20,
            bestFigures: '4/18',
            overs: 31,
            maidens: 1
          },
          {
            _id: '8',
            name: 'Yuzvendra Chahal',
            team: 'Team Gamma',
            teamShortName: 'TG',
            wickets: 15,
            innings: 8,
            average: 15.80,
            economy: 6.50,
            bestFigures: '4/22',
            overs: 34,
            maidens: 3
          },
          {
            _id: '9',
            name: 'Rashid Khan',
            team: 'Team Delta',
            teamShortName: 'TD',
            wickets: 14,
            innings: 8,
            average: 16.50,
            economy: 7.80,
            bestFigures: '3/15',
            overs: 32,
            maidens: 2
          },
          {
            _id: '10',
            name: 'Trent Boult',
            team: 'Team Zeta',
            teamShortName: 'TZ',
            wickets: 13,
            innings: 8,
            average: 18.23,
            economy: 7.00,
            bestFigures: '3/20',
            overs: 31,
            maidens: 1
          }
        ];
      }
    }
  },
  tournament: {
    getCurrent: async () => {
      // Simulating API call - replace with your actual API endpoint
      return {
        _id: 'tournament1',
        name: 'Cricket Premier League 2024',
        season: '2024',
        stats: {
          totalRuns: 3568,
          totalWickets: 186,
          totalSixes: 142,
          totalFours: 489,
          highestScore: 91,
          bestBowling: '5/12',
          mostRuns: { player: 'Virat Kohli', team: 'Team Alpha', runs: 421 },
          mostWickets: { player: 'Jasprit Bumrah', team: 'Team Alpha', wickets: 18 },
          highestStrikeRate: { player: 'Suryakumar Yadav', team: 'Team Delta', strikeRate: 162.38 },
          bestEconomy: { player: 'Yuzvendra Chahal', team: 'Team Gamma', economy: 6.50 },
          totalMatches: 15,
          completedMatches: 10,
          averageScore: 156,
          averageWickets: 6
        },
        milestones: [
          {
            _id: 'm1',
            player: 'Virat Kohli',
            team: 'Team Alpha',
            milestone: 'Fastest century of the tournament (45 balls)',
            match: 'vs Team Beta',
            date: '2024-10-12',
            type: 'batting'
          },
          {
            _id: 'm2',
            player: 'Jasprit Bumrah',
            team: 'Team Alpha',
            milestone: 'First hat-trick of the tournament',
            match: 'vs Team Delta',
            date: '2024-10-15',
            type: 'bowling'
          },
          {
            _id: 'm3',
            player: 'Suryakumar Yadav',
            team: 'Team Delta',
            milestone: 'Most sixes in an innings (8)',
            match: 'vs Team Gamma',
            date: '2024-10-18',
            type: 'batting'
          },
          {
            _id: 'm4',
            player: 'Rohit Sharma',
            team: 'Team Beta',
            milestone: '4000 career T20 runs',
            match: 'vs Team Alpha',
            date: '2024-10-20',
            type: 'career'
          }
        ]
      };
    }
  }
};

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batting');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch top batsmen
        const topBatsmenData = await api.players.getLeaderboard('batting-runs', 5);
        
        // Fetch top bowlers
        const topBowlersData = await api.players.getLeaderboard('bowling-wickets', 5);
        
        // Fetch tournament stats
        const tournamentData = await api.tournament.getCurrent();
        
        setStats({
          topBatsmen: topBatsmenData,
          topBowlers: topBowlersData,
          tournamentStats: tournamentData.stats || {},
          milestones: tournamentData.milestones || []
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error('Failed to load statistics');
        
        // Fallback to mock data
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
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getPlayerAvatar = (playerName) => {
    const initials = playerName.split(' ').map(n => n[0]).join('').toUpperCase();
    return initials;
  };

  const getMilestoneIcon = (type) => {
    switch(type) {
      case 'batting': return <FaBolt />;
      case 'bowling': return <FaBullseye />;
      case 'career': return <FaStar />;
      default: return <FaFire />;
    }
  };

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
        <div className="header-content">
          <div>
            <h1>Statistics</h1>
            <p className="subtitle">Tournament stats and player performances</p>
          </div>
          <div className="tournament-info">
            <h3>Cricket Premier League 2024</h3>
            <p>Season 2024 • Group Stage</p>
          </div>
        </div>
      </header>

      <div className="stats-tabs">
        <button 
          className={`tab-btn ${activeTab === 'batting' ? 'active' : ''}`}
          onClick={() => setActiveTab('batting')}
        >
          <FaUser /> Batting Leaders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bowling' ? 'active' : ''}`}
          onClick={() => setActiveTab('bowling')}
        >
          <FaTrophy /> Bowling Leaders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          <FaChartLine /> Tournament Stats
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
            <div className="section-header">
              <h2>Top Batsmen</h2>
              <div className="leader-type">
                <span className="leader-badge orange">Most Runs</span>
              </div>
            </div>
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Runs</th>
                    <th>Average</th>
                    <th>SR</th>
                    <th>HS</th>
                    <th>4s/6s</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBatsmen.map((player, index) => (
                    <tr key={player._id || index}>
                      <td className="rank-cell">
                        <div className={`rank ${index < 3 ? `top-${index + 1}` : ''}`}>
                          {index + 1}
                          {index === 0 && <FaCrown className="crown" />}
                        </div>
                      </td>
                      <td className="player-cell">
                        <div className="player-avatar">
                          {getPlayerAvatar(player.name)}
                        </div>
                        <div className="player-info">
                          <div className="player-name">{player.name}</div>
                          <div className="player-details">
                            <span className="innings">{player.innings} inns</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="team-badge">
                          {player.teamShortName || player.team}
                        </div>
                      </td>
                      <td className="highlight">
                        <div className="stat-value">{player.runs}</div>
                        <div className="stat-label">runs</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.average}</div>
                        <div className="stat-label">avg</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.strikeRate}</div>
                        <div className="stat-label">sr</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.highestScore}</div>
                        <div className="stat-label">hs</div>
                      </td>
                      <td>
                        <div className="boundaries">
                          <span className="fours">{player.fours || 0}×4</span>
                          <span className="sixes">{player.sixes || 0}×6</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="stats-footnote">
              <p>Minimum qualification: 100 runs scored</p>
            </div>
          </div>
        )}

        {activeTab === 'bowling' && (
          <div className="stats-section">
            <div className="section-header">
              <h2>Top Bowlers</h2>
              <div className="leader-type">
                <span className="leader-badge purple">Most Wickets</span>
              </div>
            </div>
            <div className="stats-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Wkts</th>
                    <th>Average</th>
                    <th>Econ</th>
                    <th>Best</th>
                    <th>Maidens</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topBowlers.map((player, index) => (
                    <tr key={player._id || index}>
                      <td className="rank-cell">
                        <div className={`rank ${index < 3 ? `top-${index + 1}` : ''}`}>
                          {index + 1}
                          {index === 0 && <FaCrown className="crown" />}
                        </div>
                      </td>
                      <td className="player-cell">
                        <div className="player-avatar">
                          {getPlayerAvatar(player.name)}
                        </div>
                        <div className="player-info">
                          <div className="player-name">{player.name}</div>
                          <div className="player-details">
                            <span className="innings">{player.innings} inns</span>
                            <span className="overs">{player.overs || 0} ov</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="team-badge">
                          {player.teamShortName || player.team}
                        </div>
                      </td>
                      <td className="highlight">
                        <div className="stat-value">{player.wickets}</div>
                        <div className="stat-label">wkts</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.average}</div>
                        <div className="stat-label">avg</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.economy}</div>
                        <div className="stat-label">econ</div>
                      </td>
                      <td>
                        <div className="best-figures">{player.bestFigures}</div>
                      </td>
                      <td>
                        <div className="stat-value">{player.maidens || 0}</div>
                        <div className="stat-label">maidens</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="stats-footnote">
              <p>Minimum qualification: 5 wickets taken</p>
            </div>
          </div>
        )}

        {activeTab === 'overall' && (
          <div className="overall-stats">
            <div className="section-header">
              <h2>Tournament Statistics</h2>
              <div className="tournament-phase">
                <span className="phase-badge">Group Stage</span>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card large">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-value">{stats.tournamentStats.totalRuns}</div>
                <div className="stat-label">Total Runs Scored</div>
                <div className="stat-detail">Avg: {stats.tournamentStats.averageScore || 156} per innings</div>
              </div>
              
              <div className="stat-card large">
                <div className="stat-icon">
                  <FaTrophy />
                </div>
                <div className="stat-value">{stats.tournamentStats.totalWickets}</div>
                <div className="stat-label">Total Wickets Taken</div>
                <div className="stat-detail">Avg: {stats.tournamentStats.averageWickets || 6} per innings</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.tournamentStats.totalSixes}</div>
                <div className="stat-label">Total Sixes</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.tournamentStats.totalFours}</div>
                <div className="stat-label">Total Fours</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.tournamentStats.highestScore}</div>
                <div className="stat-label">Highest Score</div>
                <div className="stat-detail">by {stats.tournamentStats.mostRuns?.player || 'N/A'}</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.tournamentStats.bestBowling}</div>
                <div className="stat-label">Best Bowling</div>
                <div className="stat-detail">by {stats.tournamentStats.mostWickets?.player || 'N/A'}</div>
              </div>
            </div>
            
            <div className="leaders-container">
              <div className="leaders-header">
                <h3>Tournament Leaders</h3>
              </div>
              <div className="leaders-grid">
                <div className="leader-card">
                  <div className="leader-header">
                    <h4>🏏 Most Runs</h4>
                    <span className="leader-stat">{stats.tournamentStats.mostRuns?.runs || 421}</span>
                  </div>
                  <div className="leader-info">
                    <div className="leader-avatar">
                      {getPlayerAvatar(stats.tournamentStats.mostRuns?.player || 'Virat Kohli')}
                    </div>
                    <div className="leader-details">
                      <div className="leader-name">{stats.tournamentStats.mostRuns?.player || 'Virat Kohli'}</div>
                      <div className="leader-team">{stats.tournamentStats.mostRuns?.team || 'Team Alpha'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="leader-card">
                  <div className="leader-header">
                    <h4>🎯 Most Wickets</h4>
                    <span className="leader-stat">{stats.tournamentStats.mostWickets?.wickets || 18}</span>
                  </div>
                  <div className="leader-info">
                    <div className="leader-avatar">
                      {getPlayerAvatar(stats.tournamentStats.mostWickets?.player || 'Jasprit Bumrah')}
                    </div>
                    <div className="leader-details">
                      <div className="leader-name">{stats.tournamentStats.mostWickets?.player || 'Jasprit Bumrah'}</div>
                      <div className="leader-team">{stats.tournamentStats.mostWickets?.team || 'Team Alpha'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="leader-card">
                  <div className="leader-header">
                    <h4>⚡ Highest Strike Rate</h4>
                    <span className="leader-stat">{stats.tournamentStats.highestStrikeRate?.strikeRate || 162.38}</span>
                  </div>
                  <div className="leader-info">
                    <div className="leader-avatar">
                      {getPlayerAvatar(stats.tournamentStats.highestStrikeRate?.player || 'Suryakumar Yadav')}
                    </div>
                    <div className="leader-details">
                      <div className="leader-name">{stats.tournamentStats.highestStrikeRate?.player || 'Suryakumar Yadav'}</div>
                      <div className="leader-team">{stats.tournamentStats.highestStrikeRate?.team || 'Team Delta'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="leader-card">
                  <div className="leader-header">
                    <h4>💰 Best Economy</h4>
                    <span className="leader-stat">{stats.tournamentStats.bestEconomy?.economy || 6.50}</span>
                  </div>
                  <div className="leader-info">
                    <div className="leader-avatar">
                      {getPlayerAvatar(stats.tournamentStats.bestEconomy?.player || 'Yuzvendra Chahal')}
                    </div>
                    <div className="leader-details">
                      <div className="leader-name">{stats.tournamentStats.bestEconomy?.player || 'Yuzvendra Chahal'}</div>
                      <div className="leader-team">{stats.tournamentStats.bestEconomy?.team || 'Team Gamma'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-section">
            <div className="section-header">
              <h2>Tournament Milestones</h2>
              <div className="milestone-count">
                <span className="count-badge">{stats.milestones.length} achievements</span>
              </div>
            </div>
            
            <div className="milestones-grid">
              {stats.milestones.map((milestone, index) => (
                <div key={milestone._id || index} className="milestone-card">
                  <div className={`milestone-icon ${milestone.type}`}>
                    {getMilestoneIcon(milestone.type)}
                  </div>
                  <div className="milestone-content">
                    <h3>{milestone.milestone}</h3>
                    <div className="milestone-info">
                      <div className="player-info">
                        <div className="player-name">{milestone.player}</div>
                        <div className="player-team">{milestone.team}</div>
                      </div>
                      <div className="match-info">
                        <div className="match">{milestone.match}</div>
                        {milestone.date && (
                          <div className="date">
                            {new Date(milestone.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="milestone-badge">
                    <FaStar />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="milestones-legend">
              <div className="legend-item">
                <span className="legend-icon batting"><FaBolt /></span>
                <span>Batting Milestone</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon bowling"><FaBullseye /></span>
                <span>Bowling Milestone</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon career"><FaStar /></span>
                <span>Career Milestone</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="stats-footer">
        <p>Statistics updated: {new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}</p>
        <p className="disclaimer">* Minimum qualification criteria apply for leaderboards</p>
      </div>
    </div>
  );
};

export default Statistics;