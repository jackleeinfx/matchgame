// 內置的詞彙列表-------------------------------------------------------------------------------------

window.fallbackVocabulary_Medical = 
[
[1,"appointment","預約"],
[2,"prescription","處方"],
[3,"symptom","症狀"],
[4,"diagnosis","診斷"],
[5,"treatment","治療"],
[6,"medication","藥物"],
[7,"dosage","劑量"],
[8,"allergy","過敏"],
[9,"side effect","副作用"],
[10,"referral","轉診"],
[11,"specialist","專科醫生"],
[12,"primary care","初級醫療"],
[13,"general practitioner","全科醫生"],
[14,"emergency room","急診室"],
[15,"urgent care","緊急護理"],
]

// 內置的詞彙列表-------------------------------------------------------------------------------------




// 動態創建 vocabularies 對象
const vocabularies = Object.fromEntries(
    Object.entries(window).filter(([key]) => key.startsWith('fallbackVocabulary'))
);

// 在控制台輸出 vocabularies 對象，檢查是否包含所有預期的詞彙表
console.log(vocabularies);

let wordPairs = [];
let displayedCards = [];
let firstCard = null;
let secondCard = null;
let score = 0;

let processingAnimation = false;

// 在頁面加載完成後初始化下拉選單並開始遊戲
document.addEventListener('DOMContentLoaded', function() {
    initializeVocabularySelect();
    initializeVocabularyListSelect(); // 確保這行在這裡
    initializeRangeSlider();
    // 其他初始化代碼...
});

// 初始化詞彙表選擇下拉選單
function initializeVocabularySelect() {
    const select = document.getElementById('vocabularySelect');
    
    // 清空現有的選項
    select.innerHTML = '<option value="none">None</option>';

    for (const key in vocabularies) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace('fallbackVocabulary_', '');
        select.appendChild(option);
    }

    // 設置默認選項為 "None"
    select.value = "none";

    select.addEventListener('change', function() {
        if (this.value === "none") {
            console.log("No vocabulary selected");
            return;
        }
        const selectedVocabulary = vocabularies[this.value];
        processJsonData(selectedVocabulary);
        
        // 更新滑塊範圍
        const slider = document.getElementById('vocabularyRange');
        slider.noUiSlider.updateOptions({
            range: {
                'min': 1,
                'max': selectedVocabulary.length
            }
        });
        slider.noUiSlider.set([1, selectedVocabulary.length]);
    });
}

// 處理 JSON 數據
function processJsonData(jsonData) {
    const slider = document.getElementById('vocabularyRange');
    const selectedVocabularyKey = document.getElementById('vocabularySelect').value;
    const originalVocabulary = vocabularies[selectedVocabularyKey];
    
    slider.noUiSlider.updateOptions({
        range: {
            'min': 1,
            'max': originalVocabulary.length
        }
    });

    wordPairs = jsonData.map((item, index) => ({
        id: index.toString(),
        english: item[1],
        chinese: item[2]
    }));
    initializeGame();
    showMessage('遊戲已開始!');
}

// 處理上傳的 JSON 文件
document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                processJsonData(jsonData);
            } catch (error) {
                console.error('解析 JSON 文件時出錯:', error);
                showMessage('載入文件時發生錯誤。請確保文件格式正確。');
            }
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
    card.classList.add('card', column);
    
    if (column === 'left') {
        const imageButton = document.createElement('button');
        imageButton.classList.add('image-button');
        imageButton.innerHTML = '🖼️';
        imageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = document.getElementById('imageModal');
            if (modal.style.display === 'block' && modal.dataset.currentWord === content) {
                modal.style.display = 'none';
            } else {
                showImage(content);
                modal.dataset.currentWord = content;
            }
        });
        card.appendChild(imageButton);
    }
    
    const textSpan = document.createElement('span');
    textSpan.innerText = content;
    card.appendChild(textSpan);
    
    card.dataset.pair = id;

    if (/^[a-zA-Z\s]+$/.test(content)) {
        card.addEventListener('click', () => {
            speakText(content);
            handleCardClick(card);
        });
    } else {
        card.addEventListener('click', () => handleCardClick(card));
    }

    return card;
}

