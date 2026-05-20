/**
 * Iter Rectum — 3D Game (Three.js)
 *
 * Architecture:
 *  - SceneManager   : Three.js renderer, camera, lights
 *  - World          : infinite ground, lane lines, sky
 *  - Character      : animated 3D stick figure built from meshes
 *  - CardManager    : spawns / moves 3D answer cards
 *  - UIManager      : modal dialogs (question, feedback, results)
 *  - InputManager   : keyboard + touch controls
 *  - Game           : orchestrates all subsystems, game loop
 */

import * as THREE from 'three';
import { QuestionManager } from '../../core/components/question.js';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const LANE_COUNT   = 3;
const LANE_SPREAD  = 1.6;      // spacing between lanes (world units)
const CARD_SPEED   = 6;        // units per second
const GROUND_SPEED = 6;        // scroll speed for textures
const FIGURE_X     = -4;       // figure's fixed X in world space
const CAMERA_FOV   = 60;

const GOLD   = 0xc9a84c;
const CREAM  = 0xffefcd;
const BGDEEP = 0x0e1520;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function lerpAngle(from, to, t) {
    return from + (to - from) * t;
}

/** Returns target Y position for a given lane (1-3) */
function laneY(lane) {
    // lanes: 1=top(-LANE_SPREAD), 2=mid(0), 3=bottom(+LANE_SPREAD)
    return (lane - 2) * LANE_SPREAD;
}

// ─────────────────────────────────────────────
// SCENE MANAGER
// ─────────────────────────────────────────────
class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene  = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1020, 0.045);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha:    false,
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(BGDEEP);

        this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
        this._resetCamera();

        this._addLights();
        this._resize();

        this._onResize = this._resize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _resetCamera() {
        // Slightly above and behind the figure, angled forward
        this.camera.position.set(FIGURE_X - 4.5, 3.5, 0);
        this.camera.lookAt(FIGURE_X + 6, 0.5, 0);
    }

    _addLights() {
        const ambient = new THREE.AmbientLight(0x1a2540, 2.5);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xfff4d0, 3.0);
        key.position.set(10, 14, 4);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far  = 60;
        key.shadow.camera.left = key.shadow.camera.bottom = -20;
        key.shadow.camera.right = key.shadow.camera.top  =  20;
        key.shadow.bias = -0.001;
        this.scene.add(key);

        // Gold accent rim light from the right
        const rim = new THREE.DirectionalLight(GOLD, 1.2);
        rim.position.set(-4, 6, -10);
        this.scene.add(rim);

        // Cool fill from below
        const fill = new THREE.HemisphereLight(0x0d1c3a, 0x0a150e, 0.8);
        this.scene.add(fill);
    }

    _resize() {
        const wrap = this.canvas.parentElement;
        if (!wrap) return;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    render(scene) {
        this.renderer.render(scene, this.camera);
    }

    dispose() {
        window.removeEventListener('resize', this._onResize);
    }
}

// ─────────────────────────────────────────────
// WORLD (ground + lane lines + backdrop)
// ─────────────────────────────────────────────
class World {
    constructor(scene) {
        this.scene    = scene;
        this.scrollOffset = 0;

        this._buildGround();
        this._buildLaneLines();
        this._buildBackdrop();
        this._buildGrassBlades();
    }

    _buildGround() {
        // Procedural stripe texture
        const size = 512;
        const ctx  = Object.assign(document.createElement('canvas'), { width: size, height: size })
                         .getContext('2d');

        // Base green
        ctx.fillStyle = '#136b2a';
        ctx.fillRect(0, 0, size, size);

        // Subtle darker stripes along lanes
        const laneHeightPx = size / 3;
        [0, 1, 2].forEach(i => {
            const y = i * laneHeightPx;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(0, y, size, laneHeightPx);
        });

        // Random grass tufts
        ctx.strokeStyle = '#0d5020';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 400; i++) {
            const gx = Math.random() * size;
            const gy = Math.random() * size;
            // avoid centre of lane lines
            if (Math.abs(gy % laneHeightPx - laneHeightPx) < 8) continue;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + (Math.random() - .5) * 4, gy - 5 - Math.random() * 6);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(ctx.canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 3);

        this.groundTex = tex;

