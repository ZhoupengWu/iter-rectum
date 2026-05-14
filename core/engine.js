import * as THREE from "three";

/**
 * Represents a 3D stick figure built from Three.js geometries (cylinders + spheres).
 * The figure is assembled in a Group and can be added to any Three.js scene.
 */
export class StickFigure3D {
    /**
     * @param {number} x - World X position
     * @param {number} y - World Y position (lane height)
     * @param {number} z - World Z position
     * @param {number} [scale=1] - Overall scale multiplier
     * @param {number|string} [color=0x111111] - Hex color for the figure material
     */
    constructor(x, y, z, scale = 1, color = 0x111111) {
        this.scale = scale;
        this.color = color;
        this.phase = 0;

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        this._material = new THREE.MeshToonMaterial({ color });

        this._buildFigure();
    }

    /**
     * Builds all body parts and attaches them to this.group.
     * @private
     */
    _buildFigure() {
        const s = this.scale;
        const mat = this._material;

        // ── HEAD ──────────────────────────────────────────────
        const headGeo = new THREE.SphereGeometry(0.18 * s, 16, 16);
        this.head = new THREE.Mesh(headGeo, mat);
        this.head.position.set(0, 1.55 * s, 0);

        // Eye dot (faces +X direction = right)
        const eyeGeo = new THREE.SphereGeometry(0.035 * s, 8, 8);
        const eyeMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        this.eye = new THREE.Mesh(eyeGeo, eyeMat);
        this.eye.position.set(0.15 * s, 1.58 * s, 0.06 * s);

        // ── TORSO ─────────────────────────────────────────────
        const torsoGeo = new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.55 * s, 8);
        this.torso = new THREE.Mesh(torsoGeo, mat);
        this.torso.position.set(0, 1.1 * s, 0);

        // ── ARMS (pivot groups) ───────────────────────────────
        const armLen = 0.38 * s;
        const armGeo = new THREE.CylinderGeometry(0.045 * s, 0.045 * s, armLen, 8);

        // Left arm pivot at shoulder
        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(0, 1.32 * s, 0);
        const leftArmMesh = new THREE.Mesh(armGeo, mat);
        leftArmMesh.position.set(0, -(armLen / 2), 0);
        this.leftArmPivot.add(leftArmMesh);

        // Right arm
        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0, 1.32 * s, 0);
        const rightArmMesh = new THREE.Mesh(armGeo, mat);
        rightArmMesh.position.set(0, -(armLen / 2), 0);
        this.rightArmPivot.add(rightArmMesh);

        // ── LEGS (pivot groups) ───────────────────────────────
        const legLen = 0.5 * s;
        const legGeo = new THREE.CylinderGeometry(0.055 * s, 0.055 * s, legLen, 8);

        // Left leg pivot at hip
        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(0, 0.83 * s, 0);
        const leftLegMesh = new THREE.Mesh(legGeo, mat);
        leftLegMesh.position.set(0, -(legLen / 2), 0);
        this.leftLegPivot.add(leftLegMesh);

        // Right leg
        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0, 0.83 * s, 0);
        const rightLegMesh = new THREE.Mesh(legGeo, mat);
        rightLegMesh.position.set(0, -(legLen / 2), 0);
        this.rightLegPivot.add(rightLegMesh);

        // ── ASSEMBLE ──────────────────────────────────────────
        this.group.add(
            this.head,
            this.eye,
            this.torso,
            this.leftArmPivot,
            this.rightArmPivot,
            this.leftLegPivot,
            this.rightLegPivot
        );

        // Separate arms along Z so they don't overlap
        this.leftArmPivot.position.z  =  0.08 * s;
        this.rightArmPivot.position.z = -0.08 * s;
        this.leftLegPivot.position.z  =  0.07 * s;
        this.rightLegPivot.position.z = -0.07 * s;
    }

    /**
     * Advances the walking animation by one tick.
     * @param {number} [delta=0.016] - Time delta in seconds (for frame-rate independence)
     */
    walk(delta = 0.016) {
        this.phase += delta * 4.5;
        const amp = 0.65;

        this.leftLegPivot.rotation.x  =  Math.sin(this.phase) * amp;
        this.rightLegPivot.rotation.x =  Math.sin(this.phase + Math.PI) * amp;
        this.leftArmPivot.rotation.x  =  Math.sin(this.phase + Math.PI) * (amp * 0.7);
        this.rightArmPivot.rotation.x =  Math.sin(this.phase) * (amp * 0.7);
    }

    /**
     * Moves the figure to a new Y world position (lane switch).
     * @param {number} y
     */
    setLaneY(y) {
        this.group.position.y = y;
    }

    /**
     * Adds the figure's group to a Three.js scene.
     * @param {THREE.Scene} scene
     */
    addTo(scene) {
        scene.add(this.group);
    }
}