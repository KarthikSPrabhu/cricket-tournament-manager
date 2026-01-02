import React, { useState, useEffect } from 'react';
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
  FaBolt,
  FaWifi,
  FaWifiSlash,
  FaPlay,
  FaStop,
  FaExchangeAlt,
  FaCalculator,
  FaChartLine,
  FaExclamationTriangle,
  FaCommentAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import CricketPitch from './CricketPitch';
import ScoringControls from './ScoringControls';
import Scorecard from './Scorecard';
import './ScoringDashboard.css';

const ScoringDashboard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  
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
  const [lastUpdate, setLastUpdate] = useState(null);
  const [commentary, setCommentary] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);

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

  // WebSocket setup for real-time updates
  useEffect(() => {
    if (!socket.socket || !matchId) return;

    // Join match room
    socket.joinMatchRoom(matchId);
    console.log('Joined match room via WebSocket:', matchId);

    // Listen for ball updates from other scorers
    const handleBallUpdated = (data) => {
      console.log('Received ball update via WebSocket:', data);
      if (data.matchId === matchId) {
        // Update match data if it's from another scorer
        if (data.emittedBy !== 'self') {
          updateMatchFromSocket(data);
          toast.info('Live update received!', {
            icon: '⚡',
            duration: 2000
          });
        }
        setLastUpdate(new Date());
      }
    };

    // Listen for match status updates
    const handleMatchStatusUpdated = (data) => {
      console.log('Received match status update:', data);
      if (data.matchId === matchId) {
        setMatch(prev => ({
          ...prev,
          status: data.newStatus,
          toss: data.toss
        }));
        if (data.newStatus === 'completed') {
          toast.success('Match completed!', {
            icon: '🎉',
            duration: 5000
          });
        }
      }
    };

    // Listen for match updates
    const handleMatchUpdated = (data) => {
      console.log('Received match update:', data);
      if (data.matchId === matchId) {
        // Refresh data if score differs
        fetchMatchData();
      }
    };

    // Listen for highlight events
    const handleHighlightEvent = (data) => {
      if (data.matchId === matchId) {
        showHighlightToast(data);
      }
    };

    // Add listeners
    socket.addListener('ball-updated', handleBallUpdated);
    socket.addListener('match-status-updated', handleMatchStatusUpdated);
    socket.addListener('match-updated', handleMatchUpdated);
    socket.addListener('highlight-event', handleHighlightEvent);

    // Cleanup
    return () => {
      socket.leaveMatchRoom(matchId);
      socket.removeListener('ball-updated', handleBallUpdated);
      socket.removeListener('match-status-updated', handleMatchStatusUpdated);
      socket.removeListener('match-updated', handleMatchUpdated);
      socket.removeListener('highlight-event', handleHighlightEvent);
    };
  }, [socket, matchId]);

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
        const currentInningsNum = matchData.currentInnings || 1;
        setCurrentInnings(currentInningsNum);
        
        // Load current innings data
        const innings = matchData.innings[currentInningsNum - 1];
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

  const updateMatchFromSocket = (data) => {
    setMatch(prev => {
      if (!prev) return prev;
      
      const updatedMatch = { ...prev };
      const currentInningsIndex = (updatedMatch.currentInnings || 1) - 1;
      
      if (updatedMatch.innings && updatedMatch.innings[currentInningsIndex]) {
        const updatedInnings = [...updatedMatch.innings];
        const currentInnings = { ...updatedInnings[currentInningsIndex] };
        
        // Update from socket data
        if (data.ball) {
          currentInnings.balls = [...(currentInnings.balls || []), data.ball];
        }
        
        if (data.currentScore) {
          currentInnings.currentOver = data.currentScore.currentOver || [];
          currentInnings.totalRuns = data.currentScore.runs || 0;
          currentInnings.totalWickets = data.currentScore.wickets || 0;
          currentInnings.totalOvers = data.currentScore.overs || 0;
          currentInnings.extras = data.currentScore.extras || currentInnings.extras;
        }
        
        updatedInnings[currentInningsIndex] = currentInnings;
        updatedMatch.innings = updatedInnings;
        
        // Update local state
        setCurrentOver(data.currentScore?.currentOver || []);
        setScoreHistory(currentInnings.balls || []);
      }
      
      return updatedMatch;
    });
  };

  const showHighlightToast = (data) => {
    const toastConfig = {
      duration: 4000,
      style: {
        fontWeight: 'bold',
        fontSize: '14px'
      }
    };

    switch(data.type) {
      case 'SIX':
        toast.success(`${data.type}: ${data.description}`, {
          ...toastConfig,
          icon: '🚀',
          style: { ...toastConfig.style, background: '#f39c12', color: 'white' }
        });
        break;
      case 'FOUR':
        toast.info(`${data.type}: ${data.description}`, {
          ...toastConfig,
          icon: '🎯',
          style: { ...toastConfig.style, background: '#3498db', color: 'white' }
        });
        break;
      case 'WICKET':
        toast.error(`${data.type}: ${data.description}`, {
          ...toastConfig,
          icon: '🎳',
          style: { ...toastConfig.style, background: '#e74c3c', color: 'white' }
        });
        break;
      default:
        toast(data.description, toastConfig);
    }
  };

  const autoSaveMatch = async () => {
    try {
      await api.matches.update(matchId, match);
      console.log('Auto-saved match');
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
        commentary: commentary || '',
        ...scoreData
      };

      const response = await api.matches.addBall(matchId, ballData);
      
      // Update local state
      const updatedMatch = response.match;
      setMatch(updatedMatch);
      
      const innings = updatedMatch.innings[updatedMatch.currentInnings - 1];
      setCurrentOver(innings.currentOver || []);
      setScoreHistory(innings.balls || []);
      
      // Clear commentary
      setCommentary('');
      
      // Send WebSocket event
      socket.sendEvent('score-added', {
        matchId,
        ball: ballData,
        scorerId: 'self',
        timestamp: new Date()
      });

      // Show success toast
      const runText = scoreData.runs === 0 ? 'Dot ball' : 
                     scoreData.runs === 1 ? 'Single' :
                     scoreData.runs === 2 ? 'Two runs' :
                     scoreData.runs === 3 ? 'Three runs' :
                     scoreData.runs === 4 ? 'FOUR!' :
                     scoreData.runs === 6 ? 'SIX!' : `${scoreData.runs} runs`;
      
      toast.success(`Score recorded: ${runText}`, {
        icon: '🏏',
        duration: 2000
      });
      
      // Auto-rotate strike on even runs (except extras)
      if (scoreData.runs % 2 === 0 && !scoreData.extraType) {
        rotateStrike();
      }
      
      setLastUpdate(new Date());
      
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
      
      toast.info('Strike rotated', {
        duration: 1000,
        icon: '🔄'
      });
    }
  };

  const undoLastBall = async () => {
    if (scoreHistory.length === 0) {
      toast.error('No balls to undo');
      return;
    }

    if (!window.confirm('Undo last ball? This action cannot be reversed.')) {
      return;
    }

    try {
      await api.matches.undoLastBall(matchId);
      fetchMatchData();
      toast.success('Last ball undone');
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
      
      // Send WebSocket event
      socket.sendEvent('innings-changed', {
        matchId,
        innings: 2,
        timestamp: new Date()
      });
      
      toast.success('Second innings started');
      fetchMatchData();
    } catch (error) {
      toast.error('Failed to change innings');
    }
  };

  const endMatch = async () => {
    const winner = prompt('Enter winning team name:');
    const margin = prompt('Enter win margin (e.g., "45 runs" or "5 wickets"):');
    
    if (!winner || !margin) {
      toast.error('Winner and margin are required');
      return;
    }

    if (!window.confirm(`End match? Winner: ${winner}, Margin: ${margin}`)) {
      return;
    }

    try {
      await api.matches.updateStatus(matchId, { 
        status: 'completed',
        result: { winner, margin }
      });
      
      // Send WebSocket event
      socket.sendEvent('match-ended', {
        matchId,
        winner,
        margin,
        timestamp: new Date()
      });
      
      toast.success('Match completed successfully');
      setTimeout(() => {
        navigate('/admin/matches');
      }, 2000);
    } catch (error) {
      toast.error('Failed to end match');
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
    toast.info(isLiveMode ? 'Live mode disabled' : 'Live mode enabled', {
      icon: isLiveMode ? '🔴' : '🟢'
    });
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const diff = Math.floor((new Date() - lastUpdate) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
        <button 
          className="btn primary"
          onClick={() => navigate('/admin/matches')}
        >
          Back to Matches
        </button>
      </div>
    );
  }

  const currentInningsData = match.innings?.[currentInnings - 1];
  const battingTeam = currentInningsData?.team;
  const bowlingTeam = battingTeam?._id === match.team1._id ? match.team2 : match.team1;

  const connectionStatus = socket.getConnectionStatus();

  return (
    <div className="scoring-dashboard">
      {/* Header */}
      <header className="scoring-header">
        <button 
          className="back-btn" 
          onClick={() => navigate('/admin/matches')}
        >
          <FaArrowLeft /> Back to Matches
        </button>
        
        <div className="match-info">
          <h1>
            <FaCricket /> Live Scoring
            <span className="live-badge">
              <FaBolt /> LIVE
            </span>
            {isLiveMode && (
              <span className="live-mode-badge">
                <FaPlay /> LIVE MODE
              </span>
            )}
          </h1>
          <div className="match-details">
            <div className="teams">
              <span className="team">{match.team1.name}</span>
              <span className="vs">vs</span>
              <span className="team">{match.team2.name}</span>
            </div>
            <div className="match-meta">
              <span className="venue">{match.venue}</span>
              <span className="innings">Innings {currentInnings}</span>
              <span className="format">{match.overs} overs</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="websocket-status">
            <div className={`status-indicator ${socket.isConnected() ? 'connected' : 'disconnected'}`}>
              {socket.isConnected() ? (
                <>
                  <FaWifi /> Connected
                </>
              ) : (
                <>
                  <FaWifiSlash /> Offline
                </>
              )}
            </div>
            {lastUpdate && (
              <div className="last-update">
                Updated: {formatLastUpdate()}
              </div>
            )}
          </div>
          
          <button 
            className="btn icon-btn"
            onClick={fetchMatchData}
            title="Refresh Data"
          >
            <FaSync />
          </button>
          
          <button 
            className="btn icon-btn"
            onClick={undoLastBall}
            title="Undo Last Ball"
            disabled={scoreHistory.length === 0}
          >
            <FaUndo />
          </button>
          
          <button 
            className={`btn icon-btn ${isLiveMode ? 'active' : ''}`}
            onClick={toggleLiveMode}
            title={isLiveMode ? 'Disable Live Mode' : 'Enable Live Mode'}
          >
            {isLiveMode ? <FaStop /> : <FaPlay />}
          </button>
          
          <div className="auto-save">
            <label className="auto-save-label">
              <input
                type="checkbox"
                checked={isAutoSave}
                onChange={(e) => setIsAutoSave(e.target.checked)}
                className="auto-save-checkbox"
              />
              <span>Auto-save</span>
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
                  className="player-select"
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
                {selectedBatsman && (
                  <div className="player-stats">
                    {(() => {
                      const batsmanInnings = currentInningsData?.batting?.find(
                        b => b.player?._id === selectedBatsman
                      );
                      return batsmanInnings ? (
                        <>
                          {batsmanInnings.runs || 0} runs ({batsmanInnings.balls || 0} balls)
                          {batsmanInnings.isOut && ' - OUT'}
                        </>
                      ) : 'Not yet batted';
                    })()}
                  </div>
                )}
              </div>

              <div className="selector-group">
                <label>Bowler</label>
                <select 
                  value={selectedBowler || ''}
                  onChange={(e) => setSelectedBowler(e.target.value)}
                  className="player-select"
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
                {selectedBowler && (
                  <div className="player-stats">
                    {(() => {
                      const bowlerInnings = currentInningsData?.bowling?.find(
                        b => b.player?._id === selectedBowler
                      );
                      return bowlerInnings ? (
                        <>
                          {bowlerInnings.overs?.toFixed(1) || 0} overs, {bowlerInnings.wickets || 0} wkts
                        </>
                      ) : 'Not yet bowled';
                    })()}
                  </div>
                )}
              </div>

              <div className="selector-group">
                <label>Non-Striker</label>
                <select 
                  value={selectedNonStriker || ''}
                  onChange={(e) => setSelectedNonStriker(e.target.value)}
                  className="player-select"
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

            <div className="player-actions">
              <button 
                className="btn rotate-btn"
                onClick={rotateStrike}
                disabled={!selectedBatsman || !selectedNonStriker}
              >
                <FaExchangeAlt /> Rotate Strike
              </button>
              <button 
                className="btn secondary"
                onClick={() => {
                  setSelectedBatsman(null);
                  setSelectedNonStriker(null);
                  setSelectedBowler(null);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h3><FaTachometerAlt /> Quick Actions</h3>
            <ScoringControls onScore={handleScore} />
          </div>

          <div className="panel-section">
            <h3><FaCommentAlt /> Commentary</h3>
            <textarea
              className="commentary-input"
              placeholder="Add commentary for this ball..."
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows="3"
            />
          </div>

          <div className="panel-section">
            <h3><FaHistory /> Current Over</h3>
            <div className="current-over">
              {currentOver.map((ball, index) => (
                <div 
                  key={index} 
                  className={`ball ${ball.wicket ? 'wicket' : ''} ${ball.runs === 4 ? 'four' : ball.runs === 6 ? 'six' : ''}`}
                  title={ball.extraType ? `${ball.extraType} ball` : ''}
                >
                  {ball.runs}
                  {ball.extraType && <span className="extra">*</span>}
                  {ball.wicket && <span className="wicket-symbol">W</span>}
                </div>
              ))}
              {[...Array(6 - currentOver.length)].map((_, i) => (
                <div key={`empty-${i}`} className="ball empty">•</div>
              ))}
            </div>
            <div className="over-summary">
              Over {Math.floor(scoreHistory.length / 6) + 1} of {match.overs}
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
              onRefresh={fetchMatchData}
            />
          </div>
        </div>

        {/* Right Panel - Match Controls & Info */}
        <div className="right-panel">
          <div className="panel-section">
            <h3><FaChartLine /> Match Status</h3>
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
                  {(currentInningsData?.totalOvers || 0).toFixed(1)}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Run Rate:</span>
                <span className="value">
                  {currentInningsData?.totalOvers > 0 
                    ? ((currentInningsData.totalRuns / currentInningsData.totalOvers)).toFixed(2)
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
            <h3><FaCalculator /> Required Run Rate</h3>
            <div className="required-rate">
              {currentInnings === 2 && match.innings?.[0]?.totalRuns ? (
                <>
                  <div className="rate-item">
                    <span className="label">Required:</span>
                    <span className="value">
                      {match.innings[0].totalRuns + 1 - (currentInningsData?.totalRuns || 0)} runs
                    </span>
                  </div>
                  <div className="rate-item">
                    <span className="label">From:</span>
                    <span className="value">
                      {Math.ceil((match.overs * 6) - scoreHistory.length)} balls
                    </span>
                  </div>
                  <div className="rate-item">
                    <span className="label">Required RR:</span>
                    <span className="value highlight">
                      {((match.innings[0].totalRuns + 1 - (currentInningsData?.totalRuns || 0)) / 
                        Math.max(1, (match.overs - (currentInningsData?.totalOvers || 0))) * 6).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="no-target">Batting first</div>
              )}
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
                onClick={async () => {
                  await api.matches.updateStatus(matchId, { status: 'innings-break' });
                  fetchMatchData();
                }}
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
                className="btn control-btn secondary"
                onClick={() => window.open(`/matches/${matchId}`, '_blank')}
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

          <div className="panel-section">
            <h3>Real-time Info</h3>
            <div className="realtime-info">
              <div className="info-item">
                <span className="label">WebSocket:</span>
                <span className={`value ${socket.isConnected() ? 'connected' : 'disconnected'}`}>
                  {socket.isConnected() ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Socket ID:</span>
                <span className="value socket-id">
                  {connectionStatus.socketId?.substring(0, 8) || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Last Ball:</span>
                <span className="value">
                  {scoreHistory.length > 0 
                    ? `${scoreHistory[scoreHistory.length - 1]?.runs || 0} runs`
                    : 'N/A'}
                </span>
              </div>
              {connectionStatus.reconnectAttempts > 0 && (
                <div className="info-item warning">
                  <FaExclamationTriangle />
                  <span className="label">Reconnect attempts:</span>
                  <span className="value">{connectionStatus.reconnectAttempts}</span>
                </div>
              )}
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
            <span className="value">
              {(() => {
                const last30Balls = scoreHistory.slice(-30);
                const runs = last30Balls.reduce((sum, ball) => sum + (ball.runs || 0), 0);
                return `${runs} runs`;
              })()}
            </span>
          </div>
          <div className="stat">
            <span className="label">Required Rate:</span>
            <span className="value">
              {currentInnings === 2 && match.innings?.[0]?.totalRuns
                ? ((match.innings[0].totalRuns + 1 - (currentInningsData?.totalRuns || 0)) / 
                   Math.max(1, (match.overs - (currentInningsData?.totalOvers || 0))) * 6).toFixed(2)
                : 'N/A'}
            </span>
          </div>
          <div className="stat">
            <span className="label">Powerplay:</span>
            <span className="value">
              {Math.min(currentInningsData?.totalOvers || 0, 6)}/6 overs
            </span>
          </div>
          <div className="stat">
            <span className="label">Live Mode:</span>
            <span className={`value ${isLiveMode ? 'live' : 'off'}`}>
              {isLiveMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
        <div className="footer-actions">
          <button 
            className="btn small"
            onClick={fetchMatchData}
          >
            <FaSync /> Refresh Data
          </button>
          <button 
            className="btn small secondary"
            onClick={autoSaveMatch}
          >
            <FaSave /> Save Now
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ScoringDashboard;