const RED_SUITS = new Set(['♥', '♦']);

function renderCard(card) {
    const el = document.createElement('div');
    el.className = `card ${RED_SUITS.has(card.suit) ? 'red' : 'black'}`;
    el.innerHTML = `<span class="value">${card.value}</span><span class="suit">${card.suit}</span>`;
    return el;
}

function renderCardSlot(card, height = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-slot';

    const cardEl = card ? renderCard(card) : document.createElement('div');
    if (!card) cardEl.className = 'card empty';
    wrapper.appendChild(cardEl);

    if (height !== null && height > 1) {
        const heightEl = document.createElement('div');
        heightEl.className = 'pile-height';
        heightEl.textContent = height;
        wrapper.appendChild(heightEl);
    }

    return wrapper;
}

function renderGrid(grid, label, pileHeights = null) {
    const section = document.createElement('div');
    section.className = 'section';

    const labelEl = document.createElement('div');
    labelEl.className = 'section-label';
    labelEl.textContent = label;

    const gridEl = document.createElement('div');
    gridEl.className = 'game-grid';
    grid.forEach((card, i) => {
        gridEl.appendChild(renderCardSlot(card, pileHeights ? pileHeights[i] : null));
    });

    section.append(labelEl, gridEl);
    return section;
}

function renderFullDeck(deck, dealtFromPile) {
    const section = document.createElement('div');
    section.className = 'section';

    const totalDealt = 9 + dealtFromPile;

    const labelEl = document.createElement('div');
    labelEl.className = 'section-label';
    labelEl.textContent = `Deck — ${totalDealt}/52 dealt`;

    const pileWrapper = document.createElement('div');
    pileWrapper.className = 'pile-wrapper';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${(totalDealt / 52) * 100}%`;
    progressBar.appendChild(progressFill);

    const pileEl = document.createElement('div');
    pileEl.className = 'cards';
    deck.forEach((card, i) => {
        const cardEl = renderCard(card);
        if (i < 9) cardEl.classList.add('initial');
        else if (i >= 9 + dealtFromPile) cardEl.classList.add('undealt');
        pileEl.appendChild(cardEl);
    });

    pileWrapper.append(progressBar, pileEl);
    section.append(labelEl, pileWrapper);
    return section;
}

function renderStats(analysis) {
    const stats = document.createElement('div');
    stats.className = 'stats';

    const items = [
        { label: 'Matches', value: `${analysis.pairMatches}p + ${analysis.faceMatches}f = ${analysis.totalMatches}` },
        { label: 'Progress', value: `${analysis.stuckPoint}%` },
        { label: 'Cards Remaining', value: analysis.remaining },
    ];

    items.forEach(({ label, value }) => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `<span class="stat-label">${label}</span><span class="stat-value">${value}</span>`;
        stats.appendChild(item);
    });

    return stats;
}

function renderDetailView(deck, analysis, index) {
    const container = document.createElement('div');
    container.className = 'deck-detail';

    const header = document.createElement('div');
    header.className = 'deck-header';

    const title = document.createElement('h2');
    title.textContent = `Deck ${index + 1}`;

    const badge = document.createElement('span');
    badge.className = analysis.won ? 'badge win' : 'badge loss';
    badge.textContent = analysis.won ? 'Win' : `Stuck (${analysis.remaining} left)`;

    header.append(title, badge);
    container.append(header);
    container.append(renderGrid(analysis.finalGrid, 'Final Grid', analysis.pileHeights));
    container.append(renderStats(analysis));
    container.append(renderFullDeck(deck, analysis.dealtCount));

    return container;
}

function renderSummary(analyses, total) {
    const wins = analyses.filter(a => a.won).length;
    const losses = analyses.filter(a => !a.won);
    const winRate = (wins / total * 100).toFixed(2);

    const avgMatches = (analyses.reduce((sum, a) => sum + a.totalMatches, 0) / total).toFixed(1);
    const avgProgress = (analyses.reduce((sum, a) => sum + a.stuckPoint, 0) / total).toFixed(1);
    const avgRemainingOnLoss = losses.length > 0
        ? (losses.reduce((sum, a) => sum + a.remaining, 0) / losses.length).toFixed(1)
        : 0;

    const winsWith1Face = analyses.filter(a => a.won && a.faceMatches === 1).length;
    const winsWith3Face = analyses.filter(a => a.won && a.faceMatches === 3).length;

    const positionHits = new Array(9).fill(0);
    analyses.forEach(a => a.pileHeights.forEach((h, i) => positionHits[i] += h));
    const maxHits = Math.max(...positionHits);
    const minHits = Math.min(...positionHits);

    let positionGridHTML = '';
    for (let i = 0; i < 9; i++) {
        const intensity = (positionHits[i] - minHits) / (maxHits - minHits);
        const r = Math.round(42 + intensity * 40);
        const g = Math.round(74 + intensity * 40);
        const b = Math.round(58 + intensity * 40);
        positionGridHTML += `<div class="pos-cell" style="background: rgb(${r},${g},${b})">${positionHits[i].toLocaleString()}</div>`;
    }

    const el = document.createElement('div');
    el.className = 'summary';
    el.innerHTML = `
        <div class="summary-main">
            <span class="win">${wins.toLocaleString()} wins</span> / <span class="loss">${(total - wins).toLocaleString()} losses</span>
            <strong>(${winRate}% win rate)</strong>
        </div>
        <div class="summary-stats">
            <div class="stat-group">
                <span class="stat-label">Matches per game</span>
                <span class="stat-val">${avgMatches} avg</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Deck progress</span>
                <span class="stat-val">${avgProgress}% avg</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Cards left on loss</span>
                <span class="stat-val">${avgRemainingOnLoss} avg</span>
            </div>
        </div>
        <div class="position-section">
            <div class="stat-label">Grid activity</div>
            <div class="position-grid">${positionGridHTML}</div>
            <div class="position-note">Total cards placed at each grid position across all ${total.toLocaleString()} games. Position 0 and 1 see the most action because matching starts as soon as 2 cards are dealt.</div>
        </div>
        <div class="win-breakdown">
            <div class="stat-label">The math behind wins</div>
            <div class="breakdown-note">To win, you must deal all 43 cards from the deck. Each pair match uses 2 cards, each J+Q+K match uses 3. So: 2×pairs + 3×faces = 43. Since 43 is odd, you can only win with 1 or 3 face matches.</div>
            <div class="breakdown-row">
                <span class="breakdown-val">${winsWith1Face.toLocaleString()}</span>
                <span class="breakdown-desc">games won with 1 face match + 20 pair matches → final grid has 9 face cards</span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-val">${winsWith3Face.toLocaleString()}</span>
                <span class="breakdown-desc">games won with 3 face matches + 17 pair matches → final grid has 3 face cards</span>
            </div>
        </div>
    `;
    return el;
}

function renderCanvas(container, analyses, onSelectDeck) {
    const canvas = document.createElement('canvas');
    canvas.className = 'decks-canvas';
    container.appendChild(canvas);

    const total = analyses.length;
    const cols = 250;
    const rows = Math.ceil(total / cols);
    let canvasInfo = {};

    function draw() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const cellW = rect.width / cols;
        const cellH = rect.height / rows;

        analyses.forEach((analysis, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * cellW;
            const y = row * cellH;

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x, y, cellW, cellH);

            const progressW = cellW * (analysis.stuckPoint / 100);
            ctx.fillStyle = analysis.won ? '#2a4a3a' : '#4a2a2a';
            ctx.fillRect(x, y, progressW, cellH);
        });

        canvasInfo = { cols, rows, cellW, cellH };
    }

    draw();

    let mouseX = -1, mouseY = -1;

    function drawWithMagnifier() {
        draw();
        if (mouseX < 0 || mouseY < 0) return;

        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const { cols, cellW, cellH } = canvasInfo;
        const zoom = 3;
        const magRadius = 80;

        const centerCol = Math.floor(mouseX / cellW);
        const centerRow = Math.floor(mouseY / cellH);
        const zoomedW = cellW * zoom;
        const zoomedH = cellH * zoom;
        const cellsX = Math.ceil(magRadius / zoomedW) + 1;
        const cellsY = Math.ceil(magRadius / zoomedH) + 1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, magRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();
        ctx.clip();

        for (let dr = -cellsY; dr <= cellsY; dr++) {
            for (let dc = -cellsX; dc <= cellsX; dc++) {
                const col = centerCol + dc;
                const row = centerRow + dr;
                const index = row * cols + col;

                if (col < 0 || col >= cols || row < 0 || index < 0 || index >= analyses.length) continue;

                const analysis = analyses[index];
                const cellCenterX = (col + 0.5) * cellW;
                const cellCenterY = (row + 0.5) * cellH;
                const drawX = mouseX + (cellCenterX - mouseX) * zoom - zoomedW / 2;
                const drawY = mouseY + (cellCenterY - mouseY) * zoom - zoomedH / 2;

                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(drawX, drawY, zoomedW - 1, zoomedH - 1);

                const progressW = (zoomedW - 1) * (analysis.stuckPoint / 100);
                ctx.fillStyle = analysis.won ? '#2a4a3a' : '#4a2a2a';
                ctx.fillRect(drawX, drawY, progressW, zoomedH - 1);

                if (col === centerCol && row === centerRow) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX + 1, drawY + 1, zoomedW - 3, zoomedH - 3);
                }
            }
        }

        ctx.restore();
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, magRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        const col = Math.floor(mouseX / canvasInfo.cellW);
        const row = Math.floor(mouseY / canvasInfo.cellH);
        const index = row * canvasInfo.cols + col;

        if (index >= 0 && index < analyses.length) {
            onSelectDeck(index);
        }

        drawWithMagnifier();
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -1;
        mouseY = -1;
        draw();
    });

    window.addEventListener('resize', draw);
}
