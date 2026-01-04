const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = new Set(['♥', '♦']);

const CARD_VALUES = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 0, 'Q': 0, 'K': 0
};

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

function shuffle(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function cardKey(card) {
    return `${card.value}${card.suit}`;
}

function getShuffleScore(deck) {
    const ordered = createDeck();
    let displacement = 0;
    for (let i = 0; i < deck.length; i++) {
        const originalIndex = ordered.findIndex(c => cardKey(c) === cardKey(deck[i]));
        displacement += Math.abs(i - originalIndex);
    }
    const maxDisplacement = deck.length * deck.length / 2;
    return Math.round((displacement / maxDisplacement) * 100);
}

function findValidMoves(grid) {
    const moves = [];
    const cards = grid.map((card, i) => card ? { card, index: i } : null).filter(Boolean);

    for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
            const v1 = CARD_VALUES[cards[i].card.value];
            const v2 = CARD_VALUES[cards[j].card.value];
            if (v1 > 0 && v2 > 0 && v1 + v2 === 11) {
                moves.push({ type: 'pair', indices: [cards[i].index, cards[j].index] });
            }
        }
    }

    const jacks = cards.filter(c => c.card.value === 'J');
    const queens = cards.filter(c => c.card.value === 'Q');
    const kings = cards.filter(c => c.card.value === 'K');

    for (const j of jacks) {
        for (const q of queens) {
            for (const k of kings) {
                moves.push({ type: 'face', indices: [j.index, q.index, k.index].sort((a, b) => a - b) });
            }
        }
    }

    return moves;
}

function simulateDeck(deck, randomMoves = false) {
    const grid = [null, null, null, null, null, null, null, null, null];
    const pileHeights = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const drawPile = [...deck];
    let pairMatches = 0;
    let faceMatches = 0;

    function resolve() {
        let changed = true;
        while (changed) {
            changed = false;
            const moves = findValidMoves(grid);
            const validMoves = moves.filter(m => drawPile.length >= m.indices.length);

            if (validMoves.length > 0) {
                const validMove = randomMoves
                    ? validMoves[Math.floor(Math.random() * validMoves.length)]
                    : validMoves[0];

                if (validMove.type === 'pair') pairMatches++;
                else faceMatches++;

                for (const index of validMove.indices) {
                    grid[index] = drawPile.shift();
                    pileHeights[index]++;
                }
                changed = true;
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        grid[i] = drawPile.shift();
        pileHeights[i] = 1;
        resolve();
    }

    resolve();

    const won = drawPile.length === 0;
    const remaining = drawPile.length;
    const stuckPoint = won ? 100 : Math.round(((43 - remaining) / 43) * 100);
    const maxPileHeight = Math.max(...pileHeights);
    const avgPileHeight = pileHeights.reduce((a, b) => a + b, 0) / 9;
    const hottestPosition = pileHeights.indexOf(maxPileHeight);

    const finalFaceCards = grid.filter(c =>
        c && (c.value === 'J' || c.value === 'Q' || c.value === 'K')
    ).length;

    return {
        won,
        finalGrid: [...grid],
        pileHeights,
        dealtCount: 43 - remaining,
        remaining,
        pairMatches,
        faceMatches,
        totalMatches: pairMatches + faceMatches,
        finalFaceCards,
        stuckPoint,
        maxPileHeight,
        avgPileHeight,
        hottestPosition
    };
}

function analyzeDeck(deck) {
    return simulateDeck(deck);
}

function renderCard(card) {
    const el = document.createElement('div');
    el.className = `card ${RED_SUITS.has(card.suit) ? 'red' : 'black'}`;
    el.innerHTML = `<span class="value">${card.value}</span><span class="suit">${card.suit}</span>`;
    return el;
}

function renderCardSlot(card, height = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-slot';

    let cardEl;
    if (card) {
        cardEl = renderCard(card);
    } else {
        cardEl = document.createElement('div');
        cardEl.className = 'card empty';
    }

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
        const height = pileHeights ? pileHeights[i] : null;
        gridEl.appendChild(renderCardSlot(card, height));
    });

    section.append(labelEl, gridEl);
    return section;
}

