import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload, FaCricket } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './TeamForm.css';

const TeamForm = ({ team, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    teamId: '',
    name: '',
    shortName: '',
    logo: '',
    group: '',
    coach: '',
    captain: '',
    viceCaptain: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (team) {
      setFormData({
        teamId: team.teamId || '',
        name: team.name || '',
        shortName: team.shortName || '',
        logo: team.logo || '',
        group: team.group || '',
        coach: team.coach || '',
        captain: team.captain?._id || '',
        viceCaptain: team.viceCaptain?._id || ''
      });
    }
    fetchPlayers();
  }, [team]);

  const fetchPlayers = async () => {
    try {
      const data = await api.players.getAll();
      setPlayers(data);
    } catch (error) {
      console.error('Fetch players error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.teamId.trim()) {
      newErrors.teamId = 'Team ID is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.teamId)) {
      newErrors.teamId = 'Team ID should contain only uppercase letters and numbers';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    
    if (!formData.shortName.trim()) {
      newErrors.shortName = 'Short name is required';
    } else if (formData.shortName.length > 3) {
      newErrors.shortName = 'Short name must be 3 characters or less';
    }
    
    if (formData.group && !['A', 'B', 'C', 'D'].includes(formData.group)) {
      newErrors.group = 'Group must be A, B, C, or D';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamId' || name === 'shortName' ? value.toUpperCase() : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In production, upload to cloud storage like Cloudinary
    // For now, create a local object URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      if (team) {
        // Update existing team
        await api.teams.update(team._id, formData);
        toast.success('Team updated successfully');
      } else {
        // Create new team
        await api.teams.create(formData);
        toast.success('Team created successfully');
      }
      
      onSave();
    } catch (error) {
      toast.error(error.message || 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const groups = ['A', 'B', 'C', 'D'];

  return (
    <div className="team-form">
      <div className="form-header">
        <h2>
          <FaCricket /> {team ? 'Edit Team' : 'Create New Team'}
        </h2>
        <button className="btn icon-btn" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Team Logo Section */}
          <div className="logo-section">
            <div className="logo-upload">
              {formData.logo ? (
                <img src={formData.logo} alt="Team Logo" className="team-logo-preview" />
              ) : (
                <div className="logo-placeholder">
                  <FaCricket />
                  <span>Upload Logo</span>
                </div>
              )}
              <label className="upload-btn">
                <FaUpload />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  hidden
                />
              </label>
            </div>
            <p className="logo-hint">Recommended: 200x200px, PNG or JPG</p>
          </div>

          {/* Team Details Section */}
          <div className="details-section">
            <div className="form-group">
              <label htmlFor="teamId">
                Team ID *
                <span className="hint">(e.g., TEA001, MUM001)</span>
              </label>
              <input
                type="text"
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                placeholder="Enter team ID"
                className={errors.teamId ? 'error' : ''}
                disabled={!!team}
              />
              {errors.teamId && <span className="error-text">{errors.teamId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="name">
                Team Name *
                <span className="hint">Full team name</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter team name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shortName">
                  Short Name *
                  <span className="hint">Max 3 letters (e.g., IND, AUS)</span>
                </label>
                <input
                  type="text"
                  id="shortName"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  placeholder="IND"
                  maxLength="3"
                  className={errors.shortName ? 'error' : ''}
                />
                {errors.shortName && <span className="error-text">{errors.shortName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="group">Group</label>
                <select
                  id="group"
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className={errors.group ? 'error' : ''}
                >
                  <option value="">Select Group</option>
                  {groups.map(group => (
                    <option key={group} value={group}>
                      Group {group}
                    </option>
                  ))}
                </select>
                {errors.group && <span className="error-text">{errors.group}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="coach">Coach Name</label>
              <input
                type="text"
                id="coach"
                name="coach"
                value={formData.coach}
                onChange={handleChange}
                placeholder="Enter coach name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="captain">Captain</label>
                <select
                  id="captain"
                  name="captain"
                  value={formData.captain}
                  onChange={handleChange}
                >
                  <option value="">Select Captain</option>
                  {players.map(player => (
                    <option key={player._id} value={player._id}>
                      {player.name} ({player.playerId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="viceCaptain">Vice Captain</label>
                <select
                  id="viceCaptain"
                  name="viceCaptain"
                  value={formData.viceCaptain}
                  onChange={handleChange}
                >
                  <option value="">Select Vice Captain</option>
                  {players.map(player => (
                    <option key={player._id} value={player._id}>
                      {player.name} ({player.playerId})
                    </option>
                  ))}
                </select>
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
                <FaSave /> {team ? 'Update Team' : 'Create Team'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamForm;