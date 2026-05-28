/* ============================================
   COMEDK 2026 Marks vs Rank Calculator
   Core Logic, Data & Visualization
   ============================================ */

// =============================
// RAW DATA FROM IMAGES
// =============================

// COMEDK 2024 — Actual marks vs rank (from provided image)
const DATA_2024 = [
    { marks: 131, rank: 80 },
    { marks: 123, rank: 220 },
    { marks: 116, rank: 544 },
    { marks: 113, rank: 800 },
    { marks: 104, rank: 1700 },
    { marks: 96,  rank: 3200 },
    { marks: 95,  rank: 3600 },
    { marks: 83,  rank: 8300 },
    { marks: 65,  rank: 25000 },
];

// COMEDK 2025 — Session 3 data (10 S3 column, most complete & monotonic)
const DATA_2025 = [
    { marks: 139, rank: 61 },
    { marks: 134, rank: 354 },
    { marks: 131, rank: 562 },
    { marks: 119, rank: 1613 },
    { marks: 116, rank: 2333 },
    { marks: 113, rank: 3002 },
    { marks: 110, rank: 3364 },
    { marks: 107, rank: 4829 },
    { marks: 104, rank: 5818 },
    { marks: 101, rank: 6929 },
    { marks: 97,  rank: 8255 },
    { marks: 92,  rank: 10470 },
    { marks: 84,  rank: 14813 },
    { marks: 74,  rank: 23461 },
    { marks: 64,  rank: 36627 },
    { marks: 54,  rank: 75925 },
];

// =============================
// 2026 PREDICTION MODEL (v2 — Industry-Calibrated)
// =============================
/*
    Model v2 — Rebuilt with industry consensus calibration.

    Previous model (v1) used a simple offset+scale approach:
      rank_2026(M) = rank_2024(M + 6) × 1.26
    This was ~3–5× too optimistic because:
      - The 6-marks difficulty offset was too small
      - Linear candidate scaling didn't capture density shifts
      - High-marks extrapolation on 2024 data was aggressive

    New approach (v2): Direct prediction curve calibrated against:
      - Careers360, Shiksha, CollegeDunia, CollegeDekho consensus for 2026
      - 2024/2025 actual data for cross-validation
      - Confirmed: 1,29,643 registered, ~85% appeared ≈ 1,10,000+
      - Expert analysis: paper was moderate-to-tough, Math lengthy

    Industry consensus anchor points for 2026:
      170–180 → 1–10       |  130–139 → 501–1,500
      160–169 → 11–50      |  120–129 → 1,501–3,000
      150–159 → 51–150     |  110–119 → 3,001–5,500
      140–149 → 151–500    |  100–109 → 5,501–8,000

    Below 100: extrapolated from 2024 data scaled ~3× for combined
    effect of 30% more candidates + harder paper + density compression.
*/

const TOTAL_CANDIDATES_2026 = 113437;

// Direct 2026 prediction curve — 32 calibrated anchor points
const CURVE_2026_DIRECT = [
    { marks: 180, rank: 1 },
    { marks: 175, rank: 3 },
    { marks: 170, rank: 10 },
    { marks: 165, rank: 30 },
    { marks: 160, rank: 50 },
    { marks: 155, rank: 100 },
    { marks: 150, rank: 150 },
    { marks: 145, rank: 325 },
    { marks: 140, rank: 500 },
    { marks: 137, rank: 750 },
    { marks: 135, rank: 1000 },
    { marks: 132, rank: 1300 },
    { marks: 130, rank: 1500 },
    { marks: 127, rank: 2000 },
    { marks: 125, rank: 2250 },
    { marks: 122, rank: 2700 },
    { marks: 120, rank: 3000 },
    { marks: 117, rank: 3800 },
    { marks: 115, rank: 4250 },
    { marks: 112, rank: 5000 },
    { marks: 110, rank: 5500 },
    { marks: 107, rank: 6300 },
    { marks: 105, rank: 6800 },
    { marks: 102, rank: 7500 },
    { marks: 100, rank: 8000 },
    { marks: 97,  rank: 9500 },
    { marks: 95,  rank: 11000 },
    { marks: 92,  rank: 12800 },
    { marks: 90,  rank: 14500 },
    { marks: 87,  rank: 17500 },
    { marks: 85,  rank: 20000 },
    { marks: 82,  rank: 23500 },
    { marks: 80,  rank: 27000 },
    { marks: 77,  rank: 31000 },
    { marks: 75,  rank: 36000 },
    { marks: 72,  rank: 40500 },
    { marks: 70,  rank: 45000 },
    { marks: 67,  rank: 50000 },
    { marks: 65,  rank: 56000 },
    { marks: 62,  rank: 62000 },
    { marks: 60,  rank: 68000 },
    { marks: 55,  rank: 80000 },
    { marks: 50,  rank: 92000 },
    { marks: 45,  rank: 100000 },
    { marks: 40,  rank: 106000 },
    { marks: 30,  rank: 111000 },
    { marks: 20,  rank: 113000 },
    { marks: 0,   rank: 113437 },
].sort((a, b) => b.marks - a.marks);

