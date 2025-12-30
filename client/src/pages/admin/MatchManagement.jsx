import { useState } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaCricket } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import MatchesList from '../../components/admin/MatchesList';
import MatchForm from '../../components/admin/MatchForm';
import './MatchManagement.css';

const MatchManagement = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleEdit = (match) => {
    setSelectedMatch(match);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedMatch(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedMatch(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedMatch(null);
  };

  const handleStartScoring = (match) => {
    // Navigate to scoring interface
    navigate(`/admin/scoring/${match._id}`);
  };

  return (
    <div className="match-management">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1><FaCalendarAlt /> Match Management</h1>
        <p>Schedule, manage, and score tournament matches</p>
      </div>

      <div className="management-content">
        {showForm ? (
          <MatchForm
            match={selectedMatch}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <MatchesList
            onEdit={handleEdit}
            onCreate={handleCreate}
            onStartScoring={handleStartScoring}
          />
        )}
      </div>

      <div className="management-guide">
        <h3>Match Management Guide</h3>
        <div className="guide-items">
          <div className="guide-item">
            <div className="guide-icon">1</div>
            <div className="guide-content">
              <h4>Schedule Match</h4>
              <p>Select teams, set venue, date, and match format</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">2</div>
            <div className="guide-content">
              <h4>Start Toss</h4>
              <p>Update match status to toss and record toss results</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">3</div>
            <div className="guide-content">
              <h4>Begin Match</h4>
              <p>Start live scoring and track ball-by-ball updates</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-icon">4</div>
            <div className="guide-content">
              <h4>Complete Match</h4>
              <p>Record final result and update team statistics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchManagement;