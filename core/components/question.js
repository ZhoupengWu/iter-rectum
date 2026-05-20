/**
 * @typedef {Object} Question
 * @property {string} id - Unique identifier for the question.
 * @property {string} category - Category/topic of the question.
 * @property {string} difficulty - Difficulty level (e.g., "facile", "medio", "difficile").
 * @property {string} question - The question text.
 * @property {Object<string, string>} answers - Map of answer keys ("1", "2", "3") to answer text.
 * @property {string} correct_answer - The key of the correct answer.
 * @property {Object<string, string>} explanations - Map of answer keys to their respective explanations.
 */

/**
 * Manages the question lifecycle, including fetching, randomizing, and displaying questions via custom modals.
 */
export class QuestionManager {
    /**
     * @param {string} questionsUrl - Path to the questions JSON file.
     */
    constructor(questionsUrl) {
        this.questionsUrl = questionsUrl;
        /** @type {Question[]} */
        this.allQuestions = [];
        /** @type {Question[]} */
        this.sessionQuestions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.maxScore = 0;
        this.overlay = null;
        this.isProcessing = false;

        /** @type {Object<string, number>} */
        this.difficultyPoints = {
            facile: 10,
            medio: 15,
            difficile: 25
        };
    }

    /**
     * Fetches questions and initializes the modal system.
     * @returns {Promise<void>}
     */
    async init() {
        try {
            const response = await fetch(this.questionsUrl);

            if (!response.ok) throw new Error("Failed to fetch questions");

            /** @type {{questions: Question[]}} */
            const data = await response.json();
            this.allQuestions = data.questions;
            this._prepareSession();
            this._updateScoreDisplay();
        } catch (error) {
            console.error("QuestionManager initialization failed:", error);
        }
    }

    /**
     * Updates the score display in the UI if it exists.
     * @private
     * @returns {void}
     */
    _updateScoreDisplay() {
        const scoreEl = document.getElementById("score-value");

        if (scoreEl) {
            scoreEl.textContent = this.score.toString();
        }
    }

    /**
     * Randomizes and selects 10 questions for the current session.
     * @private
     * @returns {void}
     */
    _prepareSession() {
        const shuffled = [...this.allQuestions].sort(() => 0.5 - Math.random());
        this.sessionQuestions = shuffled.slice(0, 10);
        this.currentIndex = 0;
        this.score = 0;
        this.maxScore = this.sessionQuestions.reduce((acc, q) => acc + this.difficultyPoints[q.difficulty], 0);
    }

