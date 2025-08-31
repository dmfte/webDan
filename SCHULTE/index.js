(function () {
    const MIN_SIZE = 3;
    const MAX_SIZE = 6; // bump this later to allow larger boards
    const LS_KEY = 'schulte_best_times_v1';

    let gridSize = MIN_SIZE;
    let nextExpected = 1;
    let totalCells = gridSize * gridSize;
    let finished = false;
    let startTime = 0;

    const boardEl = document.getElementById('board');
    const sizeSel = document.getElementById('size');
    const nextNumEl = document.getElementById('nextNum');
    const sizeInfoEl = document.getElementById('sizeInfo');
    const msgEl = document.getElementById('message');
    const resetBtn = document.getElementById('resetBtn');
    const bestbarEl = document.getElementById('bestbar');

    // ---- Local Storage helpers ----
    function loadBests() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return {};
            const data = JSON.parse(raw);
            return typeof data === 'object' && data ? data : {};
        } catch {
            return {};
        }
    }

    function saveBests(obj) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch {}
    }

    let bests = loadBests(); // { '3': ms, '4': ms, ... }

    // Populate size selector based on config
    for (let s = MIN_SIZE; s <= MAX_SIZE; s++) {
        const opt = document.createElement('option');
        opt.value = String(s);
        opt.textContent = `${s}×${s}`;
        sizeSel.appendChild(opt);
    }

    sizeSel.addEventListener('change', () => {
        gridSize = parseInt(sizeSel.value, 10);
        totalCells = gridSize * gridSize;
        sizeInfoEl.textContent = `${gridSize}×${gridSize}`;
        newGame();
    });

    resetBtn.addEventListener('click', newGame);

    // ---- UI builders ----
    function renderBestBar() {
        bestbarEl.innerHTML = '';
        for (let s = MIN_SIZE; s <= MAX_SIZE; s++) {
            const wrap = document.createElement('div');
            wrap.className = 'best';
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = `${s}×${s}`;
            const time = document.createElement('div');
            time.className = 'time';
            const ms = bests[String(s)];
            time.textContent = ms ? formatTime(ms) : '—';
            wrap.append(label, time);
            bestbarEl.appendChild(wrap);
        }
    }

    function updateOneBestInBar(size) {
        const idx = size - MIN_SIZE; // position within grid-auto-flow
        const node = bestbarEl.children[idx];
        if (!node) return;
        const timeNode = node.querySelector('.time');
        const ms = bests[String(size)];
        timeNode.textContent = ms ? formatTime(ms) : '—';
    }

    function buildGrid(numbers) {
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        numbers.forEach((n) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cell';
            btn.textContent = n;
            btn.setAttribute('data-n', String(n));
            btn.setAttribute('role', 'gridcell');
            btn.setAttribute('aria-label', `Number ${n}`);
            btn.addEventListener('click', onCellClick);
            boardEl.appendChild(btn);
        });
    }

    // ---- Time helpers ----
    function now() {
        return performance.now();
    }

    function formatTime(ms) {
        const total = Math.max(0, Math.round(ms));
        const m = Math.floor(total / 60000);
        const s = Math.floor((total % 60000) / 1000);
        const cs = Math.floor((total % 1000) / 10); // centiseconds
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        const cc = String(cs).padStart(2, '0');
        return `${mm}:${ss}.${cc}`;
    }

    function shuffledNumbers() {
        const arr = Array.from({
            length: totalCells
        }, (_, i) => i + 1);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function onCellClick(e) {
        const cell = e.currentTarget;
        if (finished) {
            newGame();
            return;
        }

        const value = parseInt(cell.getAttribute('data-n'), 10);
        if (value !== nextExpected) {
            cell.classList.add('wrong');
            setTimeout(() => cell.classList.remove('wrong'), 500);
            return;
        }

        nextExpected++;
        nextNumEl.textContent = nextExpected > totalCells ? '—' : String(nextExpected);

        if (nextExpected > totalCells) {
            // Completed sequence — stop time and evaluate best
            finished = true;
            const elapsed = now() - startTime;
            const prev = bests[String(gridSize)];
            const isBest = !prev || elapsed < prev;
            if (isBest) {
                bests[String(gridSize)] = elapsed;
                saveBests(bests);
                updateOneBestInBar(gridSize);
            }

            const msg = `Great! You cleared the ${gridSize}×${gridSize} board in ${formatTime(elapsed)}${isBest ? ' — NEW BEST!' : ''} Tap anywhere on the board to play again.`;
            msgEl.textContent = msg;
            msgEl.classList.add('show');
            boardEl.classList.add('dimmed');
            // Defer attaching the reset listener to avoid catching the same click event
            setTimeout(() => {
                boardEl.addEventListener('click', handlePostWinResetOnce, {
                    once: true
                });
            }, 0);
            return;
        }
        reshuffleBoard();
    }

    function handlePostWinResetOnce() {
        newGame();
    }

    function reshuffleBoard() {
        const nums = shuffledNumbers();
        const cells = boardEl.querySelectorAll('.cell');
        cells.forEach((cell, idx) => {
            const n = nums[idx];
            cell.textContent = n;
            cell.setAttribute('data-n', String(n));
            cell.setAttribute('aria-label', `Number ${n}`);
        });
    }

    function newGame() {
        finished = false;
        nextExpected = 1;
        totalCells = gridSize * gridSize;
        msgEl.classList.remove('show');
        nextNumEl.textContent = '1';
        boardEl.classList.remove('dimmed');
        buildGrid(shuffledNumbers());
        startTime = now();
    }

    // Initial
    sizeSel.value = String(gridSize);
    sizeInfoEl.textContent = `${gridSize}×${gridSize}`;
    renderBestBar();
    newGame();
})();