        const geo  = new THREE.PlaneGeometry(200, LANE_SPREAD * LANE_COUNT, 1, 1);
        const mat  = new THREE.MeshLambertMaterial({ map: tex });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    _buildLaneLines() {
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
        [-LANE_SPREAD / 2, LANE_SPREAD / 2].forEach(z => {
            const geo  = new THREE.PlaneGeometry(200, 0.06);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(0, 0.003, z);
            this.scene.add(mesh);
        });
    }

    _buildGrassBlades() {
        // Instanced grass for performance
        const bladeGeo = new THREE.ConeGeometry(0.04, 0.25, 3);
        bladeGeo.translate(0, 0.12, 0);
        const bladeMat = new THREE.MeshLambertMaterial({ color: 0x1a7a30 });
        const count = 600;
        const mesh  = new THREE.InstancedMesh(bladeGeo, bladeMat, count);
        mesh.castShadow = false;

        const dummy = new THREE.Object3D();
        const halfW = LANE_SPREAD * LANE_COUNT * .5;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - .5) * 80;
            const z = (Math.random() - .5) * halfW * 2;
            // skip if on divider
            if (Math.abs(Math.abs(z) - LANE_SPREAD / 2) < .15) { i--; continue; }
            dummy.position.set(x, 0, z);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.scale.setScalar(.7 + Math.random() * .6);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.grassMesh = mesh;
        this.scene.add(mesh);
    }

    _buildBackdrop() {
        // Simple sky gradient via gradient texture
        const size = 2;
        const ctx  = Object.assign(document.createElement('canvas'), { width: 1, height: size })
                         .getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0,   '#05111e');
        grad.addColorStop(0.4, '#0d1e36');
        grad.addColorStop(1,   '#132440');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, size);

        const skyTex = new THREE.CanvasTexture(ctx.canvas);
        this.scene.background = skyTex;

        // Distant "stars" via point cloud
        const starGeo = new THREE.BufferGeometry();
        const starVerts = [];
        for (let i = 0; i < 600; i++) {
            starVerts.push(
                (Math.random() - .5) * 300,
                 10 + Math.random() * 60,
                (Math.random() - .5) * 300
            );
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
        const starMat  = new THREE.PointsMaterial({ color: 0xfff8e0, size: 0.18, sizeAttenuation: true });
        this.scene.add(new THREE.Points(starGeo, starMat));
    }

    update(dt) {
        // Scroll ground texture forward
        this.scrollOffset += dt * GROUND_SPEED * 0.02;
        if (this.groundTex) {
            this.groundTex.offset.x = this.scrollOffset;
        }
    }
}

// ─────────────────────────────────────────────
// CHARACTER  (3D stick figure)
// ─────────────────────────────────────────────
class Character {
    constructor(scene) {
        this.scene = scene;
        this.phase = 0;

        this.root = new THREE.Group();
        this.root.position.set(FIGURE_X, 0, 0);
        scene.add(this.root);

        this._mat = new THREE.MeshStandardMaterial({
            color:     CREAM,
            roughness: 0.4,
            metalness: 0.1,
            emissive:  new THREE.Color(GOLD).multiplyScalar(0.08),
        });

        this._build();

        // Target/current lane Y (world Z)
        this.targetZ  = 0;
        this.currentZ = 0;
    }

    _cyl(rTop, rBot, h, name) {
        const geo  = new THREE.CylinderGeometry(rTop, rBot, h, 8);
        const mesh = new THREE.Mesh(geo, this._mat);
        mesh.castShadow = true;
        mesh.name = name;
        return mesh;
    }

    _sph(r, name) {
        const geo  = new THREE.SphereGeometry(r, 12, 8);
        const mesh = new THREE.Mesh(geo, this._mat);
        mesh.castShadow = true;
        mesh.name = name;
        return mesh;
    }

