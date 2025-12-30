import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUsers, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './TeamsList.css';

const TeamsList = ({ onEdit, onCreate }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [selectedTeams, setSelectedTeams] = useState([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await api.teams.getAll();
      setTeams(data);
    } catch (error) {
      toast.error('Failed to fetch teams');
      console.error('Fetch teams error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await api.teams.delete(id);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeams.length === 0) {
      toast.error('Please select teams to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedTeams.length} teams?`)) {
      return;
    }

    try {
      const deletePromises = selectedTeams.map(id => api.teams.delete(id));
      await Promise.all(deletePromises);
      toast.success(`${selectedTeams.length} teams deleted successfully`);
      setSelectedTeams([]);
      fetchTeams();
    } catch (error) {
      toast.error('Failed to delete teams');
    }
  };

  const handleSelectTeam = (id) => {
    setSelectedTeams(prev => 
      prev.includes(id) 
        ? prev.filter(teamId => teamId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeams.length === filteredTeams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(filteredTeams.map(team => team._id));
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase()) ||
                         team.teamId.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroup === 'all' || team.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  if (loading) {
    return (
      <div className="teams-loading">
        <div className="spinner"></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="teams-list">
      <div className="teams-header">
        <div className="header-left">
          <h2>
            <FaUsers /> Teams Management
          </h2>
          <p>Total Teams: {teams.length}</p>
        </div>
        
        <div className="header-actions">
          <button className="btn primary" onClick={onCreate}>
            <FaPlus /> Create Team
          </button>
          {selectedTeams.length > 0 && (
            <button className="btn danger" onClick={handleBulkDelete}>
              <FaTrash /> Delete Selected ({selectedTeams.length})
            </button>
          )}
        </div>
      </div>

      <div className="teams-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search teams by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <FaFilter />
          <select 
            value={filterGroup} 
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="A">Group A</option>
            <option value="B">Group B</option>
            <option value="C">Group C</option>
            <option value="D">Group D</option>
            <option value={null}>No Group</option>
          </select>
        </div>
      </div>

      <div className="teams-table-container">
        <table className="teams-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredTeams.length === 0}
                />
              </th>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Short Name</th>
              <th>Group</th>
              <th>Players</th>
              <th>Matches</th>
              <th>Points</th>
              <th>NRR</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => (
              <tr key={team._id} className={selectedTeams.includes(team._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team._id)}
                    onChange={() => handleSelectTeam(team._id)}
                  />
                </td>
                <td>
                  <span className="team-id">{team.teamId}</span>
                </td>
                <td>
                  <div className="team-info">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="team-logo" />
                    ) : (
                      <div className="team-logo-placeholder">
                        {team.shortName}
                      </div>
                    )}
                    <div className="team-details">
                      <div className="team-name">{team.name}</div>
                      {team.coach && (
                        <div className="team-coach">Coach: {team.coach}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="short-name">{team.shortName}</span>
                </td>
                <td>
                  {team.group ? (
                    <span className="group-badge group-{team.group}">
                      Group {team.group}
                    </span>
                  ) : (
                    <span className="no-group">No Group</span>
                  )}
                </td>
                <td>
                  <span className="player-count">
                    {team.players?.length || 0} players
                  </span>
                </td>
                <td>
                  <div className="match-stats">
                    <div className="stat-row">
                      <span className="stat-label">Played:</span>
                      <span className="stat-value">{team.matchesPlayed}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">W/L:</span>
                      <span className="stat-value">{team.matchesWon}/{team.matchesLost}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="points">{team.points}</span>
                </td>
                <td>
                  <span className={`nrr ${team.netRunRate >= 0 ? 'positive' : 'negative'}`}>
                    {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(2)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn icon-btn edit"
                      onClick={() => onEdit(team)}
                      title="Edit Team"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn icon-btn delete"
                      onClick={() => handleDelete(team._id)}
                      title="Delete Team"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTeams.length === 0 && (
          <div className="no-teams">
            {search || filterGroup !== 'all' ? (
              <p>No teams found matching your criteria.</p>
            ) : (
              <>
                <FaUsers className="empty-icon" />
                <p>No teams created yet.</p>
                <button className="btn primary" onClick={onCreate}>
                  <FaPlus /> Create Your First Team
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="teams-footer">
        <div className="selected-count">
          {selectedTeams.length > 0 && (
            <span>{selectedTeams.length} team(s) selected</span>
          )}
        </div>
        <div className="total-count">
          Showing {filteredTeams.length} of {teams.length} teams
        </div>
      </div>
    </div>
  );
};

export default TeamsList;