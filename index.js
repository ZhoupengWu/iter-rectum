const button_start = /** @type {HTMLElement} */ (document.getElementById("start-here"));

button_start.addEventListener("click", () => {
    location.href = "./assets/pages/list_game.html";
});

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.href.includes('index.html') && (currentPath === '/' || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
            link.style.borderBottom = '2px solid #ffefcd';
        }
    });
});