function renderFullDeck(deck, dealtFromPile) {
    const section = document.createElement('div');
    section.className = 'section';

    const labelEl = document.createElement('div');
    labelEl.className = 'section-label';
    const totalDealt = 9 + dealtFromPile;
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
        if (i < 9) {
            cardEl.classList.add('initial');
        } else if (i >= 9 + dealtFromPile) {
            cardEl.classList.add('undealt');
        }
        pileEl.appendChild(cardEl);
    });

    pileWrapper.append(progressBar, pileEl);
    section.append(labelEl, pileWrapper);
    return section;
}


function renderStats(analysis) {
    const stats = document.createElement('div');
    stats.className = 'stats';

    const statItems = [
        {
            label: 'Matches',
            value: `${analysis.pairMatches}p + ${analysis.faceMatches}f = ${analysis.totalMatches}`,
            title: 'Total matches made. "p" = pair matches (two cards summing to 11), "f" = face matches (J+Q+K trios)'
        },
        {
            label: 'Progress',
            value: `${analysis.stuckPoint}%`,
            title: 'How far through the draw pile. 100% = win (pile emptied)'
        },
        {
            label: 'Cards Remaining',
            value: analysis.remaining,
            title: 'Cards left in the draw pile when the game ended'
        },
        {
            label: 'Face Cards (final)',
            value: analysis.finalFaceCards,
            title: 'J/Q/K cards stuck in the final grid. These were never matched as a J+Q+K trio'
        },
        {
            label: 'Max Pile Height',
            value: analysis.maxPileHeight,
            title: 'Tallest stack at any grid position. Shows which spot saw the most action'
        },
        {
            label: 'Hottest Position',
            value: analysis.hottestPosition + 1,
            title: 'Grid position (1-9) with the most cards stacked. 1-3 top row, 4-6 middle, 7-9 bottom'
        },
    ];

    statItems.forEach(({ label, value, title }) => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.title = title;
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

    const resultBadge = document.createElement('span');
    if (analysis.won) {
        resultBadge.className = 'badge win';
        resultBadge.textContent = 'Win';
    } else {
        resultBadge.className = 'badge loss';
        resultBadge.textContent = `Stuck (${analysis.remaining} left)`;
    }

    header.append(title, resultBadge);
    container.append(header);

    container.append(renderGrid(analysis.finalGrid, 'Final Grid', analysis.pileHeights));
    container.append(renderStats(analysis));
    container.append(renderFullDeck(deck, analysis.dealtCount));

    return container;
}

const state = {
    decks: [],
    analyses: [],
    selectedIndex: null
};

const gridContainer = document.getElementById('decks-container');
const detailContainer = document.getElementById('detail-container');

function selectDeck(index) {
    state.selectedIndex = index;

    detailContainer.innerHTML = '';
    if (index !== null && index < state.analyses.length) {
        detailContainer.appendChild(
            renderDetailView(state.decks[index], state.analyses[index], index)
        );
    }
}

function generateDecks(count) {
    state.decks = [];
    state.analyses = [];
    state.selectedIndex = null;

    for (let i = 0; i < count; i++) {
        const deck = shuffle(createDeck());
        state.decks.push(deck);
        state.analyses.push(analyzeDeck(deck));
    }

    renderAll();
}

function renderAll() {
    gridContainer.innerHTML = '';
    detailContainer.innerHTML = '';

    const wins = state.analyses.filter(a => a.won).length;
    const losses = state.analyses.filter(a => !a.won);
    const total = state.analyses.length;
    const winRate = (wins / total * 100).toFixed(2);

    // Aggregate stats
    const avgMatches = (state.analyses.reduce((sum, a) => sum + a.totalMatches, 0) / total).toFixed(1);
    const avgProgress = (state.analyses.reduce((sum, a) => sum + a.stuckPoint, 0) / total).toFixed(1);
    const avgRemainingOnLoss = losses.length > 0
        ? (losses.reduce((sum, a) => sum + a.remaining, 0) / losses.length).toFixed(1)
        : 0;

    // Face match distribution for wins
    const winsWith1Face = state.analyses.filter(a => a.won && a.faceMatches === 1).length;
    const winsWith3Face = state.analyses.filter(a => a.won && a.faceMatches === 3).length;

    // Position heat map - cards placed per position
    const positionHits = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    state.analyses.forEach(a => {
        a.pileHeights.forEach((h, i) => positionHits[i] += h);
    });
    const maxHits = Math.max(...positionHits);
    const minHits = Math.min(...positionHits);

    // Build position grid HTML
    const positionLabels = ['Top-left', 'Top', 'Top-right', 'Left', 'Center', 'Right', 'Bottom-left', 'Bottom', 'Bottom-right'];
    let positionGridHTML = '';
    for (let i = 0; i < 9; i++) {
        const intensity = (positionHits[i] - minHits) / (maxHits - minHits);
        const r = Math.round(42 + intensity * 40);
        const g = Math.round(74 + intensity * 40);
        const b = Math.round(58 + intensity * 40);
        positionGridHTML += `<div class="pos-cell" style="background: rgb(${r},${g},${b})" title="${positionLabels[i]}: ${positionHits[i].toLocaleString()} cards">${positionHits[i].toLocaleString()}</div>`;
    }

    const summaryEl = document.createElement('div');
    summaryEl.className = 'summary';
    summaryEl.innerHTML = `
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
    gridContainer.appendChild(summaryEl);

    const canvas = document.createElement('canvas');
    canvas.className = 'decks-canvas';
    gridContainer.appendChild(canvas);

    const cols = 250;
    const rows = Math.ceil(total / cols);

    function draw() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const cellW = rect.width / cols;
        const cellH = rect.height / rows;

        state.analyses.forEach((analysis, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * cellW;
            const y = row * cellH;

            // Background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x, y, cellW, cellH);

            // Progress fill
            const progressW = cellW * (analysis.stuckPoint / 100);
            ctx.fillStyle = analysis.won ? '#2a4a3a' : '#4a2a2a';
            ctx.fillRect(x, y, progressW, cellH);
        });

        state.canvasInfo = { cols, rows, cellW, cellH };
    }

    draw();

    let mouseX = -1, mouseY = -1;

    function drawWithMagnifier() {
        draw();

        if (mouseX < 0 || mouseY < 0) return;

        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const { cols, cellW, cellH } = state.canvasInfo;
        const zoom = 3;
        const magRadius = 80;

        const centerCol = Math.floor(mouseX / cellW);
        const centerRow = Math.floor(mouseY / cellH);

        const zoomedW = cellW * zoom;
        const zoomedH = cellH * zoom;

        // How many cells fit in the magnifier
        const cellsX = Math.ceil(magRadius / zoomedW) + 1;
        const cellsY = Math.ceil(magRadius / zoomedH) + 1;

        // Draw magnifier background
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, magRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();
        ctx.clip();

        // Draw zoomed cells centered on mouse
        for (let dr = -cellsY; dr <= cellsY; dr++) {
            for (let dc = -cellsX; dc <= cellsX; dc++) {
                const col = centerCol + dc;
                const row = centerRow + dr;
                const index = row * cols + col;

                if (col < 0 || col >= cols || row < 0 || index < 0 || index >= state.analyses.length) continue;

                const analysis = state.analyses[index];

                // Position relative to center of magnifier
                const cellCenterX = (col + 0.5) * cellW;
                const cellCenterY = (row + 0.5) * cellH;
                const drawX = mouseX + (cellCenterX - mouseX) * zoom - zoomedW / 2;
                const drawY = mouseY + (cellCenterY - mouseY) * zoom - zoomedH / 2;

                // Background
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(drawX, drawY, zoomedW - 1, zoomedH - 1);

                // Progress fill
                const progressW = (zoomedW - 1) * (analysis.stuckPoint / 100);
                ctx.fillStyle = analysis.won ? '#2a4a3a' : '#4a2a2a';
                ctx.fillRect(drawX, drawY, progressW, zoomedH - 1);

                // Highlight selected cell
                if (col === centerCol && row === centerRow) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX + 1, drawY + 1, zoomedW - 3, zoomedH - 3);
                }
            }
        }

        // Draw magnifier border
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
        const { cols, cellW, cellH } = state.canvasInfo;

        const col = Math.floor(mouseX / cellW);
        const row = Math.floor(mouseY / cellH);
        const index = row * cols + col;

        if (index >= 0 && index < state.analyses.length && index !== state.selectedIndex) {
            selectDeck(index);
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

document.getElementById('generate-decks').addEventListener('click', () => generateDecks(100000));

const modal = document.getElementById('modal');
document.getElementById('help-btn').addEventListener('click', () => {
    modal.classList.remove('hidden');
});
modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.add('hidden');
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

generateDecks(100000);
