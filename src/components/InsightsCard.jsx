import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import './InsightsCard.css';

const MOCK_DATA = [
  { name: 'Mon', violations: 120 },
  { name: 'Tue', violations: 150 },
  { name: 'Wed', violations: 110 },
  { name: 'Thu', violations: 200 },
  { name: 'Fri', violations: 180 },
  { name: 'Sat', violations: 250 },
  { name: 'Sun', violations: 300 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="ic-custom-tooltip">
        <p className="ic-tooltip-label">{label}</p>
        <p className="ic-tooltip-value">
          Violations: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function InsightsCard() {
  return (
    <div className="insights-card">
      <div className="ic-header">
        <div className="ic-icon-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <h2 className="ic-title">Real-Time Analytics</h2>
      </div>

      <div className="ic-chart-wrapper">
        <h3 className="ic-chart-title">Violations This Week</h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={MOCK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="violations" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ic-recommendations">
        <div className="ic-rec-item">
          <div className="ic-rec-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="ic-rec-text">
            <strong>High Activity Alert:</strong> Expect increased traffic violations during weekend evenings in downtown zones. Deploy additional patrol units.
          </p>
        </div>
        
        <div className="ic-rec-item">
          <div className="ic-rec-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20h.01"/>
              <path d="M7 20v-4"/>
              <path d="M12 20v-8"/>
              <path d="M17 20V8"/>
              <path d="M22 4v16"/>
            </svg>
          </div>
          <p className="ic-rec-text">
            <strong>Trend Analysis:</strong> Speeding offenses are up 15% in School Zones compared to last week.
          </p>
        </div>
      </div>
    </div>
  );
}
