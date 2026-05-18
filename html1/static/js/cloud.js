import { cloud1 } from './cloud-path1.js';
import { cloud2 } from './cloud-path2.js';
import { cloud3 } from './cloud-path3.js';
import { cloud4 } from './cloud-path4.js';

const clouds = [
    ['#cloud-path1', cloud1],
    ['#drawing-cloud-path', cloud1],
    ['#cloud-path2', cloud2],
    ['#cloud-path3', cloud3],
    ['#cloud-path4', cloud4],
];

clouds.forEach(([targetSelector, cloud]) => {
    const path = document.querySelector(targetSelector);

    if (!path) {
        return;
    }

    path.setAttribute('d', cloud.path);
    path.closest('svg')?.setAttribute('viewBox', cloud.viewBox);
});

const cloudRoot = document.querySelector('.cloud-svg');
const cloud1Element = document.querySelector('.cloud1');
const carElement = document.querySelector('.car');
const worldElement = document.querySelector('.world');
const followingClouds = [
    [document.querySelector('.cloud2'), 0.05, 8, -30],
    [document.querySelector('.cloud3'), 0.35, 6, -25],
    [document.querySelector('.cloud4'), 0.6, 4, -20],
];
const CLOUD_GAP = 2;
const MIN_CLOUD_SCALE = 0.4;
const COLLISION_MIN_CLOUD_SCALE = 0.28;
const MAX_CLOUD_SCALE = 2;
const SCALE_DISTANCE_RATIO = 0.14;
const SCALE_COLLISION_PASSES = 4;
const ZOOMED_CAR_COLLISION_RATIO = 0.58;

function getCenter(rect, rootRect) {
    return {
        x: rect.left - rootRect.left + rect.width / 2,
        y: rect.top - rootRect.top + rect.height / 2,
    };
}

function getBottomCenter(rect, rootRect) {
    return {
        x: rect.left - rootRect.left + rect.width / 2,
        y: rect.bottom - rootRect.top,
    };
}

function getRadius(rect) {
    return Math.max(rect.width, rect.height) / 2;
}

function getBaseRadius(rootRect, cloudElement, baseWidth) {
    const viewBox = cloudElement.getAttribute('viewBox')?.split(/\s+/).map(Number);
    const aspectRatio = viewBox?.length === 4 && viewBox[2] > 0 ? viewBox[3] / viewBox[2] : 1;
    const width = rootRect.width * baseWidth / 100;
    const height = width * aspectRatio;

    return Math.max(width, height) / 2;
}

function getLinePoint(start, end, ratio) {
    return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
    };
}

function getCurveOffset(start, end, ratio, curveSize) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const curveAmount = Math.sin(ratio * Math.PI) * curveSize;

    return {
        x: -dy / length * curveAmount,
        y: dx / length * curveAmount,
    };
}

function getClampedScale(value) {
    return Math.min(Math.max(value, MIN_CLOUD_SCALE), MAX_CLOUD_SCALE);
}

function limitScaleNearCircle(point, circlePoint) {
    const distance = Math.hypot(point.x - circlePoint.x, point.y - circlePoint.y);
    const allowedRadius = distance - circlePoint.radius - CLOUD_GAP;
    const maxScale = allowedRadius / point.baseRadius;

    point.scale = Math.min(point.scale, Math.max(maxScale, COLLISION_MIN_CLOUD_SCALE));
}

