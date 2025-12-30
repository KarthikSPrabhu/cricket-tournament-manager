import { useState } from 'react';
import { FaUser, FaCricket, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './Scorecard.css';

const Scorecard = ({ match, currentInnings, scoreHistory }) => {
  const [sortField, setSortField] = useState('runs');
  const [sortDirection, setSortDirection] = useState('desc');

  const innings = match.innings?.[currentInnings - 1];
  if (!innings) return null;

  const battingTeam = innings.team;
  const bowlingTeam = battingTeam._id === match.team1._id ? match.team2 : match.team1;

  const battingStats = innings.batting || [];
  const bowlingStats = innings.bowling || [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedBatting = [...battingStats].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'runs') {
      comparison = b.runs - a.runs;
    } else if (sortField === 'balls') {
      comparison = b.balls - a.balls;
    } else if (sortField === 'strikeRate') {
      comparison = b.strikeRate - a.strikeRate;
    }
    
    return sortDirection === 'desc' ? comparison : -comparison;
  });

  return (
    <div className="scorecard">
      <div className="scorecard-header">
        <h3>
          <FaCricket /> Live Scorecard
          <span className="innings-tag">Innings {currentInnings}</span>
        </h3>
        <div className="score-summary">
          <div className="total-score">
            {innings.totalRuns || 0}/{innings.totalWickets || 0}
          </div>
          <div className="overs">
            Overs: {innings.totalOvers || 0}.{innings.currentOver?.length || 0}
          </div>
          <div className="run-rate">
            RR: {innings.totalOvers > 0 
              ? (innings.totalRuns / innings.totalOvers).toFixed(2)
              : '0.00'}
          </div>
        </div>
      </div>

      <div className="scorecard-content">
        {/* Batting Section */}
        <div className="batting-section">
          <h4>
            Batting: {battingTeam.name}
            <span className="team-score">{innings.totalRuns || 0}/{innings.totalWickets || 0}</span>
          </h4>
          
          <table className="batting-table">
            <thead>
              <tr>
                <th>Batsman</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('runs')}
                >
                  Runs {getSortIcon('runs')}
                </th>
                <th>Balls</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedBatting.map((batsman, index) => (
                <tr key={index} className={batsman.isBatting ? 'batting' : ''}>
                  <td className="player-cell">
                    <div className="player-info">
                      <FaUser className="player-icon" />
                      <div>
                        <div className="player-name">
                          {batsman.player?.name || `Player ${index + 1}`}
                          {batsman.isBatting && <span className="batting-indicator">*</span>}
                        </div>
                        <div className="player-detail">
                          {batsman.outMethod || 'Not Out'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="runs">{batsman.runs || 0}</td>
                  <td>{batsman.balls || 0}</td>
                  <td>{batsman.fours || 0}</td>
                  <td>{batsman.sixes || 0}</td>
                  <td>{batsman.strikeRate || '0.00'}</td>
                  <td>
                    {batsman.isOut ? (
                      <span className="out">Out</span>
                    ) : batsman.isBatting ? (
                      <span className="batting">Batting</span>
                    ) : (
                      <span className="yet-to-bat">Yet to Bat</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bowling Section */}
        <div className="bowling-section">
          <h4>Bowling: {bowlingTeam.name}</h4>
          
          <table className="bowling-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>Overs</th>
                <th>Maidens</th>
                <th>Runs</th>
                <th>Wickets</th>
                <th>Econ</th>
                <th>Wides</th>
                <th>No Balls</th>
              </tr>
            </thead>
            <tbody>
              {bowlingStats.map((bowler, index) => (
                <tr key={index}>
                  <td className="player-cell">
                    <div className="player-info">
                      <FaUser className="player-icon" />
                      <div className="player-name">
                        {bowler.player?.name || `Bowler ${index + 1}`}
                      </div>
                    </div>
                  </td>
                  <td>{bowler.overs?.toFixed(1) || '0.0'}</td>
                  <td>{bowler.maidens || 0}</td>
                  <td>{bowler.runs || 0}</td>
                  <td className="wickets">{bowler.wickets || 0}</td>
                  <td>{bowler.economy || '0.00'}</td>
                  <td>{bowler.wides || 0}</td>
                  <td>{bowler.noBalls || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras & Partnership */}
        <div className="stats-section">
          <div className="stats-row">
            <div className="stat-box">
              <h5>Extras</h5>
              <div className="extras-breakdown">
                <div className="extra-item">
                  <span className="label">Wides:</span>
                  <span className="value">{innings.extras?.wides || 0}</span>
                </div>
                <div className="extra-item">
                  <span className="label">No Balls:</span>
                  <span className="value">{innings.extras?.noBalls || 0}</span>
                </div>
                <div className="extra-item">
                  <span className="label">Byes:</span>
                  <span className="value">{innings.extras?.byes || 0}</span>
                </div>
                <div className="extra-item">
                  <span className="label">Leg Byes:</span>
                  <span className="value">{innings.extras?.legByes || 0}</span>
                </div>
                <div className="extra-item total">
                  <span className="label">Total:</span>
                  <span className="value">
                    {(innings.extras?.wides || 0) +
                     (innings.extras?.noBalls || 0) +
                     (innings.extras?.byes || 0) +
                     (innings.extras?.legByes || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-box">
              <h5>Current Partnership</h5>
              <div className="partnership">
                <div className="partnership-runs">24 runs</div>
                <div className="partnership-balls">18 balls</div>
                <div className="partnership-players">
                  <div className="player">Player A</div>
                  <div className="player">Player B</div>
                </div>
              </div>
            </div>

            <div className="stat-box">
              <h5>Fall of Wickets</h5>
              <div className="fall-of-wickets">
                {innings.batting
                  ?.filter(b => b.isOut)
                  .map((batsman, index) => (
                    <div key={index} className="wicket-fall">
                      <span className="score">{batsman.runs || 0}/{index + 1}</span>
                      <span className="player">{batsman.player?.name || `Player ${index + 1}`}</span>
                    </div>
                  ))}
                {innings.batting?.filter(b => b.isOut).length === 0 && (
                  <div className="no-wickets">No wickets fallen</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Balls */}
        <div className="recent-balls">
          <h5>Recent Balls</h5>
          <div className="balls-timeline">
            {scoreHistory.slice(-12).map((ball, index) => (
              <div key={index} className="ball-item">
                <div className="ball-over">
                  {ball.overNumber}.{ball.ballNumber}
                </div>
                <div className={`ball-result ${ball.wicket ? 'wicket' : ''}`}>
                  {ball.runs}{ball.extras > 0 ? `+${ball.extras}` : ''}
                  {ball.wicket && 'W'}
                </div>
                <div className="ball-details">
                  {ball.batsman?.name?.split(' ')[0]} to {ball.bowler?.name?.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scorecard;