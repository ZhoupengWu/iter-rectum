document.addEventListener('DOMContentLoaded', () => {
    /** @type {NodeListOf<HTMLDivElement>} */
    const cards = document.querySelectorAll('.tutorial-card');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    // @ts-ignore
                    entry.target.style.opacity = '1';
                    // @ts-ignore
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(card);
    });

    const heroElements = /** @type {HTMLElement[]} */ ([
        document.querySelector('.hero-eyebrow'),
        document.querySelector('.page-title'),
        document.querySelector('.hero-rule'),
        document.querySelector('.hero-sub')
    ]);

    heroElements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 200 + (index * 200));
        }
    });
});