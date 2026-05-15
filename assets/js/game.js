import { COLOURS } from "../../core/models/colours.js";
import { StickFigure, Card } from "../../core/engine.js";
import { QuestionManager } from "../../core/components/question.js";

/**
 * Maps the lane index to the Y-coordinate height for the stick figure and cards.
 * @type {Object<number, number>}
 */
const positionFigure = {
    1: 96,
    2: 288,
    3: 480
};

/**
 * The current lane position of the stick figure (1, 2, or 3).
 * @type {number}
 */
let position = 1;

/**
 * The current phase of the walking animation.
 * @type {number}
 */
let phase = 0;

/**
 * Flag indicating if the game is currently running (walking).
 * @type {boolean}
 */
let isRunning = false;

/**
 * Current question being played in the current turn.
 * @type {import("../../core/components/question.js").Question | null}
 */
let currentQuestion = null;

/**
 * Array of card objects currently rendered on the road.
 * @type {Card[]}
 */
let cards = [];

/**
 * The main game container element.
 * @type {HTMLElement}
 */
const game = /** @type {HTMLElement} */ (document.getElementById("game"));

/**
 * The background canvas element representing the road/field.
 * @type {HTMLCanvasElement}
 */
const road = /** @type {HTMLCanvasElement} */ (document.getElementById("road"));
road.width = road.offsetWidth;
road.height = road.offsetHeight;

/**
 * Offscreen canvas used to pre-render the grass pattern.
 * @type {HTMLCanvasElement}
 */
const grassTile = document.createElement("canvas");
grassTile.width = road.width;
grassTile.height = road.height;

/**
 * The current horizontal scroll offset for the background animation.
 * @type {number}
 */
let scrollX = 0;

/**
 * The stick figure instance.
 * @type {StickFigure}
 */
let person;

/**
 * Canvas context for the human figure.
 * @type {CanvasRenderingContext2D}
 */
let humanFigureCtx;

/**
 * Question manager instance.
 */
const qManager = new QuestionManager("../json/questions.json");

document.addEventListener("DOMContentLoaded", async () => {
    setupGrassTile();
    initFigure();
    await qManager.init();
    startNewTurn();
});

/**
 * Initializes the stick figure and its canvas.
 * @returns {void}
 */
function initFigure() {
    const humanFigure = document.createElement("canvas");
    humanFigure.width = road.offsetWidth;
    humanFigure.height = road.offsetHeight;
    humanFigure.style.position = "absolute";
    humanFigure.style.top = "0";
    humanFigure.style.left = "0";
    humanFigure.style.pointerEvents = "none";
    game.appendChild(humanFigure);

    humanFigureCtx = /** @type {CanvasRenderingContext2D} */ (humanFigure.getContext("2d"));
    person = new StickFigure(96, positionFigure[position], 1.5, COLOURS.black, 2);
    person.draw(humanFigureCtx);

    setupControls();
}

/**
 * Sets up the keyboard controls for lane switching.
 * @returns {void}
 */
function setupControls() {
    document.addEventListener("keydown", event => {
        if (!isRunning) return;

        const arrows = ["ArrowUp", "ArrowDown"];
        if (arrows.includes(event.key)) event.preventDefault();

        if (event.key === "ArrowUp") {
            if (position === 1) return;
            position--;
            person.y = positionFigure[position];
        }

        if (event.key === "ArrowDown") {
            if (position === 3) return;
            position++;
            person.y = positionFigure[position];
        }
    });
}

/**
 * Starts a new turn by showing the question modal.
 * @returns {void}
 */
function startNewTurn() {
    isRunning = false;
    qManager.showQuestion((/** @type {import("../../core/components/question.js").Question} */ question) => {
        currentQuestion = question;
        spawnCards(question);
        isRunning = true;
        requestAnimationFrame(gameLoop);
    });
}

/**
 * Spawns answer cards on the road based on the current question.
 * @param {import("../../core/components/question.js").Question} question
 * @returns {void}
 */
function spawnCards(question) {
    cards = [];
    const cardWidth = 200;
    const cardHeight = 120;
    const startX = road.width + 100;

    // Create a card for each answer in its respective lane
    Object.keys(question.answers).forEach(key => {
        const lane = parseInt(key);
        const y = positionFigure[lane];
        const text = question.answers[key];
        cards.push(new Card(startX, y, cardWidth, cardHeight, text, key));
    });
}

/**
 * Pre-renders the grass pattern onto the offscreen grassTile canvas.
 * @returns {void}
 */
