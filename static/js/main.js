import { route1 } from './route-path1.js';
import { route2 } from './route-path2.js';
import { titlePath } from './title-path.js?v=1';
import './cloud.js?v=6';
import './zoom.js?v=4';
import './zoom2.js?v=1';
import './ui.js?v=4';
import './drawing-drag.js?v=2';
import './traffic-sound.js?v=4';

const VIEWBOX = {
    x: 199.4,
    y: 543.03,
    width: 14174,
    height: 946,
};

const path1 = document.querySelector('#route-path1');
path1.setAttribute('d', route1);
const path2 = document.querySelector('#route-path2');
path2.setAttribute('d', route2);
const titlePathElement = document.querySelector('#title-path');
titlePathElement.setAttribute('d', titlePath);

document.querySelectorAll('.route-path1').forEach((path) => {
    path.setAttribute('d', route1);
});

document.querySelectorAll('.route-path2').forEach((path) => {
    path.setAttribute('d', route2);
});

const car = document.querySelector('.car');
const world = document.querySelector('.world');
const routeSvg = document.querySelector('.route-svg');
const routeSamples = new Map([
    [path1, createRouteSamples(path1)],
    [path2, createRouteSamples(path2)],
]);

function createRouteSamples(path) {
    const length = path.getTotalLength();
    const sampleCount = 2400;
    const samples = [];

    for (let i = 0; i <= sampleCount; i += 1) {
        const point = path.getPointAtLength(length * i / sampleCount);

        samples.push({
            x: (point.x - VIEWBOX.x) / VIEWBOX.width,
            y: (point.y - VIEWBOX.y) / VIEWBOX.height,
        });
    }

    return samples;
}

function getRouteY(path, localX) {
    const samples = routeSamples.get(path);
    let closest = samples[0];
    let closestDistance = Math.abs(localX - closest.x);

    for (const sample of samples) {
        const distance = Math.abs(localX - sample.x);

        if (distance < closestDistance) {
            closest = sample;
            closestDistance = distance;
        }
    }

    return closest.y;
}

function getPositiveModulo(value, size) {
    return ((value % size) + size) % size;
}

function getRouteYAtScreenX(screenX, routeRect, roadWidth) {
    const roadHeight = routeRect.height;
    const routeX = getPositiveModulo(screenX - routeRect.left, roadWidth * 2);
    const routeIndex = Math.floor(routeX / roadWidth);
    const localX = getPositiveModulo(routeX, roadWidth) / roadWidth;
    const path = routeIndex === 0 ? path1 : path2;

    return getRouteY(path, localX) * roadHeight;
}

function moveCarOnRoute() {
    const isCarZoomed = world.classList.contains('is-car-zoomed');
    const worldStyle = getComputedStyle(world);
    const worldRect = world.getBoundingClientRect();
    const carRect = car.getBoundingClientRect();
    const routeRect = routeSvg.getBoundingClientRect();
    const roadWidth = routeSvg.querySelector('svg').getBoundingClientRect().width;
    const roadHeight = routeRect.height;
    const carX = carRect.left + carRect.width / 2;
    const wheelBase = carRect.width * 0.68;
    const rearWheelX = carX - wheelBase / 2;
    const frontWheelX = carX + wheelBase / 2;
    const rearWheelY = getRouteYAtScreenX(rearWheelX, routeRect, roadWidth);
    const frontWheelY = getRouteYAtScreenX(frontWheelX, routeRect, roadWidth);
    const carY = (rearWheelY + frontWheelY) / 2 - roadHeight;
    const carRotation = Math.atan2(frontWheelY - rearWheelY, wheelBase) * 180 / Math.PI;

    if (isCarZoomed) {
        const routeBaseTop = worldRect.bottom - roadHeight;
        const routeY = (rearWheelY + frontWheelY) / 2;
        const roadGap = parseFloat(worldStyle.getPropertyValue('--zoom-road-gap')) || 0;
        const roadY = carRect.bottom - routeBaseTop - routeY - roadGap;

        world.style.setProperty('--zoom-road-y', `${roadY}px`);
    } else {
        car.style.setProperty('--car-route-y', `${carY}px`);
        world.style.setProperty('--zoom-road-y', '0px');
    }

    car.style.setProperty('--car-route-rotation', `${carRotation}deg`);

    requestAnimationFrame(moveCarOnRoute);
}

requestAnimationFrame(moveCarOnRoute);
