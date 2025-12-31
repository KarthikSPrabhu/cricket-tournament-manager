import { useState, useEffect } from 'react';
import { 
  FaTrophy, 
  FaUsers, 
  FaCalendarAlt, 
  FaCog, 
  FaPlus, 
  FaTrash,
  FaSave,
  FaPlay,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './TournamentSetup.css';

const TournamentSetup = () => {
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    description: '',
    startDate: '',
    endDate: '',
    format: 'group+knockout',
    rules: {
      pointsPerWin: 2,
      pointsPerTie: 1,
      pointsPerNoResult: 1,
      superOver: true,
      dlsMethod: true,
      powerplayOvers: 6
    }
  });
  const [groups, setGroups] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tournamentData, teamsData] = await Promise.all([
        api.tournament.getCurrent(),
        api.teams.getAll()
      ]);
      
      setTournament(tournamentData);
      setTeams(teamsData);
      
      if (tournamentData && !tournamentData.message) {
        setFormData({
          name: tournamentData.name || '',
          year: tournamentData.year || new Date().getFullYear(),
          description: tournamentData.description || '',
          startDate: tournamentData.startDate ? new Date(tournamentData.startDate).toISOString().split('T')[0] : '',
          endDate: tournamentData.endDate ? new Date(tournamentData.endDate).toISOString().split('T')[0] : '',
          format: tournamentData.format || 'group+knockout',
          rules: tournamentData.rules || {
            pointsPerWin: 2,
            pointsPerTie: 1,
            pointsPerNoResult: 1,
            superOver: true,
            dlsMethod: true,
            powerplayOvers: 6
          }
        });
        
        if (tournamentData.groups) {
          setGroups(tournamentData.groups);
        }
        
        // Load fixtures if tournament exists
        if (tournamentData._id) {
          const matches = await api.matches.getAll({ tournament: tournamentData._id });
          setFixtures(matches);
        }
      }
      
      // Update available teams
      updateAvailableTeams();
    } catch (error) {
      toast.error('Failed to load tournament data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableTeams = () => {
    const assignedTeamIds = groups.flatMap(group => group.teams || []);
    const available = teams.filter(team => !assignedTeamIds.includes(team._id));
    setAvailableTeams(available);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('rules.')) {
      const ruleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        rules: {
          ...prev.rules,
          [ruleField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value
      }));
    }
  };

  const handleCreateTournament = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const tournamentData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      if (tournament && tournament._id) {
        await api.tournament.update(tournament._id, tournamentData);
        toast.success('Tournament updated successfully');
      } else {
        const newTournament = await api.tournament.create(tournamentData);
        setTournament(newTournament);
        toast.success('Tournament created successfully');
      }
      
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to save tournament');
    }
  };

  const handleAddGroup = () => {
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];
    const usedNames = groups.map(g => g.name);
    const nextName = groupNames.find(name => !usedNames.includes(name));
    
    if (!nextName) {
      toast.error('Maximum 6 groups allowed');
      return;
    }

    setGroups(prev => [...prev, { name: nextName, teams: [] }]);
  };

  const handleRemoveGroup = (groupIndex) => {
    if (groups[groupIndex].teams.length > 0) {
      if (!window.confirm('This group contains teams. Are you sure?')) {
        return;
      }
    }
    
    setGroups(prev => prev.filter((_, index) => index !== groupIndex));
    updateAvailableTeams();
  };

  const handleAddTeamToGroup = (groupIndex, teamId) => {
    const team = teams.find(t => t._id === teamId);
    if (!team) return;

    const updatedGroups = [...groups];
    if (!updatedGroups[groupIndex].teams.includes(teamId)) {
      updatedGroups[groupIndex].teams.push(teamId);
      setGroups(updatedGroups);
      updateAvailableTeams();
      
      // Update team group assignment
      api.teams.update(teamId, { group: updatedGroups[groupIndex].name });
    }
  };

  const handleRemoveTeamFromGroup = (groupIndex, teamId) => {
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].teams = updatedGroups[groupIndex].teams.filter(id => id !== teamId);
    setGroups(updatedGroups);
    updateAvailableTeams();
    
    // Remove group from team
    api.teams.update(teamId, { group: null });
  };

  const handleSaveGroups = async () => {
    if (!tournament || !tournament._id) {
      toast.error('Please create tournament first');
      return;
    }

    try {
      await api.tournament.createGroups(tournament._id, groups);
      toast.success('Groups saved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to save groups');
    }
  };

  const handleGenerateFixtures = async () => {
    if (!tournament || !tournament._id) {
      toast.error('Please create tournament first');
      return;
    }

    if (groups.length === 0 || groups.some(g => g.teams.length === 0)) {
      toast.error('Please create groups and assign teams first');
      return;
    }

    try {
      const startDate = formData.startDate || new Date().toISOString().split('T')[0];
      const fixtureData = {
        startDate,
        daysBetweenMatches: 1,
        matchesPerDay: 2
      };

      const result = await api.tournament.generateFixtures(tournament._id, fixtureData);
      toast.success(`${result.count} fixtures generated successfully`);
      setFixtures(result.matches);
    } catch (error) {
      toast.error('Failed to generate fixtures');
    }
  };

  const handleStartTournament = async () => {
    if (!tournament || !tournament._id) {
      toast.error('Please create tournament first');
      return;
    }

    if (fixtures.length === 0) {
      toast.error('Please generate fixtures first');
      return;
    }

    try {
      await api.tournament.update(tournament._id, { status: 'ongoing' });
      toast.success('Tournament started successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to start tournament');
    }
  };

  const getGroupTeamCount = (groupIndex) => {
    return groups[groupIndex]?.teams?.length || 0;
  };

  const getTotalAssignedTeams = () => {
    return groups.reduce((total, group) => total + (group.teams?.length || 0), 0);
  };

  if (loading) {
    return (
      <div className="tournament-loading">
        <div className="spinner"></div>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  return (
    <div className="tournament-setup">
      <div className="setup-header">
        <h1><FaTrophy /> Tournament Setup</h1>
        <p>Configure and manage your cricket tournament</p>
      </div>

      <div className="setup-tabs">
        <button 
          className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          <FaCog /> Basic Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
          disabled={!tournament || !tournament._id}
        >
          <FaUsers /> Groups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fixtures' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixtures')}
          disabled={!tournament || !tournament._id}
        >
          <FaCalendarAlt /> Fixtures
        </button>
        <button 
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
          disabled={!tournament || !tournament._id}
        >
          <FaPlay /> Status
        </button>
      </div>

      <div className="setup-content">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="basic-info">
            <div className="form-section">
              <h3>Tournament Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    Tournament Name *
                    <span className="hint">e.g., Premier Cricket League 2023</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter tournament name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year">
                    Year *
                    <span className="hint">Tournament year</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    min="2000"
                    max="2100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="format">
                    Format *
                    <span className="hint">Tournament structure</span>
                  </label>
                  <select
                    id="format"
                    name="format"
                    value={formData.format}
                    onChange={handleFormChange}
                  >
                    <option value="group+knockout">Group Stage + Knockout</option>
                    <option value="league">Round Robin League</option>
                    <option value="knockout">Knockout Only</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">
                  Description
                  <span className="hint">Brief tournament description</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe the tournament..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Dates</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="startDate">
                    Start Date *
                    <span className="hint">Tournament start date</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">
                    End Date *
                    <span className="hint">Tournament end date</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Rules & Settings</h3>
              
              <div className="rules-grid">
                <div className="rule-item">
                  <label htmlFor="pointsPerWin">
                    Points per Win
                    <span className="hint">Points awarded for a win</span>
                  </label>
                  <input
                    type="number"
                    id="pointsPerWin"
                    name="rules.pointsPerWin"
                    value={formData.rules.pointsPerWin}
                    onChange={handleFormChange}
                    min="1"
                    max="4"
                  />
                </div>

                <div className="rule-item">
                  <label htmlFor="pointsPerTie">
                    Points per Tie
                    <span className="hint">Points awarded for a tie</span>
                  </label>
                  <input
                    type="number"
                    id="pointsPerTie"
                    name="rules.pointsPerTie"
                    value={formData.rules.pointsPerTie}
                    onChange={handleFormChange}
                    min="0"
                    max="4"
                  />
                </div>

                <div className="rule-item">
                  <label htmlFor="pointsPerNoResult">
                    Points per No Result
                    <span className="hint">Points awarded for no result</span>
                  </label>
                  <input
                    type="number"
                    id="pointsPerNoResult"
                    name="rules.pointsPerNoResult"
                    value={formData.rules.pointsPerNoResult}
                    onChange={handleFormChange}
                    min="0"
                    max="4"
                  />
                </div>

                <div className="rule-item">
                  <label htmlFor="powerplayOvers">
                    Powerplay Overs
                    <span className="hint">Overs in powerplay</span>
                  </label>
                  <input
                    type="number"
                    id="powerplayOvers"
                    name="rules.powerplayOvers"
                    value={formData.rules.powerplayOvers}
                    onChange={handleFormChange}
                    min="1"
                    max="20"
                  />
                </div>

                <div className="rule-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="rules.superOver"
                      checked={formData.rules.superOver}
                      onChange={handleFormChange}
                    />
                    <span className="checkmark"></span>
                    Super Over for Ties
                  </label>
                </div>

                <div className="rule-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="rules.dlsMethod"
                      checked={formData.rules.dlsMethod}
                      onChange={handleFormChange}
                    />
                    <span className="checkmark"></span>
                    DLS Method for Rain
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn primary large"
                onClick={handleCreateTournament}
              >
                <FaSave /> {tournament && tournament._id ? 'Update Tournament' : 'Create Tournament'}
              </button>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="groups-management">
            <div className="groups-header">
              <h3>Group Management</h3>
              <div className="header-stats">
                <div className="stat">
                  <span className="label">Total Teams:</span>
                  <span className="value">{teams.length}</span>
                </div>
                <div className="stat">
                  <span className="label">Assigned Teams:</span>
                  <span className="value">{getTotalAssignedTeams()}</span>
                </div>
                <div className="stat">
                  <span className="label">Available Teams:</span>
                  <span className="value">{availableTeams.length}</span>
                </div>
              </div>
            </div>

            {availableTeams.length > 0 && (
              <div className="available-teams">
                <h4>Available Teams</h4>
                <div className="teams-list">
                  {availableTeams.map(team => (
                    <div key={team._id} className="team-card">
                      <div className="team-logo">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} />
                        ) : (
                          <div className="logo-placeholder">
                            {team.shortName}
                          </div>
                        )}
                      </div>
                      <div className="team-info">
                        <div className="team-name">{team.name}</div>
                        <div className="team-id">{team.teamId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="groups-container">
              <div className="groups-header">
                <h4>Tournament Groups</h4>
                <button 
                  className="btn primary"
                  onClick={handleAddGroup}
                  disabled={groups.length >= 6}
                >
                  <FaPlus /> Add Group
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="no-groups">
                  <FaUsers className="empty-icon" />
                  <p>No groups created yet.</p>
                  <p>Click "Add Group" to create your first group.</p>
                </div>
              ) : (
                <div className="groups-grid">
                  {groups.map((group, groupIndex) => (
                    <div key={groupIndex} className="group-card">
                      <div className="group-header">
                        <h5>
                          Group {group.name}
                          <span className="team-count">
                            {getGroupTeamCount(groupIndex)} teams
                          </span>
                        </h5>
                        <button 
                          className="btn icon-btn danger"
                          onClick={() => handleRemoveGroup(groupIndex)}
                          title="Remove Group"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="group-teams">
                        {group.teams && group.teams.length > 0 ? (
                          group.teams.map(teamId => {
                            const team = teams.find(t => t._id === teamId);
                            return team ? (
                              <div key={teamId} className="group-team">
                                <div className="team-info">
                                  <div className="team-logo-small">
                                    {team.logo ? (
                                      <img src={team.logo} alt={team.name} />
                                    ) : (
                                      <div>{team.shortName}</div>
                                    )}
                                  </div>
                                  <div className="team-details">
                                    <div className="team-name">{team.name}</div>
                                    <div className="team-meta">
                                      {team.players?.length || 0} players
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  className="btn icon-btn danger small"
                                  onClick={() => handleRemoveTeamFromGroup(groupIndex, teamId)}
                                  title="Remove from Group"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <div className="no-teams-in-group">
                            No teams assigned
                          </div>
                        )}
                      </div>

                      <div className="group-actions">
                        <select
                          value=""
                          onChange={(e) => handleAddTeamToGroup(groupIndex, e.target.value)}
                          disabled={availableTeams.length === 0}
                        >
                          <option value="">Add Team to Group...</option>
                          {availableTeams.map(team => (
                            <option key={team._id} value={team._id}>
                              {team.name} ({team.teamId})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {groups.length > 0 && (
                <div className="groups-actions">
                  <button 
                    className="btn primary large"
                    onClick={handleSaveGroups}
                    disabled={getTotalAssignedTeams() === 0}
                  >
                    <FaSave /> Save Groups Configuration
                  </button>
                  
                  {getTotalAssignedTeams() < teams.length && (
                    <div className="warning-message">
                      <FaExclamationTriangle />
                      <span>Some teams are not assigned to any group.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="fixtures-management">
            <div className="fixtures-header">
              <h3>Fixture Generation</h3>
              <div className="header-info">
                <p>Generate match schedule based on groups configuration</p>
              </div>
            </div>

            <div className="generation-controls">
              <div className="control-card">
                <h4>Auto Generate Fixtures</h4>
                <p>Automatically create round-robin matches within each group</p>
                <button 
                  className="btn primary large"
                  onClick={handleGenerateFixtures}
                  disabled={groups.length === 0}
                >
                  <FaCalendarAlt /> Generate Fixtures
                </button>
              </div>

              <div className="stats-card">
                <h4>Current Status</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{groups.length}</div>
                    <div className="stat-label">Groups</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{getTotalAssignedTeams()}</div>
                    <div className="stat-label">Teams Assigned</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{fixtures.length}</div>
                    <div className="stat-label">Fixtures Generated</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {fixtures.filter(f => f.status === 'completed').length}
                    </div>
                    <div className="stat-label">Matches Played</div>
                  </div>
                </div>
              </div>
            </div>

            {fixtures.length > 0 && (
              <div className="fixtures-list">
                <h4>Generated Fixtures</h4>
                <div className="fixtures-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Teams</th>
                        <th>Date & Time</th>
                        <th>Venue</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixtures.slice(0, 10).map(match => (
                        <tr key={match._id}>
                          <td>
                            <div className="match-id">{match.matchId}</div>
                            <div className="match-number">#{match.matchNumber}</div>
                          </td>
                          <td>
                            <div className="teams-cell">
                              <div className="team">
                                {match.team1?.logo ? (
                                  <img src={match.team1.logo} alt={match.team1.name} />
                                ) : (
                                  <div className="team-logo-placeholder">
                                    {match.team1?.shortName}
                                  </div>
                                )}
                                <span>{match.team1?.name}</span>
                              </div>
                              <div className="vs">vs</div>
                              <div className="team">
                                {match.team2?.logo ? (
                                  <img src={match.team2.logo} alt={match.team2.name} />
                                ) : (
                                  <div className="team-logo-placeholder">
                                    {match.team2?.shortName}
                                  </div>
                                )}
                                <span>{match.team2?.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="date-time">
                              {new Date(match.date).toLocaleDateString()}
                              <div className="time">{match.startTime}</div>
                            </div>
                          </td>
                          <td>{match.venue}</td>
                          <td>
                            <span className={`type-badge ${match.matchType}`}>
                              {match.matchType}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${match.status}`}>
                              {match.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {fixtures.length > 10 && (
                  <div className="view-all">
                    <button className="btn secondary">
                      View All {fixtures.length} Fixtures
                    </button>
                  </div>
                )}
              </div>
            )}

            {fixtures.length === 0 && groups.length > 0 && (
              <div className="no-fixtures">
                <FaCalendarAlt className="empty-icon" />
                <p>No fixtures generated yet.</p>
                <p>Click "Generate Fixtures" to create the tournament schedule.</p>
              </div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="tournament-status">
            <div className="status-header">
              <h3>Tournament Status</h3>
              <div className="status-badges">
                <span className={`tournament-status-badge ${tournament?.status || 'upcoming'}`}>
                  {tournament?.status?.toUpperCase() || 'NOT CREATED'}
                </span>
              </div>
            </div>

            <div className="status-overview">
              <div className="overview-card">
                <h4>Tournament Progress</h4>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${fixtures.length > 0 ? 
                        (fixtures.filter(f => f.status === 'completed').length / fixtures.length * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-stats">
                  <div className="stat">
                    <span className="value">
                      {fixtures.filter(f => f.status === 'completed').length}
                    </span>
                    <span className="label">Played</span>
                  </div>
                  <div className="stat">
                    <span className="value">
                      {fixtures.filter(f => f.status === 'live').length}
                    </span>
                    <span className="label">Live</span>
                  </div>
                  <div className="stat">
                    <span className="value">
                      {fixtures.filter(f => f.status === 'scheduled').length}
                    </span>
                    <span className="label">Scheduled</span>
                  </div>
                  <div className="stat">
                    <span className="value">{fixtures.length}</span>
                    <span className="label">Total</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h4>Quick Actions</h4>
                <div className="action-buttons">
                  <button 
                    className="btn primary"
                    onClick={handleStartTournament}
                    disabled={tournament?.status === 'ongoing' || fixtures.length === 0}
                  >
                    <FaPlay /> Start Tournament
                  </button>
                  
                  <button 
                    className="btn secondary"
                    onClick={() => api.tournament.update(tournament._id, { status: 'completed' })}
                    disabled={tournament?.status !== 'ongoing'}
                  >
                    <FaCheck /> Mark as Completed
                  </button>
                </div>
              </div>
            </div>

            <div className="status-cards">
              <div className="status-card">
                <div className="card-icon teams">
                  <FaUsers />
                </div>
                <div className="card-content">
                  <h5>Teams</h5>
                  <p className="card-value">{teams.length}</p>
                  <p className="card-label">Registered Teams</p>
                </div>
              </div>

              <div className="status-card">
                <div className="card-icon groups">
                  <FaUsers />
                </div>
                <div className="card-content">
                  <h5>Groups</h5>
                  <p className="card-value">{groups.length}</p>
                  <p className="card-label">Active Groups</p>
                </div>
              </div>

              <div className="status-card">
                <div className="card-icon matches">
                  <FaCalendarAlt />
                </div>
                <div className="card-content">
                  <h5>Matches</h5>
                  <p className="card-value">{fixtures.length}</p>
                  <p className="card-label">Total Fixtures</p>
                </div>
              </div>

              <div className="status-card">
                <div className="card-icon progress">
                  <FaTrophy />
                </div>
                <div className="card-content">
                  <h5>Progress</h5>
                  <p className="card-value">
                    {fixtures.length > 0 ? 
                      `${Math.round(fixtures.filter(f => f.status === 'completed').length / fixtures.length * 100)}%` 
                      : '0%'}
                  </p>
                  <p className="card-label">Completed</p>
                </div>
              </div>
            </div>

            {tournament?.status === 'ongoing' && (
              <div className="live-updates">
                <h4>Tournament Updates</h4>
                <div className="updates-list">
                  {/* This would show recent match updates */}
                  <div className="update-item">
                    <div className="update-time">2 hours ago</div>
                    <div className="update-content">
                      <strong>Team A</strong> defeated <strong>Team B</strong> by 24 runs
                    </div>
                  </div>
                  <div className="update-item">
                    <div className="update-time">5 hours ago</div>
                    <div className="update-content">
                      <strong>Team C</strong> vs <strong>Team D</strong> match started
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentSetup;