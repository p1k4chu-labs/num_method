// --- UTILITY & MATH HELPER FUNCTIONS ---
const multiplyMatrixByScalar = (scalar, M) => M.map(row => row.map(val => scalar * val));
const formatNum = (num, places = 4) => (isNaN(num)) ? 'N/A' : num.toFixed(places);

// --- DOM MANIPULATION & EVENT HANDLING ---
document.addEventListener('DOMContentLoaded', () => {
    const matrixSizeSelect = document.getElementById('matrix-size');
    const matrixContainer = document.getElementById('matrix-container');
    const resultSection = document.getElementById('result-section');
    const resultOutput = document.getElementById('result-output');
    const sorSwitch = document.getElementById('sor-switch');
    const sorOmegaContainer = document.getElementById('sor-omega-container');
    
    let convergenceChart = null;

    const generateMatrix = () => {
        const n = parseInt(matrixSizeSelect.value, 10);
        let gridHtml = `<div class="grid gap-2" style="grid-template-columns: repeat(${n + 2}, 1fr);">`;
        // Add headers for columns
        for(let j=0; j<n; j++) gridHtml += `<div class="text-center font-bold text-gray-400">x${j+1}</div>`;
        gridHtml += `<div></div><div>b</div>`;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                gridHtml += `<input type="text" class="form-input a-element w-full p-2 text-center bg-gray-900 border border-gray-600 rounded-md" data-row="${i}" data-col="${j}">`;
            }
            gridHtml += `<div class="text-center font-bold text-lg self-center">=</div>`;
            gridHtml += `<input type="text" class="form-input b-element w-full p-2 text-center bg-gray-900 border border-gray-600 rounded-md" data-row="${i}">`;
        }
        gridHtml += `</div>`;
        matrixContainer.innerHTML = gridHtml;
        resultSection.classList.add('hidden');
    };
    
    const randomizeInputs = () => {
        const n = parseInt(matrixSizeSelect.value, 10);
        for (let i = 0; i < n; i++) {
            let rowSum = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const val = Math.floor(Math.random() * 10) - 5;
                    document.querySelector(`.a-element[data-row='${i}'][data-col='${j}']`).value = val;
                    rowSum += Math.abs(val);
                }
            }
            const diagonalVal = rowSum + Math.floor(Math.random() * 5) + 1;
            document.querySelector(`.a-element[data-row='${i}'][data-col='${i}']`).value = (Math.random() > 0.5 ? 1 : -1) * diagonalVal;
            document.querySelector(`.b-element[data-row='${i}']`).value = Math.floor(Math.random() * 20) - 10;
        }
    };

    const resetInputs = () => {
        matrixContainer.querySelectorAll('input').forEach(input => input.value = '');
        resultSection.classList.add('hidden');
        sorSwitch.checked = false;
        sorOmegaContainer.classList.add('hidden');
    };

    // --- CORE SOLVER LOGIC ---
    const solveSystem = () => {
        try {
            const n = parseInt(matrixSizeSelect.value, 10);
            const A = [], b = [];
            for (let i = 0; i < n; i++) {
                const row = [];
                for (let j = 0; j < n; j++) {
                    const val = document.querySelector(`.a-element[data-row='${i}'][data-col='${j}']`).value.trim();
                    if (val === '' || isNaN(val)) throw new Error(`Invalid input at A[${i+1},${j+1}]`);
                    row.push(parseFloat(val));
                }
                A.push(row);
                const b_val = document.querySelector(`.b-element[data-row='${i}']`).value.trim();
                if (b_val === '' || isNaN(b_val)) throw new Error(`Invalid input at b[${i+1}]`);
                b.push(parseFloat(b_val));
            }

            const tolerance = parseFloat(document.getElementById('tolerance').value);
            const maxIterations = parseInt(document.getElementById('max-iterations').value, 10);
            const useSOR = sorSwitch.checked;
            const omega = useSOR ? parseFloat(document.getElementById('sor-omega').value) : 1.0;

            if (isNaN(tolerance) || tolerance <= 0) throw new Error('Tolerance must be a positive number.');
            if (isNaN(maxIterations) || maxIterations <= 0) throw new Error('Max iterations must be a positive integer.');
            if (useSOR && (isNaN(omega) || omega <= 0 || omega >= 2)) throw new Error('Omega (ω) for SOR must be between 0 and 2.');

            let isDiagonallyDominant = true;
            for (let i = 0; i < n; i++) {
                let rowSum = 0;
                for (let j = 0; j < n; j++) {
                    if (i !== j) rowSum += Math.abs(A[i][j]);
                }
                if (Math.abs(A[i][i]) < rowSum) {
                    isDiagonallyDominant = false;
                    break;
                }
            }

            let x = new Array(n).fill(0);
            const iterationHistory = [[...x]];
            const errorHistory = [];
            let iteration;
            for (iteration = 0; iteration < maxIterations; iteration++) {
                const x_old = [...x];
                for (let i = 0; i < n; i++) {
                    let sigma = 0;
                    for (let j = 0; j < n; j++) {
                        if (i !== j) sigma += A[i][j] * x_old[j];
                    }
                    if (A[i][i] === 0) throw new Error(`Division by zero at A[${i+1},${i+1}]. The matrix is singular.`);
                    const jacobiVal = (b[i] - sigma) / A[i][i];
                    x[i] = (1 - omega) * x_old[i] + omega * jacobiVal;
                }
                iterationHistory.push([...x]);
                
                const error = Math.max(...x.map((val, i) => Math.abs(val - x_old[i])));
                errorHistory.push(error);
                if (error < tolerance) break;
            }

            const status = iteration < maxIterations 
                ? { text: `Success: Converged in ${iteration + 1} iterations.`, class: 'text-green-400' }
                : { text: 'Failed: Maximum iterations reached.', class: 'text-red-400' };

            displayResults(A, b, x, status, iterationHistory, errorHistory, isDiagonallyDominant, useSOR, omega);

        } catch (error) {
            resultSection.classList.remove('hidden');
            resultOutput.innerHTML = `<p class="text-red-400 font-bold p-4 bg-red-900/50 rounded-lg">Error: ${error.message}</p>`;
        }
    };

    const displayResults = (A, b, solution, status, history, errorHistory, isDiagonallyDominant, useSOR, omega) => {
        const n = A.length;
        
        const D = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((__, j) => i === j ? A[i][j] : 0));
        const L = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((__, j) => j < i ? A[i][j] : 0));
        const U = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((__, j) => j > i ? A[i][j] : 0));

        let H, C, analysisTitle, hFormula, cFormula;

        const D_inv = D.map(row => [...row]);
        let canInvert = true;
        for(let i=0; i<n; i++) {
            if (D[i][i] === 0) { canInvert = false; break; }
            D_inv[i][i] = 1 / D[i][i];
        }

        if (canInvert) {
            const L_plus_U = L.map((row, i) => row.map((val, j) => val + U[i][j]));
            const H_J = L_plus_U.map((row, i) => row.map(val => -D_inv[i][i] * val));
            const C_J = b.map((val, i) => D_inv[i][i] * val);

            if (useSOR) {
                analysisTitle = `Matrix Analysis (SOR, ω=${omega})`;
                hFormula = `H_{JOR} = (1-ω)I + ωH_J`;
                cFormula = `C_{JOR} = ωD⁻¹b`;
                H = H_J.map((row, i) => row.map((val, j) => (i === j ? (1 - omega) : 0) + omega * val));
                C = C_J.map(val => omega * val);
            } else {
                analysisTitle = "Matrix Analysis (Jacobi)";
                hFormula = `H = -D⁻¹(L+U)`;
                cFormula = `C = D⁻¹b`;
                H = H_J;
                C = C_J;
            }
        } else {
            H = null; C = null;
            analysisTitle = "Matrix Analysis";
            hFormula = "N/A"; cFormula = "N/A";
        }

        const renderMatrix = (matrix) => {
            if (!matrix) return '<p class="text-yellow-400">Matrix could not be computed.</p>';
            let html = `<div class="p-3 bg-gray-800 rounded-md font-mono text-sm overflow-x-auto"><div class="grid gap-2" style="grid-template-columns: repeat(${matrix[0].length}, 1fr);">`;
            matrix.forEach(row => row.forEach(val => html += `<div class="text-center p-1 bg-gray-900 rounded">${formatNum(val, 3)}</div>`));
            html += `</div></div>`;
            return html;
        };
        
        const renderVector = (vector) => {
            if (!vector) return '<p class="text-yellow-400">Vector could not be computed.</p>';
            let html = `<div class="p-3 bg-gray-800 rounded-md font-mono text-sm overflow-x-auto"><div class="grid gap-2 grid-cols-1">`;
            vector.forEach(val => html += `<div class="text-center p-1 bg-gray-900 rounded">${formatNum(val, 3)}</div>`);
            html += `</div></div>`;
            return html;
        };

        let tableHeader = '<th>k</th>';
        for(let i=0; i<n; i++) tableHeader += `<th>x${i+1}</th>`;
        let tableBody = history.map((row, k) => `<tr><td>${k}</td>${row.map(v => `<td>${formatNum(v, 6)}</td>`).join('')}</tr>`).join('');
        
        let diagonalDominanceWarning = '';
        if (!isDiagonallyDominant) {
            diagonalDominanceWarning = `<div class="p-4 bg-yellow-900/50 rounded-lg text-yellow-300"><p><strong>Warning:</strong> The matrix is not diagonally dominant. Convergence is not guaranteed.</p></div>`;
        }

        resultOutput.innerHTML = `
            ${diagonalDominanceWarning}
            <div class="p-4 glass-card rounded-lg fade-in">
                <h3 class="font-semibold text-xl mb-2 text-white">Summary</h3>
                <p><strong>Method Used:</strong> <span class="font-bold ${useSOR ? 'text-teal-400' : 'text-blue-400'}">${useSOR ? `SOR (ω = ${omega})` : 'Jacobi'}</span></p>
                <p><strong>Status:</strong> <span class="${status.class}">${status.text}</span></p>
                <p class="text-lg"><strong>Final Solution (x):</strong> <code class="text-cyan-300 font-bold">[${solution.map(v => formatNum(v, 6)).join(', ')}]</code></p>
            </div>

            <div class="p-4 glass-card rounded-lg fade-in" style="animation-delay: 0.1s;">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold text-xl text-white">Convergence Analysis</h3>
                    <div class="flex items-center space-x-2">
                        <label for="chart-toggle" class="text-sm font-medium">Show Chart</label>
                        <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" id="chart-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label for="chart-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer toggle-bg"></label>
                        </div>
                    </div>
                </div>
                <div id="chart-container" class="hidden h-64 mt-4"><canvas id="convergenceChart"></canvas></div>
                <div id="iteration-table-container" class="max-h-80 overflow-auto custom-scrollbar bg-gray-900/50 rounded-lg p-2">
                    <table class="w-full text-center table-auto">
                    <thead class="sticky top-0 bg-gray-900/80 backdrop-blur-sm"><tr>${tableHeader}</tr></thead>
                        <tbody class="divide-y divide-gray-700">${tableBody}</tbody>
                    </table>
                </div>
            </div>

            <div class="p-4 glass-card rounded-lg fade-in" style="animation-delay: 0.2s;">
                <h3 class="font-semibold text-xl mb-2 text-white">${analysisTitle}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold text-lg mb-2 text-gray-300">Lower Triangular (L)</h4>
                        ${renderMatrix(L)}
                    </div>
                    <div>
                        <h4 class="font-semibold text-lg mb-2 text-gray-300">Diagonal (D)</h4>
                        ${renderMatrix(D)}
                    </div>
                    <div>
                        <h4 class="font-semibold text-lg mb-2 text-gray-300">Upper Triangular (U)</h4>
                        ${renderMatrix(U)}
                    </div>
                </div>
                <div class="flex flex-wrap justify-around gap-4 mt-4">
                    <div class="p-4 bg-gray-900 rounded-lg flex-1 min-w-[280px]">
                        <h4 class="font-semibold text-lg mb-2 text-gray-300">Iteration Matrix (H)</h4>
                        <p class="text-sm text-gray-400 mb-2">Formula: <code class="text-cyan-400">${hFormula}</code></p>
                        ${renderMatrix(H)}
                    </div>
                    <div class="p-4 bg-gray-900 rounded-lg flex-1 min-w-[150px]">
                        <h4 class="font-semibold text-lg mb-2 text-gray-300">Constant Vector (C)</h4>
                        <p class="text-sm text-gray-400 mb-2">Formula: <code class="text-cyan-400">${cFormula}</code></p>
                        ${renderVector(C)}
                    </div>
                </div>
            </div>
        `;
        resultSection.classList.remove('hidden');

        const chartToggle = document.getElementById('chart-toggle');
        const chartContainer = document.getElementById('chart-container');
        const tableContainer = document.getElementById('iteration-table-container');

        chartToggle.addEventListener('change', (e) => {
            const showChart = e.target.checked;
            chartContainer.classList.toggle('hidden', !showChart);
            tableContainer.classList.toggle('hidden', showChart);
            if(showChart) {
                if (convergenceChart) convergenceChart.destroy();
                const ctx = document.getElementById('convergenceChart').getContext('2d');
                convergenceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length: errorHistory.length}, (_, i) => i + 1),
                        datasets: [{
                            label: 'L-infinity Norm Error',
                            data: errorHistory,
                            borderColor: '#2dd4bf',
                            backgroundColor: 'rgba(45, 212, 191, 0.2)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: { 
                            y: { 
                                type: 'logarithmic', 
                                title: { display: true, text: 'Error (log scale)', color: '#d1d5db' }, 
                                ticks: { color: '#d1d5db' }, 
                                grid: { color: 'rgba(255,255,255,0.1)' } 
                            },
                            x: { 
                                title: { display: true, text: 'Iteration', color: '#d1d5db' }, 
                                ticks: { color: '#d1d5db' }, 
                                grid: { color: 'rgba(255,255,255,0.1)' } 
                            } 
                        },
                        plugins: { legend: { labels: { color: '#d1d5db' } } }
                    }
                });
            }
        });
        // Ensure chart is hidden initially, but table is visible.
        chartContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        chartToggle.checked = false;
    };

    // --- Event Listeners ---
    matrixSizeSelect.addEventListener('change', generateMatrix);
    document.getElementById('solve-btn').addEventListener('click', solveSystem);
    document.getElementById('randomize-btn').addEventListener('click', randomizeInputs);
    document.getElementById('reset-btn').addEventListener('click', resetInputs);
    sorSwitch.addEventListener('change', (e) => {
        sorOmegaContainer.classList.toggle('hidden', !e.target.checked);
    });
    
    matrixContainer.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
            event.preventDefault();
            const inputs = Array.from(matrixContainer.querySelectorAll('input[type="text"]'));
            const currentIndex = inputs.indexOf(event.target);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            } else if (currentIndex === inputs.length - 1) {
                document.getElementById('solve-btn').click();
            }
        }
    });
    
    generateMatrix(); // Initial call
});