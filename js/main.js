import {twgl} from 'twgl.js';
import Particle from './particle';
import {range, random} from 'utils';

const PARTICLE_COUNT = 70;
const PROXIMITY_THRESHOLD = 0.3;
const SPEED = 0.005;

let container = document.querySelector('.container');
let shaders = ['js/gl.vs', 'js/gl.fs'];
Promise.all(shaders.map(get)).then(main);


function main([vs, fs]) {
    let {height, width} = container.getBoundingClientRect();
    let canvas = document.createElement('canvas');
    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    container.appendChild(canvas);
    let gl = twgl.getWebGLContext(canvas);
    let programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let particles = range(PARTICLE_COUNT).map(() => {
        let pos = [random(-1, 1), random(-1, 1)];
        let inertia = [random(-SPEED, SPEED), random(-SPEED, SPEED)];
        return new Particle(pos, inertia);
    });

    let sortedByX = particles.slice();
    let sortedByY = particles.slice();

    let continuePlaying = true;
    document.addEventListener('keydown', (e) => {
        if (e.which === 32) { // spacebar
            continuePlaying = !continuePlaying;
            if (continuePlaying) {
                requestAnimationFrame(frame);
            }
        }
    });

    function getEdges() {
        sortedByX = sortedByX.sort((a, b) => a.pos[0] - b.pos[0]);
        sortedByY = sortedByY.sort((a, b) => a.pos[1] - b.pos[1]);

        let distances = [];

        let edges = particles.reduce((edges, particle) => {
            let {pos: [x, y]} = particle;
            let startX = binarySearchLow(sortedByX, x - PROXIMITY_THRESHOLD, p => p.pos[0]);
            let endX = binarySearchHigh(sortedByX, x + PROXIMITY_THRESHOLD, p => p.pos[0]);
            let startY = binarySearchLow(sortedByY, y - PROXIMITY_THRESHOLD, p => p.pos[1]);
            let endY = binarySearchHigh(sortedByY, y + PROXIMITY_THRESHOLD, p => p.pos[1]);

            let i = startX || 0;
            endX = Number.isFinite(endX) ? endX : sortedByX.length - 1;
            while (i <= endX) {
                let distance = dist(sortedByX[i].pos, [x, y]);
                if (distance <= PROXIMITY_THRESHOLD) {
                    edges = edges.concat(sortedByX[i].pos).concat([x, y]);
                    distances.push(distance, distance);
                }
                i += 1;
            }

            let j = startY || 0;
            endY = Number.isFinite(endY) ? endY : sortedByY.length - 1;
            while (j <= endY) {
                let distance = dist(sortedByY[j].pos, [x, y]);
                if (distance <= PROXIMITY_THRESHOLD) {
                    edges = edges.concat(sortedByY[j].pos).concat([x, y]);
                    distances.push(distance, distance);
                }
                j += 1;
            }
            return edges;
        }, []);

        return {
            distances,
            edges
        }
    }

    function frame(i) {
        if (continuePlaying) {
            requestAnimationFrame(frame);
        }
        let pts = particles.reduce((memo, particle) => memo.concat(particle.update()), []);

        let arrays = {
            position: {numComponents: 2, data: pts},
            distance: {numComponents: 1, data: range(pts.length / 2).map(() => 0.35)}
        };
        let bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, gl.POINTS, bufferInfo);

        let {edges, distances} = getEdges();
        arrays = {
            position: {numComponents: 2, data: edges},
            distance: {numComponents: 1, data: distances}
        };
        bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, gl.LINES, bufferInfo);
    }

    requestAnimationFrame(frame);
}

function dist([startX, startY], [endX, endY]) {
    let changeX = endX - startX;
    let changeY = endY - startY;
    return Math.sqrt(changeX * changeX + changeY * changeY);
}

function binarySearchHigh(sorted, needle, evaluateFn) {
    if (!sorted.length) {
        return null;
    }

    if (sorted.length === 1) {
        if (evaluateFn(sorted[0]) === needle) {
            return 0;
        } else {
            return null;
        }
    }
    let middle = (sorted.length / 2 | 0) - 1;
    if (evaluateFn(sorted[middle]) === needle) {
        let index = binarySearchHigh(sorted.slice(middle + 1), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index + middle + 1;
        } else {
            return middle;
        }
    }
    if (evaluateFn(sorted[middle]) < needle) {
        let index = binarySearchHigh(sorted.slice(middle + 1), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index + middle + 1;
        } else {
            return null;
        }
    }
    if (evaluateFn(sorted[middle]) > needle) {
        let index = binarySearchHigh(sorted.slice(0, middle), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index;
        } else {
            return null;
        }
    }
}

function binarySearchLow(sorted, needle, evaluateFn) {
    if (!sorted.length) {
        return null;
    }

    if (sorted.length === 1) {
        if (evaluateFn(sorted[0]) === needle) {
            return 0;
        } else {
            return null;
        }
    }
    let middle = (sorted.length / 2 | 0) - 1;
    if (evaluateFn(sorted[middle]) === needle) {
        let index = binarySearchLow(sorted.slice(0, middle), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index;
        } else {
            return middle;
        }
    }
    if (evaluateFn(sorted[middle]) < needle) {
        let index = binarySearchLow(sorted.slice(middle + 1), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index + middle + 1;
        } else {
            return null;
        }
    }
    if (evaluateFn(sorted[middle]) > needle) {
        let index = binarySearchLow(sorted.slice(0, middle), needle, evaluateFn);
        if (Number.isFinite(index)) {
            return index;
        } else {
            return null;
        }
    }
}

function get(url) {
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
            (this.status >= 200 && this.status < 400 ? resolve : reject)(this.response);
        };
        request.onerror = function() {
            reject(this.response);
        };
        request.send();
    });
}
