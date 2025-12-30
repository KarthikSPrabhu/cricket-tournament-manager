import { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaPlay,
  FaStop,
  FaTrophy
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './MatchesList.css';

const MatchesList = ({ onEdit, onCreate, onStartScoring }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedMatches, setSelectedMatches] = useState([]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'toss', label: 'Toss' },
    { value: 'live', label: 'Live' },
    { value: 'completed', label: 'Completed' },
    { value: 'abandoned', label: 'Abandoned' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'group', label: 'Group Stage' },
    { value: 'quarter-final', label: 'Quarter Final' },
    { value: 'semi-final', label: 'Semi Final' },
    { value: 'final', label: 'Final' }
  ];

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const data = await api.matches.getAll();
      setMatches(data);
    } catch (error) {
      toast.error('Failed to fetch matches');
      console.error('Fetch matches error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      await api.matches.delete(id);
      toast.success('Match deleted successfully');
      fetchMatches();
    } catch (error) {
      toast.error('Failed to delete match');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.matches.updateStatus(id, { status });
      toast.success(`Match status updated to ${status}`);
      fetchMatches();
    } catch (error) {
      toast.error('Failed to update match status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMatches.length === 0) {
      toast.error('Please select matches to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMatches.length} matches?`)) {
      return;
    }

    try {
      const deletePromises = selectedMatches.map(id => api.matches.delete(id));
      await Promise.all(deletePromises);
      toast.success(`${selectedMatches.length} matches deleted successfully`);
      setSelectedMatches([]);
      fetchMatches();
    } catch (error) {
      toast.error('Failed to delete matches');
    }
  };

  const handleSelectMatch = (id) => {
    setSelectedMatches(prev => 
      prev.includes(id) 
        ? prev.filter(matchId => matchId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMatches.length === filteredMatches.length) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(filteredMatches.map(match => match._id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'scheduled': { color: '#f39c12', label: 'Scheduled' },
      'toss': { color: '#3498db', label: 'Toss' },
      'live': { color: '#e74c3c', label: 'Live' },
      'completed': { color: '#27ae60', label: 'Completed' },
      'abandoned': { color: '#7f8c8d', label: 'Abandoned' }
    };
    
    const config = statusConfig[status] || { color: '#bdc3c7', label: status };
    
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      'group': { color: '#3498db', label: 'Group' },
      'quarter-final': { color: '#9b59b6', label: 'Quarter Final' },
      'semi-final': { color: '#f1c40f', label: 'Semi Final' },
      'final': { color: '#e74c3c', label: 'Final' }
    };
    
    const config = typeConfig[type] || { color: '#7f8c8d', label: type };
    
    return (
      <span className="type-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.matchId.toLowerCase().includes(search.toLowerCase()) ||
                         match.venue.toLowerCase().includes(search.toLowerCase()) ||
                         (match.team1?.name?.toLowerCase().includes(search.toLowerCase())) ||
                         (match.team2?.name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || match.status === filterStatus;
    const matchesType = filterType === 'all' || match.matchType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="matches-loading">
        <div className="spinner"></div>
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="matches-list">
      <div className="matches-header">
        <div className="header-left">
          <h2>
            <FaCalendarAlt /> Matches Management
          </h2>
          <p>Total Matches: {matches.length}</p>
        </div>
        
        <div className="header-actions">
          <button className="btn primary" onClick={onCreate}>
            <FaPlus /> Schedule Match
          </button>
          {selectedMatches.length > 0 && (
            <button className="btn danger" onClick={handleBulkDelete}>
              <FaTrash /> Delete Selected ({selectedMatches.length})
            </button>
          )}
        </div>
      </div>

      <div className="matches-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search matches by ID, venue, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <FaFilter />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <FaTrophy />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="matches-table-container">
        <table className="matches-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedMatches.length === filteredMatches.length && filteredMatches.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredMatches.length === 0}
                />
              </th>
              <th>Match ID</th>
              <th>Teams</th>
              <th>Venue & Date</th>
              <th>Format</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map((match) => (
              <tr key={match._id} className={selectedMatches.includes(match._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedMatches.includes(match._id)}
                    onChange={() => handleSelectMatch(match._id)}
                  />
                </td>
                <td>
                  <span className="match-id">{match.matchId}</span>
                  <div className="match-number">#{match.matchNumber}</div>
                </td>
                <td>
                  <div className="teams-info">
                    <div className="team-row">
                      <div className="team-logo-small">
                        {match.team1?.logo ? (
                          <img src={match.team1.logo} alt={match.team1.name} />
                        ) : (
                          <div>{match.team1?.shortName || 'T1'}</div>
                        )}
                      </div>
                      <div className="team-name">{match.team1?.name || 'Team 1'}</div>
                    </div>
                    <div className="vs-small">vs</div>
                    <div className="team-row">
                      <div className="team-logo-small">
                        {match.team2?.logo ? (
                          <img src={match.team2.logo} alt={match.team2.name} />
                        ) : (
                          <div>{match.team2?.shortName || 'T2'}</div>
                        )}
                      </div>
                      <div className="team-name">{match.team2?.name || 'Team 2'}</div>
                    </div>
                    
                    {match.result && (
                      <div className="match-result">
                        <FaTrophy /> 
                        <span className="winner">
                          {match.result.winner?.name} won by {match.result.margin}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="venue-info">
                    <div className="venue-name">{match.venue}</div>
                    <div className="match-date">
                      {new Date(match.date).toLocaleDateString()} at {match.startTime}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="format">{match.overs} overs</span>
                </td>
                <td>
                  {getStatusBadge(match.status)}
                  {match.status === 'live' && (
                    <button 
                      className="btn small-btn"
                      onClick={() => onStartScoring(match)}
                    >
                      <FaPlay /> Score
                    </button>
                  )}
                </td>
                <td>
                  {getTypeBadge(match.matchType)}
                </td>
                <td>
                  <div className="action-buttons">
                    {match.status === 'scheduled' && (
                      <button 
                        className="btn icon-btn start"
                        onClick={() => handleStatusUpdate(match._id, 'toss')}
                        title="Start Toss"
                      >
                        <FaPlay />
                      </button>
                    )}
                    
                    {match.status === 'toss' && (
                      <button 
                        className="btn icon-btn live"
                        onClick={() => handleStatusUpdate(match._id, 'live')}
                        title="Start Match"
                      >
                        <FaPlay />
                      </button>
                    )}
                    
                    {match.status === 'live' && (
                      <button 
                        className="btn icon-btn stop"
                        onClick={() => handleStatusUpdate(match._id, 'completed')}
                        title="End Match"
                      >
                        <FaStop />
                      </button>
                    )}
                    
                    <button 
                      className="btn icon-btn edit"
                      onClick={() => onEdit(match)}
                      title="Edit Match"
                    >
                      <FaEdit />
                    </button>
                    
                    <button 
                      className="btn icon-btn delete"
                      onClick={() => handleDelete(match._id)}
                      title="Delete Match"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMatches.length === 0 && (
          <div className="no-matches">
            {search || filterStatus !== 'all' || filterType !== 'all' ? (
              <p>No matches found matching your criteria.</p>
            ) : (
              <>
                <FaCalendarAlt className="empty-icon" />
                <p>No matches scheduled yet.</p>
                <button className="btn primary" onClick={onCreate}>
                  <FaPlus /> Schedule Your First Match
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="matches-footer">
        <div className="selected-count">
          {selectedMatches.length > 0 && (
            <span>{selectedMatches.length} match(es) selected</span>
          )}
        </div>
        <div className="total-count">
          Showing {filteredMatches.length} of {matches.length} matches
        </div>
      </div>

      <div className="matches-stats">
        <div className="stat-card">
          <div className="stat-icon scheduled">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <h3>Scheduled</h3>
            <p className="stat-value">
              {matches.filter(m => m.status === 'scheduled').length}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon live">
            <FaPlay />
          </div>
          <div className="stat-info">
            <h3>Live</h3>
            <p className="stat-value">
              {matches.filter(m => m.status === 'live').length}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaTrophy />
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-value">
              {matches.filter(m => m.status === 'completed').length}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <h3>Total</h3>
            <p className="stat-value">{matches.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchesList;