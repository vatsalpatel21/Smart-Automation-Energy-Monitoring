import React from 'react';

export default function LoginHistory({ historyData, title, showUserCols = false }) {
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">🔐 {title}</span>
                <span className="badge badge-info">{showUserCols ? 'System-wide Logins' : 'Recent Logins'}</span>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {showUserCols && <th>Email</th>}
                            {showUserCols && <th>Role</th>}
                            <th>Date & Time</th>
                            <th>IP Address</th>
                            <th>Device</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.map((log, i) => (
                            <tr key={i}>
                                {showUserCols && <td style={{ fontWeight: 600 }}>{log.username}</td>}
                                {showUserCols && <td style={{ textTransform: 'capitalize' }}>{log.role || '—'}</td>}
                                <td>{log.login_time}</td>
                                <td>{log.ip_address}</td>
                                <td>{log.device}</td>
                                <td>
                                    <span className={`status-badge ${log.status === 'Success' ? 'status-success' : 'status-failed'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {historyData.length === 0 && (
                            <tr>
                                <td colSpan={showUserCols ? "6" : "4"} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
                                    No login activity recorded
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
