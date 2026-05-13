import { COLOURS } from "../../core/models/colours.js";
import { StickFigure } from "../../core/engine.js";

/**
 * Altezza della figura nei tre percorsi
 * @type {Object<number, number>}
 */
const positionFigure = {
    1: 96,
    2: 288,
    3: 480
};
let position = 1;

let phase = 0;
let is_walking = true;

const game = /** @type {HTMLElement} */ (document.getElementById("game"));

const road = /** @type {HTMLCanvasElement} */ (document.getElementById("road"));
road.width = road.offsetWidth;
road.height = road.offsetHeight;

document.addEventListener("DOMContentLoaded", () => {
    baseGame();
    figureRendering();
});

/**
 * Render the base of the game
 * @returns {void}
 */
function baseGame() {
    const height_triangle = Math.round(Math.sqrt(Math.pow(16, 2) - Math.pow(8, 2)));
    const length_base_triangle = 16;

    const ctx = /** @type {CanvasRenderingContext2D} */ (road.getContext("2d"));

    ctx.fillStyle = COLOURS.green;
    ctx.fillRect(192, 0, 1152, 576);

    ctx.strokeStyle = COLOURS.black;
    ctx.lineWidth = 1;
    const padding = 20;

    // General field grass
    for (let i = 0; i < 200; i++) {
        const grassX = (192 + padding) + Math.random() * (1152 - 192 - (padding * 2));
        const grassY = padding + Math.random() * (576 - (padding * 2));
        const safetyZone = 15;

        if (Math.abs(grassY - 192) < safetyZone || Math.abs(grassY - 384) < safetyZone) {
            continue;
        }

        drawCluster(ctx, grassX, grassY);
    }

    ctx.beginPath();
    ctx.moveTo(192, 192);
    ctx.lineTo(1152, 192);
    ctx.strokeStyle = COLOURS.black;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(192, 384);
    ctx.lineTo(1152, 384);
    ctx.strokeStyle = COLOURS.black;
    ctx.stroke();

    for (let y = 0; y < road.height; y += length_base_triangle) {
        ctx.beginPath();

        ctx.moveTo(192, y);
        ctx.lineTo(192 + height_triangle, y + 8);
        ctx.lineTo(192, y + 16);
        ctx.closePath();

        ctx.fillStyle = "brown";
        ctx.fill();

        ctx.strokeStyle = COLOURS.black;
        ctx.stroke()
    }
}

/**
 * Render the figure
 * @returns {void}
 */
function figureRendering() {
    const human_figure = document.createElement("canvas");
    human_figure.width = road.offsetWidth;
    human_figure.height = road.offsetHeight;
    human_figure.style.border = "1px solid black";
    game.appendChild(human_figure);

    const human_figure_ctx = /** @type {CanvasRenderingContext2D} */ (human_figure.getContext("2d"));

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
            human_figure_ctx.clearRect(0, 0, human_figure.width, human_figure.height);
            person.y = positionFigure[position];
            person.draw(human_figure_ctx);
        }
    });

    /**
     * The figure can walk
     * @returns {void}
     */
    function figureWalk() {
        if (!is_walking) return;

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
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
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