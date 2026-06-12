import React from 'react';

export default function EnergyInsights({ analytics }) {
    if (!analytics) return null;

    const { trend, peak, predicted_kwh } = analytics;

    const formatTime = (ts) => {
        if (!ts) return '—';
        try {
            return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch {
            return ts;
        }
    };

    const isUp = trend?.change_pct > 0;
    const changeTxt = isUp ? 'increased' : 'decreased';
    const pct = Math.abs(trend?.change_pct || 0);

    return (
        <div className="card insights-card">
            <div className="card-header">
                <span className="card-title">Energy Insights</span>
            </div>
            <div className="insights-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                <div className="insight-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #eee', padding: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{isUp ? '📈' : '📉'}</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>
                        Energy usage has <strong>{changeTxt} by {pct}%</strong> compared to yesterday.
                    </span>
                </div>

                <div className="insight-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #eee', padding: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⚡</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>
                        Peak energy usage occurred at <strong>{formatTime(peak?.peak_time)}</strong>, hitting a high of <strong>{peak?.peak_power}W</strong>.
                    </span>
                </div>

                <div className="insight-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #eee', padding: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🔮</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>
                        Predicted energy consumption for tomorrow is approximately <strong>{predicted_kwh?.toFixed(2) || '—'} kWh</strong>.
                    </span>
                </div>

            </div>
        </div>
    );
}
