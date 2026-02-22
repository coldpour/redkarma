(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hasFinePointer = window.matchMedia('(pointer: fine)');

    if (prefersReducedMotion.matches || !hasFinePointer.matches) {
        return;
    }

    const layer = document.createElement('div');
    layer.className = 'sparkle-trail-layer';
    layer.setAttribute('aria-hidden', 'true');

    const maxParticles = 80;
    let lastX = -Infinity;
    let lastY = -Infinity;
    let lastSpawnTime = 0;

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function spawnSparkle(x, y, intensity) {
        const particle = document.createElement('span');
        particle.className = 'sparkle-trail-particle';

        const size = randomBetween(6, 12 + intensity * 4);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--sparkle-size', `${size}px`);
        particle.style.setProperty('--sparkle-drift-x', `${randomBetween(-12, 12)}px`);
        particle.style.setProperty('--sparkle-drift-y', `${randomBetween(-14, 10)}px`);
        particle.style.setProperty('--sparkle-rotate', `${randomBetween(-100, 100)}deg`);

        particle.addEventListener('animationend', () => {
            particle.remove();
        }, { once: true });

        layer.appendChild(particle);

        if (layer.childElementCount > maxParticles) {
            layer.firstElementChild?.remove();
        }
    }

    function onPointerMove(event) {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        const now = performance.now();
        const x = event.clientX;
        const y = event.clientY;
        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.hypot(dx, dy);

        if (distance < 8 && now - lastSpawnTime < 24) {
            return;
        }

        const intensity = Math.min(distance / 24, 1);
        spawnSparkle(x, y, intensity);

        if (intensity > 0.65) {
            spawnSparkle(x + randomBetween(-8, 8), y + randomBetween(-8, 8), intensity * 0.75);
        }

        lastX = x;
        lastY = y;
        lastSpawnTime = now;
    }

    function onPointerDown(event) {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        for (let i = 0; i < 6; i += 1) {
            spawnSparkle(
                event.clientX + randomBetween(-12, 12),
                event.clientY + randomBetween(-12, 12),
                1
            );
        }
    }

    function mount() {
        if (!document.body.contains(layer)) {
            document.body.appendChild(layer);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
})();
