const world = document.querySelector('.world');
const cloud1 = document.querySelector('.cloud1');

function openScene3() {
    if (!world.classList.contains('is-car-zoomed')) {
        return;
    }

    world.classList.add('is-cloud-lowered');
}

function closeScene3() {
    world.classList.remove('is-cloud-lowered');
}

cloud1.addEventListener('click', (event) => {
    if (!world.classList.contains('is-car-zoomed')) {
        return;
    }

    const cloudRect = cloud1.getBoundingClientRect();
    const isUpperCloudClick = event.clientY < cloudRect.top + cloudRect.height * 0.5;

    if (!isUpperCloudClick) {
        return;
    }

    openScene3();
});

window.addEventListener('scene3:open', openScene3);
window.addEventListener('scene3:close', closeScene3);
