import { useState } from 'react';
import { FaCricket, FaUndo, FaSync } from 'react-icons/fa';
import './CricketPitch.css';

const CricketPitch = ({ onScore }) => {
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [selectedWicket, setSelectedWicket] = useState(null);

  const runOptions = [0, 1, 2, 3, 4, 5, 6];
  const extraOptions = [
    { type: 'wide', label: 'Wide', runs: 1 },
    { type: 'no-ball', label: 'No Ball', runs: 1 },
    { type: 'bye', label: 'Bye', runs: 1 },
    { type: 'leg-bye', label: 'Leg Bye', runs: 1 }
  ];
  const wicketOptions = [
    { type: 'bowled', label: 'Bowled' },
    { type: 'caught', label: 'Caught' },
    { type: 'lbw', label: 'LBW' },
    { type: 'run-out', label: 'Run Out' },
    { type: 'stumped', label: 'Stumped' },
    { type: 'hit-wicket', label: 'Hit Wicket' }
  ];

  const handleRunSelect = (runs) => {
    setSelectedRun(runs);
    setSelectedExtra(null);
    setSelectedWicket(null);
  };

  const handleExtraSelect = (extra) => {
    setSelectedExtra(extra);
    setSelectedRun(null);
    setSelectedWicket(null);
  };

  const handleWicketSelect = (wicket) => {
    setSelectedWicket(wicket);
    setSelectedRun(null);
    setSelectedExtra(null);
  };

  const handleSubmit = () => {
    if (selectedRun !== null) {
      onScore({ runs: selectedRun });
      resetSelection();
    } else if (selectedExtra) {
      onScore({ 
        runs: 0, 
        extras: selectedExtra.runs, 
        extraType: selectedExtra.type 
      });
      resetSelection();
    } else if (selectedWicket) {
      onScore({ 
        runs: 0, 
        wicket: true, 
        wicketType: selectedWicket.type 
      });
      resetSelection();
    } else {
      alert('Please select a scoring option');
    }
  };

  const resetSelection = () => {
    setSelectedRun(null);
    setSelectedExtra(null);
    setSelectedWicket(null);
  };

  const handleDotBall = () => {
    onScore({ runs: 0 });
  };

  return (
    <div className="cricket-pitch">
      <div className="pitch-header">
        <h3><FaCricket /> Cricket Pitch</h3>
        <div className="pitch-actions">
          <button className="btn small-btn" onClick={resetSelection}>
            <FaUndo /> Clear
          </button>
          <button className="btn small-btn" onClick={handleDotBall}>
            Dot Ball
          </button>
        </div>
      </div>

      <div className="pitch-container">
        {/* Pitch Visualization */}
        <div className="pitch-visualization">
          <div className="pitch-rectangle">
            <div className="crease crease-top"></div>
            <div className="crease crease-bottom"></div>
            <div className="stumps stumps-top"></div>
            <div className="stumps stumps-bottom"></div>
            <div className="pitch-markings">
              <div className="good-length"></div>
              <div className="yorker-length"></div>
              <div className="full-length"></div>
            </div>
          </div>

          {/* Fielding Positions */}
          <div className="fielding-positions">
            <div className="position slip" title="Slip">SL</div>
            <div className="position gully" title="Gully">GL</div>
            <div className="position point" title="Point">PT</div>
            <div className="position cover" title="Cover">CV</div>
            <div className="position mid-off" title="Mid Off">MO</div>
            <div className="position mid-on" title="Mid On">MN</div>
            <div className="position mid-wicket" title="Mid Wicket">MW</div>
            <div className="position square-leg" title="Square Leg">SL</div>
            <div className="position fine-leg" title="Fine Leg">FL</div>
            <div className="position third-man" title="Third Man">TM</div>
          </div>
        </div>

        {/* Scoring Controls */}
        <div className="scoring-controls">
          {/* Runs */}
          <div className="control-section">
            <h4>Runs</h4>
            <div className="run-buttons">
              {runOptions.map(run => (
                <button
                  key={run}
                  className={`run-btn ${selectedRun === run ? 'selected' : ''}`}
                  onClick={() => handleRunSelect(run)}
                >
                  {run}
                </button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div className="control-section">
            <h4>Extras</h4>
            <div className="extra-buttons">
              {extraOptions.map(extra => (
                <button
                  key={extra.type}
                  className={`extra-btn ${selectedExtra?.type === extra.type ? 'selected' : ''}`}
                  onClick={() => handleExtraSelect(extra)}
                >
                  {extra.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wickets */}
          <div className="control-section">
            <h4>Wickets</h4>
            <div className="wicket-buttons">
              {wicketOptions.map(wicket => (
                <button
                  key={wicket.type}
                  className={`wicket-btn ${selectedWicket?.type === wicket.type ? 'selected' : ''}`}
                  onClick={() => handleWicketSelect(wicket)}
                >
                  {wicket.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button 
              className="btn primary submit-btn"
              onClick={handleSubmit}
              disabled={!selectedRun && !selectedExtra && !selectedWicket}
            >
              Record Ball
            </button>
            
            <div className="selected-info">
              {selectedRun !== null && (
                <span>Selected: {selectedRun} run(s)</span>
              )}
              {selectedExtra && (
                <span>Selected: {selectedExtra.label} (+{selectedExtra.runs})</span>
              )}
              {selectedWicket && (
                <span>Selected: {selectedWicket.label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="btn quick-btn"
          onClick={() => onScore({ runs: 1 })}
        >
          Single (1)
        </button>
        <button 
          className="btn quick-btn"
          onClick={() => onScore({ runs: 2 })}
        >
          Double (2)
        </button>
        <button 
          className="btn quick-btn"
          onClick={() => onScore({ runs: 4 })}
        >
          Boundary (4)
        </button>
        <button 
          className="btn quick-btn"
          onClick={() => onScore({ runs: 6 })}
        >
          Six (6)
        </button>
        <button 
          className="btn quick-btn warning"
          onClick={() => onScore({ runs: 0, extras: 1, extraType: 'wide' })}
        >
          Wide
        </button>
        <button 
          className="btn quick-btn danger"
          onClick={() => onScore({ runs: 0, wicket: true, wicketType: 'bowled' })}
        >
          Wicket
        </button>
      </div>
    </div>
  );
};

export default CricketPitch;