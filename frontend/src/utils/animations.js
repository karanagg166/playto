import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

// Smooth Scroll Provider
export function SmoothScrollProvider({ children }) {
    const lenisRef = useRef(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return children;
}

// GSAP Animation Hooks
export function useGsapFadeIn(ref, options = {}) {
    useEffect(() => {
        if (!ref.current) return;

        gsap.fromTo(ref.current,
            {
                opacity: 0,
                y: options.y || 30,
                scale: options.scale || 1,
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: options.duration || 0.8,
                delay: options.delay || 0,
                ease: options.ease || 'power3.out',
            }
        );
    }, []);
}

export function useGsapStagger(containerRef, selector, options = {}) {
    useEffect(() => {
        if (!containerRef.current) return;

        const elements = containerRef.current.querySelectorAll(selector);

        gsap.fromTo(elements,
            {
                opacity: 0,
                y: options.y || 20,
            },
            {
                opacity: 1,
                y: 0,
                duration: options.duration || 0.6,
                stagger: options.stagger || 0.1,
                delay: options.delay || 0,
                ease: options.ease || 'power2.out',
            }
        );
    }, []);
}

// Text reveal animation
export function useTextReveal(ref, options = {}) {
    useEffect(() => {
        if (!ref.current) return;

        gsap.fromTo(ref.current,
            {
                opacity: 0,
                y: 50,
                clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
            },
            {
                opacity: 1,
                y: 0,
                clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
                duration: options.duration || 1,
                delay: options.delay || 0,
                ease: 'power4.out',
            }
        );
    }, []);
}

// Magnetic button effect
export function useMagneticEffect(ref, strength = 0.3) {
    useEffect(() => {
        if (!ref.current) return;

        const element = ref.current;

        const handleMouseMove = (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(element, {
                x: x * strength,
                y: y * strength,
                duration: 0.3,
                ease: 'power2.out',
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)',
            });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [strength]);
}

// Parallax effect
export function useParallax(ref, speed = 0.5) {
    useEffect(() => {
        if (!ref.current) return;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            gsap.to(ref.current, {
                y: scrollY * speed,
                duration: 0.1,
                ease: 'none',
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);
}

export { gsap };
