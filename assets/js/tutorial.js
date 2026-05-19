document.addEventListener('DOMContentLoaded', () => {
    /** @type {NodeListOf<HTMLElement>} */
    const animElements = document.querySelectorAll('.tutorial-card, .how-to-play, .step');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animElements.forEach(el => observer.observe(el));

    const heroElements = /** @type {HTMLElement[]} */ ([
        document.querySelector('.hero-eyebrow'),
        document.querySelector('.page-title'),
        document.querySelector('.hero-rule'),
        document.querySelector('.hero-sub')
    ]);

    heroElements.forEach((el, index) => {
        if (el) {
            setTimeout(() => {
                el.classList.add('visible');
            }, 200 + (index * 200));
        }
    });
});