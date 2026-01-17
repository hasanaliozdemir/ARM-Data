// Global variables
let turkeyData = [];
let similarCountries = [];
let similarityChart = null;
let trendChart = null;

// Load all data
async function loadAllData() {
    try {
        await Promise.all([
            loadTurkeyData(),
            loadSimilarCountries()
        ]);

        displaySimilarCountries();
        displayTurkeyPredictions();
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML += '<p class="loading">Error loading data. Please ensure CSV files are accessible.</p>';
    }
}

// Load Turkey predictions
async function loadTurkeyData() {
    const response = await fetch('final_model/turkey_predictions_2025_2030.csv');
    const csvText = await response.text();
    turkeyData = parseCSV(csvText);
}

// Load similar countries data
async function loadSimilarCountries() {
    const response = await fetch('final_model/turkey_similar_countries.csv');
    const csvText = await response.text();
    similarCountries = parseSimilarityCSV(csvText);
}

// Parse standard CSV
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

// Parse similarity CSV
function parseSimilarityCSV(text) {
    const lines = text.trim().split('\n');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            Entity: values[0],
            similarity_to_turkey: parseFloat(values[1]),
            e_coli_ARM_percent: parseFloat(values[2]),
            s_aureus_ARM_percent: parseFloat(values[3]),
            am_consumption_rate: parseFloat(values[4]),
            avg_predicted_resistance_2025: parseFloat(values[5])
        };
    });
}

// Display similar countries
function displaySimilarCountries() {
    // Take only countries with positive similarity (top similar ones)
    const topSimilar = similarCountries
        .filter(c => c.similarity_to_turkey > 0)
        .sort((a, b) => b.similarity_to_turkey - a.similarity_to_turkey)
        .slice(0, 10);

    // Update table
    const tbody = document.querySelector('#similarCountriesTable tbody');
    tbody.innerHTML = '';

    topSimilar.forEach((country, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = country.Entity;

        const scoreCell = row.insertCell();
        scoreCell.textContent = country.similarity_to_turkey.toFixed(4);
        scoreCell.style.fontWeight = 'bold';
        scoreCell.style.color = '#14b8a6';

        row.insertCell().textContent = country.e_coli_ARM_percent.toFixed(2) + '%';
        row.insertCell().textContent = country.s_aureus_ARM_percent.toFixed(2) + '%';
        row.insertCell().textContent = country.am_consumption_rate.toFixed(2);
    });

    // Create similarity chart
    createSimilarityChart(topSimilar);
}

// Create similarity bar chart
function createSimilarityChart(topSimilar) {
    const ctx = document.getElementById('similarityChart').getContext('2d');

    if (similarityChart) {
        similarityChart.destroy();
    }

    similarityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topSimilar.map(c => c.Entity),
            datasets: [{
                label: 'Similarity Score',
                data: topSimilar.map(c => c.similarity_to_turkey),
                backgroundColor: 'rgba(20, 184, 166, 0.7)',
                borderColor: 'rgba(20, 184, 166, 1)',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Countries Most Similar to Turkey',
                    font: { size: 18, weight: 'bold' },
                    color: '#ffffff'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Similarity Score',
                        font: { weight: 'bold' },
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Display Turkey predictions
function displayTurkeyPredictions() {
    // Update summary cards
    const ecoliData = turkeyData.filter(d => d.Bacteria === 'E. coli');
    const saureusData = turkeyData.filter(d => d.Bacteria === 'S. aureus');

    if (ecoliData.length > 0) {
        const ecoli2025 = ecoliData.find(d => d.Year === 2025);
        const ecoli2030 = ecoliData.find(d => d.Year === 2030);

        document.getElementById('ecoli2025').textContent = ecoli2025.Resistance.toFixed(1) + '%';
        document.getElementById('ecoli2030').textContent = ecoli2030.Resistance.toFixed(1) + '%';

        const ecoliChange = ecoli2030.Resistance - ecoli2025.Resistance;
        const ecoliChangeDiv = document.getElementById('ecoliChange');
        ecoliChangeDiv.textContent = `Change: ${ecoliChange.toFixed(1)}% (${ecoliChange < 0 ? '↓ Decrease' : '↑ Increase'})`;
        ecoliChangeDiv.className = `change-indicator ${ecoliChange < 0 ? 'decrease' : 'increase'}`;
    }

    if (saureusData.length > 0) {
        const saureus2025 = saureusData.find(d => d.Year === 2025);
        const saureus2030 = saureusData.find(d => d.Year === 2030);

        document.getElementById('saureus2025').textContent = saureus2025.Resistance.toFixed(1) + '%';
        document.getElementById('saureus2030').textContent = saureus2030.Resistance.toFixed(1) + '%';

        const saureusChange = saureus2030.Resistance - saureus2025.Resistance;
        const saureusChangeDiv = document.getElementById('saureusChange');
        saureusChangeDiv.textContent = `Change: ${saureusChange.toFixed(1)}% (${saureusChange < 0 ? '↓ Decrease' : '↑ Increase'})`;
        saureusChangeDiv.className = `change-indicator ${saureusChange < 0 ? 'decrease' : 'increase'}`;
    }

    // Create trend chart
    createTrendChart();

    // Update detailed table
    updateDetailedTable();
}

// Create Turkey trend chart
function createTrendChart() {
    const ctx = document.getElementById('turkeyTrendChart').getContext('2d');

    if (trendChart) {
        trendChart.destroy();
    }

    const ecoliData = turkeyData.filter(d => d.Bacteria === 'E. coli');
    const saureusData = turkeyData.filter(d => d.Bacteria === 'S. aureus');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [2025, 2026, 2027, 2028, 2029, 2030],
            datasets: [
                {
                    label: 'E. coli',
                    data: ecoliData.map(d => d.Resistance),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'S. aureus',
                    data: saureusData.map(d => d.Resistance),
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Turkey AMR Predictions 2025-2030',
                    font: { size: 18, weight: 'bold' },
                    color: '#ffffff'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        font: { weight: 'bold' },
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Predicted Resistance (%)',
                        font: { weight: 'bold' },
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    min: 0,
                    max: 30,
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

// Update detailed table
function updateDetailedTable() {
    const tbody = document.querySelector('#turkeyDataTable tbody');
    tbody.innerHTML = '';

    // Group by bacteria
    const grouped = {};
    turkeyData.forEach(d => {
        if (!grouped[d.Bacteria]) {
            grouped[d.Bacteria] = { Bacteria: d.Bacteria, years: {} };
        }
        grouped[d.Bacteria].years[d.Year] = d.Resistance;
    });

    Object.values(grouped).forEach(item => {
        const row = tbody.insertRow();
        const bacteriaCell = row.insertCell();
        bacteriaCell.textContent = item.Bacteria;
        bacteriaCell.style.fontWeight = 'bold';
        bacteriaCell.style.color = '#14b8a6';

        for (let year = 2025; year <= 2030; year++) {
            const cell = row.insertCell();
            const value = item.years[year];
            cell.textContent = value !== undefined ? value.toFixed(2) + '%' : '-';

            // Gradient coloring for dark theme
            if (value !== undefined) {
                if (value < 10) {
                    cell.style.background = 'rgba(34, 197, 94, 0.2)';
                    cell.style.color = '#22c55e';
                } else if (value < 20) {
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAllData);
