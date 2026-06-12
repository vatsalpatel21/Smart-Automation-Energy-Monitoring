import React from 'react';
import EnergyLineChart from './EnergyLineChart';
import WeeklyBarChart from './WeeklyBarChart';

function formatTimestamp(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return ts; }
}

export default function AnalyticsPanel({
    analytics,
    range,
    setRange,
    exporting,
    onExport,
    scoreColors
}) {
    const trend = analytics?.trend || {};

    return (
        <div className="analytics-section">
            <div className="analytics-header">
                <div>
                    <h2>📊 Advanced Analytics</h2>
                    <div className="section-subtitle">Historical trends, comparisons, and predictions</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="date-range-selector">
                        {['today', 'week', 'month'].map(r => (
                            <button key={r} className={`date-range-btn ${range === r ? 'active' : ''}`}
                                onClick={() => setRange(r)} id={`range-${r}`}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={onExport} disabled={exporting} id="export-csv-btn">
                        {exporting ? '⏳ Exporting...' : '📥 Export CSV'}
                    </button>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="card chart-card">
                    <h3>⚡ Energy Consumption Timeline</h3>
                    <EnergyLineChart data={analytics?.timeline || []} />
                </div>
                <div className="card chart-card">
                    <h3>📊 Weekly Energy Comparison</h3>
                    <WeeklyBarChart data={analytics?.weekly || []} />
                </div>
            </div>

            {/* Stats row: prediction + trend + peak + health */}
            <div className="analytics-stats">
                {/* Prediction Card */}
                <div className="card prediction-card">
                    <div className="card-header">
                        <span className="card-title">Predicted Tomorrow</span>
                        <span className="prediction-badge">AI Est.</span>
                    </div>
                    <div className="card-value">{analytics?.predicted_kwh ?? '—'}</div>
                    <div className="card-unit">kWh expected</div>
                </div>

                {/* Trend Insights */}
                <div className="card" style={{ borderLeft: '3px solid #333' }}>
                    <div className="card-title" style={{ marginBottom: '12px' }}>Trend Insights</div>
                    <div className="trend-row">
                        <span className="trend-label">Today</span>
                        <span className="trend-value">{trend.today_kwh ?? '—'} kWh</span>
                    </div>
                    <div className="trend-row">
                        <span className="trend-label">Yesterday</span>
                        <span className="trend-value">{trend.yesterday_kwh ?? '—'} kWh</span>
                    </div>
                    <div className="trend-row">
                        <span className="trend-label">Change</span>
                        <span className={trend.change_pct > 0 ? 'trend-change-up' : 'trend-change-down'}>
                            {trend.change_pct > 0 ? '▲' : '▼'} {Math.abs(trend.change_pct ?? 0)}%
                        </span>
                    </div>
                </div>

                {/* Peak Power */}
                <div className="card stat-card">
                    <div className="card-title">Peak Power</div>
                    <div className="card-value">{analytics?.peak?.peak_power?.toFixed(0) ?? '—'}</div>
                    <div className="card-unit">W</div>
                    {analytics?.peak?.peak_time && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
                            at {formatTimestamp(analytics.peak.peak_time)}
                        </div>
                    )}
                </div>

                {/* Health Score */}
                <div className="card stat-card health-score-container">
                    <div className="health-score-circle" style={{
                        borderColor: scoreColors.border, background: scoreColors.bg, color: scoreColors.text,
                    }}>
                        {analytics?.health_score?.toFixed(0) ?? '—'}
                    </div>
                    <div className="health-score-label">Health Score</div>
                </div>
            </div>
        </div>
    );
}