    _build() {
        const S = 0.55; // overall scale

        // --- Head ---
        this.head = this._sph(0.22 * S, 'head');
        this.head.position.set(0, 1.72 * S, 0);
        this.root.add(this.head);

        // --- Eye (gold dot, always facing camera isn't needed — face right) ---
        const eyeMat = new THREE.MeshBasicMaterial({ color: GOLD });
        const eye    = new THREE.Mesh(new THREE.SphereGeometry(0.04 * S, 6, 6), eyeMat);
        eye.position.set(0.18 * S, 0.04 * S, 0.05 * S);
        this.head.add(eye);

        // --- Torso ---
        this.torso = this._cyl(0.12 * S, 0.14 * S, 0.6 * S, 'torso');
        this.torso.position.set(0, 1.25 * S, 0);
        this.root.add(this.torso);

        // --- Arm pivots ---
        const armPivotY = 1.5 * S;

        this.leftArmPivot  = new THREE.Group();
        this.leftArmPivot.position.set(0, armPivotY, 0);
        this.root.add(this.leftArmPivot);

        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0, armPivotY, 0);
        this.root.add(this.rightArmPivot);

        const arm = () => {
            const cyl = this._cyl(0.055 * S, 0.045 * S, 0.45 * S, 'arm');
            cyl.position.set(0, -0.22 * S, 0);
            return cyl;
        };
        this.leftArmPivot.add(arm());
        this.rightArmPivot.add(arm());

        // --- Leg pivots ---
        const legPivotY = 0.95 * S;

        this.leftLegPivot  = new THREE.Group();
        this.leftLegPivot.position.set(0, legPivotY, 0);
        this.root.add(this.leftLegPivot);

        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0, legPivotY, 0);
        this.root.add(this.rightLegPivot);

        const leg = () => {
            const cyl = this._cyl(0.07 * S, 0.055 * S, 0.55 * S, 'leg');
            cyl.position.set(0, -0.27 * S, 0);
            return cyl;
        };
        this.leftLegPivot.add(leg());
        this.rightLegPivot.add(leg());

        // Ground shadow disc
        const shadowGeo = new THREE.CircleGeometry(0.22 * S, 16);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.002;
        this.root.add(shadow);
    }

    setLane(lane) {
        this.targetZ = laneY(lane);
    }

    update(dt, isRunning) {
        // Smooth lane transition
        this.currentZ = THREE.MathUtils.lerp(this.currentZ, this.targetZ, Math.min(1, dt * 10));
        this.root.position.z = this.currentZ;

        if (!isRunning) return;

        // Walk animation
        this.phase += dt * 5.5;
        const amp = 0.65;

        this.leftLegPivot.rotation.x  =  Math.sin(this.phase) * amp;
        this.rightLegPivot.rotation.x = -Math.sin(this.phase) * amp;
        this.leftArmPivot.rotation.x  = -Math.sin(this.phase) * amp * 0.7;
        this.rightArmPivot.rotation.x =  Math.sin(this.phase) * amp * 0.7;

        // Subtle body bob
        this.root.position.y = Math.abs(Math.sin(this.phase)) * 0.04;

        // Face forward (slight tilt towards camera)
        this.root.rotation.y = -Math.PI / 2 + 0.05;
    }
}

