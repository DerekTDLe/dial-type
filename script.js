const textToTypeElement = document.getElementById('text-to-type');
const dummyLine = document.getElementById('dummy-line');
randoList = [];
const inputBox = document.getElementById('input-box');
const result = document.getElementById('result');
const phoneNumberInput = document.getElementById('phone-number-input');
let wordList = [];
let currentWordIndex = 0;
let typedWords = [];
let startTime = null;
let prevResult = '';
let timer = null;
let totalCorrectCharacters = 0; // Global variable for correct character count
let totalCharacters = 0; // Global variable for total characters in the text
TEST_DURATION = 30000; // 30 seconds

// Fetch word list from JSON
fetch('english.json')
    .then(response => response.json())
    .then(data => {
        wordList = data.words;
        initialize(); // Initialize after loading words
    })
    .catch(error => console.error('Error loading word list:', error));

function getRandomWords(numWords) {
    let words = [];
    for (let i = 0; i < numWords; i++) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        words.push(wordList[randomIndex]);
    }
    return words;
}

function setTestDuration(duration) {
    TEST_DURATION = duration;
    initialize();
}

// Initialize the text display and state
function initialize() {
    if (wordList.length === 0) return;

    textToTypeElement.innerHTML = '';
    typedWords = [];
    currentWordIndex = 0;
    startTime = null;
    //result default inner text
    resultDefault = 'WPM: x | Accuracy: x% | Time:' + TEST_DURATION/1000 + ' sec | Correct Characters: x';
    result.innerText = resultDefault;
    inputBox.value = '';
    inputBox.disabled = false;
    
    // Clear previous timer
    clearTimeout(timer);

    // Generate and display the initial line of text
    updateLine();
}

function updateLine() {
    wordsForTest = getRandomWords(10); // Generate 20 words for the test
    if (randoList.length === 0) {
        randoList = wordsForTest;
        dummyLine.innerHTML = randoList.map(word => `<span class="word">${word}</span>`).join(' ');
        wordsForTest = getRandomWords(10);
    }

    const line = document.createElement('p');
    line.id = 'line';
    line.innerHTML = randoList.map(word => `<span class="word">${word}</span>`).join(' ');

    textToTypeElement.appendChild(line);
    randoList = wordsForTest;
    dummyLine.innerHTML = randoList.map(word => `<span class="word">${word}</span>`).join(' ');

    // Update totalCharacters with the length of the current line
    totalCharacters += wordsForTest.join(' ').replace(/ /g, '').length;

    // Highlight the first word
    line.children[0]?.classList.add('current');

    // Reset the current word index for the new line
    currentWordIndex = 0;
}

function getCurrentWordSpan() {
    const line = document.getElementById('line');
    return line ? line.children[currentWordIndex] : null;
}

