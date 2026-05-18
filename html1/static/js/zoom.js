const world = document.querySelector('.world');
const car = document.querySelector('.car');

car.addEventListener('click', () => {
    world.classList.toggle('is-car-zoomed');

    if (!world.classList.contains('is-car-zoomed')) {
        world.classList.remove('is-cloud-lowered');
    }
});