// ─────────────────────────────────────────────
// CARD MANAGER
// ─────────────────────────────────────────────
class CardObject {
    constructor(scene, text, lane, key) {
        this.scene  = scene;
        this.lane   = lane;
        this.key    = key;
        this.passed = false;

        const targetZ = laneY(lane);
        const startX  = 22; // off-screen right

        // Rounded-rect canvas texture for card face
        const { texture, w, h } = CardObject._makeTexture(text, key);

        // Card geometry (thin box)
        const aspect = w / h;
        const cardH  = 1.1;
        const cardW  = cardH * aspect;
        const geo    = new THREE.BoxGeometry(0.04, cardH, cardW);

        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x080e1b, roughness: .7 }),   // right side
            new THREE.MeshStandardMaterial({ color: 0x080e1b, roughness: .7 }),   // left side
            new THREE.MeshStandardMaterial({ color: 0x080e1b }),                  // top
            new THREE.MeshStandardMaterial({ color: 0x080e1b }),                  // bottom
            new THREE.MeshStandardMaterial({ map: texture, roughness: .5, metalness: .05 }), // front (face)
            new THREE.MeshStandardMaterial({ color: 0x080e1b, roughness: .7 }),   // back
        ];

        this.mesh = new THREE.Mesh(geo, materials);
        this.mesh.position.set(startX, cardH / 2, targetZ);
        this.mesh.castShadow  = true;
        this.mesh.receiveShadow = false;

        // Gold border frame
        const frameMat = new THREE.MeshBasicMaterial({ color: GOLD, wireframe: false });
        const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.06, cardH + 0.06, cardW + 0.06));
        this.frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: GOLD }));
        this.frame.position.copy(this.mesh.position);

        scene.add(this.mesh);
        scene.add(this.frame);

        this.width  = cardW;
        this.height = cardH;
    }

    static _makeTexture(text, key) {
        const W = 512, H = 256;
        const cv  = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');

        // Background
        ctx.fillStyle = '#080e1b';
        ctx.fillRect(0, 0, W, H);

        // Gold border inside
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, W - 6, H - 6);

        // Lane number badge
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 28px Cinzel, serif';
        ctx.fillText(`[${key}]`, 20, 40);

        // Wrapped answer text
        ctx.fillStyle = '#ffefcd';
        ctx.font = '22px "Crimson Text", serif';
        ctx.textAlign = 'center';
        CardObject._wrapCtx(ctx, text, W / 2, 90, W - 60, 32);

        return { texture: new THREE.CanvasTexture(cv), w: W, h: H };
    }

    static _wrapCtx(ctx, text, x, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > maxW && line) {
                lines.push(line.trim()); line = w + ' ';
            } else { line = test; }
        }
        lines.push(line.trim());
        const total = lines.length * lineH;
        let cy = y - total / 2 + lineH / 2;
        for (const l of lines) { ctx.fillText(l, x, cy); cy += lineH; }
    }

    get x() { return this.mesh.position.x; }

    update(dt) {
        const dx = CARD_SPEED * dt;
        this.mesh.position.x  -= dx;
        this.frame.position.x -= dx;
    }

    isOffScreen() {
        return this.mesh.position.x < FIGURE_X - 3;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.scene.remove(this.frame);
        this.mesh.geometry.dispose();
        this.mesh.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        this.frame.geometry.dispose();
    }
}

// ─────────────────────────────────────────────
// UI MANAGER
// ─────────────────────────────────────────────
class UIManager {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.content = document.getElementById('modal-content');
    }

    _show(html) {
        this.content.innerHTML = html;
        this.overlay.setAttribute('aria-hidden', 'false');
        this.overlay.classList.add('active');
    }

    _hide(cb) {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');
        setTimeout(cb, 300);
    }

    showQuestion(question, index, total, onStart) {
        this._show(`
            <h2 class="modal-title">Domanda ${index + 1} di ${total}</h2>
            <div class="modal-badges">
                <span class="modal-badge">${question.category}</span>
                <span class="modal-badge">${question.difficulty}</span>
            </div>
            <p class="modal-question">${question.question}</p>
            <div class="modal-footer">
                <button type="button" id="ui-go" class="btn-cta"><span>VAI!</span></button>
            </div>
            <p class="modal-hint">oppure premi <kbd>Spazio</kbd></p>
        `);

        const go = () => this._hide(() => onStart(question));
        document.getElementById('ui-go').addEventListener('click', go, { once: true });

        const spaceH = e => {
            if (e.code === 'Space') { e.preventDefault(); go(); document.removeEventListener('keydown', spaceH); }
        };
        document.addEventListener('keydown', spaceH);
    }

    showFeedback(isCorrect, question, chosenKey, points, onNext, isLast) {
        const sign     = isCorrect ? `+${points}` : `-${points}`;
        const status   = isCorrect ? 'CORRETTO!' : 'SBAGLIATO!';
        const cls      = isCorrect ? 'correct' : 'wrong';

        const wrongPanel = !isCorrect ? `
            <div class="feedback-panel gold-border">
                <strong>La risposta corretta era:</strong>
                <p>${question.answers[question.correct_answer]}</p>
            </div>` : '';

        this._show(`
            <div class="feedback-status ${cls}">${status}</div>
            <div class="modal-badges"><span class="modal-badge">${sign} punti</span></div>
            <div class="feedback-panel">
                <strong>La tua scelta:</strong>
                <p>${question.answers[chosenKey]}</p>
            </div>
            <div class="feedback-panel">
                <strong>Spiegazione:</strong>
                <p>${question.explanations[chosenKey]}</p>
            </div>
            ${wrongPanel}
            <div class="modal-footer">
                <button type="button" id="ui-next" class="btn-cta">
                    <span>${isLast ? 'FINISCI' : 'PROSSIMA'}</span>
                </button>
            </div>
            <p class="modal-hint">oppure premi <kbd>Spazio</kbd></p>
        `);

        const next = () => this._hide(onNext);
        document.getElementById('ui-next').addEventListener('click', next, { once: true });

        const spaceH = e => {
            if (e.code === 'Space') { e.preventDefault(); next(); document.removeEventListener('keydown', spaceH); }
        };
        document.addEventListener('keydown', spaceH);
    }

    showResults(score, maxScore, onRestart) {
        const pct = Math.max(0, Math.round((score / maxScore) * 100));
        const msg = pct >= 100 ? 'Perfetto! Sei un vero esperto.'
                  : pct >=  80 ? 'Ottimo lavoro! Sai come proteggerti.'
                  : pct >=  50 ? 'Buon risultato, ma ripassa i termini!'
                  : pct >=   0 ? 'Continua a informarti: è il primo passo.'
                  : 'Attenzione: poca consapevolezza dei rischi.';

        this._show(`
            <h2 class="modal-title">SESSIONE COMPLETATA!</h2>
            <div class="result-score">${score}</div>
            <div class="result-stats">
                <div class="stat-item">
                    <span class="stat-value">${score} / ${maxScore}</span>
                    <span class="stat-label">Punteggio</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${pct}%</span>
                    <span class="stat-label">Successo</span>
                </div>
            </div>
            <div class="feedback-panel">
                <p style="text-align:center;font-style:normal;">${msg}</p>
            </div>
            <div class="modal-footer">
                <a href="./list_game.html" class="btn-cta"><span>LISTA GIOCHI</span></a>
                <button type="button" id="ui-restart" class="btn-cta"><span>GIOCA ANCORA</span></button>
            </div>
        `);

        document.getElementById('ui-restart').addEventListener('click', () => {
            this._hide(onRestart);
        }, { once: true });
    }
}