// Extended 2024 curve with extrapolation at extremes (for reference comparison)
const CURVE_2024_EXTENDED = [
    { marks: 180, rank: 1 },
    { marks: 170, rank: 1 },
    { marks: 160, rank: 10 },
    { marks: 150, rank: 50 },
    { marks: 145, rank: 100 },
    { marks: 140, rank: 180 },
    { marks: 135, rank: 300 },
    { marks: 133, rank: 400 },
    ...DATA_2024,
    { marks: 60,  rank: 32000 },
    { marks: 55,  rank: 42000 },
    { marks: 50,  rank: 55000 },
    { marks: 45,  rank: 65000 },
    { marks: 40,  rank: 72000 },
    { marks: 30,  rank: 82000 },
    { marks: 20,  rank: 88000 },
    { marks: 0,   rank: 90000 },
].sort((a, b) => b.marks - a.marks);

// Piecewise linear interpolation
function interpolate(dataPoints, queryMarks) {
    // dataPoints sorted descending by marks
    if (queryMarks >= dataPoints[0].marks) return dataPoints[0].rank;
    if (queryMarks <= dataPoints[dataPoints.length - 1].marks) return dataPoints[dataPoints.length - 1].rank;

    for (let i = 0; i < dataPoints.length - 1; i++) {
        const upper = dataPoints[i];
        const lower = dataPoints[i + 1];
        if (queryMarks <= upper.marks && queryMarks >= lower.marks) {
            const t = (upper.marks - queryMarks) / (upper.marks - lower.marks);
            return Math.round(upper.rank + t * (lower.rank - upper.rank));
        }
    }
    return dataPoints[dataPoints.length - 1].rank;
}

// Main prediction function — now uses direct calibrated curve
function predictRank2026(marks) {
    marks = Math.max(0, Math.min(180, marks));
    return interpolate(CURVE_2026_DIRECT, marks);
}

// Get rank from 2024 data (interpolated)
function getRank2024(marks) {
    return interpolate(CURVE_2024_EXTENDED, marks);
}

// Extended 2025 curve
const CURVE_2025_EXTENDED = [
    { marks: 180, rank: 1 },
    { marks: 150, rank: 1 },
    { marks: 145, rank: 10 },
    { marks: 142, rank: 25 },
    ...DATA_2025,
    { marks: 50,  rank: 80000 },
    { marks: 40,  rank: 83000 },
    { marks: 30,  rank: 85000 },
    { marks: 0,   rank: 85000 },
].sort((a, b) => b.marks - a.marks);

function getRank2025(marks) {
    return interpolate(CURVE_2025_EXTENDED, marks);
}

// Generate rank range (±15% uncertainty for better honesty)
function getRankRange(rank) {
    const low = Math.max(1, Math.round(rank * 0.85));
    const high = Math.round(rank * 1.15);
    return { low, high };
}

