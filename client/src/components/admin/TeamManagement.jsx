import { useState } from 'react';
import { FaArrowLeft, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import TeamsList from '../../components/admin/TeamsList';
import TeamForm from '../../components/admin/TeamForm';
import './TeamManagement.css';

const TeamManagement = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedTeam(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedTeam(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedTeam(null);
  };

  return (
    <div className="team-management">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1><FaUsers /> Team Management</h1>
        <p>Create, edit, and manage tournament teams</p>
      </div>

      <div className="management-content">
        {showForm ? (
          <TeamForm
            team={selectedTeam}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <TeamsList
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        )}
      </div>

      <div className="management-guide">
        <h3>Team Management Guide</h3>
        <div className="guide-items">
          <div className="guide-item">
            <div className="guide-icon">1</div>
            <div className="guide-content">
              <h4>Create Teams</h4>
              <p>Add all participating teams with unique IDs and logos</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">2</div>
            <div className="guide-content">
              <h4>Assign Groups</h4>
              <p>Organize teams into groups (A, B, C, D) for tournament format</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">3</div>
            <div className="guide-content">
              <h4>Add Players</h4>
              <p>After creating teams, add players to each team</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">4</div>
            <div className="guide-content">
              <h4>Set Leadership</h4>
              <p>Assign captain and vice-captain for each team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;