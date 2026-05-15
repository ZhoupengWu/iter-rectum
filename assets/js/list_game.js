document.addEventListener('DOMContentLoaded', () => {
    console.log('Game selection list initialized.');

    const currentPath = window.location.pathname;
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        // @ts-ignore
        if (link.href.includes(currentPath.split('/').pop())) {
            link.classList.add('active');
            link.style.borderBottom = '2px solid #ffefcd';
        }
    });
});