// 修改 speakText 函數
function speakText(text) {
    const ttsSelect = document.getElementById('ttsSelect');
    const selectedTTS = ttsSelect.value;

    if (selectedTTS === 'browser') {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    } else if (selectedTTS === 'google') {
        const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`);
        audio.play().catch(error => {
            console.error('Error playing Google TTS:', error);
            // 如果 Google TTS 失敗，回退到瀏覽器 TTS
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        });
    }
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
    const newPairs = getRandomPairs(1);
    
    if (newPairs.length > 0) {
        const newPair = newPairs[0];
        gameContainer.appendChild(createCard(newPair.english, newPair.id, 'left'));  // 左列
        gameContainer.appendChild(createCard(newPair.chinese, newPair.id, 'right')); // 右列
        shuffleCards(gameContainer);
    } else {
        console.log('所有單詞都已使用完畢');
        // 可以在這裡添加遊戲結束的邏輯
    }
}

function getRandomPairs(numPairs) {
    // 如果所有單詞都已經顯示過，重置 displayedCards
    if (displayedCards.length >= wordPairs.length) {
        displayedCards = [];
    }

    const availablePairs = wordPairs.filter(pair => !displayedCards.some(displayedPair => displayedPair.id === pair.id));
    const selectedPairs = [];

    for (let i = 0; i < numPairs && availablePairs.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePairs.length);
        const selectedPair = availablePairs.splice(randomIndex, 1)[0];
        selectedPairs.push(selectedPair);
        displayedCards.push(selectedPair);
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

// 顯示消息的函數
function showMessage(message) {
    alert(message);
}

// 修改 initializeRangeSlider 函數
function initializeRangeSlider() {
    const slider = document.getElementById('vocabularyRange');
    const applyButton = document.getElementById('applyRange');
    const minInput = document.getElementById('minRangeInput');
    const maxInput = document.getElementById('maxRangeInput');

    noUiSlider.create(slider, {
        start: [1, 30],
        connect: true,
        range: {
            'min': 1,
            'max': 100
        },
        step: 1,
        format: {
            to: function (value) {
                return Math.round(value);
            },
            from: function (value) {
                return Number(value);
            }
        }
    });

    // 當滑塊值改變時更新輸入框
    slider.noUiSlider.on('update', function (values, handle) {
        minInput.value = Math.round(values[0]);
        maxInput.value = Math.round(values[1]);
    });

    // 當輸入框值改變時更新滑塊
    document.getElementById('minRangeInput').addEventListener('change', function() {
        const min = parseInt(this.value);
        const max = parseInt(document.getElementById('maxRangeInput').value);
        if (min > max) {
            this.value = max;
            slider.noUiSlider.set([max, max]);
        } else {
            slider.noUiSlider.set([min, max]);
        }
    });

    document.getElementById('maxRangeInput').addEventListener('change', function() {
        const min = parseInt(document.getElementById('minRangeInput').value);
        const max = parseInt(this.value);
        if (max < min) {
            this.value = min;
            slider.noUiSlider.set([min, min]);
        } else {
            slider.noUiSlider.set([min, max]);
        }
    });

    applyButton.addEventListener('click', function() {
        const min = parseInt(document.getElementById('minRangeInput').value);
        const max = parseInt(document.getElementById('maxRangeInput').value);
        applyVocabularyRange(min, max);
    });

    // 在初始化後立即應用 1-30 的範圍
    applyVocabularyRange(1, 30);
}

// 修改 applyVocabularyRange 函數
function applyVocabularyRange(start, end) {
    const selectedVocabularyKey = document.getElementById('vocabularySelect').value;
    const originalVocabulary = vocabularies[selectedVocabularyKey];
    const rangedVocabulary = originalVocabulary.slice(start - 1, end);
    processJsonData(rangedVocabulary);
    showMessage(`已應用單詞範圍: ${start} - ${end}`);
}

// 在文件頂部添加 Pixabay API 密鑰
const PIXABAY_API_KEY = '46481672-c86f0353c7aa5be69bdef1d93';

// 添加顯示圖片的函數
let currentImages = [];
let currentImageIndex = 0;

// 添加獲取例句的函數
async function getExampleSentence(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].meanings && data[0].meanings[0] && data[0].meanings[0].definitions) {
            const definition = data[0].meanings[0].definitions.find(def => def.example);
            return definition ? definition.example : '沒有找到例句。';
        }
        return '沒有找到例句。';
    } catch (error) {
        console.error('Error fetching example sentence:', error);
        return '獲取例句時出錯。';
    }
}

// 修改 showImage 函數
async function showImage(word) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const wordDisplay = document.getElementById('wordDisplay');
    const exampleSentenceDisplay = document.getElementById('exampleSentenceDisplay');
    
    modal.style.display = 'block';
    modalImage.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    // 查找對應的中文翻譯
    const wordPair = wordPairs.find(pair => pair.english === word);
    const chineseTranslation = wordPair ? wordPair.chinese : '無翻譯';
    
    // 更新單詞顯示
    wordDisplay.innerHTML = `<strong>${word}</strong> - ${chineseTranslation}`;

    // 獲取並顯示例句
    const exampleSentence = await getExampleSentence(word);
    exampleSentenceDisplay.textContent = `例句：${exampleSentence}`;

    try {
        const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(word)}&image_type=photo&per_page=10`);
        const data = await response.json();
        currentImages = data.hits.map(hit => hit.webformatURL);
        currentImageIndex = 0;

        if (currentImages.length > 0) {
            displayNextImage();
        } else {
            modalImage.src = 'path/to/no-image-found.jpg';
            modalImage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        modalImage.src = 'path/to/error-image.jpg';
        modalImage.style.display = 'block';
    }

    loadingSpinner.style.display = 'none';
}
function displayNextImage() {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = currentImages[currentImageIndex];
    modalImage.style.display = 'block';
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
}

