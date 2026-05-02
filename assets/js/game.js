import { COLOURS } from "../../core/models/colours.js";

/**
 * @type {HTMLCanvasElement}
 */
// @ts-ignore
const road = document.getElementById("road");
road.width = road.offsetWidth;
road.height = road.offsetHeight;

const height_triangle = Math.round(Math.sqrt(Math.pow(16, 2) - Math.pow(8, 2)));
const length_base_triangle = 16;

/**
 * @type {CanvasRenderingContext2D}
 */
// @ts-ignore
const ctx = road.getContext("2d");

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