function setupGrassTile() {
    const tileCtx = /** @type {CanvasRenderingContext2D} */ (grassTile.getContext("2d"));
    const padding = 20;

    tileCtx.fillStyle = COLOURS.green;
    tileCtx.fillRect(0, 0, grassTile.width, grassTile.height);

    tileCtx.strokeStyle = COLOURS.black;
    tileCtx.lineWidth = 1;

    for (let i = 0; i < 200; i++) {
        const grassX = Math.random() * grassTile.width;
        const grassY = padding + Math.random() * (grassTile.height - (padding * 2));
        const safetyZone = 15;

        if (Math.abs(grassY - 192) < safetyZone || Math.abs(grassY - 384) < safetyZone) {
            continue;
        }

        drawCluster(tileCtx, grassX, grassY);

        if (grassX < 15) {
            drawCluster(tileCtx, grassX + grassTile.width, grassY);
        } else if (grassX > grassTile.width - 15) {
            drawCluster(tileCtx, grassX - grassTile.width, grassY);
        }
    }
}

/**
 * Main game loop for rendering and logic.
 * @returns {void}
 */
function gameLoop() {
    if (!isRunning) return;

    renderBackground();
    updateAndDrawCards();
    updateAndDrawFigure();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

/**
 * Renders the moving background.
 * @returns {void}
 */
function renderBackground() {
    const ctx = /** @type {CanvasRenderingContext2D} */ (road.getContext("2d"));

    scrollX -= 4; // Walking speed
    if (scrollX <= -grassTile.width) {
        scrollX = 0;
    }

    ctx.drawImage(grassTile, scrollX, 0);
    ctx.drawImage(grassTile, scrollX + grassTile.width, 0);

    ctx.strokeStyle = COLOURS.black;
    ctx.lineWidth = 1;

    // Lane dividers
    [192, 384].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(road.width, y);
        ctx.stroke();
    });
}

/**
 * Updates card positions and draws them on the road canvas.
 * @returns {void}
 */
function updateAndDrawCards() {
    const ctx = /** @type {CanvasRenderingContext2D} */ (road.getContext("2d"));
    cards.forEach(card => {
        card.x -= 4; // Move at the same speed as the background
        card.draw(ctx);
    });
}

/**
 * Updates the stick figure's animation phase and draws it.
 * @returns {void}
 */
function updateAndDrawFigure() {
    humanFigureCtx.clearRect(0, 0, road.width, road.height);

    phase += 0.15;
    const amplitude = 0.7;

    person.leftLegAngle = Math.sin(phase) * amplitude;
    person.rightLegAngle = Math.sin(phase + Math.PI) * amplitude;
    person.leftArmAngle = Math.sin(phase + Math.PI) * (amplitude * 0.8);
    person.rightArmAngle = Math.sin(phase) * (amplitude * 0.8);

    person.draw(humanFigureCtx);
}

/**
 * Checks for collision between the figure and cards.
 * @returns {void}
 */
function checkCollisions() {
    const figureX = person.x;
    const figureLane = position;

    cards.forEach(card => {
        // Simple collision: if card passes the figure's X and is in the same lane
        if (!card.passed && (card.x + card.width) < figureX + 30) {
            card.passed = true;
            // If this card is in the player's current lane, it's the choice!
            if (parseInt(card.key) === figureLane) {
                handleChoice(card.key);
            }
        }
    });

    // If all cards have passed and no choice was made (shouldn't happen if lanes are full)
    if (cards.length > 0 && cards.every(c => (c.x + c.width) < 0)) {
        isRunning = false;
        // Maybe repeat the question or handle as wrong?
        startNewTurn();
    }
}

/**
 * Handles the player's answer choice.
 * @param {string} chosenKey
 * @returns {void}
 */
function handleChoice(chosenKey) {
    if (!isRunning) return;

    isRunning = false;

    if (!currentQuestion) {
        console.error("Gameplay Error: 'handleChoice' called but no active 'currentQuestion' found.");
        // Attempt to recover by restarting the turn
        startNewTurn();

        return;
    }

    if (!currentQuestion.answers[chosenKey]) {
        console.error(`Gameplay Error: Chosen key '${chosenKey}' does not exist in the current question.`);
        isRunning = true; // Resume if it was a false positive

        return;
    }

    const isCorrect = chosenKey === currentQuestion.correct_answer;

    qManager.showFeedback(isCorrect, currentQuestion, chosenKey, () => {
        startNewTurn();
    });
}

/**
 * Draws a small cluster of lines at a given coordinate to represent grass.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} x - The base X coordinate of the cluster.
 * @param {number} y - The base Y coordinate of the cluster.
 * @returns {void}
 */
function drawCluster(ctx, x, y) {
    for (let j = 0; j < 5; j++) {
        const rx = x + (Math.random() - 0.5) * 10;
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx + (Math.random() - 0.5) * 4, y - 5 - Math.random() * 5);
        ctx.stroke();
    }
}