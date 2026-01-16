const state = {
    decks: [],
    analyses: [],
    selectedIndex: null
};

const gridContainer = document.getElementById('decks-container');
const detailContainer = document.getElementById('detail-container');

function selectDeck(index) {
    if (index === state.selectedIndex) return;
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
        state.analyses.push(simulateDeck(deck));
    }

    gridContainer.innerHTML = '';
    detailContainer.innerHTML = '';

    gridContainer.appendChild(renderSummary(state.analyses, count));
    renderCanvas(gridContainer, state.analyses, selectDeck);
}

document.getElementById('generate-decks').addEventListener('click', () => generateDecks(100000));

const modal = document.getElementById('modal');
document.getElementById('help-btn').addEventListener('click', () => modal.classList.remove('hidden'));
modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

generateDecks(100000);