// ─────────────────────────────────────────────
// INPUT MANAGER
// ─────────────────────────────────────────────
class InputManager {
    constructor(gameWrapper) {
        this.onUp   = null;
        this.onDown = null;

        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowUp')   { e.preventDefault(); this.onUp?.(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.onDown?.(); }
        });

        // Click on canvas (top / bottom half)
        gameWrapper.addEventListener('mousedown', e => {
            if (e.target.closest('#mobile-controls')) return;
            const rect = gameWrapper.getBoundingClientRect();
            const cy   = e.clientY - rect.top;
            cy < rect.height / 2 ? this.onUp?.() : this.onDown?.();
        });

        // Mobile buttons
        const btnUp   = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');

        const handle = (el, cb) => {
            el.addEventListener('touchstart', e => { e.preventDefault(); cb(); }, { passive: false });
            el.addEventListener('mousedown',  e => { e.preventDefault(); cb(); });
        };
        if (btnUp)   handle(btnUp,   () => this.onUp?.());
        if (btnDown) handle(btnDown, () => this.onDown?.());

        // Prevent pull-to-refresh during game
        gameWrapper.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    }
}

// ─────────────────────────────────────────────
// LANE INDICATOR UI
// ─────────────────────────────────────────────
function updateLaneDots(activeLane) {
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`lane-${i}`);
        if (!dot) continue;
        dot.dataset.active = (i === activeLane) ? 'true' : 'false';
    }
}

// ─────────────────────────────────────────────
// SCORE DISPLAY
// ─────────────────────────────────────────────
function setScore(val) {
    const el = document.getElementById('score-value');
    if (el) el.textContent = val;
}

// ─────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────
function setLoading(pct) {
    const bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = `${pct}%`;
}
function hideLoading() {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
}

// ─────────────────────────────────────────────
// MAIN GAME CLASS
// ─────────────────────────────────────────────
class Game {
    constructor() {
        this.canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game3d-canvas'));

        this.scene  = new SceneManager(this.canvas);
        this.world  = new World(this.scene.scene);
        this.char   = new Character(this.scene.scene);
        this.ui     = new UIManager();
        this.input  = new InputManager(document.getElementById('game-wrapper'));

        /** @type {QuestionManager} */
        this.qm = new QuestionManager('../../assets/json/questions.json');

        // State
        this.running      = false;
        this.lane         = 2;
        this.cards        = [];
        this.currentQ     = null;
        this.score        = 0;
        this.maxScore     = 0;
        this.sessionIndex = 0;
        this.sessionLen   = 10;
        this.diffPts      = { facile: 10, medio: 15, difficile: 25 };

        // Clock
        this._clock = new THREE.Clock(false);
        this._raf   = null;

        // Wire controls
        this.input.onUp   = () => this._moveUp();
        this.input.onDown = () => this._moveDown();

        // Init async
        this._init();
    }

