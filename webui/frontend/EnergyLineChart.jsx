import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function EnergyLineChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="loading-container"><p className="loading-text">No data available</p></div>;
    }

    // Sample data to avoid overloading the chart
    const step = Math.max(1, Math.floor(data.length / 60));
    const sampled = data.filter((_, i) => i % step === 0);

    const chartData = {
        labels: sampled.map((d) => {
            const date = new Date(d.timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }),
        datasets: [
            {
                label: 'Power (W)',
                data: sampled.map((d) => d.power),
                borderColor: '#4f6ef7',
                backgroundColor: 'rgba(79, 110, 247, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8', maxTicksLimit: 8 },
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' },
            },
        },
        interaction: { intersect: false, mode: 'index' },
    };

    return (
        <div style={{ height: '280px' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
