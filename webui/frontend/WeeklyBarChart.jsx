import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WeeklyBarChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="loading-container"><p className="loading-text">No data available</p></div>;
    }

    const chartData = {
        labels: data.map((d) => {
            const date = new Date(d.day);
            return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Energy (kWh)',
                data: data.map((d) => d.energy_kwh?.toFixed(3) || 0),
                backgroundColor: data.map((_, i) =>
                    i === data.length - 1 ? '#4f6ef7' : 'rgba(79, 110, 247, 0.3)'
                ),
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 32,
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
                ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' },
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' },
            },
        },
    };

    return (
        <div style={{ height: '280px' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
}