    async _init() {
        setLoading(20);
        await this.qm.init();
        setLoading(70);

        // Manual session (bypass qm modal system)
        this._sessionQuestions = [...this.qm.allQuestions]
            .sort(() => Math.random() - .5)
            .slice(0, this.sessionLen);
        this.sessionIndex = 0;
        this.score        = 0;
        this.maxScore     = this._sessionQuestions.reduce((a, q) => a + this.diffPts[q.difficulty], 0);

        setLoading(100);
        setTimeout(hideLoading, 400);

        // Start loop
        this._clock.start();
        this._loop();

        // Show first question
        this._startTurn();
    }

    _moveUp() {
        if (!this.running || this.lane === 1) return;
        this.lane--;
        this.char.setLane(this.lane);
        updateLaneDots(this.lane);
    }

    _moveDown() {
        if (!this.running || this.lane === 3) return;
        this.lane++;
        this.char.setLane(this.lane);
        updateLaneDots(this.lane);
    }

    _startTurn() {
        if (this.sessionIndex >= this.sessionLen) {
            this._endSession();
            return;
        }
        this.running  = false;
        const q = this._sessionQuestions[this.sessionIndex];
        this.currentQ = q;

        this.ui.showQuestion(q, this.sessionIndex, this.sessionLen, question => {
            this._spawnCards(question);
            this.running = true;
        });
    }

    _spawnCards(question) {
        // Remove leftover cards
        this.cards.forEach(c => c.destroy());
        this.cards = [];

        Object.keys(question.answers).forEach(key => {
            const lane = parseInt(key);
            const card = new CardObject(this.scene.scene, question.answers[key], lane, key);
            this.cards.push(card);
        });
    }

    _checkCollisions() {
        const figX  = FIGURE_X;
        // Use a horizontal threshold slightly in front of the figure
        const hitX  = figX + 0.35;

        for (const card of this.cards) {
            if (card.passed) continue;
            if (card.x <= hitX) {
                card.passed = true;
                // Check lane match
                if (card.lane === this.lane) {
                    this._handleChoice(String(card.lane));
                    return;
                }
            }
        }

        // All cards have scrolled off — no choice made (wrong by default? skip turn)
        if (this.cards.length > 0 && this.cards.every(c => c.isOffScreen())) {
            this._cleanCards();
            this.running = false;
            this._startTurn();
        }
    }

    _handleChoice(chosenKey) {
        if (!this.running) return;
        this.running = false;

        const q       = this.currentQ;
        const correct = chosenKey === q.correct_answer;
        const pts     = this.diffPts[q.difficulty];

        this.score += correct ? pts : -pts;
        setScore(this.score);

        this._cleanCards();

        this.ui.showFeedback(
            correct, q, chosenKey, pts,
            () => {
                this.sessionIndex++;
                this._startTurn();
            },
            this.sessionIndex === this.sessionLen - 1
        );
    }

    _cleanCards() {
        this.cards.forEach(c => c.destroy());
        this.cards = [];
    }

    _endSession() {
        this.running = false;
        this._cleanCards();
        this.ui.showResults(this.score, this.maxScore, () => {
            // Restart
            this._sessionQuestions = [...this.qm.allQuestions]
                .sort(() => Math.random() - .5)
                .slice(0, this.sessionLen);
            this.sessionIndex = 0;
            this.score        = 0;
            this.lane         = 2;
            this.char.setLane(2);
            updateLaneDots(2);
            setScore(0);
            this._startTurn();
        });
    }

    _loop() {
        this._raf = requestAnimationFrame(() => this._loop());
        const dt  = Math.min(this._clock.getDelta(), 0.05); // cap at 50ms

        // Update subsystems
        this.world.update(dt);
        this.char.update(dt, this.running);

        if (this.running) {
            this.cards.forEach(c => c.update(dt));
            this._checkCollisions();
        }

        this.scene.render(this.scene.scene);
    }
}

// ─────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});