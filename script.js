document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar') || document.querySelector('pill-nav');

    window.addEventListener('scroll', () => {
        if (navbar && navbar.classList) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right');

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar ? navbar.offsetHeight || 80 : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Carousel logic
    const carousel = document.querySelector('.gallery-carousel');
    const btnPrev = document.querySelector('.carousel-btn.prev');
    const btnNext = document.querySelector('.carousel-btn.next');

    if (carousel && btnPrev && btnNext) {
        btnNext.addEventListener('click', () => {
            const scrollAmount = carousel.offsetWidth / (window.innerWidth >= 768 ? 3 : 1);
            if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
                carousel.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        });
        btnPrev.addEventListener('click', () => {
            const scrollAmount = carousel.offsetWidth / (window.innerWidth >= 768 ? 3 : 1);
            if (carousel.scrollLeft <= 0) {
                carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        });
    }

    // Lofts Carousel logic
    const loftCarousel = document.querySelector('.lofts-carousel');
    const btnPrevLoft = document.querySelector('.carousel-btn.prev-loft');
    const btnNextLoft = document.querySelector('.carousel-btn.next-loft');

    if (loftCarousel && btnPrevLoft && btnNextLoft) {
        btnNextLoft.addEventListener('click', () => {
            const scrollAmount = loftCarousel.offsetWidth / (window.innerWidth >= 768 ? 3 : 1);
            if (loftCarousel.scrollLeft + loftCarousel.clientWidth >= loftCarousel.scrollWidth - 1) {
                loftCarousel.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                loftCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        });
        btnPrevLoft.addEventListener('click', () => {
            const scrollAmount = loftCarousel.offsetWidth / (window.innerWidth >= 768 ? 3 : 1);
            if (loftCarousel.scrollLeft <= 0) {
                loftCarousel.scrollTo({ left: loftCarousel.scrollWidth, behavior: 'smooth' });
            } else {
                loftCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        });
    }
});
