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
 * Manages the question lifecycle, including fetching, randomizing, and displaying questions via a Bootstrap modal.
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
        this.modalElement = null;
        this.bsModal = null;
    }

    /**
     * Fetches questions and initializes the modal element.
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
            this._createModalElement();
        } catch (error) {
            console.error("QuestionManager initialization failed:", error);
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
    }

    /**
     * Injects the Bootstrap modal HTML into the DOM.
     * @private
     * @returns {void}
     */
    _createModalElement() {
        const modalHtml = `
            <div class="modal fade" id="questionModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="questionModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title" id="questionModalLabel">Domanda <span id="q-current">1</span> di 10</h5>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div id="q-category" class="badge rounded-pill bg-primary mb-3"></div>
                            <h3 id="q-text" class="mb-4"></h3>
                            <div id="q-difficulty" class="badge bg-secondary mb-2 text-uppercase"></div>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" id="btn-start-question" class="btn btn-success btn-lg px-5">VAI!</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const div = document.createElement("div");
        div.innerHTML = modalHtml;
        document.body.appendChild(div);

        this.modalElement = document.getElementById("questionModal");
        // @ts-ignore
        this.bsModal = new bootstrap.Modal(this.modalElement);
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

        const question = this.sessionQuestions[this.currentIndex];

        // Update UI
        // @ts-ignore
        document.getElementById("q-current").textContent = (
            this.currentIndex + 1
        ).toString();
        // @ts-ignore
        document.getElementById("q-text").textContent = question.question;
        // @ts-ignore
        document.getElementById("q-category").textContent = question.category;
        // @ts-ignore
        document.getElementById("q-difficulty").textContent = question.difficulty;

        const btn = document.getElementById("btn-start-question");

        // Clean up previous listeners if any
        // @ts-ignore
        const newBtn = btn.cloneNode(true);
        // @ts-ignore
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener(
            "click",
            () => {
                this.bsModal.hide();
                onStartCallback(question);
            },
            { once: true },
        );

        this.bsModal.show();
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
        const title = isCorrect ? "CORRETTO! 🎉" : "SBAGLIATO! ❌";
        const headerClass = isCorrect ? "bg-success" : "bg-danger";
        // @ts-ignore
        const explanation =
            question.explanations[chosenAnswerKey] ||
            "Nessuna spiegazione disponibile.";
        // @ts-ignore
        const correctAnswerText = question.answers[question.correct_answer];

        const feedbackHtml = `
            <div class="modal fade" id="feedbackModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header ${headerClass} text-white">
                            <h5 class="modal-title">${title}</h5>
                        </div>
                        <div class="modal-body py-4">
                            <div class="mb-3">
                                <strong>La tua scelta:</strong><br>
                                <p class="mb-2 italic">${question.answers[chosenAnswerKey]}</p>
                                <div class="p-3 bg-light rounded border">
                                    ${explanation}
                                </div>
                            </div>
                            ${!isCorrect ? `
                            <div class="mb-0">
                                <strong>La risposta corretta era:</strong><br>
                                <p class="text-success fw-bold">${correctAnswerText}</p>
                            </div>
                            ` : ""
                            }
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" id="btn-next-question" class="btn btn-primary btn-lg px-5">
                                ${this.currentIndex === 9 ? "FINISCI" : "PROSSIMA"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove old feedback modal if exists
        const existing = document.getElementById("feedbackModal");
        // @ts-ignore
        if (existing) existing.parentElement.remove();

        const div = document.createElement("div");
        div.innerHTML = feedbackHtml;
        document.body.appendChild(div);

        // @ts-ignore
        const bsFeedbackModal = new bootstrap.Modal(
            document.getElementById("feedbackModal"),
        );

        // @ts-ignore
        document.getElementById("btn-next-question").addEventListener("click", () => {
                bsFeedbackModal.hide();
                this.currentIndex++;
                onNext();
            },
            { once: true },
        );

        bsFeedbackModal.show();
    }

    /**
     * Handles the end of a question session.
     * @private
     * @returns {void}
     */
    _onSessionEnd() {
        alert("Sessione completata! Ottimo lavoro.");
        location.reload();
    }
}