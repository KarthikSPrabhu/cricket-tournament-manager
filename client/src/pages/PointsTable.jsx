import { useState, useEffect } from 'react';
import { FaTrophy, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './PointsTable.css';

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [sortField, setSortField] = useState('points');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      const mockTeams = [
        {
          id: 1,
          name: 'Team A',
          played: 5,
          won: 4,
          lost: 1,
          tied: 0,
          points: 8,
          nrr: 1.25,
          form: ['W', 'W', 'L', 'W', 'W']
        },
        {
          id: 2,
          name: 'Team B',
          played: 5,
          won: 3,
          lost: 2,
          tied: 0,
          points: 6,
          nrr: 0.75,
          form: ['W', 'L', 'W', 'W', 'L']
        },
        {
          id: 3,
          name: 'Team C',
          played: 5,
          won: 3,
          lost: 2,
          tied: 0,
          points: 6,
          nrr: 0.45,
          form: ['L', 'W', 'W', 'L', 'W']
        },
        {
          id: 4,
          name: 'Team D',
          played: 5,
          won: 2,
          lost: 3,
          tied: 0,
          points: 4,
          nrr: -0.25,
          form: ['W', 'L', 'L', 'W', 'L']
        },
        {
          id: 5,
          name: 'Team E',
          played: 5,
          won: 2,
          lost: 3,
          tied: 0,
          points: 4,
          nrr: -0.75,
          form: ['L', 'W', 'L', 'L', 'W']
        },
        {
          id: 6,
          name: 'Team F',
          played: 5,
          won: 1,
          lost: 4,
          tied: 0,
          points: 2,
          nrr: -1.50,
          form: ['L', 'L', 'W', 'L', 'L']
        }
      ];
      setTeams(mockTeams);
      setLoading(false);
    }, 1000);
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
    } else if (sortField === 'nrr') {
      comparison = b.nrr - a.nrr;
    } else if (sortField === 'won') {
      comparison = b.won - a.won;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    }
    
    return sortDirection === 'desc' ? comparison : -comparison;
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
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
      </header>

      <div className="legend">
        <div className="legend-item">
          <span className="qualification qual-1"></span>
          <span>Qualification Zone</span>
        </div>
        <div className="legend-item">
          <span className="qualification qual-2"></span>
          <span>Elimination Zone</span>
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
              <th>Form</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr 
                key={team.id} 
                className={index < 4 ? 'qualification-zone' : ''}
              >
                <td className="position">
                  {index + 1}
                  {index === 0 && <FaTrophy className="trophy" />}
                </td>
                <td className="team-name">
                  <div className="team-info">
                    <div className="team-logo">{team.name.charAt(0)}</div>
                    <span>{team.name}</span>
                  </div>
                </td>
                <td>{team.played}</td>
                <td>{team.won}</td>
                <td>{team.lost}</td>
                <td>{team.tied}</td>
                <td className="points">{team.points}</td>
                <td className={`nrr ${team.nrr >= 0 ? 'positive' : 'negative'}`}>
                  {team.nrr > 0 ? '+' : ''}{team.nrr.toFixed(2)}
                </td>
                <td className="form">
                  {team.form.map((result, i) => (
                    <span 
                      key={i} 
                      className={`form-result ${result.toLowerCase()}`}
                    >
                      {result}
                    </span>
                  ))}
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
            <li>Win: 2 points</li>
            <li>Tie/No Result: 1 point</li>
            <li>Loss: 0 points</li>
            <li>Top 4 teams qualify for playoffs</li>
            <li>NRR (Net Run Rate) decides tied positions</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>Key Dates</h3>
          <ul>
            <li>Group Stage: Oct 15 - Oct 30</li>
            <li>Quarter Finals: Nov 2 - Nov 3</li>
            <li>Semi Finals: Nov 5</li>
            <li>Final: Nov 8</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>Qualification Scenario</h3>
          <ul>
            <li>Top 2: Direct to semi-finals</li>
            <li>3rd & 4th: Quarter finals</li>
            <li>5th & 6th: Eliminated</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PointsTable;