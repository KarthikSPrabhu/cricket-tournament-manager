import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './MatchForm.css';

const MatchForm = ({ match, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    matchId: '',
    team1Id: '',
    team2Id: '',
    venue: '',
    date: '',
    startTime: '10:00',
    overs: 20,
    matchType: 'group',
    umpires: {
      onField: ['', ''],
      thirdUmpire: '',
      matchReferee: ''
    },
    streamLink: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matchTypes, setMatchTypes] = useState([
    { value: 'group', label: 'Group Stage' },
    { value: 'quarter-final', label: 'Quarter Final' },
    { value: 'semi-final', label: 'Semi Final' },
    { value: 'final', label: 'Final' }
  ]);

  useEffect(() => {
    fetchData();
    if (match) {
      setFormData({
        matchId: match.matchId || '',
        team1Id: match.team1?._id || '',
        team2Id: match.team2?._id || '',
        venue: match.venue || '',
        date: match.date ? new Date(match.date).toISOString().split('T')[0] : '',
        startTime: match.startTime || '10:00',
        overs: match.overs || 20,
        matchType: match.matchType || 'group',
        umpires: match.umpires || {
          onField: ['', ''],
          thirdUmpire: '',
          matchReferee: ''
        },
        streamLink: match.streamLink || ''
      });
    } else {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        date: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [match]);

  const fetchData = async () => {
    try {
      const [teamsData, tournamentsData] = await Promise.all([
        api.teams.getAll(),
        api.tournament.getAll()
      ]);
      setTeams(teamsData);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.matchId.trim()) {
      newErrors.matchId = 'Match ID is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.matchId)) {
      newErrors.matchId = 'Match ID should contain only uppercase letters and numbers';
    }
    
    if (!formData.team1Id) {
      newErrors.team1Id = 'Team 1 is required';
    }
    
    if (!formData.team2Id) {
      newErrors.team2Id = 'Team 2 is required';
    } else if (formData.team1Id === formData.team2Id) {
      newErrors.team2Id = 'Team 1 and Team 2 cannot be the same';
    }
    
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (new Date(formData.date) < new Date().setHours(0,0,0,0)) {
      newErrors.date = 'Date cannot be in the past';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.overs || formData.overs < 5 || formData.overs > 50) {
      newErrors.overs = 'Overs must be between 5 and 50';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('umpires.')) {
      const umpireField = name.split('.')[1];
      if (umpireField === 'onField') {
        const index = parseInt(name.split('.')[2]);
        const newOnField = [...formData.umpires.onField];
        newOnField[index] = value;
        setFormData(prev => ({
          ...prev,
          umpires: { ...prev.umpires, onField: newOnField }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          umpires: { ...prev.umpires, [umpireField]: value }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'matchId' ? value.toUpperCase() : 
                (name === 'overs' ? parseInt(value) || '' : value)
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      const matchData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };

      if (match) {
        // Update existing match
        await api.matches.update(match._id, matchData);
        toast.success('Match updated successfully');
      } else {
        // Create new match
        await api.matches.create(matchData);
        toast.success('Match created successfully');
      }
      
      onSave();
    } catch (error) {
      toast.error(error.message || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const generateMatchId = () => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newMatchId = `MATCH${month}${day}${random}`;
    setFormData(prev => ({ ...prev, matchId: newMatchId }));
  };

  const getTeamOptions = () => {
    return teams.filter(team => team._id !== formData.team1Id && team._id !== formData.team2Id);
  };

  return (
    <div className="match-form">
      <div className="form-header">
        <h2>
          <FaTrophy /> {match ? 'Edit Match' : 'Schedule New Match'}
        </h2>
        <button className="btn icon-btn" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Match ID & Type Section */}
          <div className="section">
            <h3>Match Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="matchId">
                  Match ID *
                  <span className="hint">Unique match identifier</span>
                </label>
                <div className="input-with-button">
                  <input
                    type="text"
                    id="matchId"
                    name="matchId"
                    value={formData.matchId}
                    onChange={handleChange}
                    placeholder="MATCH001"
                    className={errors.matchId ? 'error' : ''}
                    disabled={!!match}
                  />
                  {!match && (
                    <button 
                      type="button" 
                      className="btn generate-btn"
                      onClick={generateMatchId}
                    >
                      Generate
                    </button>
                  )}
                </div>
                {errors.matchId && <span className="error-text">{errors.matchId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="matchType">
                  Match Type *
                  <span className="hint">Stage of tournament</span>
                </label>
                <select
                  id="matchType"
                  name="matchType"
                  value={formData.matchType}
                  onChange={handleChange}
                >
                  {matchTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Teams Selection */}
          <div className="section">
            <h3>Teams</h3>
            
            <div className="teams-selection">
              <div className="team-select">
                <div className="form-group">
                  <label htmlFor="team1Id">
                    Team 1 *
                    <span className="hint">Select first team</span>
                  </label>
                  <select
                    id="team1Id"
                    name="team1Id"
                    value={formData.team1Id}
                    onChange={handleChange}
                    className={errors.team1Id ? 'error' : ''}
                  >
                    <option value="">Select Team 1</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name} ({team.teamId})
                      </option>
                    ))}
                  </select>
                  {errors.team1Id && <span className="error-text">{errors.team1Id}</span>}
                </div>
                
                {formData.team1Id && (
                  <div className="team-preview">
                    {teams.find(t => t._id === formData.team1Id)?.logo ? (
                      <img 
                        src={teams.find(t => t._id === formData.team1Id).logo} 
                        alt="Team 1" 
                        className="team-logo"
                      />
                    ) : (
                      <div className="team-logo-placeholder">
                        {teams.find(t => t._id === formData.team1Id)?.shortName}
                      </div>
                    )}
                    <div className="team-name">
                      {teams.find(t => t._id === formData.team1Id)?.name}
                    </div>
                  </div>
                )}
              </div>

              <div className="vs">VS</div>

              <div className="team-select">
                <div className="form-group">
                  <label htmlFor="team2Id">
                    Team 2 *
                    <span className="hint">Select second team</span>
                  </label>
                  <select
                    id="team2Id"
                    name="team2Id"
                    value={formData.team2Id}
                    onChange={handleChange}
                    className={errors.team2Id ? 'error' : ''}
                  >
                    <option value="">Select Team 2</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name} ({team.teamId})
                      </option>
                    ))}
                  </select>
                  {errors.team2Id && <span className="error-text">{errors.team2Id}</span>}
                </div>
                
                {formData.team2Id && (
                  <div className="team-preview">
                    {teams.find(t => t._id === formData.team2Id)?.logo ? (
                      <img 
                        src={teams.find(t => t._id === formData.team2Id).logo} 
                        alt="Team 2" 
                        className="team-logo"
                      />
                    ) : (
                      <div className="team-logo-placeholder">
                        {teams.find(t => t._id === formData.team2Id)?.shortName}
                      </div>
                    )}
                    <div className="team-name">
                      {teams.find(t => t._id === formData.team2Id)?.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="section">
            <h3>Match Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="venue">
                  <FaMapMarkerAlt /> Venue *
                  <span className="hint">Stadium or ground name</span>
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Wankhede Stadium, Mumbai"
                  className={errors.venue ? 'error' : ''}
                />
                {errors.venue && <span className="error-text">{errors.venue}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="overs">
                  Overs *
                  <span className="hint">Number of overs per innings</span>
                </label>
                <select
                  id="overs"
                  name="overs"
                  value={formData.overs}
                  onChange={handleChange}
                  className={errors.overs ? 'error' : ''}
                >
                  <option value="5">5 overs</option>
                  <option value="10">10 overs</option>
                  <option value="20">20 overs (T20)</option>
                  <option value="50">50 overs (ODI)</option>
                </select>
                {errors.overs && <span className="error-text">{errors.overs}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">
                  <FaCalendarAlt /> Date *
                  <span className="hint">Match date</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="startTime">
                  <FaClock /> Start Time *
                  <span className="hint">Match start time</span>
                </label>
                <select
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={errors.startTime ? 'error' : ''}
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="19:00">07:00 PM</option>
                </select>
                {errors.startTime && <span className="error-text">{errors.startTime}</span>}
              </div>
            </div>
          </div>

          {/* Umpires & Officials */}
          <div className="section">
            <h3>Match Officials</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="umpires.onField[0]">
                  On-Field Umpire 1
                  <span className="hint">Main umpire</span>
                </label>
                <input
                  type="text"
                  name="umpires.onField[0]"
                  value={formData.umpires.onField[0]}
                  onChange={handleChange}
                  placeholder="Umpire Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="umpires.onField[1]">
                  On-Field Umpire 2
                  <span className="hint">Second umpire</span>
                </label>
                <input
                  type="text"
                  name="umpires.onField[1]"
                  value={formData.umpires.onField[1]}
                  onChange={handleChange}
                  placeholder="Umpire Name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="umpires.thirdUmpire">
                  Third Umpire
                  <span className="hint">TV umpire</span>
                </label>
                <input
                  type="text"
                  name="umpires.thirdUmpire"
                  value={formData.umpires.thirdUmpire}
                  onChange={handleChange}
                  placeholder="Third Umpire Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="umpires.matchReferee">
                  Match Referee
                  <span className="hint">Match referee name</span>
                </label>
                <input
                  type="text"
                  name="umpires.matchReferee"
                  value={formData.umpires.matchReferee}
                  onChange={handleChange}
                  placeholder="Referee Name"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="section">
            <h3>Additional Information</h3>
            
            <div className="form-group">
              <label htmlFor="streamLink">
                Stream Link
                <span className="hint">Live streaming URL (optional)</span>
              </label>
              <input
                type="url"
                id="streamLink"
                name="streamLink"
                value={formData.streamLink}
                onChange={handleChange}
                placeholder="https://example.com/live-stream"
              />
            </div>

            <div className="form-group">
              <label>Match Preview</label>
              <div className="match-preview">
                <div className="preview-header">Match Summary</div>
                <div className="preview-content">
                  <div className="preview-teams">
                    <div className="preview-team">
                      <div className="preview-team-name">
                        {formData.team1Id ? 
                          teams.find(t => t._id === formData.team1Id)?.name : 'Team 1'}
                      </div>
                      <div className="preview-vs">vs</div>
                      <div className="preview-team-name">
                        {formData.team2Id ? 
                          teams.find(t => t._id === formData.team2Id)?.name : 'Team 2'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="preview-details">
                    <div className="preview-detail">
                      <FaCalendarAlt /> 
                      {formData.date ? new Date(formData.date).toLocaleDateString() : 'Date'}
                    </div>
                    <div className="preview-detail">
                      <FaClock /> {formData.startTime || 'Time'}
                    </div>
                    <div className="preview-detail">
                      <FaMapMarkerAlt /> {formData.venue || 'Venue'}
                    </div>
                    <div className="preview-detail">
                      <FaTrophy /> {formData.overs ? `${formData.overs} overs` : 'Format'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            className="btn secondary"
            onClick={onCancel}
            disabled={loading}
          >
            <FaTimes /> Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave /> {match ? 'Update Match' : 'Schedule Match'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;