// 在文件底部添加以下代碼
document.addEventListener('DOMContentLoaded', function() {
    // ... 現有的代碼 ...

    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <div id="wordDisplay"></div>
            <div id="exampleSentenceDisplay"></div>
            <img id="modalImage" src="" alt="Word Image">
            <div id="loadingSpinner">Loading...</div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    const modalImage = document.getElementById('modalImage');
    modalImage.addEventListener('click', displayNextImage);

    // 添加這個事件監聽器來處理點擊其他單詞時關閉圖片模態框
    document.getElementById('game-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('card') || e.target.closest('.card')) {
            const modal = document.getElementById('imageModal');
            modal.style.display = 'none';
        }
    });

    // 初始化TTS選擇下拉選單
    const ttsSelect = document.getElementById('ttsSelect');
    ttsSelect.addEventListener('change', function() {
        console.log('Selected TTS:', this.value);
    });
});

// 初始化展開單字列表下拉選單
function initializeVocabularyListSelect() {
    const select = document.getElementById('vocabularyListSelect');
    
    // 清空現有的選項
    select.innerHTML = '<option value="">請選擇單字列表</option>';
    
    for (const key in vocabularies) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace('fallbackVocabulary_', '');
        select.appendChild(option);
    }

    select.addEventListener('change', function() {
        displayVocabularyList(this.value);
    });
}

function displayVocabularyList(vocabularyKey) {
    const display = document.getElementById('vocabularyListDisplay');
    const title = document.getElementById('vocabularyListTitle');
    const list = document.getElementById('vocabularyList');
    
    if (!vocabularyKey) {
        display.style.display = 'none';
        return;
    }

    const vocabulary = vocabularies[vocabularyKey];
    
    title.textContent = vocabularyKey.replace('fallbackVocabulary_', '');
    list.innerHTML = '';
    
    vocabulary.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item[1]} - ${item[2]}`;
        list.appendChild(li);
    });

    display.style.display = 'block';
}



