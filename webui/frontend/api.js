// Use the Flask backend route prefix on the same host/port.
const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, config);

    if (response.status === 401) {
        if (token && endpoint !== '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    // Handle CSV downloads
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
        return response;
    }

    return response.json();
}

// ─── Login ───────────────────────────────────────
// Flask backend: POST /api/login → { token, username, email, role }
export async function login(email, password) {
    const data = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    console.log('[API] Login response:', data);

    return {
        token: data.token,
        email: data.email || email,
        role: data.role || 'user',
    };
}

// ─── Sensor Data ─────────────────────────────────
// Flask backend: GET /api/sensor-data
// Dashboard expects: { sensor, kpis, alerts, health, device_status, last_updated }
export async function getSensorData() {
    const data = await fetchApi('/sensor-data');
    console.log('[API] Sensor data response:', data);

    if (!data || !data.sensor) {
        throw new Error('No sensor data available');
    }

    return data;
    console.log('[API] Raw sensor data:', rawArray);

    // Handle empty or invalid data
    if (!Array.isArray(rawArray) || rawArray.length === 0) {
        throw new Error('No sensor data available');
    }

    // Use the latest reading
    const latest = rawArray[rawArray.length - 1];

    // Transform into the shape the dashboard components expect
    const sensor = {
        current: Number(latest.current) || 0,
        power: Number(latest.power) || 0,
        energy: Number(latest.energy) || 0,
        voltage: Number(latest.voltage) || 230, // default voltage if not provided
        temperature: Number(latest.temperature) || 25,
        humidity: Number(latest.humidity) || 50,
    };

    // Compute basic KPIs from available data
    const kpis = {
        today_energy_kwh: sensor.energy,
        avg_power: sensor.power,
        runtime_seconds: rawArray.length * 2, // rough estimate based on polling interval
    };

    // Generate simple alerts based on thresholds
    const alerts = [];
    if (sensor.power > 4500) alerts.push({ level: 'critical', message: `High power usage: ${sensor.power}W` });
    if (sensor.current > 20) alerts.push({ level: 'warning', message: `High current: ${sensor.current}A` });
    if (sensor.voltage < 210 || sensor.voltage > 250) alerts.push({ level: 'warning', message: `Voltage out of range: ${sensor.voltage}V` });
    if (sensor.temperature > 75) alerts.push({ level: 'critical', message: `High temperature: ${sensor.temperature}°C` });

    // Compute simple health scores
    const health = {
        voltage_stability: sensor.voltage >= 210 && sensor.voltage <= 250 ? 95 : 60,
        temperature_safety: sensor.temperature < 60 ? 95 : sensor.temperature < 75 ? 70 : 40,
        current_stability: sensor.current < 15 ? 95 : sensor.current < 20 ? 70 : 40,
    };

    return {
        sensor,
        kpis,
        alerts,
        health,
        device_status: sensor.power > 0 ? 'ON' : 'OFF',
        last_updated: latest.timestamp || new Date().toISOString(),
    };
}

// ─── Device Toggle ───────────────────────────────
// Node.js backend doesn't have a toggle endpoint, so this is a no-op stub
export async function toggleDevice() {
    console.log('[API] toggleDevice called (not supported by Node backend)');
    return { status: 'ok' };
}

// ─── Stubs for Flask-only endpoints ──────────────
// These are used by ManagerDashboard but don't exist on Node.js backend.
// Return safe defaults so the app doesn't crash.

export async function getAnalytics(range = 'today') {
    console.log('[API] getAnalytics stub called — not available on Node backend');
    return {
        health_score: 85,
        trend: {},
        hourly: [],
        daily: [],
    };
}

export async function exportCSV() {
    console.log('[API] exportCSV stub — not available on Node backend');
    alert('CSV export is not available with the current backend.');
}

export async function getMyLoginHistory() {
    console.log('[API] getMyLoginHistory stub');
    return [];
}

export async function getSystemLoginHistory() {
    console.log('[API] getSystemLoginHistory stub');
    return [];
}

export async function getActivityLog() {
    console.log('[API] getActivityLog stub');
    return { events: [] };
}

export function register(full_name, email, mobile_number, password) {
    console.log('[API] register stub — not available on Node backend');
    return Promise.reject(new Error('Registration is not available with the current backend.'));
}