function checkTyping(event) {
    const typedText = inputBox.value.trim();

    // Start the timer as soon as the first key is pressed
    if (!startTime) {
        startTime = new Date();
        timer = setTimeout(endTest, TEST_DURATION); // Start the test duration timer here
        wpmInterval = setInterval(updateWPM, 1000); // Update WPM every second
    }

    if (event.inputType === 'insertText' && event.data === ' ' || typedText.includes(' ')) {
        const currentWordSpan = getCurrentWordSpan();
        if (!currentWordSpan) {
            return; // Exit if there’s no current word span
        }

        const typedWord = typedText.trim();

        if (typedWord === currentWordSpan.innerText.trim()) {
            currentWordSpan.classList.remove('current');
            currentWordSpan.classList.add('correct');
            typedWords.push(typedWord);  // Add the correctly typed word to the list
        } else {
            currentWordSpan.classList.remove('current');
            currentWordSpan.classList.add('incorrect');
            typedWords.push(typedWord);  // Even add the incorrectly typed word to keep track of attempts
        }

        inputBox.value = '';  // Clear the input box
        currentWordIndex++;   // Move to the next word

        // Update WPM calculations after each word is completed
        updateWPM();

        // Update the current word
        updateCurrentWord();

        // Check if the current line is complete
        const line = document.getElementById('line');
        if (line && Array.from(line.children).every(child => child.classList.contains('correct') || child.classList.contains('incorrect'))) {
            // Calculate correct characters for the finished line
            const correctCharacters = Array.from(line.children)
                .filter(child => child.classList.contains('correct'))
                .map(child => child.innerText.trim())
                .reduce((sum, word) => sum + word.length, 0);

            totalCorrectCharacters += correctCharacters; // Accumulate correct characters

            // Remove the finished line and replace it with a new line
            textToTypeElement.removeChild(line);

            // Generate and add a new line
            updateLine();
        }
    }
}
// Function to update WPM and predicted WPM
function updateWPM() {
    const currentTime = new Date();
    const timeElapsedInMinutes = (currentTime - startTime) / 1000 / 60; // Time in minutes
    //calculate total correct characters by adding the length of each correct word in the typedWords array
    totalCorrectCharacters = typedWords.reduce((sum, word) => sum + word.length, 0);
    
    // Ensure at least 1 second has passed to prevent initial high spikes
    const safeTimeElapsed = Math.max(timeElapsedInMinutes, 1 / 60);

    // Calculate current WPM based on words typed so far
    const currentWPM = (totalCorrectCharacters/5 / safeTimeElapsed);

    // Calculate predicted final WPM using average typing speed
    const totalTimeInMinutes = TEST_DURATION / 1000 / 60; // Total time in minutes
    //const predictedWPM = (typedWords.length / timeElapsedInMinutes) * (timeElapsedInMinutes / totalTimeInMinutes);
    const predictedWPM = (totalCorrectCharacters / 5) / (totalTimeInMinutes);

    // Update the WPM displays
    document.getElementById('current-wpm').innerText = `Current WPM: ${currentWPM.toFixed(2)}`;
    document.getElementById('predicted-wpm').innerText = `Predicted Final WPM: ${predictedWPM.toFixed(2)}`;
}


function updateCurrentWord() {
    const line = document.getElementById('line');
    if (line && currentWordIndex < line.childElementCount) {
        line.children[currentWordIndex]?.classList.add('current');
    }
}

function endTest() {
    inputBox.disabled = true;
    clearTimeout(timer); // Clear the timer
    clearInterval(wpmInterval); // Clear the WPM update interval

    const endTime = new Date();
    const timeTaken = (endTime - startTime) / 1000; // in seconds

    // Calculate WPM and accuracy
    const wpm = (totalCorrectCharacters / 5) / (timeTaken / 60);
    const accuracy = totalCharacters > 0 ? (totalCorrectCharacters / totalCharacters) * 100 : 0;

    // Display the time taken for the test explicitly
    result.innerText = `WPM: ${wpm.toFixed(2)} | Accuracy: ${accuracy.toFixed(2)}% | Time taken: ${timeTaken.toFixed(2)} sec | Correct Characters: ${totalCorrectCharacters}`;

    if (phoneNumberInput.textContent === 'Start a test to begin') {
        phoneNumberInput.textContent = '';
    }
    let newWpm = Math.round(wpm);
    phoneNumberInput.textContent += newWpm;
    prevResult = newWpm;
    phoneNumberInput.textContent = phoneNumberInput.textContent.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

function sendPhoneNumber() {
    let phoneNumber = phoneNumberInput.textContent;
    let phoneNumberSent = document.createElement('p');
    phoneNumberSent.textContent = 'Phone number ' + phoneNumber + ' has been sent!';
    document.getElementById('phone-number').appendChild(phoneNumberSent);
    phoneNumberInput.textContent = '';
}

function resetPhoneNumber() {
    phoneNumberInput.textContent = '';
}

function undo() {
    phoneNumberInput.textContent = phoneNumberInput.textContent.replace(prevResult, '');
    prevResult = '';
}

function nextText() {
    //set the counters to zero 
    totalCorrectCharacters = 0;
    totalCharacters = 0;
    initialize();
}
