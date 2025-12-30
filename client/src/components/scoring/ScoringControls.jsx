import { useState } from 'react';
import { FaCricket, FaUndo, FaRedo } from 'react-icons/fa';
import './ScoringControls.css';

const ScoringControls = ({ onScore }) => {
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  const quickActions = [
    { label: 'Dot Ball', score: { runs: 0 }, className: 'dot' },
    { label: 'Single', score: { runs: 1 }, className: 'single' },
    { label: 'Double', score: { runs: 2 }, className: 'double' },
    { label: 'Triple', score: { runs: 3 }, className: 'triple' },
    { label: 'Boundary', score: { runs: 4 }, className: 'boundary' },
    { label: 'Five', score: { runs: 5 }, className: 'five' },
    { label: 'Six', score: { runs: 6 }, className: 'six' },
    { label: 'Wide', score: { runs: 0, extras: 1, extraType: 'wide' }, className: 'wide' },
    { label: 'No Ball', score: { runs: 0, extras: 1, extraType: 'no-ball' }, className: 'no-ball' },
    { label: 'Bye', score: { runs: 0, extras: 1, extraType: 'bye' }, className: 'bye' },
    { label: 'Leg Bye', score: { runs: 0, extras: 1, extraType: 'leg-bye' }, className: 'leg-bye' }
  ];

  const wicketActions = [
    { label: 'Bowled', type: 'bowled', className: 'bowled' },
    { label: 'Caught', type: 'caught', className: 'caught' },
    { label: 'LBW', type: 'lbw', className: 'lbw' },
    { label: 'Run Out', type: 'run-out', className: 'run-out' },
    { label: 'Stumped', type: 'stumped', className: 'stumped' },
    { label: 'Hit Wicket', type: 'hit-wicket', className: 'hit-wicket' }
  ];

  const handleQuickAction = (score) => {
    setHistory(prev => [...prev, score]);
    setRedoHistory([]);
    onScore(score);
  };

  const handleWicket = (wicketType) => {
    const score = { runs: 0, wicket: true, wicketType };
    setHistory(prev => [...prev, score]);
    setRedoHistory([]);
    onScore(score);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, lastAction]);
    // Note: This would need backend support to actually undo
    alert('Undo feature requires backend implementation');
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    
    const nextAction = redoHistory[redoHistory.length - 1];
    setRedoHistory(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, nextAction]);
    onScore(nextAction);
  };

  return (
    <div className="scoring-controls">
      <div className="controls-header">
        <h3><FaCricket /> Quick Scoring</h3>
        <div className="history-controls">
          <button 
            className="btn icon-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
          >
            <FaUndo />
          </button>
          <button 
            className="btn icon-btn"
            onClick={handleRedo}
            disabled={redoHistory.length === 0}
            title="Redo"
          >
            <FaRedo />
          </button>
        </div>
      </div>

      <div className="quick-actions-grid">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className={`action-btn ${action.className}`}
            onClick={() => handleQuickAction(action.score)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="wicket-actions">
        <h4>Wicket Types</h4>
        <div className="wicket-buttons">
          {wicketActions.map((wicket, index) => (
            <button
              key={index}
              className={`wicket-btn ${wicket.className}`}
              onClick={() => handleWicket(wicket.type)}
            >
              {wicket.label}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scoring">
        <h4>Custom Score</h4>
        <div className="custom-input">
          <input
            type="number"
            min="0"
            max="6"
            placeholder="Runs"
            id="customRuns"
          />
          <select id="customExtra">
            <option value="">No Extra</option>
            <option value="wide">Wide</option>
            <option value="no-ball">No Ball</option>
            <option value="bye">Bye</option>
            <option value="leg-bye">Leg Bye</option>
          </select>
          <button 
            className="btn primary"
            onClick={() => {
              const runs = parseInt(document.getElementById('customRuns').value) || 0;
              const extraType = document.getElementById('customExtra').value;
              const score = extraType 
                ? { runs, extras: 1, extraType }
                : { runs };
              handleQuickAction(score);
              document.getElementById('customRuns').value = '';
              document.getElementById('customExtra').value = '';
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringControls;