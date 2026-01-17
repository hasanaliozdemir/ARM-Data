// Global variables
let allData = [];
let filteredData = [];
let chart = null;

// Load and parse CSV data
async function loadData() {
    try {
        const response = await fetch('final_model/future_predictions_2025_2030.csv');
        const csvText = await response.text();
        allData = parseCSV(csvText);
        populateCountryFilter();
        applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('chartContainer').innerHTML =
            '<p class="loading">Error loading data. Please ensure the CSV file is accessible.</p>';
    }
}

// Parse CSV text to array of objects
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            Country: values[0],
            Bacteria: values[1],
            Year: parseInt(values[2]),
            Resistance: parseFloat(values[3])
        };
    });
}

// Populate country filter dropdown
function populateCountryFilter() {
    const countries = [...new Set(allData.map(d => d.Country))].sort();
    const select = document.getElementById('countryFilter');

    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        select.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const countryFilter = document.getElementById('countryFilter');
    const bacteriaFilter = document.getElementById('bacteriaFilter').value;

    const selectedCountries = Array.from(countryFilter.selectedOptions).map(opt => opt.value);

    filteredData = allData.filter(d => {
        const countryMatch = selectedCountries.includes('all') ||
            selectedCountries.length === 0 ||
            selectedCountries.includes(d.Country);
        const bacteriaMatch = bacteriaFilter === 'all' || d.Bacteria === bacteriaFilter;
        return countryMatch && bacteriaMatch;
    });

    updateChart();
    updateTable();
    updateStats();
}

// Reset filters
function resetFilters() {
    document.getElementById('countryFilter').selectedIndex = 0;
    document.getElementById('bacteriaFilter').selectedIndex = 0;
    applyFilters();
}

// Update chart
function updateChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    // Group data by country-bacteria combination
    const datasets = {};

    filteredData.forEach(d => {
        const key = `${d.Country} - ${d.Bacteria}`;
        if (!datasets[key]) {
            datasets[key] = {
                label: key,
                data: [],
                borderColor: getRandomColor(),
                backgroundColor: 'transparent',
                tension: 0.4
            };
        }
        datasets[key].data.push({ x: d.Year, y: d.Resistance });
    });

    // Limit to top 10 for readability
    const datasetArray = Object.values(datasets)
        .sort((a, b) => {
            const avgA = a.data.reduce((sum, point) => sum + point.y, 0) / a.data.length;
            const avgB = b.data.reduce((sum, point) => sum + point.y, 0) / b.data.length;
            return avgB - avgA;
        })
        .slice(0, 10);

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasetArray
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Antimicrobial Resistance Trends 2025-2030',
                    font: { size: 18, weight: 'bold' },
                    color: '#ffffff'
                },
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' },
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    min: 2025,
                    max: 2030,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Resistance (%)',
                        font: { weight: 'bold' },
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Update table
function updateTable() {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    // Group data by country and bacteria
    const grouped = {};
    filteredData.forEach(d => {
        const key = `${d.Country}|${d.Bacteria}`;
        if (!grouped[key]) {
            grouped[key] = {
                Country: d.Country,
                Bacteria: d.Bacteria,
                years: {}
            };
        }
        grouped[key].years[d.Year] = d.Resistance;
    });

    // Sort by 2030 value (descending)
    const sortedData = Object.values(grouped).sort((a, b) => {
        return (b.years[2030] || 0) - (a.years[2030] || 0);
    });

    sortedData.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell().textContent = item.Country;
        row.insertCell().textContent = item.Bacteria;

        for (let year = 2025; year <= 2030; year++) {
            const cell = row.insertCell();
            const value = item.years[year];
            cell.textContent = value !== undefined ? value.toFixed(2) + '%' : '-';

            // Color coding for dark theme
            if (value !== undefined) {
                if (value < 10) {
                    cell.style.background = 'rgba(34, 197, 94, 0.2)';
                    cell.style.color = '#22c55e';
                } else if (value < 30) {
                    cell.style.background = 'rgba(234, 179, 8, 0.2)';
                    cell.style.color = '#eab308';
                } else {
                    cell.style.background = 'rgba(239, 68, 68, 0.2)';
                    cell.style.color = '#ef4444';
                }
            }
        }
    });
}

// Update statistics
function updateStats() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = '';

    if (filteredData.length === 0) {
        statsDiv.innerHTML = '<p>No data to display</p>';
        return;
    }

    // Calculate statistics for 2030
    const data2030 = filteredData.filter(d => d.Year === 2030);

    if (data2030.length === 0) return;

    const resistanceValues = data2030.map(d => d.Resistance);
    const avg = resistanceValues.reduce((a, b) => a + b, 0) / resistanceValues.length;
    const max = Math.max(...resistanceValues);
    const min = Math.min(...resistanceValues);

    const maxEntry = data2030.find(d => d.Resistance === max);
    const minEntry = data2030.find(d => d.Resistance === min);

    const stats = [
        { label: 'Average Resistance', value: avg.toFixed(2) + '%' },
        { label: 'Highest', value: `${max.toFixed(2)}% (${maxEntry.Country})` },
        { label: 'Lowest', value: `${min.toFixed(2)}% (${minEntry.Country})` },
        { label: 'Data Points', value: data2030.length }
    ];

    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <h4>${stat.label}</h4>
            <div class="value">${stat.value}</div>
        `;
        statsDiv.appendChild(card);
    });
}

// Generate random color for chart lines
function getRandomColor() {
    const colors = [
        '#22c55e', '#14b8a6', '#f97316', '#eab308',
        '#3b82f6', '#a855f7', '#ec4899', '#06b6d4',
        '#10b981', '#8b5cf6', '#f43f5e', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
});
