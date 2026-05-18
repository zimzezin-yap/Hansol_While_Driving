const world = document.querySelector('.world');
const drawingLayer = document.querySelector('.drawing-layer');
const drawingImage = document.querySelector('.drawing-image');

let dragState = null;

function getSvgPoint(event) {
    const matrix = drawingLayer.getScreenCTM();

    if (!matrix) {
        return null;
    }

    const point = drawingLayer.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;

    return point.matrixTransform(matrix.inverse());
}

function getImagePosition() {
    return {
        x: parseFloat(getComputedStyle(drawingImage).getPropertyValue('--drawing-image-x')) || 0,
        y: parseFloat(getComputedStyle(drawingImage).getPropertyValue('--drawing-image-y')) || 0,
    };
}

function setImagePosition(x, y) {
    drawingImage.style.setProperty('--drawing-image-x', `${x}px`);
    drawingImage.style.setProperty('--drawing-image-y', `${y}px`);
    drawingImage.setAttribute('x', x);
    drawingImage.setAttribute('y', y);
}

function startDrag(event) {
    if (!world.classList.contains('is-car-zoomed')) {
        return;
    }

    const point = getSvgPoint(event);

    if (!point) {
        return;
    }

    const imagePosition = getImagePosition();

    dragState = {
        pointerId: event.pointerId,
        startPointerX: point.x,
        startPointerY: point.y,
        startImageX: imagePosition.x,
        startImageY: imagePosition.y,
    };

    drawingImage.classList.add('is-dragging');
    drawingImage.setPointerCapture(event.pointerId);
    event.preventDefault();
}

function drag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
    }

    const point = getSvgPoint(event);

    if (!point) {
        return;
    }

    setImagePosition(
        dragState.startImageX + point.x - dragState.startPointerX,
        dragState.startImageY + point.y - dragState.startPointerY,
    );
}

function endDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
    }

    drawingImage.classList.remove('is-dragging');
    drawingImage.releasePointerCapture(event.pointerId);
    dragState = null;
}

if (world && drawingLayer && drawingImage) {
    drawingImage.addEventListener('pointerdown', startDrag);
    drawingImage.addEventListener('pointermove', drag);
    drawingImage.addEventListener('pointerup', endDrag);
    drawingImage.addEventListener('pointercancel', endDrag);
}
