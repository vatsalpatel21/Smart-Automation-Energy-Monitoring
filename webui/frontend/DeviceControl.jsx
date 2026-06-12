import React from 'react';

export default function DeviceControl({
    isOnline,
    device_status,
    sensor,
    onToggle,
    toggling,
    readOnly = false
}) {
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">🔌 Device {readOnly ? 'Status' : 'Control'}</span>
                {!readOnly ? (
                    <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                ) : (
                    <span className="badge badge-warning">Read Only</span>
                )}
            </div>

            <div className="device-control">
                <div className="device-info">
                    <div className={`device-indicator ${isOnline ? 'on' : 'off'}`}></div>
                    <div className="device-meta">
                        <div className="device-name">Main Energy Unit</div>
                        <div className="device-sub">
                            {isOnline
                                ? `Running · ${sensor?.power != null ? Number(sensor.power).toFixed(0) : 0}W consumption`
                                : 'Powered off · 0W consumption'}
                        </div>
                    </div>
                </div>

                {!readOnly ? (
                    <button
                        className={`toggle-switch ${isOnline ? 'active' : ''}`}
                        onClick={onToggle}
                        disabled={toggling}
                        id="device-toggle"
                        aria-label="Toggle device"
                    >
                        <span className="toggle-knob"></span>
                    </button>
                ) : (
                    <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`}>
                        {device_status || '—'}
                    </span>
                )}
            </div>

            <div style={{
                marginTop: '12px', paddingTop: '12px',
                borderTop: '1px solid #eee',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span style={{ fontSize: '13px', color: '#555' }}>Supply Voltage</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>
                        {sensor?.voltage != null ? Number(sensor.voltage).toFixed(1) : '—'} V
                    </span>
                    {!readOnly && (
                        <span className={`badge ${sensor?.voltage >= 220 && sensor?.voltage <= 240 ? 'badge-success' : 'badge-warning'}`}>
                            {sensor?.voltage >= 220 && sensor?.voltage <= 240 ? 'Normal' : 'Check'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
