document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('statusDisplay');
    const restartButton = document.getElementById('restartButton');
    const startButton = document.getElementById('startButton');
    const modeRadios = document.querySelectorAll('input[name="gameMode"]'); // Get all mode radios
    const gameBoard = document.getElementById('gameBoard');
    const controlElements = document.querySelector('.controls');
    const symbolChoiceContainer = document.getElementById('symbolChoiceContainer');
    const symbolRadios = document.querySelectorAll('input[name="playerSymbolChoice"]'); // Get symbol choice radios

    // --- Game State Variables ---
    let boardState = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X'; // X always starts the game logic
    let gameActive = false;
    let currentMode = 'pvp';
    let playerSymbol = 'X';   // Human player's symbol (default X)
    let computerSymbol = 'O'; // Computer's symbol (default O)
    let computerTurnTimeout;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const displayMessage = (message) => {
        statusDisplay.textContent = message;
    };

    // --- Function to show/hide symbol choice based on mode ---
    const handleModeChange = () => {
        const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
        if (selectedMode === 'pvc') {
            symbolChoiceContainer.classList.remove('hidden');
        } else {
            symbolChoiceContainer.classList.add('hidden');
        }
        currentMode = selectedMode; // Update currentMode immediately on change
    };

    const startGame = () => {
        // currentMode is already updated by handleModeChange
        gameActive = true;
        currentPlayer = 'X'; // X always logically starts
        boardState = ['', '', '', '', '', '', '', '', ''];

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'occupied', 'winning-cell');
            cell.style.cursor = 'pointer'; // Reset cursor
             // Remove potential old listener before adding a new one
            cell.removeEventListener('click', handleCellClick);
            cell.addEventListener('click', handleCellClick);
        });

        let initialStatus = '';

        // --- Determine Player and Computer Symbols for PvC ---
        if (currentMode === 'pvc') {
            playerSymbol = document.querySelector('input[name="playerSymbolChoice"]:checked').value;
            computerSymbol = (playerSymbol === 'X') ? 'O' : 'X';
            initialStatus = `Mode: PvC (You are ${playerSymbol}) | `;
        } else if (currentMode === 'pvp') {
            playerSymbol = 'X'; // Not strictly needed but good for consistency
            computerSymbol = 'O';
            initialStatus = `Mode: PvP | `;
        } else { // CvC
            playerSymbol = 'N/A'; // Player symbol irrelevant
            computerSymbol = 'N/A'; // Computer symbols are just X and O
             initialStatus = `Mode: CvC | `;
        }
        // --- End Symbol Determination ---

        displayMessage(initialStatus + `Player ${currentPlayer}'s turn`);
        restartButton.classList.remove('hidden');
        controlElements.classList.add('hidden');
        gameBoard.classList.remove('hidden');

        // --- Handle First Turn ---
        if (currentMode === 'cvc') {
            // Computer 'X' starts
            disableBoardInteraction();
            computerTurnTimeout = setTimeout(makeComputerMove, 800);
        } else if (currentMode === 'pvc' && playerSymbol === 'O') {
            // Player chose 'O', so Computer ('X') starts
            disableBoardInteraction();
            computerTurnTimeout = setTimeout(makeComputerMove, 800);
        } else {
            // Player vs Player OR Player vs Computer (Player is 'X')
            enableBoardInteraction(); // Player's turn
        }
        // --- End Handle First Turn ---
    };

    const getModeName = (mode) => {
        switch(mode) {
            case 'pvp': return 'Player vs Player';
            case 'pvc': return 'Player vs Computer';
            case 'cvc': return 'Computer vs Computer';
            default: return 'Unknown Mode';
        }
    }

    const handleCellClick = (event) => {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        // --- Input Validation ---
        if (!gameActive || boardState[clickedCellIndex] !== '' || clickedCell.style.pointerEvents === 'none') {
             // Also check pointerEvents for safety, although disableBoardInteraction should handle it
            return;
        }

        // In PvC, only allow clicks if it's the human player's turn (check their symbol)
        if (currentMode === 'pvc' && currentPlayer !== playerSymbol) {
             // console.log("PvC: Not player's turn");
             return;
        }
        // --- End Input Validation ---

        makeMove(clickedCellIndex, currentPlayer);

        // --- Trigger Computer Move if applicable ---
        if (gameActive) {
            if (currentMode === 'pvc' && currentPlayer === computerSymbol) {
                // It's now the computer's turn
                disableBoardInteraction();
                computerTurnTimeout = setTimeout(makeComputerMove, 600);
            }
            // CvC turn transition is handled within makeComputerMove
        }
        // --- End Trigger Computer Move ---
    };

    const makeMove = (index, player) => {
        if (!gameActive || boardState[index] !== '') return;

        boardState[index] = player;
        const cell = cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase(), 'occupied');
        cell.style.cursor = 'default'; // Mark as not clickable visually
        // cell.removeEventListener('click', handleCellClick); // Can remove listener, but disabling interaction is safer

        if (checkWin(player)) {
            endGame(false);
        } else if (boardState.every(cell => cell !== '')) {
            endGame(true);
        } else {
            switchPlayer();
             // Update status AFTER switching player
            if (gameActive) { // Only update status if game continues
                 let turnMsg = `Player ${currentPlayer}'s turn`;
                 if(currentMode === 'pvc') {
                    turnMsg = (currentPlayer === playerSymbol) ? "Your turn" : "Computer's turn";
                 } else if(currentMode === 'cvc') {
                     turnMsg = `Computer ${currentPlayer}'s turn`;
                 }
                 displayMessage(`${getModeName(currentMode)} | ${turnMsg}`);
            }
        }
    };

    const switchPlayer = () => {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        // Status message update moved to makeMove to happen *after* switch
    };

    const checkWin = (player) => {
        let winFound = false;
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
                highlightWinningCells([a, b, c]);
                winFound = true; // Mark win found
                break; // No need to check further conditions
            }
        }
        return winFound;
    };

     const highlightWinningCells = (indices) => {
        indices.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
    };

    const endGame = (isDraw) => {
        gameActive = false;
        clearTimeout(computerTurnTimeout);
        disableBoardInteraction(); // Stop further clicks

        let winnerMsg = '';
        if (isDraw) {
            winnerMsg = "Game ended in a draw!";
        } else {
            // `currentPlayer` at the point of winning holds the winner's symbol
            if (currentMode === 'pvc') {
                winnerMsg = (currentPlayer === playerSymbol) ? "Player Wins!" : "Computer Wins!";
            } else if (currentMode === 'cvc') {
                winnerMsg = `Computer ${currentPlayer} Wins!`;
            } else { // PvP
                 winnerMsg = `Player ${currentPlayer} Wins!`;
             }
        }
        displayMessage(winnerMsg);
    };

    const restartGame = () => {
        gameActive = false;
        clearTimeout(computerTurnTimeout);
        boardState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X'; // Reset logical starting player

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'occupied', 'winning-cell');
            cell.removeEventListener('click', handleCellClick); // Clean up listeners
            cell.style.cursor = 'pointer'; // Reset cursor visually
        });

        displayMessage("Select a mode and start the game!");
        restartButton.classList.add('hidden');
        controlElements.classList.remove('hidden');
        gameBoard.classList.add('hidden');
        symbolChoiceContainer.classList.add('hidden'); // Hide symbol choice again
         // Reset symbol choice radio to default (X)
        symbolRadios[0].checked = true;
        handleModeChange(); // Re-evaluate if symbol choice should show based on default mode
        enableBoardInteraction(); // Ensure board is interactive again potentially
    };

    // --- Computer AI Logic ---
    const makeComputerMove = () => {
        if (!gameActive) return;

        // The AI logic works based on the 'currentPlayer' variable, which is correctly set
        // to the computer's symbol when this function is called.
        let move = findBestMove(currentPlayer);

        if (move !== null) {
            // Delay the visual update slightly for perceived thinking time
             setTimeout(() => {
                 if (gameActive) { // Check game is still active before making move visually
                    makeMove(move, currentPlayer);

                    // If CvC mode and game is still active, trigger the *next* computer's turn
                    if (gameActive && currentMode === 'cvc') {
                        disableBoardInteraction(); // Keep board disabled
                        computerTurnTimeout = setTimeout(makeComputerMove, 800);
                    } else if (gameActive && currentMode === 'pvc'){
                        // It's now the human player's turn
                        enableBoardInteraction();
                        // Status update is now handled within makeMove/switchPlayer
                    }
                 }
             }, 300); // Small delay before showing the move
        } else {
            console.warn("Computer couldn't find a move."); // Should only happen on a draw/error
        }
    };

    // --- findBestMove finds the best move for the computer ---
     const findBestMove = (player) => {
        const opponent = player === 'X' ? 'O' : 'X';
        let availableCells = [];
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === '') {
                availableCells.push(i);
            }
        }

        // 1. Check if Computer can win
        for (let i of availableCells) {
            boardState[i] = player;
            if (checkWin(player)) {
                boardState[i] = '';
                return i;
            }
            boardState[i] = '';
        }

        // 2. Check if Opponent can win and block
        for (let i of availableCells) {
            boardState[i] = opponent;
            if (checkWin(opponent)) {
                boardState[i] = '';
                return i;
            }
            boardState[i] = '';
        }

        // 3. Prioritize strategic positions randomly
        const corners = [0, 2, 6, 8];
        const sides = [1, 3, 5, 7];
        const center = 4;
        let strategicMoves = [];

        if (availableCells.includes(center)) strategicMoves.push(center);
        const availableCorners = corners.filter(index => availableCells.includes(index));
        strategicMoves = strategicMoves.concat(availableCorners);
        const availableSides = sides.filter(index => availableCells.includes(index));
        strategicMoves = strategicMoves.concat(availableSides);

        if (strategicMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * strategicMoves.length);
            return strategicMoves[randomIndex];
        }

        // 4. Fallback: Random available
        if (availableCells.length > 0) {
             return availableCells[Math.floor(Math.random() * availableCells.length)];
        }

        return null;
    };
    // --- End findBestMove ---

    const disableBoardInteraction = () => {
         gameBoard.style.pointerEvents = 'none';
         cells.forEach(cell => cell.style.cursor = 'default');
    };

    const enableBoardInteraction = () => {
        gameBoard.style.pointerEvents = 'auto';
        cells.forEach(cell => {
            // Only make non-occupied cells look clickable
            if (!cell.classList.contains('occupied')) {
                 cell.style.cursor = 'pointer';
            } else {
                 cell.style.cursor = 'default';
            }
        });
    };

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    // Add listener for mode changes to show/hide symbol choice
    modeRadios.forEach(radio => radio.addEventListener('change', handleModeChange));

    // --- Theme Toggle Functionality ---
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    const root = document.documentElement;

    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    const setTheme = (theme) => {
        if (theme === 'light') {
            root.classList.add('light-theme');
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        } else {
            root.classList.remove('light-theme');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
        }
        localStorage.setItem('theme', theme);
    };

    const toggleTheme = () => {
        const currentTheme = root.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    // Set initial theme
    setTheme(savedTheme);

    // Add event listener for theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // --- Initial Setup ---
    handleModeChange(); // Call once on load to set initial visibility
    displayMessage("Select a mode and start the game!");

});