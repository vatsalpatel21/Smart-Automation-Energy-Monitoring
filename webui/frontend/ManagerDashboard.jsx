import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AnalyticsPanel from '../components/AnalyticsPanel';
import LoginHistory from '../components/LoginHistory';
import DeviceControl from '../components/DeviceControl';
import ActivityLog from '../components/ActivityLog';
import EnergyInsights from '../components/EnergyInsights';
import { getSensorData, getAnalytics, exportCSV, getSystemLoginHistory, getActivityLog } from '../api';

const ALERT_ICONS = { critical: '🔴', warning: '⚠️', success: '✅', info: 'ℹ️' };

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
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return ts; }
}

const SEVERITY_COLOR = { critical: 'var(--color-danger)', warning: 'var(--color-warning)', info: 'var(--color-primary)', success: 'var(--color-success)' };

export default function ManagerDashboard() {
    const [sensorData, setSensorData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [loginHistory, setLoginHistory] = useState([]);
    const [range, setRange] = useState('today');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [now, setNow] = useState(new Date());

    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

    const fetchSensor = useCallback(async () => {
        try { setSensorData(await getSensorData()); } catch (e) { console.error(e); }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        try {
            setAnalytics(await getAnalytics(range));
            setError('');
        } catch (e) { setError('Failed to load analytics'); }
        finally { setLoading(false); }
    }, [range]);

    const fetchActivity = useCallback(async () => {
        try {
            const d = await getActivityLog();
            setActivityLog(d.events || []);
        } catch (e) { console.error(e); }
    }, []);

    const fetchLoginHistory = useCallback(async () => {
        try {
            const hist = await getSystemLoginHistory();
            setLoginHistory(hist);
        } catch (e) { console.error('Failed to load login history', e); }
    }, []);

    useEffect(() => {
        fetchSensor(); fetchAnalytics(); fetchActivity(); fetchLoginHistory();
        const s = setInterval(fetchSensor, 2000);
        const a = setInterval(fetchActivity, 10000);
        return () => { clearInterval(s); clearInterval(a); };
    }, [fetchSensor, fetchAnalytics, fetchActivity, fetchLoginHistory]);

    useEffect(() => {
        setLoading(true);
        fetchAnalytics();
    }, [range, fetchAnalytics]);

    const handleExport = async () => {
        setExporting(true);
        try { await exportCSV(); }
        catch { setError('Export failed'); }
        finally { setExporting(false); }
    };

    const getScoreColors = (s) => {
        if (s >= 80) return { border: 'var(--color-success)', bg: 'var(--color-success-light)', text: 'var(--color-success)' };
        if (s >= 50) return { border: 'var(--color-warning)', bg: 'var(--color-warning-light)', text: 'var(--color-warning)' };
        return { border: 'var(--color-danger)', bg: 'var(--color-danger-light)', text: 'var(--color-danger)' };
    };

    const { sensor, kpis, alerts, health, device_status, last_updated } = sensorData || {};
    const isOnline = device_status === 'ON';
    const criticalCount = (alerts || []).filter(a => a.level === 'critical').length;
    const scoreColors = getScoreColors(analytics?.health_score || 0);
    const trend = analytics?.trend || {};

    if (loading && !sensorData) return (
        <>
            <div className="status-bar"><span>EnergyIQ Platform</span></div>
            <Navbar />
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
                <p className="loading-text">Loading manager dashboard...</p>
            </div>
        </>
    );

    return (
        <>
            {/* ── System Status Bar ── */}
            <div className="status-bar">
                <div className="status-bar-left">
                    <div className="status-bar-item">
                        <span className={`status-dot ${error ? 'offline' : 'online'}`}></span>
                        <span>Analytics {error ? 'Error' : 'Active'}</span>
                    </div>
                    <div className="status-divider"></div>
                    <div className="status-bar-item">
                        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                        <span>Device {device_status || '—'}</span>
                    </div>
                    {criticalCount > 0 && <>
                        <div className="status-divider"></div>
                        <div className="status-bar-item" style={{ color: '#fca5a5' }}>
                            <span>⚠ {criticalCount} critical</span>
                        </div>
                    </>}
                </div>
                <div className="status-bar-right">
                    <div className="status-bar-item">
                        <span>Connected Devices: 1</span>
                    </div>
                    <div className="status-divider"></div>
                    <div className="status-bar-item">
                        <span>Last update: {formatTimestamp(last_updated)}</span>
                    </div>
                    <div className="status-divider"></div>
                    <div className="status-bar-item">
                        <span>{now.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                </div>
            </div>

            <Navbar />

            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>Manager Dashboard</h1>
                    <p>Comprehensive energy analytics, monitoring, and reporting</p>
                </div>

                {error && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

                {/* ── Live Monitoring Section ── */}
                <div className="dashboard-grid">
                    {/* LEFT */}
                    <div className="dashboard-col">
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">📈 Key Performance Indicators</span>
                                <span className="live-dot">Live</span>
                            </div>
                            <div className="kpi-grid">
                                <div className="card kpi-card metric-card">
                                    <div className="card-title">Today Energy</div>
                                    <div className="card-value">{kpis?.today_energy_kwh?.toFixed(3) ?? '—'}</div>
                                    <div className="card-unit">kWh</div>
                                </div>
                                <div className="card kpi-card metric-card">
                                    <div className="card-title">Avg Power</div>
                                    <div className="card-value">{kpis?.avg_power?.toFixed(0) ?? '—'}</div>
                                    <div className="card-unit">W</div>
                                </div>
                                <div className="card kpi-card metric-card">
                                    <div className="card-title">Runtime</div>
                                    <div className="card-value">{formatRuntime(kpis?.runtime_seconds)}</div>
                                    <div className="card-unit">today</div>
                                </div>
                            </div>
                        </div>

                        {/* Live Metrics */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">📡 Live Operational Metrics</span></div>
                            <div className="metrics-grid">
                                {[
                                    { label: 'Temperature', value: sensor?.temperature?.toFixed(1), unit: '°C', icon: '🌡️' },
                                    { label: 'Humidity', value: sensor?.humidity?.toFixed(1), unit: '%', icon: '💧' },
                                    { label: 'Current', value: sensor?.current?.toFixed(2), unit: 'A', icon: '⚡' },
                                    { label: 'Live Power', value: sensor?.power?.toFixed(0), unit: 'W', icon: '🔋' },
                                ].map(({ label, value, unit, icon }) => (
                                    <div key={label} className="card metric-card">
                                        <div className="card-icon">{icon}</div>
                                        <div className="card-title" style={{ marginTop: '8px' }}>{label}</div>
                                        <div className="card-value">{value ?? '—'}<span className="card-unit"> {unit}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Device Status (read-only) */}
                        <DeviceControl
                            isOnline={isOnline}
                            device_status={device_status}
                            sensor={sensor}
                            readOnly={true}
                        />
                    </div>

                    {/* RIGHT */}
                    <div className="dashboard-col">

                        {/* Energy Insights */}
                        <EnergyInsights analytics={analytics} />

                        {/* Health */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">🛡️ System Health</span>
                                <span className="badge badge-primary">
                                    {(((health?.voltage_stability || 0) + (health?.temperature_safety || 0) + (health?.current_stability || 0)) / 3).toFixed(0)}% Overall
                                </span>
                            </div>
                            <div className="health-grid">
                                {[
                                    { label: 'Voltage Stability', value: health?.voltage_stability },
                                    { label: 'Temp Safety', value: health?.temperature_safety },
                                    { label: 'Current Stability', value: health?.current_stability },
                                ].map(({ label, value }) => (
                                    <div key={label} className="health-item">
                                        <div className="health-label">{label}</div>
                                        <div className="health-bar-track">
                                            <div className="health-bar-fill" style={{ width: `${value || 0}%`, background: getHealthColor(value) }}></div>
                                        </div>
                                        <div className="health-value" style={{ color: getHealthColor(value) }}>{value?.toFixed(0) ?? 0}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">🚨 Active Alerts</span>
                                {criticalCount > 0 && <span className="badge badge-danger">{criticalCount} critical</span>}
                            </div>
                            <div className="alert-list">
                                {(alerts || []).length > 0 ? (alerts || []).map((a, i) => (
                                    <div key={i} className={`alert-item ${a.level}`}>
                                        <span className="alert-icon">{ALERT_ICONS[a.level] || 'ℹ️'}</span>
                                        <span className="alert-text">{a.message}</span>
                                    </div>
                                )) : (
                                    <div className="alert-item success">
                                        <span className="alert-icon">✅</span>
                                        <span className="alert-text">All systems operating normally</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Log */}
                        <ActivityLog events={activityLog} />
                    </div>
                </div>

                <hr className="section-divider" />

                {/* ── Advanced Analytics ── */}
                <AnalyticsPanel
                    analytics={analytics}
                    range={range}
                    setRange={setRange}
                    exporting={exporting}
                    onExport={handleExport}
                    scoreColors={scoreColors}
                />

                <hr className="section-divider" />

                <LoginHistory historyData={loginHistory} title="System Login Activity" showUserCols={true} />

            </div>
        </>
    );
}
