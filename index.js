const button_start = /** @type {HTMLElement} */ (document.getElementById("start-here"));
const button_tutorial = /** @type {HTMLElement} */ (document.getElementById("tutorial-btn"));

button_start.addEventListener("click", () => {
    location.href = "./assets/pages/list_game.html";
});

button_tutorial.addEventListener("click", () => {
    location.href = "./assets/pages/tutorial.html";
});