    /**
     * Creates and shows a custom modal.
     * @private
     * @param {string} htmlContent - The inner HTML of the modal.
     * @returns {HTMLElement}
     */
    _showModal(htmlContent) {
        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = document.createElement("div");
        this.overlay.className = "custom-modal-overlay";
        this.overlay.innerHTML = `
            <div class="custom-modal">
                ${htmlContent}
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Force reflow for animation
        void this.overlay.offsetWidth;
        this.overlay.classList.add("active");

        return this.overlay;
    }

    /**
     * Hides and removes the current modal.
     * @private
     * @param {Function} callback - Callback after modal is hidden.
     * @returns {void}
     */
    _hideModal(callback) {
        if (!this.overlay) {
            callback();
            return;
        }

        this.overlay.classList.remove("active");
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            callback();
        }, 300);
    }

    /**
     * Displays the next question in the modal.
     * @param {Function} onStartCallback - Callback invoked when the user clicks 'VAI!'.
     * @returns {void}
     */
    showQuestion(onStartCallback) {
        if (this.currentIndex >= this.sessionQuestions.length) {
            this._onSessionEnd();
            return;
        }

        this.isProcessing = true;
        const question = this.sessionQuestions[this.currentIndex];

        const modalHtml = `
            <div class="custom-modal-header">
                <h2 class="custom-modal-title">Domanda ${this.currentIndex + 1} di 10</h2>
            </div>
            <div class="custom-modal-body">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem; justify-content: center;">
                    <div class="modal-badge">${question.category}</div>
                    <div class="modal-badge">${question.difficulty}</div>
                </div>
                <p class="modal-question-text">${question.question}</p>
            </div>
            <div class="custom-modal-footer">
                <button type="button" id="btn-start-question" class="btn-start"><span>VAI!</span></button>
            </div>
        `;

        this._showModal(modalHtml);
        this.isProcessing = false;

        const startBtn = /** @type {HTMLElement} */ (document.getElementById("btn-start-question"));
        startBtn.addEventListener("click", () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            this._hideModal(() => {
                onStartCallback(question);
            });
        }, { once: true });

        // Space key listener
        const spaceHandler = (/** @type {{ code: string; preventDefault: () => void; }} */ e) => {
            if (e.code === "Space") {
                e.preventDefault();
                startBtn.click();
                document.removeEventListener("keydown", spaceHandler);
            }
        };
        document.addEventListener("keydown", spaceHandler);
    }

    /**
     * Displays the feedback modal (correct/incorrect).
     * @param {boolean} isCorrect - Whether the player's choice was correct.
     * @param {Question} question - The current question object.
     * @param {string} chosenAnswerKey - The key of the answer chosen by the player.
     * @param {Function} onNext - Callback to proceed to the next question.
     * @returns {void}
     */
    showFeedback(isCorrect, question, chosenAnswerKey, onNext) {
        this.isProcessing = true;
        const points = this.difficultyPoints[question.difficulty];

        if (isCorrect) {
            this.score += points;
        } else {
            this.score -= points;
        }

        this._updateScoreDisplay();

        const status = isCorrect ? "CORRETTO!" : "SBAGLIATO!";
        const statusClass = isCorrect ? "correct" : "incorrect";
        const pointsText = isCorrect ? `+${points} punti` : `-${points} punti`;

        const feedbackHtml = `
            <div class="custom-modal-header">
                <div class="feedback-status ${statusClass}">${status}</div>
                <div class="modal-badge">${pointsText}</div>
            </div>
            <div class="custom-modal-body">
                <div class="feedback-details">
                    <strong>La tua scelta:</strong>
                    <p class="feedback-text">${question.answers[chosenAnswerKey]}</p>
                    <div style="margin-top: 1rem;">
                        <strong>Spiegazione:</strong>
                        <p class="feedback-text">${question.explanations[chosenAnswerKey]}</p>
                    </div>
                </div>
                ${!isCorrect ? `
                <div class="feedback-details" style="border-color: var(--gold-dim);">
                    <strong>La risposta corretta era:</strong>
                    <p class="feedback-text" style="color: var(--gold);">${question.answers[question.correct_answer]}</p>
                </div>
                ` : ""}
            </div>
            <div class="custom-modal-footer">
                <button type="button" id="btn-next-question" class="btn-start">
                    <span>${this.currentIndex === 9 ? "FINISCI" : "PROSSIMA"}</span>
                </button>
            </div>
        `;

        this._showModal(feedbackHtml);
        this.isProcessing = false;

        const nextBtn = /** @type {HTMLElement} */ (document.getElementById("btn-next-question"));
        nextBtn.addEventListener("click", () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            this._hideModal(() => {
                this.currentIndex++;
                onNext();
            });
        }, { once: true });

        // Space key listener
        const spaceHandler = (/** @type {{ code: string; preventDefault: () => void; }} */ e) => {
            if (e.code === "Space") {
                e.preventDefault();
                nextBtn.click();
                document.removeEventListener("keydown", spaceHandler);
            }
        };
        document.addEventListener("keydown", spaceHandler);
    }

    /**
     * Handles the end of a question session.
     * @private
     * @returns {void}
     */
    _onSessionEnd() {
        this.isProcessing = true;
        const accuracy = Math.round((this.score / this.maxScore) * 100);

        const resultHtml = `
            <div class="custom-modal-header">
                <h2 class="custom-modal-title">SESSIONE COMPLETATA!</h2>
            </div>
            <div class="custom-modal-body">
                <div class="result-score">${this.score}</div>
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-value">${this.score} / ${this.maxScore}</span>
                        <span class="stat-label">Punteggio Totale</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${accuracy}%</span>
                        <span class="stat-label">Grado di Successo</span>
                    </div>
                </div>
                <p class="feedback-text" style="font-size: 1.1rem; margin-top: 2rem; text-align: center; font-style: normal;">
                    ${this._getResultMessage(accuracy)}
                </p>
            </div>
            <div class="custom-modal-footer" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="./list_game.html" class="btn-start" style="padding: 0.8rem 1.5rem; font-size: 0.75rem;"><span>LISTA GIOCHI</span></a>
                <button type="button" id="btn-restart" class="btn-start" style="padding: 0.8rem 1.5rem; font-size: 0.75rem;"><span>GIOCA ANCORA</span></button>
            </div>
        `;

        this._showModal(resultHtml);
        this.isProcessing = false;

        // @ts-ignore
        document.getElementById("btn-restart").addEventListener("click", () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            this._hideModal(() => {
                location.reload();
            });
        }, { once: true });
    }

    /**
     * Returns a personalized message based on the final score.
     * @private
     * @param {number} percentage - The accuracy percentage.
     * @returns {string}
     */
    _getResultMessage(percentage) {
        if (percentage >= 100) return "Perfetto! Sei un vero esperto nella prevenzione del cyberbullismo.";
        if (percentage >= 80) return "Ottimo lavoro! Sai come proteggerti e come promuovere il rispetto online.";
        if (percentage >= 50) return "Buon risultato, ma ripassa i termini e le leggi contro il cyberbullismo.";
        if (percentage >= 0) return "Continua a informarti: conoscere il cyberbullismo è il primo passo per fermarlo!";
        return "Attenzione: le tue risposte indicano una scarsa consapevolezza dei rischi online.";
    }
}