function preventScaleOverlaps(points, carPoint) {
    for (let pass = 0; pass < SCALE_COLLISION_PASSES; pass += 1) {
        points.forEach((point) => {
            limitScaleNearCircle(point, carPoint);
        });

        for (let i = 0; i < points.length; i += 1) {
            for (let j = i + 1; j < points.length; j += 1) {
                const pointA = points[i];
                const pointB = points[j];
                const distance = Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
                const allowedRadiusSum = distance - CLOUD_GAP;
                const radiusSum = pointA.baseRadius * pointA.scale + pointB.baseRadius * pointB.scale;

                if (radiusSum <= allowedRadiusSum) {
                    continue;
                }

                const scaleFactor = Math.max(allowedRadiusSum / radiusSum, COLLISION_MIN_CLOUD_SCALE);

                pointA.scale = Math.max(pointA.scale * scaleFactor, COLLISION_MIN_CLOUD_SCALE);
                pointB.scale = Math.max(pointB.scale * scaleFactor, COLLISION_MIN_CLOUD_SCALE);
            }
        }
    }
}

function updateCloudScales(points, carPoint, cloud1Point, lineLength) {
    const comfortableGap = Math.max(lineLength * SCALE_DISTANCE_RATIO, 48);

    points.forEach((point, index) => {
        const distances = [
            Math.hypot(point.x - carPoint.x, point.y - carPoint.y) - point.radius - carPoint.radius,
            Math.hypot(point.x - cloud1Point.x, point.y - cloud1Point.y) - point.radius,
        ];

        points.forEach((otherPoint, otherIndex) => {
            if (index === otherIndex) {
                return;
            }

            distances.push(Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y) - point.radius - otherPoint.radius);
        });

        const nearestGap = Math.max(Math.min(...distances), 0);
        const scale = getClampedScale(MIN_CLOUD_SCALE + nearestGap / comfortableGap * (MAX_CLOUD_SCALE - MIN_CLOUD_SCALE));

        point.scale = scale;
    });

    preventScaleOverlaps(points, carPoint);
}

function moveCloudsOnCarLine() {
    if (!cloudRoot || !cloud1Element || !carElement) {
        return;
    }

    if (worldElement?.classList.contains('is-cloud-lowered')) {
        requestAnimationFrame(moveCloudsOnCarLine);
        return;
    }

    const rootRect = cloudRoot.getBoundingClientRect();
    const isCarZoomed = worldElement?.classList.contains('is-car-zoomed');
    const cloud1End = getBottomCenter(cloud1Element.getBoundingClientRect(), rootRect);
    const carRect = carElement.getBoundingClientRect();
    const carCenter = getCenter(carRect, rootRect);
    const lineLength = Math.hypot(carCenter.x - cloud1End.x, carCenter.y - cloud1End.y);
    const points = followingClouds
        .filter(([cloudElement]) => cloudElement)
        .filter(([cloudElement]) => !isCarZoomed || !cloudElement.classList.contains('cloud4'))
        .map(([cloudElement, positionRatio, baseWidth, xOffset = 0]) => {
            const point = getLinePoint(cloud1End, carCenter, positionRatio);
            const curveOffset = getCurveOffset(cloud1End, carCenter, positionRatio, 14);
            const baseRadius = getBaseRadius(rootRect, cloudElement, baseWidth);

            return {
                element: cloudElement,
                x: point.x + xOffset + curveOffset.x,
                y: point.y + curveOffset.y,
                baseWidth,
                baseRadius,
                radius: baseRadius,
            };
        });

    const carPoint = {
        x: carCenter.x,
        y: carCenter.y,
        radius: getRadius(carRect) * (worldElement?.classList.contains('is-car-zoomed') ? ZOOMED_CAR_COLLISION_RATIO : 1),
    };

    updateCloudScales(points, carPoint, cloud1End, lineLength);

    if (isCarZoomed) {
        points.forEach((point) => {
            point.scale = Math.max(point.scale, MIN_CLOUD_SCALE);
        });
    }

    points.forEach((point) => {
        point.element.style.setProperty('--cloud-x', `${point.x}px`);
        point.element.style.setProperty('--cloud-y', `${point.y}px`);
        point.element.style.setProperty('--cloud-width', `${point.baseWidth * point.scale}%`);
    });

    requestAnimationFrame(moveCloudsOnCarLine);
}

requestAnimationFrame(moveCloudsOnCarLine);
