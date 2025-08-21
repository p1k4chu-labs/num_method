document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const sizeSelector = document.getElementById('matrix-size');
    const matrixContainer = document.getElementById('matrix-container');
    const solverForm = document.getElementById('solver-form');
    const resetButton = document.getElementById('reset-button');
    const randomizeButton = document.getElementById('randomize-button');
    const resultsContainer = document.getElementById('results-container');
    const messageArea = document.getElementById('message-area');
    const finalSolution = document.getElementById('final-solution');
    const iterationsHead = document.getElementById('iterations-head');
    const iterationsBody = document.getElementById('iterations-body');
    const lMatrixDiv = document.getElementById('l-matrix');
    const dMatrixDiv = document.getElementById('d-matrix');
    const uMatrixDiv = document.getElementById('u-matrix');
    const hMatrixDiv = document.getElementById('h-matrix');
    const cVectorDiv = document.getElementById('c-vector');

    const generateMatrixInputs = (size) => {
        matrixContainer.innerHTML = '';
        matrixContainer.style.gridTemplateColumns = `repeat(${size + 2}, auto)`;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                matrixContainer.innerHTML += `<input type="number" class="w-16 h-12 text-center rounded-md input-field" data-row="${i}" data-col="${j}" value="" step="any">`;
            }
            matrixContainer.innerHTML += `<div class="w-px h-full bg-gray-600 justify-self-center"></div>`;
            matrixContainer.innerHTML += `<input type="number" class="w-16 h-12 text-center rounded-md input-field" data-row="${i}" data-vector="b" value="" step="any">`;
        }
    };

    const isDiagonallyDominant = (matrix) => {
        for (let i = 0; i < matrix.length; i++) {
            let diagonal = Math.abs(matrix[i][i]);
            let rowSum = 0;
            for (let j = 0; j < matrix.length; j++) {
                if (i !== j) rowSum += Math.abs(matrix[i][j]);
            }
            if (diagonal <= rowSum) return false;
        }
        return true;
    };
    
    const solveByJacobi = (A, b, tolerance, maxIterations) => {
        const n = A.length;
        let x = new Array(n).fill(0);
        let iterations = [];
        
        for (let k = 0; k < maxIterations; k++) {
            let x_new = new Array(n).fill(0);
            
            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    if (i !== j) sum += A[i][j] * x[j];
                }
                if (A[i][i] === 0) return { success: false, message: 'Error: Division by zero. A diagonal element is zero.', iterations: [] };
                x_new[i] = (b[i] - sum) / A[i][i];
            }

            iterations.push({ k: k + 1, x: [...x_new] });

            let error = 0;
            for (let i = 0; i < n; i++) {
                error = Math.max(error, Math.abs(x_new[i] - x[i]));
            }
            x = [...x_new];
            if (error < tolerance) return { success: true, solution: x, iterations, message: `Converged in ${k + 1} iterations.` };
        }
        return { success: false, solution: x, message: `Failed to converge within ${maxIterations} iterations.`, iterations };
    };

    const decomposeMatrix = (A) => {
        const n = A.length;
        const L = Array.from({ length: n }, () => Array(n).fill(0));
        const D = Array.from({ length: n }, () => Array(n).fill(0));
        const U = Array.from({ length: n }, () => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i > j) L[i][j] = A[i][j];
                else if (i < j) U[i][j] = A[i][j];
                else D[i][j] = A[i][j];
            }
        }
        return { L, D, U };
    };
    
    const calculateJacobiMatrices = (L, D, U, b) => {
        const n = D.length;
        const D_inv = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            D_inv[i][i] = D[i][i] !== 0 ? 1 / D[i][i] : 0;
        }

        const L_plus_U = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                L_plus_U[i][j] = L[i][j] + U[i][j];
            }
        }

        const H = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                H[i][j] = -D_inv[i][i] * L_plus_U[i][j];
            }
        }

        const C = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            C[i] = D_inv[i][i] * b[i];
        }

        return { H, C };
    };

    const formatForDisplay = (item) => {
        if (!Array.isArray(item[0])) { // Vector
            return `<pre>${item.map(val => val.toFixed(4).padStart(8)).join('\n')}</pre>`;
        }
        // Matrix
        return `<pre>${item.map(row => row.map(val => val.toFixed(4).padStart(8)).join(' ')).join('\n')}</pre>`;
    };

    const handleSolve = (e) => {
        e.preventDefault();
        resultsContainer.classList.remove('hidden');
        
        const size = parseInt(sizeSelector.value);
        const tolerance = parseFloat(document.getElementById('tolerance').value);
        const maxIterations = parseInt(document.getElementById('max-iterations').value);

        let A = Array.from({ length: size }, () => Array(size).fill(0));
        let b = new Array(size).fill(0);

        for(let i=0; i<size; i++) {
            for(let j=0; j<size; j++) {
                const input = matrixContainer.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                A[i][j] = parseFloat(input.value) || 0;
            }
            const bInput = matrixContainer.querySelector(`input[data-row="${i}"][data-vector="b"]`);
            b[i] = parseFloat(bInput.value) || 0;
        }

        let messages = [];
        if (!isDiagonallyDominant(A)) {
            messages.push({ text: 'Warning: Matrix is not strictly diagonally dominant. Convergence is not guaranteed.', type: 'warning' });
        }

        const result = solveByJacobi(A, b, tolerance, maxIterations);
        messages.push({ text: result.message, type: result.success ? 'success' : 'error' });
        messageArea.innerHTML = messages.map(msg => `<div class="${msg.type === 'success' ? 'bg-emerald-500/50' : msg.type === 'warning' ? 'bg-amber-500/50' : 'bg-red-500/50'} p-3 rounded-md mb-2">${msg.text}</div>`).join('');

        finalSolution.innerHTML = `<pre>${result.solution.map((val, i) => `x${i+1} = ${val.toFixed(6)}`).join('\n')}</pre>`;

        iterationsHead.innerHTML = `<tr><th class="p-2">k</th>${Array.from({length: size}, (_, i) => `<th class="p-2">x${i+1}</th>`).join('')}</tr>`;
        iterationsBody.innerHTML = result.iterations.map(iter => `<tr class="border-b border-gray-700 hover:bg-gray-700/50"><td class="p-2">${iter.k}</td>${iter.x.map(val => `<td class="p-2">${val.toFixed(6)}</td>`).join('')}</tr>`).join('');

        const { L, D, U } = decomposeMatrix(A);
        const { H, C } = calculateJacobiMatrices(L, D, U, b);
        lMatrixDiv.innerHTML = formatForDisplay(L);
        dMatrixDiv.innerHTML = formatForDisplay(D);
        uMatrixDiv.innerHTML = formatForDisplay(U);
        hMatrixDiv.innerHTML = formatForDisplay(H);
        cVectorDiv.innerHTML = formatForDisplay(C);
    }; 
    
    const handleReset = () => {
         resultsContainer.classList.add('hidden');
         const inputs = matrixContainer.querySelectorAll('input[type="number"]');
         inputs.forEach(input => {
            input.value = '';
         });
    }

    const handleRandomize = () => {
        const size = parseInt(sizeSelector.value);
        let rowSums = new Array(size).fill(0);

        // Generate off-diagonal elements and calculate row sums
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (i === j) continue;
                const randomVal = Math.floor(Math.random() * (size * 2)) - size; // Random int between -size and size
                const input = matrixContainer.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                if (input) {
                    input.value = randomVal;
                    rowSums[i] += Math.abs(randomVal);
                }
            }
        }

        // Generate diagonal elements to ensure dominance
        for (let i = 0; i < size; i++) {
            const diagonalInput = matrixContainer.querySelector(`input[data-row="${i}"][data-col="${i}"]`);
            const diagonalVal = rowSums[i] + Math.floor(Math.random() * size) + 1; // Sum + random int [1, size]
            if (diagonalInput) {
                diagonalInput.value = diagonalVal;
            }
        }
        
        // Generate random values for vector b
        for (let i = 0; i < size; i++) {
            const bInput = matrixContainer.querySelector(`input[data-row="${i}"][data-vector="b"]`);
            if (bInput) {
                bInput.value = Math.floor(Math.random() * 21) - 10; // Random int between -10 and 10
            }
        }
    };

    // Event Listeners
    sizeSelector.addEventListener('change', (e) => generateMatrixInputs(parseInt(e.target.value)));
    solverForm.addEventListener('submit', handleSolve);
    resetButton.addEventListener('click', handleReset);
    randomizeButton.addEventListener('click', handleRandomize);
    
    // Add keyboard navigation for input fields
    matrixContainer.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const inputs = Array.from(matrixContainer.querySelectorAll('input[type="number"]'));
        const currentIndex = inputs.indexOf(e.target);

        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
            // If it's not the last input, move to the next one
            inputs[currentIndex + 1].focus();
        } else if (currentIndex === inputs.length - 1) {
            // On the last input, trigger form submission
            solverForm.requestSubmit();
        }
    });

    // Initial setup on page load
    generateMatrixInputs(parseInt(sizeSelector.value));
});
