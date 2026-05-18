const world = document.querySelector('.world');
const trafficSound = new Audio('static/sound/traffic-sound.mp3');
const singSound = new Audio('static/sound/sing.mp3');
const SCENE1_VOLUME = 0.55;
const ZOOMED_VOLUME = 0.15;
const SING_VOLUME = 0.3;
const SING_FADE_DURATION = 2400;

trafficSound.loop = true;
trafficSound.volume = SCENE1_VOLUME;
singSound.loop = true;
singSound.volume = 0;

let singFadeFrame = null;

function isScene1() {
    return !world?.classList.contains('is-car-zoomed');
}

function playTrafficSound() {
    trafficSound.play().catch(() => {});
}

function playSingSound() {
    singSound.play().catch(() => {});
}

function stopSingFade() {
    if (singFadeFrame === null) {
        return;
    }

    cancelAnimationFrame(singFadeFrame);
    singFadeFrame = null;
}

function fadeInSingSound() {
    const startedAt = performance.now();

    stopSingFade();
    singSound.volume = 0;
    playSingSound();

    function updateVolume(now) {
        const progress = Math.min((now - startedAt) / SING_FADE_DURATION, 1);

        singSound.volume = SING_VOLUME * progress;

        if (progress < 1) {
            singFadeFrame = requestAnimationFrame(updateVolume);
            return;
        }

        singFadeFrame = null;
    }

    singFadeFrame = requestAnimationFrame(updateVolume);
}

function pauseSingSound() {
    stopSingFade();
    singSound.pause();
    singSound.currentTime = 0;
    singSound.volume = 0;
}

function syncTrafficSound() {
    const scene1 = isScene1();

    trafficSound.volume = scene1 ? SCENE1_VOLUME : ZOOMED_VOLUME;
    playTrafficSound();

    if (scene1) {
        pauseSingSound();
        return;
    }

    if (singSound.paused) {
        fadeInSingSound();
        return;
    }

    playSingSound();
}

function unlockSound() {
    syncTrafficSound();
}

['pointerdown', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, unlockSound, { once: true });
});

if (world) {
    new MutationObserver(syncTrafficSound).observe(world, {
        attributes: true,
        attributeFilter: ['class'],
    });
}

playTrafficSound();
