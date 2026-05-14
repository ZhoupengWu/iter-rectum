import * as THREE from "three";
import { StickFigure3D } from "../../core/engine.js";

// ─── LANE CONFIG ─────────────────────────────────────────────────────────────
// Three lanes along world Z axis (isometric lateral view → lanes spread in Z)
const LANE_Z = { 1: 2, 2: 0, 3: -2 };
let currentLane = 2; // start in middle lane

// ─── SCENE SETUP ─────────────────────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x1a2238);
scene.fog = new THREE.Fog(0x1a2238, 30, 60);

// ── ISOMETRIC-STYLE CAMERA ────────────────────────────────────────────────────
// OrthographicCamera gives the true isometric look (no perspective distortion)
const aspect   = window.innerWidth / window.innerHeight;
const viewSize = 8;
const camera   = new THREE.OrthographicCamera(
    -viewSize * aspect / 2,
     viewSize * aspect / 2,
     viewSize / 2,
    -viewSize / 2,
    0.1,
    200
);

// Classic isometric angle: 45° horizontal, ~35.26° vertical
camera.position.set(14, 10, 14);
camera.lookAt(0, 1, 0);

// ── RENDERER ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
document.getElementById("game").appendChild(renderer.domElement);

// ─── LIGHTING ────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
sun.position.set(10, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far  = 80;
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top  = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

// Soft fill from the opposite side
const fill = new THREE.DirectionalLight(0x9ab0ff, 0.4);
fill.position.set(-8, 6, -8);
scene.add(fill);

// ─── GROUND / LANES ──────────────────────────────────────────────────────────
buildWorld();

function buildWorld() {
    // Main grassy plane
    const groundGeo = new THREE.PlaneGeometry(60, 8);
    const groundMat = new THREE.MeshToonMaterial({ color: 0x059036 });
    const ground    = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lane divider lines (thin flat boxes)
    const divMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    [-1, 1].forEach(z => {
        const divGeo = new THREE.BoxGeometry(60, 0.02, 0.06);
        const div    = new THREE.Mesh(divGeo, divMat);
        div.position.set(0, 0.01, z);
        scene.add(div);
    });

    // Sawtooth fence on the left side (decorative, replaces the 2D triangles)
    const fenceMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
    for (let i = -28; i < 30; i += 1) {
        const toothGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
        const tooth    = new THREE.Mesh(toothGeo, fenceMat);
        tooth.position.set(i, 0.2, 4.2);
        tooth.rotation.y = Math.PI / 4;
        scene.add(tooth);
    }

    // Grass tufts scattered in lanes (small cylinders)
    const grassMat = new THREE.MeshToonMaterial({ color: 0x04722b });
    for (let i = 0; i < 120; i++) {
        const gx = (Math.random() - 0.5) * 56;
        const gz = (Math.random() - 0.5) * 7;

        // Avoid lane divider safety zone
        if (Math.abs(Math.abs(gz) - 1) < 0.25) continue;

        const h      = 0.05 + Math.random() * 0.12;
        const tGeo   = new THREE.CylinderGeometry(0.02, 0.04, h, 4);
        const tuft   = new THREE.Mesh(tGeo, grassMat);
        tuft.position.set(gx, h / 2, gz);
        scene.add(tuft);
    }

    // Infinite road scroll: moving ground stripes (visual feedback for movement)
    // We'll handle this in the animation loop via stripe groups
}

// ─── MOVING ROAD STRIPES ─────────────────────────────────────────────────────
// Thin white dashes that scroll left → gives illusion of the figure walking
const stripeGroup = new THREE.Group();
scene.add(stripeGroup);
const STRIPE_SPACING = 3;
const STRIPE_COUNT   = 20;
const stripeMat      = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true });

for (let i = 0; i < STRIPE_COUNT; i++) {
    const sGeo   = new THREE.BoxGeometry(1.2, 0.015, 0.06);
    const stripe = new THREE.Mesh(sGeo, stripeMat);
    stripe.position.set(i * STRIPE_SPACING - 30, 0.02, 0); // center lane
    stripeGroup.add(stripe);
}

// ─── STICK FIGURE ────────────────────────────────────────────────────────────
const person = new StickFigure3D(0, 0, LANE_Z[currentLane], 1.2, 0x111111);
person.addTo(scene);

// ─── LANE SWITCHING ──────────────────────────────────────────────────────────
let targetZ    = LANE_Z[currentLane];
let isMoving   = false;

document.addEventListener("keydown", e => {
    const arrows = ["ArrowUp", "ArrowDown"];
    if (arrows.includes(e.key)) e.preventDefault();

    if (e.key === "ArrowUp"   && currentLane > 1) { currentLane--; applyLane(); }
    if (e.key === "ArrowDown" && currentLane < 3) { currentLane++; applyLane(); }
});

function applyLane() {
    targetZ  = LANE_Z[currentLane];
    isMoving = true;
}

// ─── CLOCK & ANIMATION LOOP ──────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Walk animation
    person.walk(delta);

    // Smooth lane transition (lerp on Z)
    const currentZ = person.group.position.z;
    if (Math.abs(currentZ - targetZ) > 0.01) {
        person.group.position.z += (targetZ - currentZ) * 0.18;
    } else {
        person.group.position.z = targetZ;
        isMoving = false;
    }

    // Tilt figure slightly when changing lane
    const leanTarget = isMoving ? (targetZ > currentZ ? -0.15 : 0.15) : 0;
    person.group.rotation.x += (leanTarget - person.group.rotation.x) * 0.1;

    // Scroll stripes to simulate forward movement
    stripeGroup.children.forEach(stripe => {
        stripe.position.x -= delta * 4;
        if (stripe.position.x < -30) stripe.position.x += STRIPE_COUNT * STRIPE_SPACING;
    });

    renderer.render(scene, camera);
}

animate();

// ─── RESIZE HANDLER ──────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
    const a = window.innerWidth / window.innerHeight;
    camera.left   = -viewSize * a / 2;
    camera.right  =  viewSize * a / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});