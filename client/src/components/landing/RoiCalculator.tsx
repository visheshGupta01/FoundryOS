import React, { useState } from 'react';

export const RoiCalculator: React.FC = () => {
  const [teamSize, setTeamSize] = useState<number>(3);
  const [agencySpend, setAgencySpend] = useState<number>(4500);
  const [promptHoursWeekly, setPromptHoursWeekly] = useState<number>(12);

  // Dynamic calculations
  const annualAgencySavings = agencySpend * 12;
  const annualHoursSaved = promptHoursWeekly * 50 * teamSize;
  const productivityDollarValue = annualHoursSaved * 75;
  const totalValueGenerated = annualAgencySavings + productivityDollarValue;

  return (
    <div className="roi-card" id="roi">
      {/* Interactive Controls */}
      <div className="roi-controls">
        <div className="roi-control-group">
          <div className="roi-label-row">
            <span className="roi-label">Core Team Size</span>
            <span className="roi-val">{teamSize} {teamSize === 1 ? 'Founder' : 'Members'}</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={teamSize}
            onChange={e => setTeamSize(Number(e.target.value))}
            className="roi-slider"
          />
        </div>

        <div className="roi-control-group">
          <div className="roi-label-row">
            <span className="roi-label">Current Monthly Agency / Tool Spend</span>
            <span className="roi-val">${agencySpend.toLocaleString()}/mo</span>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="500"
            value={agencySpend}
            onChange={e => setAgencySpend(Number(e.target.value))}
            className="roi-slider"
          />
        </div>

        <div className="roi-control-group">
          <div className="roi-label-row">
            <span className="roi-label">Weekly Hours Re-Prompting Disconnected AI</span>
            <span className="roi-val">{promptHoursWeekly} hrs/wk</span>
          </div>
          <input
            type="range"
            min="2"
            max="30"
            value={promptHoursWeekly}
            onChange={e => setPromptHoursWeekly(Number(e.target.value))}
            className="roi-slider"
          />
        </div>
      </div>

      {/* Dynamic Results Card */}
      <div className="roi-results">
        <div className="roi-stat-box">
          <span className="roi-stat-title">Estimated Annual Value Unlocked</span>
          <span className="roi-stat-big" style={{ color: 'var(--text-primary)' }}>
            ${totalValueGenerated.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="roi-stat-box">
            <span className="roi-stat-title">Annual Founder Hours Saved</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {annualHoursSaved.toLocaleString()} hrs
            </span>
          </div>

          <div className="roi-stat-box">
            <span className="roi-stat-title">Context Retention Score</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              100% Persistent
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '12px' }}>
          * Calculated based on 50 work weeks per year and zero prompt re-entry with FoundryOS Company Brain.
        </div>
      </div>
    </div>
  );
};
