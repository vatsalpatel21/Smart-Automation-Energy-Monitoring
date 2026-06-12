import React from 'react';

const SEVERITY_COLOR = {
    critical: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
    success: 'var(--color-success)'
};

export default function ActivityLog({ events, title = "📋 Recent Activity", maxHeight = "400px" }) {
    return (
        <div className="card activity-log-card">
            <div className="card-header">
                <span className="card-title">{title}</span>
                <span className="badge badge-info">{events.length} events</span>
            </div>
            <div className="activity-log" style={{ maxHeight, overflowY: 'auto' }}>
                {events.length > 0 ? events.map((e, i) => (
                    <div key={i} className="activity-item">
                        <div className="activity-dot" style={{ background: SEVERITY_COLOR[e.severity] || 'var(--color-primary)' }}></div>
                        <div className="activity-content">
                            <div className="activity-msg">{e.message}</div>
                            <div className="activity-time">{e.timestamp}</div>
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
                        No recent events
                    </div>
                )}
            </div>
        </div>
    );
}
