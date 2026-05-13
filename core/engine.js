/**
 * Represents a line segment to be drawn on a canvas.
 */
export class Line {
    /**
     * Creates an instance of Line.
     * @param {number} x1 - The starting x-coordinate.
     * @param {number} y1 - The starting y-coordinate.
     * @param {number} x2 - The ending x-coordinate.
     * @param {number} y2 - The ending y-coordinate.
     * @param {string | CanvasGradient | CanvasPattern} [color='black'] - The color of the line.
     * @param {number} [width=1] - The thickness of the line.
     */
    constructor(x1, y1, x2, y2, color = 'black', width = 1) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.width = width;
    }

    /**
     * Draws the line on the provided canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.stroke();
        ctx.closePath();
    }
}

/**
 * Represents a stylized person (stick figure) facing right.
 */
export class StickFigure {
    /**
     * Creates an instance of StickFigure.
     * @param {number} x - The horizontal center position of the figure.
     * @param {number} y - The vertical center position (around the waist/arms area).
     * @param {number} [scale=1] - Scale factor for the figure's size.
     * @param {string | CanvasGradient | CanvasPattern} [color='black'] - The color of the figure.
     * @param {number} [width=2] - The thickness of the lines used for the figure.
     */
    constructor(x, y, scale = 1, color = 'black', width = 2) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.color = color;
        this.width = width;
    }

    /**
     * Draws the stick figure facing right on the provided canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        const headRadius = 10 * this.scale;
        const headY = this.y - 20 * this.scale;

        // Head
        const head = new Circle(this.x, headY, headRadius, this.color);
        head.draw(ctx);

        // Body
        const body = new Line(this.x, this.y - 10 * this.scale, this.x, this.y + 20 * this.scale, this.color, this.width);
        body.draw(ctx);

        // Arms (posed slightly forward/angled to suggest rightward orientation)
        const leftArm = new Line(this.x, this.y, this.x + 15 * this.scale, this.y - 10 * this.scale, this.color, this.width);
        const rightArm = new Line(this.x, this.y, this.x + 15 * this.scale, this.y + 10 * this.scale, this.color, this.width);
        leftArm.draw(ctx);
        rightArm.draw(ctx);

        // Legs
        const leftLeg = new Line(this.x, this.y + 20 * this.scale, this.x - 10 * this.scale, this.y + 40 * this.scale, this.color, this.width);
        const rightLeg = new Line(this.x, this.y + 20 * this.scale, this.x + 10 * this.scale, this.y + 40 * this.scale, this.color, this.width);
        leftLeg.draw(ctx);
        rightLeg.draw(ctx);

        // Face details to indicate facing right
        // Eye
        const eye = new Circle(this.x + 4 * this.scale, headY - 2 * this.scale, 1.5 * this.scale, this.color, true);
        eye.draw(ctx);
    }
}

/**
 * Represents a circle to be drawn on a canvas.
 */
export class Circle {
    /**
     * Creates an instance of Circle.
     * @param {number} x - The x-coordinate of the circle's center.
     * @param {number} y - The y-coordinate of the circle's center.
     * @param {number} radius - The radius of the circle.
     * @param {string | CanvasGradient | CanvasPattern} [color='black'] - The color of the circle.
     * @param {boolean} [fill=false] - Whether to fill the circle or just stroke the outline.
     */
    constructor(x, y, radius, color = 'black', fill = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.fill = fill;
    }

    /**
     * Draws the circle on the provided canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }

        ctx.closePath();
    }
}