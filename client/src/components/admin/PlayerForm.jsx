import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload, FaUser, FaCricket } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './PlayerForm.css';

const PlayerForm = ({ player, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    playerId: '',
    name: '',
    teamId: '',
    age: '',
    phoneNumber: '',
    email: '',
    playingRole: 'batsman',
    battingStyle: '',
    bowlingStyle: '',
    photo: '',
    isCaptain: false,
    isViceCaptain: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [battingStyles, setBattingStyles] = useState([]);
  const [bowlingStyles, setBowlingStyles] = useState([]);

  const playingRoles = [
    { value: 'batsman', label: 'Batsman' },
    { value: 'bowler', label: 'Bowler' },
    { value: 'all-rounder', label: 'All-Rounder' },
    { value: 'wicket-keeper', label: 'Wicket Keeper' },
    { value: 'wicket-keeper-batsman', label: 'Wicket Keeper Batsman' }
  ];

  useEffect(() => {
    fetchTeams();
    if (player) {
      setFormData({
        playerId: player.playerId || '',
        name: player.name || '',
        teamId: player.team?._id || '',
        age: player.age || '',
        phoneNumber: player.phoneNumber || '',
        email: player.email || '',
        playingRole: player.playingRole || 'batsman',
        battingStyle: player.battingStyle || '',
        bowlingStyle: player.bowlingStyle || '',
        photo: player.photo || '',
        isCaptain: player.isCaptain || false,
        isViceCaptain: player.isViceCaptain || false
      });
    }
  }, [player]);

  useEffect(() => {
    // Update styles based on playing role
    if (formData.playingRole === 'batsman' || 
        formData.playingRole === 'wicket-keeper-batsman' ||
        formData.playingRole === 'all-rounder') {
      setBattingStyles([
        { value: 'right-hand', label: 'Right Hand Batsman' },
        { value: 'left-hand', label: 'Left Hand Batsman' }
      ]);
    } else {
      setBattingStyles([]);
      setFormData(prev => ({ ...prev, battingStyle: '' }));
    }

    if (formData.playingRole === 'bowler' || 
        formData.playingRole === 'all-rounder') {
      setBowlingStyles([
        { value: 'right-arm fast', label: 'Right Arm Fast' },
        { value: 'right-arm medium', label: 'Right Arm Medium' },
        { value: 'right-arm spin', label: 'Right Arm Spin' },
        { value: 'left-arm fast', label: 'Left Arm Fast' },
        { value: 'left-arm medium', label: 'Left Arm Medium' },
        { value: 'left-arm spin', label: 'Left Arm Spin' }
      ]);
    } else {
      setBowlingStyles([]);
      setFormData(prev => ({ ...prev, bowlingStyle: '' }));
    }
  }, [formData.playingRole]);

  const fetchTeams = async () => {
    try {
      const data = await api.teams.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Fetch teams error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.playerId.trim()) {
      newErrors.playerId = 'Player ID is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.playerId)) {
      newErrors.playerId = 'Player ID should contain only uppercase letters and numbers';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }
    
    if (!formData.teamId) {
      newErrors.teamId = 'Team is required';
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 16 || formData.age > 50) {
      newErrors.age = 'Age must be between 16 and 50';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9+\-\s]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (!formData.playingRole) {
      newErrors.playingRole = 'Playing role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'playerId' ? value.toUpperCase() : value)
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In production, upload to cloud storage like Cloudinary
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
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
      if (player) {
        // Update existing player
        await api.players.update(player._id, formData);
        toast.success('Player updated successfully');
      } else {
        // Create new player
        await api.players.create(formData);
        toast.success('Player created successfully');
      }
      
      onSave();
    } catch (error) {
      toast.error(error.message || 'Failed to save player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-form">
      <div className="form-header">
        <h2>
          <FaUser /> {player ? 'Edit Player' : 'Add New Player'}
        </h2>
        <button className="btn icon-btn" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Player Photo Section */}
          <div className="photo-section">
            <div className="photo-upload">
              {formData.photo ? (
                <img src={formData.photo} alt="Player" className="player-photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <FaUser />
                  <span>Upload Photo</span>
                </div>
              )}
              <label className="upload-btn">
                <FaUpload />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  hidden
                />
              </label>
            </div>
            <p className="photo-hint">Recommended: 200x200px, PNG or JPG</p>
            
            <div className="captain-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isCaptain"
                  checked={formData.isCaptain}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Team Captain
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isViceCaptain"
                  checked={formData.isViceCaptain}
                  onChange={handleChange}
                  disabled={formData.isCaptain}
                />
                <span className="checkmark"></span>
                Vice Captain
              </label>
            </div>
          </div>

          {/* Player Details Section */}
          <div className="details-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="playerId">
                  Player ID *
                  <span className="hint">Unique identifier</span>
                </label>
                <input
                  type="text"
                  id="playerId"
                  name="playerId"
                  value={formData.playerId}
                  onChange={handleChange}
                  placeholder="PLAY001"
                  className={errors.playerId ? 'error' : ''}
                  disabled={!!player}
                />
                {errors.playerId && <span className="error-text">{errors.playerId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  Full Name *
                  <span className="hint">Player's full name</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter player name"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="teamId">
                  Team *
                  <span className="hint">Select player's team</span>
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  className={errors.teamId ? 'error' : ''}
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.teamId})
                    </option>
                  ))}
                </select>
                {errors.teamId && <span className="error-text">{errors.teamId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="age">
                  Age *
                  <span className="hint">Between 16-50 years</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="16"
                  max="50"
                  placeholder="25"
                  className={errors.age ? 'error' : ''}
                />
                {errors.age && <span className="error-text">{errors.age}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">
                  Phone Number *
                  <span className="hint">Contact number</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className={errors.phoneNumber ? 'error' : ''}
                />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email *
                  <span className="hint">Valid email address</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="player@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="playingRole">
                  Playing Role *
                  <span className="hint">Primary role in team</span>
                </label>
                <select
                  id="playingRole"
                  name="playingRole"
                  value={formData.playingRole}
                  onChange={handleChange}
                  className={errors.playingRole ? 'error' : ''}
                >
                  {playingRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.playingRole && <span className="error-text">{errors.playingRole}</span>}
              </div>
            </div>

            {(battingStyles.length > 0 || bowlingStyles.length > 0) && (
              <div className="form-row">
                {battingStyles.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="battingStyle">
                      Batting Style
                      <span className="hint">Preferred batting hand</span>
                    </label>
                    <select
                      id="battingStyle"
                      name="battingStyle"
                      value={formData.battingStyle}
                      onChange={handleChange}
                    >
                      <option value="">Select Batting Style</option>
                      {battingStyles.map(style => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bowlingStyles.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="bowlingStyle">
                      Bowling Style
                      <span className="hint">Bowling arm and type</span>
                    </label>
                    <select
                      id="bowlingStyle"
                      name="bowlingStyle"
                      value={formData.bowlingStyle}
                      onChange={handleChange}
                    >
                      <option value="">Select Bowling Style</option>
                      {bowlingStyles.map(style => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="playingRole">
                Player Description
                <span className="hint">Role summary based on selections</span>
              </label>
              <div className="role-summary">
                <FaCricket />
                <span>
                  {formData.playingRole && (
                    <strong>{playingRoles.find(r => r.value === formData.playingRole)?.label}</strong>
                  )}
                  {formData.battingStyle && ` | ${formData.battingStyle}`}
                  {formData.bowlingStyle && ` | ${formData.bowlingStyle}`}
                  {formData.isCaptain && ' (Captain)'}
                  {formData.isViceCaptain && ' (Vice Captain)'}
                </span>
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
                <FaSave /> {player ? 'Update Player' : 'Add Player'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerForm;