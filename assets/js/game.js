import { COLOURS } from "../../core/models/colours.js";
import { StickFigure, Card } from "../../core/engine.js";
import { QuestionManager } from "../../core/components/question.js";

/**
 * Calculates the Y-coordinate height for the stick figure and cards based on lane and canvas height.
 * @param {number} lane - The lane index (1, 2, or 3).
 * @returns {number}
 */
function getLaneY(lane) {
    const laneHeight = road.height / 3;
    return (laneHeight * (lane - 1)) + (laneHeight / 2);
}

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

/**
 * Offscreen canvas used to pre-render the grass pattern.
 * @type {HTMLCanvasElement}
 */
let grassTile = document.createElement("canvas");

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
    resizeCanvas();
    initFigure();
    setupGrassTile();
    await qManager.init();
    startNewTurn();

    window.addEventListener("resize", () => {
        resizeCanvas();
        setupGrassTile();
        if (person) {
            person.y = getLaneY(position);
            // Scale person based on canvas height if needed
            person.scale = (road.height / 360) * 1.0;
        }
    });
});

/**
 * Resizes the canvases to match the container dimensions.
 */
function resizeCanvas() {
    road.width = game.clientWidth;
    road.height = game.clientHeight;

    const humanFigure = document.querySelector("#game canvas:not(#road)");
    if (humanFigure) {
        /** @type {HTMLCanvasElement} */ (humanFigure).width = road.width;
        /** @type {HTMLCanvasElement} */ (humanFigure).height = road.height;
    }
}

/**
 * Initializes the stick figure and its canvas.
 * @returns {void}
 */
function initFigure() {
    const humanFigure = document.createElement("canvas");
    humanFigure.width = road.width;
    humanFigure.height = road.height;
    humanFigure.style.position = "absolute";
    humanFigure.style.top = "0";
    humanFigure.style.left = "0";
    humanFigure.style.pointerEvents = "none";
    game.appendChild(humanFigure);

    humanFigureCtx = /** @type {CanvasRenderingContext2D} */ (humanFigure.getContext("2d"));
    const initialScale = (road.height / 360) * 1.0;
    person = new StickFigure(road.width * 0.1, getLaneY(position), initialScale, COLOURS.black, 2);
    person.draw(humanFigureCtx);

    setupControls();
}

/**
 * Sets up the keyboard and touch controls for lane switching.
 * @returns {void}
 */
function setupControls() {
    const handleUp = () => {
        if (!isRunning || position === 1) return;
        position--;
        person.y = getLaneY(position);
    };

    const handleDown = () => {
        if (!isRunning || position === 3) return;
        position++;
        person.y = getLaneY(position);
    };

    document.addEventListener("keydown", event => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            handleUp();
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            handleDown();
        }
    });

    game.addEventListener("mousedown", event => {
        if (/** @type {HTMLElement} */ (event.target).closest && /** @type {HTMLElement} */ (event.target).closest('#mobile-controls')) return;

        const rect = game.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        if (clickY < rect.height / 2) {
            handleUp();
        } else {
            handleDown();
        }
    });

    const btnUp = document.getElementById("btn-up");
    if (btnUp) {
        btnUp.addEventListener("touchstart", (e) => { e.preventDefault(); handleUp(); }, { passive: false });
        btnUp.addEventListener("mousedown", (e) => { e.preventDefault(); handleUp(); });
    }

    const btnDown = document.getElementById("btn-down");
    if (btnDown) {
        btnDown.addEventListener("touchstart", (e) => { e.preventDefault(); handleDown(); }, { passive: false });
        btnDown.addEventListener("mousedown", (e) => { e.preventDefault(); handleDown(); });
    }
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
    const isMobile = road.width < 768;
    const cardWidth = isMobile ? road.width * 0.35 : road.width * 0.25;
    const cardHeight = isMobile ? road.height * 0.28 : road.height * 0.22;
    const startX = road.width + 100;

    // Create a card for each answer in its respective lane
    Object.keys(question.answers).forEach(key => {
        const lane = parseInt(key);
        const y = getLaneY(lane);
        const text = question.answers[key];
        const card = new Card(startX, y, cardWidth, cardHeight, text, key);
        card.fontSize = isMobile ? Math.max(9, cardHeight * 0.18) : Math.max(10, cardHeight * 0.15);
        cards.push(card);
    });
}

/**
 * Pre-renders the grass pattern onto the offscreen grassTile canvas.
 * @returns {void}
 */
function setupGrassTile() {
    grassTile = document.createElement("canvas");
    grassTile.width = road.width;
    grassTile.height = road.height;
    const tileCtx = /** @type {CanvasRenderingContext2D} */ (grassTile.getContext("2d"));
    const padding = 20;

    tileCtx.fillStyle = COLOURS.green;
    tileCtx.fillRect(0, 0, grassTile.width, grassTile.height);

    tileCtx.strokeStyle = COLOURS.black;
    tileCtx.lineWidth = 1;

    const lane1Boundary = road.height / 3;
    const lane2Boundary = (road.height / 3) * 2;

    const grassCount = Math.max(50, Math.floor((grassTile.width * grassTile.height) / 3300));
    for (let i = 0; i < grassCount; i++) {
        const grassX = Math.random() * grassTile.width;
        const grassY = padding + Math.random() * (grassTile.height - (padding * 2));
        const safetyZone = 15;

        if (Math.abs(grassY - lane1Boundary) < safetyZone || Math.abs(grassY - lane2Boundary) < safetyZone) {
            continue;
        }

        drawCluster(tileCtx, grassX, grassY);
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

    scrollX -= (road.width / 1152) * 4; // Scale speed with width
    if (scrollX <= -grassTile.width) {
        scrollX = 0;
    }

    ctx.drawImage(grassTile, scrollX, 0);
    ctx.drawImage(grassTile, scrollX + grassTile.width, 0);

    ctx.strokeStyle = COLOURS.black;
    ctx.lineWidth = 1;

    // Lane dividers
    const lane1Boundary = road.height / 3;
    const lane2Boundary = (road.height / 3) * 2;

    [lane1Boundary, lane2Boundary].forEach(y => {
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
    const speed = (road.width / 1152) * 4;
    cards.forEach(card => {
        card.x -= speed;
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
    const figureRightEdge = figureX + (15 * (person.scale / 1.0));

    cards.forEach(card => {
        if (!card.passed && card.x <= figureRightEdge) {
            card.passed = true;
            if (parseInt(card.key) === figureLane) {
                handleChoice(card.key);
            }
        }
    });

    if (cards.length > 0 && cards.every(c => (c.x + c.width) < 0)) {
        isRunning = false;
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
        isRunning = true;

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