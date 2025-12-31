import { useState, useEffect } from 'react';
import { FaTrophy, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './PointsTable.css';

// Mock API service - Replace with your actual API service
const api = {
  teams: {
    getAll: async () => {
      // Simulating API call - replace with your actual API endpoint
      return [
        {
          _id: '1',
          name: 'Team Alpha',
          matchesPlayed: 5,
          matchesWon: 4,
          matchesLost: 1,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 8,
          netRunRate: 1.25,
          shortName: 'TA',
          logo: null
        },
        {
          _id: '2',
          name: 'Team Beta',
          matchesPlayed: 5,
          matchesWon: 3,
          matchesLost: 2,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 6,
          netRunRate: 0.75,
          shortName: 'TB',
          logo: null
        },
        {
          _id: '3',
          name: 'Team Gamma',
          matchesPlayed: 5,
          matchesWon: 3,
          matchesLost: 2,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 6,
          netRunRate: 0.45,
          shortName: 'TG',
          logo: null
        },
        {
          _id: '4',
          name: 'Team Delta',
          matchesPlayed: 5,
          matchesWon: 2,
          matchesLost: 3,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 4,
          netRunRate: -0.15,
          shortName: 'TD',
          logo: null
        },
        {
          _id: '5',
          name: 'Team Epsilon',
          matchesPlayed: 5,
          matchesWon: 2,
          matchesLost: 3,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 4,
          netRunRate: -0.35,
          shortName: 'TE',
          logo: null
        },
        {
          _id: '6',
          name: 'Team Zeta',
          matchesPlayed: 5,
          matchesWon: 1,
          matchesLost: 4,
          matchesTied: 0,
          matchesNoResult: 0,
          points: 2,
          netRunRate: -0.85,
          shortName: 'TZ',
          logo: null
        }
      ];
    }
  }
};

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [sortField, setSortField] = useState('points');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teams from API
        const teamsData = await api.teams.getAll();
        
        // Format teams data for points table
        const formattedTeams = teamsData.map(team => ({
          id: team._id,
          name: team.name,
          played: team.matchesPlayed || 0,
          won: team.matchesWon || 0,
          lost: team.matchesLost || 0,
          tied: team.matchesTied || 0,
          noResult: team.matchesNoResult || 0,
          points: team.points || 0,
          nrr: team.netRunRate || 0,
          form: ['W', 'L', 'W', 'W', 'L'], // This would need actual recent results
          shortName: team.shortName,
          logo: team.logo
        }));
        
        // Sort by points and NRR initially
        const sortedByPoints = formattedTeams.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.nrr - a.nrr;
        });
        
        setTeams(sortedByPoints);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load points table data');
        
        // Fallback to mock data if API fails
        const fallbackTeams = [
          {
            id: 1,
            name: 'Team Alpha',
            played: 5,
            won: 4,
            lost: 1,
            tied: 0,
            points: 8,
            nrr: 1.25,
            form: ['W', 'W', 'L', 'W', 'W'],
            shortName: 'TA'
          },
          {
            id: 2,
            name: 'Team Beta',
            played: 5,
            won: 3,
            lost: 2,
            tied: 0,
            points: 6,
            nrr: 0.75,
            form: ['W', 'L', 'W', 'W', 'L'],
            shortName: 'TB'
          },
          {
            id: 3,
            name: 'Team Gamma',
            played: 5,
            won: 3,
            lost: 2,
            tied: 0,
            points: 6,
            nrr: 0.45,
            form: ['L', 'W', 'W', 'L', 'W'],
            shortName: 'TG'
          },
          {
            id: 4,
            name: 'Team Delta',
            played: 5,
            won: 2,
            lost: 3,
            tied: 0,
            points: 4,
            nrr: -0.25,
            form: ['W', 'L', 'L', 'W', 'L'],
            shortName: 'TD'
          },
          {
            id: 5,
            name: 'Team Epsilon',
            played: 5,
            won: 2,
            lost: 3,
            tied: 0,
            points: 4,
            nrr: -0.75,
            form: ['L', 'W', 'L', 'L', 'W'],
            shortName: 'TE'
          },
          {
            id: 6,
            name: 'Team Zeta',
            played: 5,
            won: 1,
            lost: 4,
            tied: 0,
            points: 2,
            nrr: -1.50,
            form: ['L', 'L', 'W', 'L', 'L'],
            shortName: 'TZ'
          }
        ];
        setTeams(fallbackTeams);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'points') {
      comparison = b.points - a.points;
      // If points are equal, sort by NRR
      if (comparison === 0) {
        comparison = b.nrr - a.nrr;
      }
    } else if (sortField === 'nrr') {
      comparison = b.nrr - a.nrr;
    } else if (sortField === 'won') {
      comparison = b.won - a.won;
    } else if (sortField === 'played') {
      comparison = b.played - a.played;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    }
    
    return sortDirection === 'desc' ? comparison : -comparison;
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const getTeamLogo = (team) => {
    if (team.logo) {
      return <img src={team.logo} alt={team.name} className="team-logo-img" />;
    }
    return <div className="team-logo-letter">{team.shortName || team.name.charAt(0)}</div>;
  };

  const getFormResultClass = (result) => {
    switch(result) {
      case 'W': return 'win';
      case 'L': return 'loss';
      case 'T': return 'tie';
      case 'N': return 'no-result';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading points table...</p>
      </div>
    );
  }

  return (
    <div className="points-table-page">
      <header className="page-header">
        <h1>Points Table</h1>
        <p className="subtitle">Tournament standings and team rankings</p>
        <div className="header-info">
          <div className="tournament-info">
            <span className="tournament-name">Cricket Premier League 2024</span>
            <span className="tournament-stage">Group Stage</span>
          </div>
        </div>
      </header>

      <div className="legend">
        <div className="legend-item">
          <span className="qualification qual-1"></span>
          <span>Qualification Zone (Top 4)</span>
        </div>
        <div className="legend-item">
          <span className="qualification qual-2"></span>
          <span>Elimination Zone</span>
        </div>
        <div className="legend-item">
          <div className="form-legend">
            <span className="form-result win">W</span>
            <span>Win</span>
            <span className="form-result loss">L</span>
            <span>Loss</span>
            <span className="form-result tie">T</span>
            <span>Tie</span>
            <span className="form-result no-result">N</span>
            <span>No Result</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="points-table">
          <thead>
            <tr>
              <th>#</th>
              <th 
                className="sortable"
                onClick={() => handleSort('name')}
              >
                <span>Team</span>
                {getSortIcon('name')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('played')}
              >
                <span>Played</span>
                {getSortIcon('played')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('won')}
              >
                <span>Won</span>
                {getSortIcon('won')}
              </th>
              <th>Lost</th>
              <th>Tied</th>
              <th>NR</th>
              <th 
                className="sortable"
                onClick={() => handleSort('points')}
              >
                <span>Points</span>
                {getSortIcon('points')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('nrr')}
              >
                <span>NRR</span>
                {getSortIcon('nrr')}
              </th>
              <th>Form (Last 5)</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr 
                key={team.id} 
                className={index < 4 ? 'qualification-zone' : ''}
              >
                <td className="position">
                  <div className="position-container">
                    {index + 1}
                    {index === 0 && <FaTrophy className="trophy" />}
                  </div>
                </td>
                <td className="team-name">
                  <div className="team-info">
                    <div className="team-logo">
                      {getTeamLogo(team)}
                    </div>
                    <div className="team-details">
                      <span className="team-full-name">{team.name}</span>
                      {team.shortName && (
                        <span className="team-short-name">{team.shortName}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{team.played}</td>
                <td>{team.won}</td>
                <td>{team.lost}</td>
                <td>{team.tied}</td>
                <td>{team.noResult}</td>
                <td className="points">{team.points}</td>
                <td className={`nrr ${team.nrr >= 0 ? 'positive' : 'negative'}`}>
                  {team.nrr > 0 ? '+' : ''}{team.nrr.toFixed(2)}
                </td>
                <td className="form">
                  <div className="form-container">
                    {team.form.map((result, i) => (
                      <span 
                        key={i} 
                        className={`form-result ${getFormResultClass(result)}`}
                        title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : result === 'T' ? 'Tie' : 'No Result'}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-info">
        <div className="info-card">
          <h3>Tournament Rules</h3>
          <ul>
            <li>Win: <strong>2 points</strong></li>
            <li>Tie/No Result: <strong>1 point</strong></li>
            <li>Loss: <strong>0 points</strong></li>
            <li>Top 4 teams qualify for playoffs</li>
            <li>NRR (Net Run Rate) decides tied positions</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>Current Standings</h3>
          <ul>
            <li>Total Teams: <strong>{teams.length}</strong></li>
            <li>Matches Played: <strong>{teams.reduce((sum, team) => sum + team.played, 0)}</strong></li>
            <li>Total Points: <strong>{teams.reduce((sum, team) => sum + team.points, 0)}</strong></li>
            <li>Leading Team: <strong>{teams[0]?.name || 'N/A'}</strong></li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>Qualification Scenario</h3>
          <ul>
            <li>Position 1-2: Direct to semi-finals</li>
            <li>Position 3-4: Play quarter finals</li>
            <li>Position 5-6: Eliminated from tournament</li>
            <li>Top 4 highlighted in green</li>
          </ul>
        </div>
      </div>

      <div className="last-updated">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </div>
  );
};

export default PointsTable;