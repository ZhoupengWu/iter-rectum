import { COLOURS } from "../../core/models/colours.js";
import { StickFigure } from "../../core/engine.js";

/**
 * Maps the lane index to the Y-coordinate height for the stick figure.
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
 * Flag indicating if the stick figure is currently walking.
 * @type {boolean}
 */
let is_walking = true;

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
// Set tile width to match canvas width for a full loop
grassTile.width = road.width;
grassTile.height = road.height;

/**
 * The current horizontal scroll offset for the background animation.
 * @type {number}
 */
let scrollX = 0;

document.addEventListener("DOMContentLoaded", () => {
    setupGrassTile();
    figureRendering();
});

/**
 * Pre-renders the grass pattern onto the offscreen grassTile canvas.
 * Ensures the pattern is seamless for looping.
 * @returns {void}
 */
function setupGrassTile() {
    const tileCtx = /** @type {CanvasRenderingContext2D} */ (grassTile.getContext("2d"));
    const padding = 20;

    // Fill the tile with green
    tileCtx.fillStyle = COLOURS.green;
    tileCtx.fillRect(0, 0, grassTile.width, grassTile.height);

    tileCtx.strokeStyle = COLOURS.black;
    tileCtx.lineWidth = 1;

    // Draw random clusters of grass into the tile
    for (let i = 0; i < 200; i++) {
        const grassX = Math.random() * grassTile.width;
        const grassY = padding + Math.random() * (grassTile.height - (padding * 2));
        const safetyZone = 15;

        // Avoid drawing on lane dividers
        if (Math.abs(grassY - 192) < safetyZone || Math.abs(grassY - 384) < safetyZone) {
            continue;
        }

        // Draw the cluster normally
        drawCluster(tileCtx, grassX, grassY);

        // For seamless looping: if the cluster is near the edges, wrap it around
        if (grassX < 15) {
            drawCluster(tileCtx, grassX + grassTile.width, grassY);
        } else if (grassX > grassTile.width - 15) {
            drawCluster(tileCtx, grassX - grassTile.width, grassY);
        }
    }
}

/**
 * Renders the moving background, including the grass, lane dividers, and side patterns.
 * @returns {void}
 */
function renderBackground() {
    const ctx = /** @type {CanvasRenderingContext2D} */ (road.getContext("2d"));

    // Update scroll offset
    scrollX -= 2; // Walking speed
    if (scrollX <= -grassTile.width) {
        scrollX = 0;
    }

    // Draw the scrolling grass tile (two copies for seamless loop)
    // Now starting from X=0 as requested
    ctx.drawImage(grassTile, scrollX, 0);
    ctx.drawImage(grassTile, scrollX + grassTile.width, 0);

    // Draw lane dividers (static or moving? Usually static for a road feel)
    ctx.strokeStyle = COLOURS.black;
    ctx.lineWidth = 1;

    // Lane divider 1
    ctx.beginPath();
    ctx.moveTo(0, 192);
    ctx.lineTo(road.width, 192);
    ctx.stroke();

    // Lane divider 2
    ctx.beginPath();
    ctx.moveTo(0, 384);
    ctx.lineTo(road.width, 384);
    ctx.stroke();
}

/**
 * Initializes the stick figure, creates its canvas, handles keyboard input for lane switching,
 * and starts the walking animation loop.
 * @returns {void}
 */
function figureRendering() {
    /**
     * Canvas dedicated to rendering the human figure to allow independent clearing.
     * @type {HTMLCanvasElement}
     */
    const human_figure = document.createElement("canvas");
    human_figure.width = road.offsetWidth;
    human_figure.height = road.offsetHeight;
    human_figure.style.border = "1px solid black";
    game.appendChild(human_figure);

    const human_figure_ctx = /** @type {CanvasRenderingContext2D} */ (human_figure.getContext("2d"));

    /**
     * The stick figure instance.
     * @type {StickFigure}
     */
    const person = new StickFigure(96, 96, 1.5, COLOURS.black, 2);
    person.draw(human_figure_ctx);

    document.addEventListener("keydown", event => {
        const arrows = ["ArrowUp", "ArrowDown"];

        if (arrows.includes(event.key)) event.preventDefault();

        if (event.key === "ArrowUp") {
            if (position === 1) return;

            position--;
            human_figure_ctx.clearRect(0, 0, human_figure.width, human_figure.height);
            person.y = positionFigure[position];
            person.draw(human_figure_ctx);
        }

        if (event.key === "ArrowDown") {
            if (position === 3) return;

            position++;
            human_figure_ctx.clearRect(0, 0, human_figure.width, human_figure_ctx.canvas.height);
            person.y = positionFigure[position];
            person.draw(human_figure_ctx);
        }
    });

    /**
     * Animation loop that updates the stick figure's limb angles and moves the background.
     * Uses requestAnimationFrame for smooth rendering.
     * @returns {void}
     */
    function figureWalk() {
        if (!is_walking) return;

        renderBackground();

        human_figure_ctx.clearRect(0, 0, human_figure.width, human_figure.height);

        phase += 0.1;
        const amplitude = 0.7;

        // Legs move in opposition
        person.leftLegAngle = Math.sin(phase) * amplitude;
        person.rightLegAngle = Math.sin(phase + Math.PI) * amplitude;

        // Arms move in opposition to legs
        person.leftArmAngle = Math.sin(phase + Math.PI) * (amplitude * 0.8);
        person.rightArmAngle = Math.sin(phase) * (amplitude * 0.8);

        person.draw(human_figure_ctx);

        requestAnimationFrame(figureWalk);
    }

    figureWalk();
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