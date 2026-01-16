const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
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

function simulateDeck(deck) {
    const grid = new Array(9).fill(null);
    const pileHeights = new Array(9).fill(0);
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
                const move = validMoves[0];

                if (move.type === 'pair') pairMatches++;
                else faceMatches++;

                for (const index of move.indices) {
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

    const won = drawPile.length === 0;
    const remaining = drawPile.length;

    return {
        won,
        finalGrid: [...grid],
        pileHeights,
        dealtCount: 43 - remaining,
        remaining,
        pairMatches,
        faceMatches,
        totalMatches: pairMatches + faceMatches,
        stuckPoint: won ? 100 : Math.round(((43 - remaining) / 43) * 100)
    };
}