// Category classification — recalibrated to realistic 2026 thresholds
function getCategory(marks) {
    if (marks >= 160) return { label: 'Top 50', color: '#22d3ee', emoji: '🏆' };
    if (marks >= 150) return { label: 'Top 150', color: '#818cf8', emoji: '🥇' };
    if (marks >= 140) return { label: 'Top 500', color: '#6366f1', emoji: '🌟' };
    if (marks >= 130) return { label: 'Top 1,500', color: '#a855f7', emoji: '⭐' };
    if (marks >= 120) return { label: 'Top 3,000', color: '#10b981', emoji: '✅' };
    if (marks >= 110) return { label: 'Top 5,500', color: '#22d3ee', emoji: '📊' };
    if (marks >= 100) return { label: 'Top 8,000', color: '#f59e0b', emoji: '📈' };
    if (marks >= 90)  return { label: 'Top 15,000', color: '#f97316', emoji: '📉' };
    if (marks >= 80)  return { label: 'Top 27,000', color: '#ef4444', emoji: '⚠️' };
    if (marks >= 65)  return { label: '27K–56K', color: '#ef4444', emoji: '⚠️' };
    return { label: '56K+', color: '#dc2626', emoji: '🔴' };
}

// =============================
// Generate 2026 table data
// =============================
function generate2026TableData() {
    const markPoints = [140, 135, 130, 128, 125, 122, 120, 118, 115, 112, 110, 108, 105, 102, 100, 98, 95, 92, 90, 88, 85, 82, 80, 75, 70, 65, 60, 55, 50];
    return markPoints.map(m => {
        const rank = predictRank2026(m);
        const range = getRankRange(rank);
        const percentile = ((TOTAL_CANDIDATES_2026 - rank) / TOTAL_CANDIDATES_2026 * 100).toFixed(2);
        return { marks: m, rank, range, percentile };
    });
}

// =============================
// DOM & UI
// =============================
document.addEventListener('DOMContentLoaded', () => {
    // Create background particles
    createParticles();

    // Populate tables
    populateTables();

    // Setup chart
    createChart();

    // Setup event listeners
    setupListeners();
});

// --- Particles ---
function createParticles() {
    const container = document.getElementById('bgParticles');
    const count = 30;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 20) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
        const colors = ['#6366f1', '#a855f7', '#22d3ee', '#10b981'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(p);
    }
}

// --- Tables ---
function populateTables() {
    // 2026 Predicted
    const table2026 = document.getElementById('table2026Body');
    const data2026 = generate2026TableData();
    data2026.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="marks-cell">${row.marks}</td>
            <td class="rank-cell">${row.rank.toLocaleString()}</td>
            <td>${row.range.low.toLocaleString()} – ${row.range.high.toLocaleString()}</td>
            <td>${row.percentile}%</td>
        `;
        table2026.appendChild(tr);
    });

    // 2024 Actual
    const table2024 = document.getElementById('table2024Body');
    DATA_2024.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="marks-cell">${row.marks}</td>
            <td class="rank-cell">${row.rank.toLocaleString()}</td>
            <td class="note-cell">Actual COMEDK 2024 data</td>
        `;
        table2024.appendChild(tr);
    });

    // 2025 Actual
    const table2025 = document.getElementById('table2025Body');
    DATA_2025.forEach(row => {
        const tr = document.createElement('tr');
        const rangeLabel = row.marks >= 100 ? `${row.marks - 1}–${row.marks + 1}` : `${row.marks - 2}–${row.marks + 2}`;
        tr.innerHTML = `
            <td class="marks-cell">${row.marks}</td>
            <td class="rank-cell">${row.rank.toLocaleString()}</td>
            <td class="note-cell">Session 3 data (10 S3)</td>
        `;
        table2025.appendChild(tr);
    });
}

