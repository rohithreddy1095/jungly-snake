const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let snake, food, cursors;
let direction = { x: 1, y: 0 }; // Replace the string direction with an object
let snakeGroup;
let jungleBackground;
let score = 0;
let scoreText;
let moveInterval = 150; // Initial move interval in milliseconds
let lastMoveTime = 0;
let gridSize = 20;
let canMove = true; // Add this line to control movement
let isPaused = false;

let foodColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0x800000, 0x008000, 0x000080, 0x808000, 0x800080, 0x008080];

function preload() {
    this.load.image('snakeHead', 'assets/snakeHead.png');
    this.load.image('snakeBody', 'assets/snakeBody.png');
    this.load.image('food', 'assets/fruit.png');
    this.load.image('jungle', 'assets/jungleBackground.png');
}

function create() {
    // Adjust background to cover the entire screen
    jungleBackground = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'jungle')
        .setOrigin(0, 0)
        .setScrollFactor(0);
    
    snakeGroup = this.add.group();
    
    // Start snake at the center of the screen
    let startX = Math.floor(this.scale.width / 2 / gridSize) * gridSize;
    let startY = Math.floor(this.scale.height / 2 / gridSize) * gridSize;
    snake = [{ x: startX, y: startY }];
    
    // Render initial snake
    renderSnake.call(this);

    // Replace the existing food creation line with this:
    food = this.add.rectangle(0, 0, gridSize - 2, gridSize - 2, Phaser.Math.RND.pick(foodColors));
    placeFood.call(this);

    cursors = this.input.keyboard.createCursorKeys();

    // Add keyboard event listeners
    this.input.keyboard.on('keydown', handleKeyDown, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    // Adjust game objects when the screen is resized
    this.scale.on('resize', resize, this);

    // Debug text
    this.add.text(16, 50, 'Use arrow keys to move. Space or click to pause/resume', { fontSize: '24px', fill: '#fff' });

    // Add pause text
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSED', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    this.pauseText.setVisible(false);

    // Add Space bar listener for pause/resume
    this.input.keyboard.on('keydown-SPACE', togglePause, this);

    // Add mouse click listener for pause/resume
    this.input.on('pointerdown', togglePause, this);

    // Add border to the game screen
    let border = this.add.graphics();
    border.lineStyle(4, 0xff0000, 1); // 4px wide red line
    border.strokeRect(2, 2, this.scale.width - 4, this.scale.height - 4);
}

function handleKeyDown(event) {
    if (isPaused || !canMove) return;

    switch (event.code) {
        case 'ArrowLeft':
            direction.x = -1;
            break;
        case 'ArrowRight':
            direction.x = 1;
            break;
        case 'ArrowUp':
            direction.y = -1;
            break;
        case 'ArrowDown':
            direction.y = 1;
            break;
    }
    canMove = false;
}

function update(time, delta) {
    if (isPaused) return;

    jungleBackground.tilePositionX += 0.5;

    if (time - lastMoveTime > moveInterval) {
        lastMoveTime = time;
        moveSnake.call(this);
        canMove = true; // Allow movement after snake moves
    }
}

function moveSnake() {
    let x = snake[0].x + direction.x * gridSize;
    let y = snake[0].y + direction.y * gridSize;

    // Store the previous direction
    let prevDirection = {
        x: snake[1] ? snake[0].x - snake[1].x : 0,
        y: snake[1] ? snake[0].y - snake[1].y : 0
    };

    // Check if snake hits the walls
    if (x < 0 || x >= this.scale.width || y < 0 || y >= this.scale.height) {
        gameOver.call(this);
        return;
    }

    // Check for reversal
    if (prevDirection.x === -direction.x * gridSize && prevDirection.y === -direction.y * gridSize) {
        snake.reverse();
        // Adjust x and y after reversal
        x = snake[0].x + direction.x * gridSize;
        y = snake[0].y + direction.y * gridSize;
    }

    snake.unshift({ x: x, y: y });

    // Check if snake head overlaps with food
    if (Math.abs(x - food.x) < gridSize && Math.abs(y - food.y) < gridSize) {
        score += 1;
        scoreText.setText('Score: ' + score);
        placeFood.call(this);
        increaseSpeed();
    } else {
        snake.pop();
    }

    renderSnake.call(this);

    // Check for self-collision
    for (let i = 1; i < snake.length; i++) {
        if (x === snake[i].x && y === snake[i].y) {
            gameOver.call(this);
            return;
        }
    }
}

function renderSnake() {
    snakeGroup.clear(true, true);
    snake.forEach((segment, index) => {
        let snakePart;
        if (index === 0) {
            snakePart = this.add.rectangle(segment.x, segment.y, gridSize - 2, gridSize - 2, 0x00ff00);
        } else {
            snakePart = this.add.rectangle(segment.x, segment.y, gridSize - 2, gridSize - 2, 0x008000);
        }
        snakeGroup.add(snakePart);
    });
}

function increaseSpeed() {
    // Decrease the move interval, making the snake faster
    moveInterval = Math.max(50, moveInterval - 5);
}

function resetGame() {
    gameOver.call(this);
}

function placeFood() {
    let newX, newY;
    do {
        newX = Math.floor(Math.random() * (this.scale.width / gridSize)) * gridSize;
        newY = Math.floor(Math.random() * (this.scale.height / gridSize)) * gridSize;
    } while (snake.some(segment => segment.x === newX && segment.y === newY));

    food.setPosition(newX + gridSize / 2, newY + gridSize / 2);
    food.fillColor = Phaser.Math.RND.pick(foodColors);
}

function togglePause() {
    isPaused = !isPaused;
    this.pauseText.setVisible(isPaused);
    console.log("Game paused:", isPaused);
    if (isPaused) {
        console.log("Game paused");
    } else {
        lastMoveTime = this.time.now;
        console.log("Game resumed");
    }
}

function resize(gameSize, baseSize, displaySize, resolution) {
    if (jungleBackground) {
        jungleBackground.setSize(gameSize.width, gameSize.height);
    }
    
    // Redraw the border when the game is resized
    let border = this.add.graphics();
    border.clear();
    border.lineStyle(4, 0xff0000, 1);
    border.strokeRect(2, 2, gameSize.width - 4, gameSize.height - 4);
}

function gameOver() {
    isPaused = true;
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Add a restart button
    let restartButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, 'Restart', {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5).setInteractive();
    
    restartButton.on('pointerdown', () => {
        isPaused = false;
        this.scene.restart();
    });
}