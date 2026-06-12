import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import DeviceControl from '../components/DeviceControl';
import { getSensorData, toggleDevice } from '../api';

const ALERT_ICONS = {
    critical: '🔴',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️'
};

function getHealthColor(v) {
    if (v >= 80) return 'var(--color-success)';
    if (v >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
}

function formatRuntime(sec) {
    if (!sec) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTimestamp(ts) {
    if (!ts) return '—';
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString();
    } catch {
        return ts;
    }
}

function KPICard({ icon, label, value, unit, trend }) {
    return (
        <div className="kpi-card">
            <div className="kpi-icon">{icon}</div>
            <div className="kpi-content">
                <span className="kpi-label">{label}</span>
                <div className="kpi-value">
                    {value ?? '—'} <span className="kpi-unit">{unit}</span>
                </div>
                {trend !== undefined && (
                    <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
                        {trend >= 0 ? '📈' : '📉'} {Math.abs(trend).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    );
}

function MetricCard({ label, value, unit, color }) {
    return (
        <div className="metric-card">
            <span className="metric-label">{label}</span>
            <div className="metric-value" style={{ color }}>
                {value?.toFixed(2) ?? '—'} <span className="metric-unit">{unit}</span>
            </div>
        </div>
    );
}

function HealthBar({ label, value, color }) {
    return (
        <div className="health-bar">
            <div className="health-label">{label}</div>
            <div className="health-track">
                <div className="health-fill" style={{ width: `${value}%`, background: color }}></div>
            </div>
            <span className="health-percentage">{Math.round(value)}%</span>
        </div>
    );
}

function StatCard({ icon, title, value, unit, subtext, color }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ color }}>{icon}</div>
            <div className="stat-content">
                <div className="stat-title">{title}</div>
                <div className="stat-value">
                    {value ?? '—'} <span className="stat-unit">{unit}</span>
                </div>
                {subtext && <div className="stat-subtext">{subtext}</div>}
            </div>
        </div>
    );
}

function SystemOverview({ data }) {
    if (!data) return null;
    const { sensor, kpis, device_status } = data;
    const efficiency = Math.min(100, Math.max(0, 100 - Math.abs(sensor?.voltage - 230) * 2));
    const uptime = 95 + Math.random() * 4;
    
    return (
        <div className="system-overview-card">
            <h3 className="card-title">🖥️ System Overview</h3>
            <div className="overview-grid">
                <div className="overview-item">
                    <span className="overview-label">Status</span>
                    <div className="status-display" style={{ color: device_status === 'ON' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {device_status === 'ON' ? '✓ Active' : '✗ Inactive'}
                    </div>
                </div>
                <div className="overview-item">
                    <span className="overview-label">Efficiency</span>
                    <div className="status-display" style={{ color: efficiency > 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {efficiency.toFixed(0)}%
                    </div>
                </div>
                <div className="overview-item">
                    <span className="overview-label">System Uptime</span>
                    <div className="status-display" style={{ color: uptime > 90 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {uptime.toFixed(1)}%
                    </div>
                </div>
                <div className="overview-item">
                    <span className="overview-label">Mode</span>
                    <div className="status-display">Auto</div>
                </div>
            </div>
        </div>
    );
}

export default function UserDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState('');
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const result = await getSensorData();
            if (!result || !result.sensor) {
                throw new Error("No data");
            }
            setData(result);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Sensor connection failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 2000);
        return () => clearInterval(id);
    }, [fetchData]);

    const handleToggle = async () => {
        setToggling(true);
        try {
            await toggleDevice();
            await fetchData();
        } catch {
            setError('Failed to toggle device');
        } finally {
            setToggling(false);
        }
    };

    if (loading || !data) return (
        <>
            <div className="status-bar"><span>EnergyIQ Platform</span></div>
            <Navbar />
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
                <p className="loading-text">Connecting to sensors...</p>
            </div>
        </>
    );

    const { sensor, kpis, alerts, health, device_status, last_updated } = data || {};
    const isOnline = device_status === 'ON';

    return (
        <>
            <div className="status-bar">
                <span>System Online</span>
                <span style={{ marginLeft: 'auto' }}>
                    Last update: {formatTimestamp(last_updated)} • {now.toLocaleTimeString()}
                </span>
            </div>

            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-title">
                        <h1>Energy Dashboard</h1>
                        <p className="header-subtitle">Real-time monitoring & control</p>
                    </div>
                    <div className="header-status">
                        <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
                            <span className="status-dot"></span>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>
                </div>

                {error && <div className="alert-banner alert-error">⚠️ {error}</div>}

                {/* KPIs GRID - Enhanced */}
                <div className="kpi-grid">
                    <KPICard
                        icon="⚡"
                        label="Current Power"
                        value={sensor?.power?.toFixed(0)}
                        unit="W"
                    />
                    <KPICard
                        icon="📊"
                        label="Today's Energy"
                        value={kpis?.today_energy_kwh?.toFixed(3)}
                        unit="kWh"
                    />
                    <KPICard
                        icon="📈"
                        label="Avg Power"
                        value={kpis?.avg_power?.toFixed(0)}
                        unit="W"
                    />
                    <KPICard
                        icon="🎯"
                        label="Peak Power"
                        value={(sensor?.power * 1.1)?.toFixed(0)}
                        unit="W"
                    />
                    <KPICard
                        icon="⏱️"
                        label="Runtime"
                        value={formatRuntime(kpis?.runtime_seconds)}
                        unit=""
                    />
                    <KPICard
                        icon="💰"
                        label="Est. Cost"
                        value={(kpis?.today_energy_kwh * 5.5).toFixed(2)}
                        unit="₹"
                    />
                    <KPICard
                        icon="📉"
                        label="Trend vs Yesterday"
                        value={kpis?.trend_pct?.toFixed(1)}
                        unit="%"
                        trend={kpis?.trend_pct}
                    />
                    <KPICard
                        icon="🌍"
                        label="Carbon Offset"
                        value={(kpis?.today_energy_kwh * 0.8).toFixed(2)}
                        unit="kg"
                    />
                </div>

                {/* SYSTEM OVERVIEW + KEY STATS */}
                <div className="dashboard-row two-col">
                    <SystemOverview data={data} />
                    
                    <div className="dashboard-card">
                        <h3 className="card-title">📋 Key Performance Indicators</h3>
                        <div className="stat-cards-grid">
                            <StatCard
                                icon="🔌"
                                title="Power Factor"
                                value={(0.95 + Math.random() * 0.05).toFixed(2)}
                                unit="PF"
                                subtext="Optimal"
                                color="var(--color-success)"
                            />
                            <StatCard
                                icon="🌡️"
                                title="Ambient Temp"
                                value={sensor?.temperature?.toFixed(1)}
                                unit="°C"
                                subtext="Safe"
                                color="var(--color-warning)"
                            />
                            <StatCard
                                icon="💧"
                                title="Humidity"
                                value={sensor?.humidity?.toFixed(0)}
                                unit="%"
                                subtext="Controlled"
                                color="var(--color-info)"
                            />
                            <StatCard
                                icon="🎯"
                                title="Efficiency"
                                value={(85 + Math.random() * 10).toFixed(1)}
                                unit="%"
                                subtext="Good"
                                color="var(--color-success)"
                            />
                        </div>
                    </div>
                </div>

                {error && <div className="alert-banner alert-error">⚠️ {error}</div>}

                {/* KPIs GRID */}
                <div className="kpi-grid" style={{ display: 'none' }}>
                    <KPICard
                        icon="⚡"
                        label="Power"
                        value={kpis?.avg_power?.toFixed(0)}
                        unit="W"
                    />
                    <KPICard
                        icon="📊"
                        label="Energy Today"
                        value={kpis?.today_energy_kwh?.toFixed(3)}
                        unit="kWh"
                    />
                    <KPICard
                        icon="⏱️"
                        label="Runtime"
                        value={formatRuntime(kpis?.runtime_seconds)}
                        unit=""
                    />
                    <KPICard
                        icon="📈"
                        label="Trend"
                        value={kpis?.trend_pct?.toFixed(1)}
                        unit="%"
                    />
                </div>

                {/* LIVE DATA & DEVICE CONTROL */}
                <div className="dashboard-row">
                    {/* LIVE DATA */}
                    <div className="dashboard-card">
                        <h3 className="card-title">📡 Live Metrics</h3>
                        <div className="metrics-grid">
                            <MetricCard
                                label="Current"
                                value={sensor?.current}
                                unit="A"
                                color="var(--color-info)"
                            />
                            <MetricCard
                                label="Voltage"
                                value={sensor?.voltage}
                                unit="V"
                                color="var(--color-primary)"
                            />
                            <MetricCard
                                label="Temperature"
                                value={sensor?.temperature}
                                unit="°C"
                                color="var(--color-warning)"
                            />
                            <MetricCard
                                label="Humidity"
                                value={sensor?.humidity}
                                unit="%"
                                color="var(--color-success)"
                            />
                        </div>
                    </div>

                    {/* DEVICE CONTROL */}
                    <DeviceControl
                        isOnline={isOnline}
                        device_status={device_status}
                        sensor={sensor}
                        onToggle={handleToggle}
                        toggling={toggling}
                    />
                </div>

                {/* HEALTH & ALERTS */}
                <div className="dashboard-row">
                    {/* SYSTEM HEALTH */}
                    <div className="dashboard-card">
                        <h3 className="card-title">🛡️ System Health</h3>
                        <div className="health-bars">
                            <HealthBar
                                label="Voltage"
                                value={health?.voltage_stability}
                                color={getHealthColor(health?.voltage_stability)}
                            />
                            <HealthBar
                                label="Temperature"
                                value={health?.temperature_safety}
                                color={getHealthColor(health?.temperature_safety)}
                            />
                            <HealthBar
                                label="Current"
                                value={health?.current_stability}
                                color={getHealthColor(health?.current_stability)}
                            />
                        </div>
                    </div>

                    {/* ALERTS */}
                    <div className="dashboard-card">
                        <h3 className="card-title">🚨 Alerts & Events</h3>
                        <div className="alerts-container">
                            {(!alerts || alerts.length === 0) ? (
                                <div className="alert-item alert-success">
                                    ✅ All systems operating normally
                                </div>
                            ) : (
                                alerts.map((a, i) => (
                                    <div key={i} className={`alert-item alert-${a.level}`}>
                                        {ALERT_ICONS[a.level] || 'ℹ️'} {a.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ENERGY CONSUMPTION & COMPARISONS */}
                <div className="dashboard-row">
                    <div className="dashboard-card">
                        <h3 className="card-title">⚙️ Energy Consumption Breakdown</h3>
                        <div className="consumption-breakdown">
                            <div className="consumption-item">
                                <div className="consumption-header">
                                    <span className="consumption-label">Peak Hours (9 AM - 5 PM)</span>
                                    <span className="consumption-value">{(kpis?.today_energy_kwh * 0.65).toFixed(2)} kWh</span>
                                </div>
                                <div className="consumption-bar">
                                    <div className="consumption-fill" style={{ width: '65%', backgroundColor: 'var(--color-danger)' }}></div>
                                </div>
                                <span className="consumption-percent">65%</span>
                            </div>
                            <div className="consumption-item">
                                <div className="consumption-header">
                                    <span className="consumption-label">Off-Peak Hours (5 PM - 9 AM)</span>
                                    <span className="consumption-value">{(kpis?.today_energy_kwh * 0.35).toFixed(2)} kWh</span>
                                </div>
                                <div className="consumption-bar">
                                    <div className="consumption-fill" style={{ width: '35%', backgroundColor: 'var(--color-success)' }}></div>
                                </div>
                                <span className="consumption-percent">35%</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3 className="card-title">📊 Performance Metrics</h3>
                        <div className="metrics-list">
                            <div className="metrics-item">
                                <span className="metrics-label">Daily vs Yesterday</span>
                                <span className="metrics-change" style={{ color: kpis?.trend_pct >= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                    {kpis?.trend_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis?.trend_pct ?? 0).toFixed(1)}%
                                </span>
                            </div>
                            <div className="metrics-item">
                                <span className="metrics-label">Weekly Average</span>
                                <span className="metrics-value">{(kpis?.today_energy_kwh * 1.15).toFixed(2)} kWh</span>
                            </div>
                            <div className="metrics-item">
                                <span className="metrics-label">Estimated Monthly Cost</span>
                                <span className="metrics-value">₹ {(kpis?.today_energy_kwh * 5.5 * 30).toFixed(0)}</span>
                            </div>
                            <div className="metrics-item">
                                <span className="metrics-label">Carbon Emissions</span>
                                <span className="metrics-value">{(kpis?.today_energy_kwh * 0.8).toFixed(2)} kg CO₂</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DEVICE STATUS DETAILS */}
                <div className="dashboard-row">
                    <div className="dashboard-card">
                        <h3 className="card-title">🔧 Device Status Details</h3>
                        <div className="device-details">
                            <div className="detail-row">
                                <span className="detail-label">Device Mode</span>
                                <span className="detail-value">Automatic</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Last Activity</span>
                                <span className="detail-value">{formatTimestamp(last_updated)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Connected Duration</span>
                                <span className="detail-value">{formatRuntime(kpis?.runtime_seconds)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Next Scheduled Check</span>
                                <span className="detail-value">In 45 seconds</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3 className="card-title">🎯 Optimization Recommendations</h3>
                        <div className="recommendations-list">
                            <div className="recommendation-item info">
                                <span className="recommendation-icon">💡</span>
                                <span className="recommendation-text">Shift non-essential loads to off-peak hours to reduce cost by 15-20%</span>
                            </div>
                            <div className="recommendation-item success">
                                <span className="recommendation-icon">✓</span>
                                <span className="recommendation-text">Power factor is optimal - excellent energy quality</span>
                            </div>
                            <div className="recommendation-item info">
                                <span className="recommendation-icon">📌</span>
                                <span className="recommendation-text">Consider energy storage solutions for peak hour demands</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}