// --- Chart ---
let rankChart = null;
function createChart() {
    const ctx = document.getElementById('rankChart').getContext('2d');

    // Generate smooth curve data for each year
    const marksRange = [];
    for (let m = 50; m <= 145; m += 1) marksRange.push(m);

    const data2024 = marksRange.map(m => ({ x: m, y: getRank2024(m) }));
    const data2025 = marksRange.map(m => ({ x: m, y: getRank2025(m) }));
    const data2026 = marksRange.map(m => ({ x: m, y: predictRank2026(m) }));

    rankChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: '2026 Predicted',
                    data: data2026,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#6366f1',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    order: 1,
                },
                {
                    label: '2024 Actual',
                    data: data2024,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.04)',
                    borderWidth: 2.5,
                    borderDash: [8, 4],
                    fill: false,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#f59e0b',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    order: 2,
                },
                {
                    label: '2025 Actual',
                    data: data2025,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.04)',
                    borderWidth: 2.5,
                    borderDash: [4, 4],
                    fill: false,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#10b981',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    order: 3,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.2,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 18, 35, 0.95)',
                    titleColor: '#f0f0ff',
                    bodyColor: '#9ca3c0',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 14,
                    titleFont: { family: "'Inter', sans-serif", size: 13, weight: 700 },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
                    callbacks: {
                        title: (items) => `Marks: ${items[0].parsed.x}`,
                        label: (item) => `${item.dataset.label}: Rank ${item.parsed.y.toLocaleString()}`,
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Marks',
                        color: '#5b6280',
                        font: { family: "'Inter', sans-serif", size: 13, weight: 600 },
                    },
                    ticks: {
                        color: '#5b6280',
                        font: { family: "'JetBrains Mono', monospace", size: 11 },
                        stepSize: 10,
                    },
                    grid: {
                        color: 'rgba(99, 102, 241, 0.06)',
                    },
                    min: 50,
                    max: 145,
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Rank (log scale)',
                        color: '#5b6280',
                        font: { family: "'Inter', sans-serif", size: 13, weight: 600 },
                    },
                    ticks: {
                        color: '#5b6280',
                        font: { family: "'JetBrains Mono', monospace", size: 11 },
                        callback: (val) => {
                            if (val >= 1000) return (val / 1000) + 'K';
                            return val;
                        },
                    },
                    grid: {
                        color: 'rgba(99, 102, 241, 0.06)',
                    },
                    reverse: true,
                    min: 1,
                    max: 100000,
                },
            }
        }
    });
}

// --- Event Listeners ---
function setupListeners() {
    const marksInput = document.getElementById('marksInput');
    const marksSlider = document.getElementById('marksSlider');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultContainer = document.getElementById('resultContainer');

    // Button click
    calculateBtn.addEventListener('click', () => {
        const val = parseInt(marksInput.value);
        if (!isNaN(val) && val >= 0 && val <= 180) {
            showResult(val);
            marksSlider.value = val;
        } else {
            marksInput.focus();
            marksInput.style.borderColor = '#ef4444';
            setTimeout(() => { marksInput.style.borderColor = ''; }, 1500);
        }
    });

    // Enter key
    marksInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') calculateBtn.click();
    });

    // Real-time input (debounced)
    let inputTimeout;
    marksInput.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            const val = parseInt(marksInput.value);
            if (!isNaN(val) && val >= 0 && val <= 180) {
                showResult(val);
                marksSlider.value = val;
            }
        }, 300);
    });

    // Slider
    marksSlider.addEventListener('input', () => {
        const val = parseInt(marksSlider.value);
        marksInput.value = val;
        showResult(val);
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// --- Display Result ---
function showResult(marks) {
    const rank = predictRank2026(marks);
    const range = getRankRange(rank);
    const percentile = ((TOTAL_CANDIDATES_2026 - rank) / TOTAL_CANDIDATES_2026 * 100).toFixed(2);
    const rank2024 = getRank2024(marks);
    const rank2025 = getRank2025(marks);
    const category = getCategory(marks);

    const container = document.getElementById('resultContainer');
    container.classList.add('visible');

    // Animated rank counter
    const rankEl = document.getElementById('resultRank');
    animateNumber(rankEl, rank);

    document.getElementById('resultRange').textContent = `Range: ${range.low.toLocaleString()} – ${range.high.toLocaleString()}`;
    document.getElementById('resultPercentile').textContent = percentile + '%';
    document.getElementById('resultPercentile').style.color = parseFloat(percentile) > 95 ? '#22d3ee' : parseFloat(percentile) > 90 ? '#6366f1' : parseFloat(percentile) > 80 ? '#10b981' : '#f59e0b';

    document.getElementById('result2024').textContent = rank2024.toLocaleString();
    document.getElementById('result2025').textContent = rank2025.toLocaleString();
    
    const categoryEl = document.getElementById('resultCategory');
    categoryEl.textContent = `${category.emoji} ${category.label}`;
    categoryEl.style.color = category.color;
}

// --- Animate number counter ---
function animateNumber(el, target) {
    el.classList.add('animate');
    const duration = 600;
    const start = performance.now();
    const startVal = parseInt(el.textContent.replace(/,/g, '')) || 0;

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (target - startVal) * eased);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.classList.remove('animate');
        }
    }

    requestAnimationFrame(step);
}
