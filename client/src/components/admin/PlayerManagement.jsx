import { useState } from 'react';
import { FaArrowLeft, FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PlayersList from '../../components/admin/PlayersList';
import PlayerForm from '../../components/admin/PlayerForm';
import './PlayerManagement.css';

const PlayerManagement = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleEdit = (player) => {
    setSelectedPlayer(player);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedPlayer(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedPlayer(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="player-management">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1><FaUserFriends /> Player Management</h1>
        <p>Add, edit, and manage tournament players</p>
      </div>

      <div className="management-content">
        {showForm ? (
          <PlayerForm
            player={selectedPlayer}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <PlayersList
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        )}
      </div>

      <div className="management-guide">
        <h3>Player Management Guide</h3>
        <div className="guide-items">
          <div className="guide-item">
            <div className="guide-icon">1</div>
            <div className="guide-content">
              <h4>Basic Information</h4>
              <p>Fill in player details: name, age, contact information</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">2</div>
            <div className="guide-content">
              <h4>Assign Team</h4>
              <p>Select which team the player belongs to</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">3</div>
            <div className="guide-content">
              <h4>Playing Role</h4>
              <p>Specify if batsman, bowler, all-rounder, or wicket-keeper</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">4</div>
            <div className="guide-content">
              <h4>Styles & Skills</h4>
              <p>Add batting/bowling styles and leadership roles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;