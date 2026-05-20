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
     * @param {string | CanvasGradient | CanvasPattern} [color='#ffefcd'] - The color of the figure.
     * @param {number} [width=2] - The thickness of the lines used for the figure.
     */
    constructor(x, y, scale = 1, color = '#ffefcd', width = 2) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.color = color;
        this.width = width;
        this.leftArmAngle = Math.PI / 4;
        this.rightArmAngle = -Math.PI / 4;
        this.leftLegAngle = Math.PI / 6;
        this.rightLegAngle = -Math.PI / 6;
    }

    /**
     * Draws the stick figure facing right on the provided canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        const headRadius = 10 * this.scale;
        const headY = this.y - 20 * this.scale;

        // Glow effect for the figure
        ctx.shadowBlur = 10 * this.scale;
        ctx.shadowColor = 'rgba(201, 168, 76, 0.3)';

        // Head
        const head = new Circle(this.x, headY, headRadius, this.color);
        head.draw(ctx);

        // Body
        const bodyTopY = this.y - 10 * this.scale;
        const bodyBottomY = this.y + 20 * this.scale;
        const body = new Line(this.x, bodyTopY, this.x, bodyBottomY, this.color, this.width);
        body.draw(ctx);

        // Arm length and Leg length
        const armLength = 20 * this.scale;
        const legLength = 25 * this.scale;

        // Arms (pivot at shoulder/middle of torso)
        const shoulderY = this.y;
        const leftArmX2 = this.x + Math.sin(this.leftArmAngle) * armLength;
        const leftArmY2 = shoulderY + Math.cos(this.leftArmAngle) * armLength;
        const rightArmX2 = this.x + Math.sin(this.rightArmAngle) * armLength;
        const rightArmY2 = shoulderY + Math.cos(this.rightArmAngle) * armLength;

        const leftArm = new Line(this.x, shoulderY, leftArmX2, leftArmY2, this.color, this.width);
        const rightArm = new Line(this.x, shoulderY, rightArmX2, rightArmY2, this.color, this.width);
        leftArm.draw(ctx);
        rightArm.draw(ctx);

        // Legs (pivot at hips)
        const hipY = bodyBottomY;
        const leftLegX2 = this.x + Math.sin(this.leftLegAngle) * legLength;
        const leftLegY2 = hipY + Math.cos(this.leftLegAngle) * legLength;
        const rightLegX2 = this.x + Math.sin(this.rightLegAngle) * legLength;
        const rightLegY2 = hipY + Math.cos(this.rightLegAngle) * legLength;

        const leftLeg = new Line(this.x, hipY, leftLegX2, leftLegY2, this.color, this.width);
        const rightLeg = new Line(this.x, hipY, rightLegX2, rightLegY2, this.color, this.width);
        leftLeg.draw(ctx);
        rightLeg.draw(ctx);

        // Face details to indicate facing right
        // Eye
        const eye = new Circle(this.x + 4 * this.scale, headY - 2 * this.scale, 1.5 * this.scale, this.color, true);
        eye.draw(ctx);

        ctx.shadowBlur = 0;
    }
}

/**
 * Represents an answer card drawn on the road.
 */
export class Card {
    /**
     * @param {number} x - Horizontal position.
     * @param {number} y - Vertical center position.
     * @param {number} width - Width of the card.
     * @param {number} height - Height of the card.
     * @param {string} text - Answer text.
     * @param {string} key - Identifier for the answer (e.g., "1", "2", "3").
     * @param {string | CanvasGradient | CanvasPattern} color - Background color.
     * @param {string | CanvasGradient | CanvasPattern} textColor - Text color.
     */
    constructor(x, y, width, height, text, key, color = '#0e1520', textColor = '#ffefcd') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.key = key;
        this.color = color;
        this.textColor = textColor;
        this.passed = false;
        /** @type {number} */
        this.fontSize = 14;
    }

    /**
     * Draws the card and its wrapped text.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        // Shadow effect
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(this.x + 6, this.y - this.height / 2 + 6, this.width, this.height);

        // Card body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);

        // Border
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x, this.y - this.height / 2, this.width, this.height);

        // Text
        ctx.fillStyle = this.textColor;
        const fontSize = this.fontSize;
        ctx.font = `${fontSize}px 'Crimson Text', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this._wrapText(ctx, this.text, this.x + this.width / 2, this.y, this.width - 20, fontSize * 1.3);
    }

    /**
     * Helper to wrap text within the card boundaries and center it vertically.
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @param {string} text - The text to wrap.
     * @param {number} x - Horizontal center for the text.
     * @param {number} y - Vertical center for the text block.
     * @param {number} maxWidth - Maximum width allowed for a line.
     * @param {number} lineHeight - Height of each line of text.
     * @private
     * @returns {void}
     */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            }
            else {
                line = testLine;
            }
        }

        lines.push(line);

        const totalHeight = lines.length * lineHeight;
        let currentY = y - (totalHeight / 2) + (lineHeight / 2);

        for (const l of lines) {
            ctx.fillText(l.trim(), x, currentY);
            currentY += lineHeight;
        }
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