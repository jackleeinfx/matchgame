let wordPairs = [];
let displayedCards = [];
let firstCard = null;
let secondCard = null;
let score = 0;

let processingAnimation = false; // Track if animation is in progress

// Process uploaded .txt file
document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            wordPairs = text.trim().split('\n').map(line => {
                const parts = line.split('@');
                return { id: parts[0], english: parts[1], chinese: parts[2] };
            });
            initializeGame();
        };
        reader.readAsText(file);
    }
});

document.getElementById('fadeDuration').addEventListener('input', function() {
    const fadeValue = document.getElementById('fadeDuration').value;
    document.getElementById('fadeValue').innerText = fadeValue;
});


// Initialize the game by populating the cards
function initializeGame() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '';
    displayedCards = [];

    const randomPairs = getRandomPairs(5); // Change 5 to any number of pairs you want displayed
    randomPairs.forEach(pair => {
        displayedCards.push(pair);
        gameContainer.appendChild(createCard(pair.english, pair.id, 'left'));  // Left column (English)
        gameContainer.appendChild(createCard(pair.chinese, pair.id, 'right')); // Right column (Chinese)
    });

    shuffleCards(gameContainer);
}

function createCard(content, id, column) {
    const card = document.createElement('div');
    card.classList.add('card', column); // Assign left or right based on the column
    card.innerText = content;
    card.dataset.pair = id;

    // Play pronunciation immediately if it's an English word
    if (/^[a-zA-Z\s]+$/.test(content)) {
        card.addEventListener('click', () => {
            speakText(content);  // Instant speech synthesis for English words
            handleCardClick(card);  // Proceed to handle the game logic
        });
    } else {
        card.addEventListener('click', () => handleCardClick(card));
    }

    return card;
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set the language to English (US)
    speechSynthesis.speak(utterance);
}


function handleCardClick(clickedCard) {
    if (processingAnimation) return; // Prevent interaction during animation setup but allow during animation

    if (!firstCard) {
        firstCard = clickedCard;
        firstCard.style.backgroundColor = '#a5d6a7';
    } else if (!secondCard && clickedCard !== firstCard) {
        secondCard = clickedCard;
        secondCard.style.backgroundColor = '#a5d6a7';

        if (firstCard.dataset.pair === secondCard.dataset.pair) {
            score++;
            document.getElementById('score').innerText = 'Score: ' + score;

            const fadeDuration = document.getElementById('fadeDuration').value * 1000;

            // Start fade-out animation without blocking the game
            processingAnimation = true;
            setTimeout(() => {
                firstCard.style.transition = `opacity ${fadeDuration / 1000}s ease-out`;
                secondCard.style.transition = `opacity ${fadeDuration / 1000}s ease-out`;

                firstCard.style.opacity = '0';
                secondCard.style.opacity = '0';
            }, 500);

            // Ensure the cards are removed after the animation completes
            setTimeout(() => {
                firstCard.remove();
                secondCard.remove();
                firstCard = null;
                secondCard = null;

                // Trigger the replacement of new word pairs after animation ends
                replaceMatchedCards();
                processingAnimation = false; // Reset the flag allowing interaction
            }, 500 + fadeDuration); // Total delay = initial delay + fade animation
        } else {
            setTimeout(() => {
                firstCard.style.backgroundColor = '';
                secondCard.style.backgroundColor = '';
                firstCard = null;
                secondCard = null;
            }, 1000);
        }
    }
}


function replaceMatchedCards() {
    const gameContainer = document.getElementById('game-container');
    const newPair = getRandomPairs(1)[0];
    gameContainer.appendChild(createCard(newPair.english, newPair.id, 'left'));  // Left column
    gameContainer.appendChild(createCard(newPair.chinese, newPair.id, 'right')); // Right column
    shuffleCards(gameContainer);
}

function getRandomPairs(numPairs) {
    const availablePairs = wordPairs.filter(pair => !displayedCards.includes(pair));
    const selectedPairs = [];
    for (let i = 0; i < numPairs; i++) {
        const randomIndex = Math.floor(Math.random() * availablePairs.length);
        selectedPairs.push(availablePairs.splice(randomIndex, 1)[0]);
    }
    return selectedPairs;
}

// Shuffle cards in the game container
function shuffleCards(container) {
    const cards = Array.from(container.children);

    // Split the cards into two groups (left and right columns)
    const leftColumnCards = cards.filter(card => card.classList.contains('left'));  // Left column
    const rightColumnCards = cards.filter(card => card.classList.contains('right')); // Right column

    // Shuffle each column independently using the Fisher-Yates shuffle algorithm
    shuffleArray(leftColumnCards);
    shuffleArray(rightColumnCards);

    // Clear the container
    container.innerHTML = '';

    // Rebuild the container with the shuffled left and right columns
    for (let i = 0; i < leftColumnCards.length; i++) {
        container.appendChild(leftColumnCards[i]);  // Append left column cards
        if (rightColumnCards[i]) {
            container.appendChild(rightColumnCards[i]);  // Append right column cards
        }
    }
}

// Fisher-Yates shuffle algorithm to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

