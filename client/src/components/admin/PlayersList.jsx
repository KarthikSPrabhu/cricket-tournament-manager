import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUserFriends, FaPlus, FaSearch, FaFilter, FaTshirt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './PlayersList.css';

const PlayersList = ({ onEdit, onCreate }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersData, teamsData] = await Promise.all([
        api.players.getAll(),
        api.teams.getAll()
      ]);
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await api.players.delete(id);
      toast.success('Player deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete player');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPlayers.length === 0) {
      toast.error('Please select players to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedPlayers.length} players?`)) {
      return;
    }

    try {
      const deletePromises = selectedPlayers.map(id => api.players.delete(id));
      await Promise.all(deletePromises);
      toast.success(`${selectedPlayers.length} players deleted successfully`);
      setSelectedPlayers([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete players');
    }
  };

  const handleSelectPlayer = (id) => {
    setSelectedPlayers(prev => 
      prev.includes(id) 
        ? prev.filter(playerId => playerId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === filteredPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(filteredPlayers.map(player => player._id));
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(search.toLowerCase()) ||
                         player.playerId.toLowerCase().includes(search.toLowerCase()) ||
                         player.email.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = filterTeam === 'all' || player.team?._id === filterTeam;
    const matchesRole = filterRole === 'all' || player.playingRole === filterRole;
    return matchesSearch && matchesTeam && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleConfig = {
      'batsman': { color: '#27ae60', label: 'Batsman' },
      'bowler': { color: '#e74c3c', label: 'Bowler' },
      'all-rounder': { color: '#f39c12', label: 'All-Rounder' },
      'wicket-keeper': { color: '#9b59b6', label: 'Wicket Keeper' },
      'wicket-keeper-batsman': { color: '#3498db', label: 'WK-Batsman' }
    };
    
    const config = roleConfig[role] || { color: '#7f8c8d', label: role };
    
    return (
      <span className="role-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="players-loading">
        <div className="spinner"></div>
        <p>Loading players...</p>
      </div>
    );
  }

  return (
    <div className="players-list">
      <div className="players-header">
        <div className="header-left">
          <h2>
            <FaUserFriends /> Players Management
          </h2>
          <p>Total Players: {players.length}</p>
        </div>
        
        <div className="header-actions">
          <button className="btn primary" onClick={onCreate}>
            <FaPlus /> Add Player
          </button>
          {selectedPlayers.length > 0 && (
            <button className="btn danger" onClick={handleBulkDelete}>
              <FaTrash /> Delete Selected ({selectedPlayers.length})
            </button>
          )}
        </div>
      </div>

      <div className="players-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search players by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <FaFilter />
          <select 
            value={filterTeam} 
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <FaTshirt />
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="batsman">Batsman</option>
            <option value="bowler">Bowler</option>
            <option value="all-rounder">All-Rounder</option>
            <option value="wicket-keeper">Wicket Keeper</option>
            <option value="wicket-keeper-batsman">WK-Batsman</option>
          </select>
        </div>
      </div>

      <div className="players-table-container">
        <table className="players-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedPlayers.length === filteredPlayers.length && filteredPlayers.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredPlayers.length === 0}
                />
              </th>
              <th>Player ID</th>
              <th>Player Name</th>
              <th>Team</th>
              <th>Age</th>
              <th>Role</th>
              <th>Batting</th>
              <th>Bowling</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player._id} className={selectedPlayers.includes(player._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player._id)}
                    onChange={() => handleSelectPlayer(player._id)}
                  />
                </td>
                <td>
                  <span className="player-id">{player.playerId}</span>
                </td>
                <td>
                  <div className="player-info">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="player-photo" />
                    ) : (
                      <div className="player-photo-placeholder">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <div className="player-details">
                      <div className="player-name">{player.name}</div>
                      {player.isCaptain && <span className="captain-badge">Captain</span>}
                      {player.isViceCaptain && <span className="vc-badge">Vice Captain</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {player.team ? (
                    <div className="team-info">
                      <div className="team-name">{player.team.name}</div>
                      <div className="team-id">{player.team.teamId}</div>
                    </div>
                  ) : (
                    <span className="no-team">No Team</span>
                  )}
                </td>
                <td>
                  <span className="player-age">{player.age} years</span>
                </td>
                <td>
                  {getRoleBadge(player.playingRole)}
                  {player.battingStyle && (
                    <div className="style-info">
                      <small>{player.battingStyle}</small>
                    </div>
                  )}
                </td>
                <td>
                  <div className="stats-info">
                    <div className="stat-row">
                      <span className="stat-label">Runs:</span>
                      <span className="stat-value">{player.battingStats.runs}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Avg:</span>
                      <span className="stat-value">{player.battingStats.battingAverage}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="stats-info">
                    <div className="stat-row">
                      <span className="stat-label">Wkts:</span>
                      <span className="stat-value">{player.bowlingStats.wickets}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Econ:</span>
                      <span className="stat-value">{player.bowlingStats.economy}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div className="contact-row">
                      <span className="contact-label">Email:</span>
                      <span className="contact-value">{player.email}</span>
                    </div>
                    <div className="contact-row">
                      <span className="contact-label">Phone:</span>
                      <span className="contact-value">{player.phoneNumber}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn icon-btn edit"
                      onClick={() => onEdit(player)}
                      title="Edit Player"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn icon-btn delete"
                      onClick={() => handleDelete(player._id)}
                      title="Delete Player"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPlayers.length === 0 && (
          <div className="no-players">
            {search || filterTeam !== 'all' || filterRole !== 'all' ? (
              <p>No players found matching your criteria.</p>
            ) : (
              <>
                <FaUserFriends className="empty-icon" />
                <p>No players added yet.</p>
                <button className="btn primary" onClick={onCreate}>
                  <FaPlus /> Add Your First Player
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="players-footer">
        <div className="selected-count">
          {selectedPlayers.length > 0 && (
            <span>{selectedPlayers.length} player(s) selected</span>
          )}
        </div>
        <div className="total-count">
          Showing {filteredPlayers.length} of {players.length} players
        </div>
      </div>
    </div>
  );
};

export default PlayersList;