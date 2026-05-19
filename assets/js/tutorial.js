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
                    // @ts-ignore
                    entry.target.style.opacity = '1';
                    // @ts-ignore
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
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