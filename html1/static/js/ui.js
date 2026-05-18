const world = document.querySelector('.world');
const zoomArrowUp = document.querySelector('.zoom-arrow-up');
const zoomArrowDown = document.querySelector('.zoom-arrow-down');

zoomArrowUp.addEventListener('click', (event) => {
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('scene3:open'));
});

zoomArrowDown.addEventListener('click', (event) => {
    event.stopPropagation();

    if (world.classList.contains('is-cloud-lowered')) {
        window.dispatchEvent(new CustomEvent('scene3:close'));
        return;
    }

    world.classList.remove('is-car-zoomed');
});
