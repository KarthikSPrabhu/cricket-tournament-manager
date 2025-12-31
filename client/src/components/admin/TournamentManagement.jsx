import { useState } from 'react';
import { FaArrowLeft, FaTrophy, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import TournamentSetup from '../../components/admin/TournamentSetup';
import './TournamentManagement.css';

const TournamentManagement = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('setup');

  return (
    <div className="tournament-management">
      <div className="management-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1><FaTrophy /> Tournament Management</h1>
        <p>Configure and manage your cricket tournament setup</p>
      </div>

      <div className="management-view">
        <div className="view-tabs">
          <button 
            className={`view-tab ${activeView === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveView('setup')}
          >
            <FaCog /> Tournament Setup
          </button>
          <button 
            className={`view-tab ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <FaCog /> Advanced Settings
          </button>
        </div>

        <div className="view-content">
          {activeView === 'setup' && <TournamentSetup />}
          
          {activeView === 'settings' && (
            <div className="settings-view">
              <div className="settings-card">
                <h3>Tournament Settings</h3>
                <p>Advanced tournament configuration options will be available here.</p>
                <div className="coming-soon">
                  <FaCog className="coming-soon-icon" />
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="management-guide">
        <h3>Tournament Setup Guide</h3>
        <div className="guide-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Basic Information</h4>
              <p>Set tournament name, dates, format, and rules</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Create Groups</h4>
              <p>Organize teams into tournament groups</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Generate Fixtures</h4>
              <p>Auto-generate match schedule based on groups</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Start Tournament</h4>
              <p>Begin tournament and track live progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentManagement;