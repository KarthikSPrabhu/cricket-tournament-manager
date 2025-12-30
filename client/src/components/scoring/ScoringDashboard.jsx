import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaCricket, 
  FaArrowLeft, 
  FaSync, 
  FaUndo, 
  FaSave,
  FaUsers,
  FaUser,
  FaTachometerAlt,
  FaHistory,
  FaBolt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import CricketPitch from './CricketPitch';
import ScoringControls from './ScoringControls';
import Scorecard from './Scorecard';
import './ScoringDashboard.css';

const ScoringDashboard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [selectedBatsman, setSelectedBatsman] = useState(null);
  const [selectedBowler, setSelectedBowler] = useState(null);
  const [selectedNonStriker, setSelectedNonStriker] = useState(null);
  const [currentOver, setCurrentOver] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isAutoSave, setIsAutoSave] = useState(true);

  useEffect(() => {
    fetchMatchData();
    
    // Auto-save interval
    const saveInterval = setInterval(() => {
      if (isAutoSave && match) {
        autoSaveMatch();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [matchId, isAutoSave]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const matchData = await api.matches.getById(matchId);
      setMatch(matchData);
      
      // Load players from both teams
      const team1Players = await api.teams.getPlayers(matchData.team1._id);
      const team2Players = await api.teams.getPlayers(matchData.team2._id);
      setPlayers([...team1Players, ...team2Players]);
      
      // Set current innings
      if (matchData.innings && matchData.innings.length > 0) {
        setCurrentInnings(matchData.currentInnings || 1);
        
        // Load current innings data
        const innings = matchData.innings[matchData.currentInnings - 1];
        if (innings) {
          setCurrentOver(innings.currentOver || []);
          setScoreHistory(innings.balls || []);
          
          // Set current batsmen and bowler
          const battingPlayers = innings.batting?.filter(p => p.isBatting) || [];
          if (battingPlayers.length > 0) {
            setSelectedBatsman(battingPlayers[0]?.player?._id);
            setSelectedNonStriker(battingPlayers[1]?.player?._id);
          }
          
          if (innings.bowling && innings.bowling.length > 0) {
            setSelectedBowler(innings.bowling[innings.bowling.length - 1]?.player?._id);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load match data');
      console.error('Fetch match error:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSaveMatch = async () => {
    try {
      // Save match state
      await api.matches.update(matchId, match);
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleScore = async (scoreData) => {
    if (!selectedBatsman || !selectedBowler) {
      toast.error('Please select batsman and bowler');
      return;
    }

    try {
      const ballData = {
        overNumber: Math.floor(scoreHistory.length / 6) + 1,
        ballNumber: (scoreHistory.length % 6) + 1,
        bowlerId: selectedBowler,
        batsmanId: selectedBatsman,
        nonStrikerId: selectedNonStriker,
        ...scoreData
      };

      const response = await api.matches.addBall(matchId, ballData);
      
      // Update local state
      const updatedMatch = response.match;
      setMatch(updatedMatch);
      
      const innings = updatedMatch.innings[updatedMatch.currentInnings - 1];
      setCurrentOver(innings.currentOver || []);
      setScoreHistory(innings.balls || []);
      
      toast.success('Score recorded successfully!');
      
      // Auto-rotate strike on even runs (except extras)
      if (scoreData.runs % 2 === 0 && !scoreData.extraType) {
        rotateStrike();
      }
      
    } catch (error) {
      toast.error('Failed to record score');
      console.error('Score error:', error);
    }
  };

  const rotateStrike = () => {
    if (selectedBatsman && selectedNonStriker) {
      const temp = selectedBatsman;
      setSelectedBatsman(selectedNonStriker);
      setSelectedNonStriker(temp);
    }
  };

  const undoLastBall = async () => {
    if (scoreHistory.length === 0) {
      toast.error('No balls to undo');
      return;
    }

    if (!window.confirm('Undo last ball?')) {
      return;
    }

    try {
      // This would require a backend endpoint to undo last ball
      toast.error('Undo feature coming soon');
    } catch (error) {
      toast.error('Failed to undo last ball');
    }
  };

  const changeInnings = async () => {
    if (!window.confirm('Start second innings?')) {
      return;
    }

    try {
      await api.matches.updateStatus(matchId, { 
        status: 'live',
        currentInnings: 2 
      });
      toast.success('Second innings started');
      fetchMatchData();
    } catch (error) {
      toast.error('Failed to change innings');
    }
  };

  const endMatch = async () => {
    if (!window.confirm('End match and record result?')) {
      return;
    }

    try {
      await api.matches.updateStatus(matchId, { status: 'completed' });
      toast.success('Match completed successfully');
      navigate('/admin/matches');
    } catch (error) {
      toast.error('Failed to end match');
    }
  };

  if (loading) {
    return (
      <div className="scoring-loading">
        <div className="spinner"></div>
        <p>Loading scoring interface...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="no-match">
        <h2>Match not found</h2>
        <button onClick={() => navigate('/admin/matches')}>
          Back to Matches
        </button>
      </div>
    );
  }

  const currentInningsData = match.innings?.[currentInnings - 1];
  const battingTeam = currentInningsData?.team;
  const bowlingTeam = battingTeam?._id === match.team1._id ? match.team2 : match.team1;

  return (
    <div className="scoring-dashboard">
      {/* Header */}
      <header className="scoring-header">
        <button className="back-btn" onClick={() => navigate('/admin/matches')}>
          <FaArrowLeft /> Back to Matches
        </button>
        
        <div className="match-info">
          <h1>
            <FaCricket /> Live Scoring
            <span className="live-badge">
              <FaBolt /> LIVE
            </span>
          </h1>
          <div className="match-details">
            <div className="teams">
              <span className="team">{match.team1.name}</span>
              <span className="vs">vs</span>
              <span className="team">{match.team2.name}</span>
            </div>
            <div className="match-meta">
              <span className="venue">{match.venue}</span>
              <span className="innings">Innings {currentIninnings}</span>
              <span className="format">{match.overs} overs</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn icon-btn"
            onClick={fetchMatchData}
            title="Refresh"
          >
            <FaSync />
          </button>
          <button 
            className="btn icon-btn"
            onClick={undoLastBall}
            title="Undo Last Ball"
          >
            <FaUndo />
          </button>
          <div className="auto-save">
            <label>
              <input
                type="checkbox"
                checked={isAutoSave}
                onChange={(e) => setIsAutoSave(e.target.checked)}
              />
              Auto-save
            </label>
          </div>
        </div>
      </header>

      <div className="scoring-layout">
        {/* Left Panel - Player Selection & Controls */}
        <div className="left-panel">
          <div className="panel-section">
            <h3><FaUsers /> Player Selection</h3>
            
            <div className="player-selector">
              <div className="selector-group">
                <label>Batsman (Striker)</label>
                <select 
                  value={selectedBatsman || ''}
                  onChange={(e) => setSelectedBatsman(e.target.value)}
                >
                  <option value="">Select Batsman</option>
                  {players
                    .filter(p => p.team?._id === battingTeam?._id)
                    .map(player => (
                      <option key={player._id} value={player._id}>
                        {player.name} ({player.playerId})
                      </option>
                    ))}
                </select>
              </div>

              <div className="selector-group">
                <label>Bowler</label>
                <select 
                  value={selectedBowler || ''}
                  onChange={(e) => setSelectedBowler(e.target.value)}
                >
                  <option value="">Select Bowler</option>
                  {players
                    .filter(p => p.team?._id === bowlingTeam?._id)
                    .map(player => (
                      <option key={player._id} value={player._id}>
                        {player.name} ({player.playerId})
                      </option>
                    ))}
                </select>
              </div>

              <div className="selector-group">
                <label>Non-Striker</label>
                <select 
                  value={selectedNonStriker || ''}
                  onChange={(e) => setSelectedNonStriker(e.target.value)}
                >
                  <option value="">Select Non-Striker</option>
                  {players
                    .filter(p => p.team?._id === battingTeam?._id && p._id !== selectedBatsman)
                    .map(player => (
                      <option key={player._id} value={player._id}>
                        {player.name} ({player.playerId})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <button 
              className="btn rotate-btn"
              onClick={rotateStrike}
              disabled={!selectedBatsman || !selectedNonStriker}
            >
              Rotate Strike
            </button>
          </div>

          <div className="panel-section">
            <h3><FaTachometerAlt /> Quick Actions</h3>
            <ScoringControls onScore={handleScore} />
          </div>

          <div className="panel-section">
            <h3><FaHistory /> Current Over</h3>
            <div className="current-over">
              {currentOver.map((ball, index) => (
                <div key={index} className="ball">
                  {ball.runs}{ball.extraType ? `(${ball.extraType})` : ''}
                  {ball.wicket && 'W'}
                </div>
              ))}
              {[...Array(6 - currentOver.length)].map((_, i) => (
                <div key={`empty-${i}`} className="ball empty">•</div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Cricket Pitch & Scorecard */}
        <div className="center-panel">
          <div className="pitch-container">
            <CricketPitch onScore={handleScore} />
          </div>
          
          <div className="scorecard-container">
            <Scorecard 
              match={match}
              currentInnings={currentInnings}
              scoreHistory={scoreHistory}
            />
          </div>
        </div>

        {/* Right Panel - Match Controls & Info */}
        <div className="right-panel">
          <div className="panel-section">
            <h3>Match Status</h3>
            <div className="match-status">
              <div className="status-item">
                <span className="label">Score:</span>
                <span className="value">
                  {currentInningsData?.totalRuns || 0}/
                  {currentInningsData?.totalWickets || 0}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Overs:</span>
                <span className="value">
                  {currentInningsData?.totalOvers || 0}.{currentOver.length}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Run Rate:</span>
                <span className="value">
                  {currentInningsData?.totalOvers > 0 
                    ? (currentInningsData.totalRuns / currentInningsData.totalOvers).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Target:</span>
                <span className="value">
                  {currentInnings === 2 && match.innings?.[0]?.totalRuns
                    ? match.innings[0].totalRuns + 1
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Match Controls</h3>
            <div className="match-controls">
              <button 
                className="btn control-btn primary"
                onClick={changeInnings}
                disabled={currentInnings === 2 || !currentInningsData?.completed}
              >
                Start 2nd Innings
              </button>
              
              <button 
                className="btn control-btn warning"
                onClick={() => api.matches.updateStatus(matchId, { status: 'innings-break' })}
                disabled={match.status === 'innings-break'}
              >
                Innings Break
              </button>
              
              <button 
                className="btn control-btn danger"
                onClick={endMatch}
              >
                End Match
              </button>
              
              <button 
                className="btn control-btn"
                onClick={() => navigate(`/matches/${matchId}`)}
              >
                View Public Scorecard
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h3>Extras Summary</h3>
            <div className="extras-summary">
              <div className="extra-item">
                <span className="label">Wides:</span>
                <span className="value">{currentInningsData?.extras?.wides || 0}</span>
              </div>
              <div className="extra-item">
                <span className="label">No Balls:</span>
                <span className="value">{currentInningsData?.extras?.noBalls || 0}</span>
              </div>
              <div className="extra-item">
                <span className="label">Byes:</span>
                <span className="value">{currentInningsData?.extras?.byes || 0}</span>
              </div>
              <div className="extra-item">
                <span className="label">Leg Byes:</span>
                <span className="value">{currentInningsData?.extras?.legByes || 0}</span>
              </div>
              <div className="extra-item total">
                <span className="label">Total Extras:</span>
                <span className="value">
                  {(currentInningsData?.extras?.wides || 0) +
                   (currentInningsData?.extras?.noBalls || 0) +
                   (currentInningsData?.extras?.byes || 0) +
                   (currentInningsData?.extras?.legByes || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with quick stats */}
      <footer className="scoring-footer">
        <div className="footer-stats">
          <div className="stat">
            <span className="label">Balls Bowled:</span>
            <span className="value">{scoreHistory.length}</span>
          </div>
          <div className="stat">
            <span className="label">Last 5 Overs:</span>
            <span className="value">24 runs</span>
          </div>
          <div className="stat">
            <span className="label">Required Rate:</span>
            <span className="value">
              {currentInnings === 2 && match.innings?.[0]?.totalRuns
                ? ((match.innings[0].totalRuns + 1 - (currentInningsData?.totalRuns || 0)) / 
                   ((match.overs * 6) - scoreHistory.length) * 6).toFixed(2)
                : 'N/A'}
            </span>
          </div>
          <div className="stat">
            <span className="label">Powerplay:</span>
            <span className="value">
              {currentInningsData?.powerplayOvers || 0}/6 overs
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ScoringDashboard;