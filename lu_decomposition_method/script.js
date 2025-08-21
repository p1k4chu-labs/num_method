document.addEventListener('DOMContentLoaded', () => {
    const mainTitle = document.getElementById('main-title');
    const methodRadios = document.querySelectorAll('input[name="method"]');
    const compareSwitch = document.getElementById('compare-switch');
    const matrixSizeInput = document.getElementById('matrix-size');
    const generateGridsBtn = document.getElementById('generate-grids');
    const randomizeBtn = document.getElementById('randomize');
    const solveBtn = document.getElementById('solve-system');
    const matrixA_Grid = document.getElementById('matrix-a-grid');
    const matrixB_Grid = document.getElementById('matrix-b-grid');
    const resultsSection = document.getElementById('results-section');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeModalBtn = document.getElementById('close-modal');

    let currentMethod = 'crout';
    let compareMode = false;

    // --- EVENT LISTENERS ---
    methodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            currentMethod = radio.value;
            updateMainTitle();
        });
    });

    compareSwitch.addEventListener('change', () => {
        compareMode = compareSwitch.checked;
        updateMainTitle();
    });

    generateGridsBtn.addEventListener('click', generateGrids);
    randomizeBtn.addEventListener('click', randomizeInputs);
    solveBtn.addEventListener('click', solveSystem);
    closeModalBtn.addEventListener('click', () => errorModal.classList.add('hidden'));

    // --- TITLE UPDATER ---
    function updateMainTitle() {
        if (compareMode) {
            mainTitle.textContent = "Crout's vs Doolittle's Solver";
        } else {
            mainTitle.textContent = `${currentMethod.charAt(0).toUpperCase() + currentMethod.slice(1)}'s Method Solver`;
        }
    }

    // --- GRID GENERATION ---
    function generateGrids() {
        const n = parseInt(matrixSizeInput.value);
        if (isNaN(n) || n < 2 || n > 10) {
            showError('Please enter a matrix size between 2 and 10.');
            return;
        }

        matrixA_Grid.innerHTML = '';
        matrixB_Grid.innerHTML = '';
        resultsSection.classList.add('hidden');

        matrixA_Grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'input-field';
                input.dataset.row = i;
                input.dataset.col = j;
                matrixA_Grid.appendChild(input);
            }
        }

        for (let i = 0; i < n; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'input-field';
            input.dataset.row = i;
            matrixB_Grid.appendChild(input);
        }
        addInputNavigation();
    }

    // --- INPUT HANDLING ---
    function addInputNavigation() {
        const inputs = document.querySelectorAll('#matrix-input-section input');
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        solveBtn.click();
                    }
                }
            });
        });
    }

    function randomizeInputs() {
        const inputs = document.querySelectorAll('#matrix-input-section input');
        if (inputs.length === 0) {
            showError('Generate the grids first before randomizing.');
            return;
        }
        inputs.forEach(input => {
            input.value = Math.floor(Math.random() * 19) - 9;
        });
    }

    function getMatrixValues() {
        const n = parseInt(matrixSizeInput.value);
        const A = Array.from({ length: n }, () => Array(n).fill(0));
        const B = Array(n).fill(0);
        let hasError = false;

        const aInputs = matrixA_Grid.querySelectorAll('input');
        aInputs.forEach(input => {
            const i = parseInt(input.dataset.row);
            const j = parseInt(input.dataset.col);
            const value = parseFloat(input.value);
            if (isNaN(value)) hasError = true;
            A[i][j] = value;
        });

        const bInputs = matrixB_Grid.querySelectorAll('input');
        bInputs.forEach((input, i) => {
            const value = parseFloat(input.value);
            if (isNaN(value)) hasError = true;
            B[i] = value;
        });

        if (hasError) {
            showError('All input fields must contain valid numbers.');
            return null;
        }
        return { A, B };
    }

    // --- SOLVER LOGIC ---
    function solveSystem() {
        const values = getMatrixValues();
        if (!values) return;

        resultsSection.innerHTML = '';
        resultsSection.classList.remove('hidden');

        if (compareMode) {
            const croutResult = solveWithMethod('crout', values.A, values.B);
            const doolittleResult = solveWithMethod('doolittle', values.A, values.B);
            displayComparisonResults(croutResult, doolittleResult);
        } else {
            const result = solveWithMethod(currentMethod, values.A, values.B);
            displaySingleResult(result);
        }
    }

    function solveWithMethod(method, A, B) {
        const n = A.length;
        const L = Array.from({ length: n }, () => Array(n).fill(0));
        const U = Array.from({ length: n }, () => Array(n).fill(0));

        let decompositionSuccess = false;
        if (method === 'crout') {
            decompositionSuccess = croutDecomposition(A, L, U, n);
        } else {
            decompositionSuccess = doolittleDecomposition(A, L, U, n);
        }

        if (!decompositionSuccess) {
            return { method, error: 'Matrix is singular (zero on diagonal during decomposition).' };
        }

        const Z = forwardSubstitution(L, B, n);
        const X = backwardSubstitution(U, Z, n);

        return { method, L, U, Z, X };
    }

    // --- DECOMPOSITION ALGORITHMS ---
    function croutDecomposition(A, L, U, n) {
        for (let i = 0; i < n; i++) U[i][i] = 1;

        for (let j = 0; j < n; j++) {
            for (let i = j; i < n; i++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[i][k] * U[k][j];
                }
                L[i][j] = A[i][j] - sum;
            }

            if (Math.abs(L[j][j]) < 1e-9) return false; // Singular matrix

            for (let i = j + 1; i < n; i++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[j][k] * U[k][i];
                }
                U[j][i] = (A[j][i] - sum) / L[j][j];
            }
        }
        return true;
    }

    function doolittleDecomposition(A, L, U, n) {
        for (let i = 0; i < n; i++) L[i][i] = 1;

        for (let k = 0; k < n; k++) {
            if (Math.abs(A[k][k]) < 1e-9) return false; // Check for pivot
            U[k][k] = A[k][k];
            for (let i = k + 1; i < n; i++) {
                L[i][k] = A[i][k] / U[k][k];
                U[k][i] = A[k][i];
            }
            for (let i = k + 1; i < n; i++) {
                for (let j = k + 1; j < n; j++) {
                    A[i][j] = A[i][j] - L[i][k] * U[k][j];
                }
            }
        }
        return true;
    }

    // --- SUBSTITUTION ALGORITHMS ---
    function forwardSubstitution(L, B, n) {
        const Z = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < i; j++) {
                sum += L[i][j] * Z[j];
            }
            Z[i] = (B[i] - sum) / L[i][i];
        }
        return Z;
    }

    function backwardSubstitution(U, Z, n) {
        const X = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += U[i][j] * X[j];
            }
            X[i] = (Z[i] - sum) / U[i][i];
        }
        return X;
    }

    // --- RESULTS DISPLAY ---
    function displaySingleResult(result) {
        if (result.error) {
            showError(result.error);
            return;
        }
        const title = `${result.method.charAt(0).toUpperCase() + result.method.slice(1)}'s Results`;
        resultsSection.innerHTML = `
            <div class="w-full">
                <h2 class="text-3xl font-bold text-center mb-6">${title}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${createResultCard('Lower Matrix [L]', result.L)}
                    ${createResultCard('Upper Matrix [U]', result.U)}
                    ${createResultCard('Intermediate [Z]', result.Z)}
                    ${createResultCard('Solution [X]', result.X)}
                </div>
            </div>
        `;
    }

    function displayComparisonResults(croutResult, doolittleResult) {
        resultsSection.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 class="text-3xl font-bold text-center mb-6">Crout's Results</h2>
                    ${croutResult.error ? `<div class="results-card text-red-400">${croutResult.error}</div>` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${createResultCard('Lower Matrix [L]', croutResult.L)}
                            ${createResultCard('Upper Matrix [U]', croutResult.U)}
                            ${createResultCard('Intermediate [Z]', croutResult.Z)}
                            ${createResultCard('Solution [X]', croutResult.X)}
                        </div>`}
                </div>
                <div>
                    <h2 class="text-3xl font-bold text-center mb-6">Doolittle's Results</h2>
                    ${doolittleResult.error ? `<div class="results-card text-red-400">${doolittleResult.error}</div>` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${createResultCard('Lower Matrix [L]', doolittleResult.L)}
                            ${createResultCard('Upper Matrix [U]', doolittleResult.U)}
                            ${createResultCard('Intermediate [Z]', doolittleResult.Z)}
                            ${createResultCard('Solution [X]', doolittleResult.X)}
                        </div>`}
                </div>
            </div>
        `;
    }

    function createResultCard(title, data) {
        const isVector = !Array.isArray(data[0]);
        const n = isVector ? data.length : data.length;
        let content;

        if (isVector) {
            content = data.map(val => `<div class="results-cell">${val.toFixed(4)}</div>`).join('');
        } else {
            content = data.map(row => 
                row.map(val => `<div class="results-cell">${val.toFixed(4)}</div>`).join('')
            ).join('');
        }

        return `
            <div class="results-card">
                <h4 class="text-xl font-semibold mb-4 text-center">${title}</h4>
                <div class="results-grid" style="--matrix-size: ${isVector ? 1 : n}">
                    ${content}
                </div>
            </div>
        `;
    }

    // --- ERROR HANDLING ---
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    // --- INITIALIZATION ---
    generateGrids();
});