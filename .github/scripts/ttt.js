const fs = require('fs');

async function run() {
    try {
        const title = process.argv[2]; // e.g., "ttt|move|5"
        const readmePath = 'README.md';
        let readme = fs.readFileSync(readmePath, 'utf8');

        // Regex to find the board state
        // <!-- ttt:state:x...o.... -->
        const stateRegex = /<!-- ttt:state:([x\.o]{9}) -->/;
        let stateMatch = readme.match(stateRegex);
        let board = stateMatch ? stateMatch[1].split('') : Array(9).fill('.');

        // Player Move (Player is always X)
        const moveIndex = parseInt(title.split('|')[2]) - 1; // 1-9 -> 0-8
        if (isNaN(moveIndex) || moveIndex < 0 || moveIndex > 8 || board[moveIndex] !== '.') {
            console.log('Invalid move. Closing.');
            return;
        }
        board[moveIndex] = 'x';

        // Check Win for Player
        if (checkWin(board, 'x')) {
            updateReadme(board, 'You Won! 🎉', readme);
            return;
        }

        // Check Draw
        if (!board.includes('.')) {
            updateReadme(board, 'Draw! 🤝', readme);
            return;
        }

        // Bot Move (Bot is always O)
        // Simple AI: Random empty slot
        const emptyIndices = board.map((c, i) => c === '.' ? i : null).filter(c => c !== null);
        const botMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        board[botMove] = 'o';

        // Check Win for Bot
        if (checkWin(board, 'o')) {
            updateReadme(board, 'Bot Won! 🤖', readme);
            return;
        }

        // Continue
        updateReadme(board, 'Your Turn! (Play X)', readme);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

function checkWin(board, player) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]           // Diagonals
    ];
    return wins.some(combo => combo.every(idx => board[idx] === player));
}

function updateReadme(board, status, readme) {
    // Generate ASCII/HTML Board
    // Links for empty cells: https://github.com/.../issues/new?title=ttt|move|1...
    const user = 'SathvikBhaskar';
    const repo = 'sathvikbhaskar';

    // reset logic if game over
    const isGameOver = status.includes('Won') || status.includes('Draw');
    if (isGameOver) {
        // Prepare board for next game (empty) but verify we show the final state first? 
        // Actually, let's show the final state and a "Reset" button.
        // For simplicity: We just reset the state string to ......... but show the final board visual.
        // Or better: Show visual of result, and a button "Play Again" which links to ttt|reset.
        // Let's stick to standard flow: Game Over state remains until someone clicks "Play Again" (ttt|reset).
        // But to keep it simple, let's just show the final board and say "Click any cell to start new game".
        // Actually, let's just keep the final board. The user will have to manually reset or we auto-reset on next move?
        // Let's make "Play Again" link reset the board.
    }

    let boardDisplay = '<table align="center"><tr>';
    board.forEach((cell, i) => {
        let cellContent = '⬜'; // Valid move
        let link = `https://github.com/${user}/${repo}/issues/new?title=ttt|move|${i + 1}&body=Just+click+submit+to+play!`;

        if (cell === 'x') {
            cellContent = '❌';
            link = null;
        } else if (cell === 'o') {
            cellContent = '⭕';
            link = null;
        }

        if (isGameOver) link = `https://github.com/${user}/${repo}/issues/new?title=ttt|reset&body=New+Game!`;

        if (link) {
            boardDisplay += `<td align="center" width="50" height="50"><a href="${link}">${cellContent}</a></td>`;
        } else {
            boardDisplay += `<td align="center" width="50" height="50">${cellContent}</td>`;
        }

        if ((i + 1) % 3 === 0 && i !== 8) {
            boardDisplay += '</tr><tr>';
        }
    });
    boardDisplay += '</tr></table>';

    // State String (for persistence)
    // If game over, maybe reset state for next click?
    // Let's handle 'ttt|reset' in the script too? (Simpler: just reset state string to .........)
    const newState = isGameOver ? '.........' : board.join('');

    const newContent = `<!-- ttt:start -->
<div align="center">
    <h4>3. Tic-Tac-Toe (You vs Bot) 🧠</h4>
    <p>Status: <b>${status}</b></p>
    ${boardDisplay}
    <!-- ttt:state:${newState} -->
</div>
<!-- ttt:end -->`;

    const sectionRegex = /<!-- ttt:start -->[\s\S]*?<!-- ttt:end -->/;
    const fs = require('fs'); // Re-import just in case

    // If section exists, replace. If not (first time), append? 
    // We assume placeholder exists from previous step.
    const newReadme = readme.replace(sectionRegex, newContent.trim());
    fs.writeFileSync('README.md', newReadme);
    console.log(`Updated TTT board: ${status}`);
}

run();
