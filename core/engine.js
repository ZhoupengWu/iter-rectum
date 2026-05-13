export class Line {
    /**
     *
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {string | CanvasGradient | CanvasPattern} color
     * @param {number} width
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
     * @param {CanvasRenderingContext2D} ctx
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

export class StickFigure {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} scale
     * @param {string | CanvasGradient | CanvasPattern} color
     * @param {number} width
     */
    constructor(x, y, scale = 1, color = 'black', width = 2) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.color = color;
        this.width = width;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
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

        // Arms
        const leftArm = new Line(this.x, this.y, this.x + 15 * this.scale, this.y - 10 * this.scale, this.color, this.width);
        const rightArm = new Line(this.x, this.y, this.x + 15 * this.scale, this.y + 10 * this.scale, this.color, this.width);
        leftArm.draw(ctx);
        rightArm.draw(ctx);

        // Legs
        const leftLeg = new Line(this.x, this.y + 20 * this.scale, this.x - 10 * this.scale, this.y + 40 * this.scale, this.color, this.width);
        const rightLeg = new Line(this.x, this.y + 20 * this.scale, this.x + 10 * this.scale, this.y + 40 * this.scale, this.color, this.width);
        leftLeg.draw(ctx);
        rightLeg.draw(ctx);

        // Face facing right
        // Eye
        const eye = new Circle(this.x + 4 * this.scale, headY - 2 * this.scale, 1.5 * this.scale, this.color, true);
        eye.draw(ctx);
    }
}

export class Circle {
    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {string | CanvasGradient | CanvasPattern} color
     * @param {boolean} fill
     */
    constructor(x, y, radius, color = 'black', fill = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.fill = fill;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
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