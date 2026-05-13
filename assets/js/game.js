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

    ctx.beginPath();
    ctx.moveTo(192, 192);
    ctx.lineTo(1152, 192);
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(192, 384);
    ctx.lineTo(1152, 384);
    ctx.strokeStyle = "black";
    ctx.stroke();

    for (let y = 0; y < road.height; y += length_base_triangle) {
        ctx.beginPath();

        ctx.moveTo(192, y);
        ctx.lineTo(192 + height_triangle, y + 8);
        ctx.lineTo(192, y + 16);
        ctx.closePath();

        ctx.fillStyle = "brown";
        ctx.fill();

        ctx.strokeStyle = "black";
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

    const person = new StickFigure(96, 96, 1.5, "black", 2);
    person.draw(human_figure_ctx);

    document.addEventListener("keydown", event => {
        const arrows = ["ArrowUp", "ArrowDown"];

        if (arrows.includes(event.key)) event.preventDefault();

        if (event.key === "ArrowUp") {
            if (position === 1) return;

            position--;
            human_figure_ctx?.clearRect(0, 0, human_figure.width, human_figure.height);
            person.y = positionFigure[position];
            person.draw(human_figure_ctx);
        }

        if (event.key === "ArrowDown") {
            if (position === 3) return;

            position++;
            human_figure_ctx?.clearRect(0, 0, human_figure.width, human_figure.height);
            person.y = positionFigure[position];
            person.draw(human_figure_ctx);
        }
    });
}