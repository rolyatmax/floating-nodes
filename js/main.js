import {twgl} from 'twgl.js';
import {random} from 'utils';
import Info from './lib/info';

const PARTICLE_COUNT = 350;
const PROXIMITY_THRESHOLD = 0.13;
const SPEED = 0.00002;

new Info({
    url: 'README.md',
    keyTrigger: true,
    container: 'wrapper'
});

let continuePlaying = true;
let mouseX = random(-1, 1);
let mouseY = random(-1, 1);
let shaders = ['js/point.vs', 'js/point.fs', 'js/edge.vs', 'js/edge.fs'];

Promise.all(shaders.map(get)).then(main);


function main([pointVs, pointFs, edgeVs, edgeFs]) {

    ////////// setup webgl

    let container = document.querySelector('.container');
    let {height, width} = container.getBoundingClientRect();
    let gl = setupGL(height, width, container);

    let pointProgramInfo = twgl.createProgramInfo(gl, [pointVs, pointFs]);
    let edgeProgramInfo = twgl.createProgramInfo(gl, [edgeVs, edgeFs]);

    let {particles, velocities} = buildParticleBuffers(PARTICLE_COUNT, SPEED);
    let {edges, edgeVelocities} = buildEdgeBuffers(particles, velocities);

    let edgeBuffer = fillBuffers(gl, edgeProgramInfo, edges, edgeVelocities);
    let particleBuffer = fillBuffers(gl, pointProgramInfo, particles, velocities);


    ////////// event handlers

    document.addEventListener('keydown', (e) => {
        if (e.which === 32) { // spacebar
            continuePlaying = !continuePlaying;
            if (continuePlaying) {
                requestAnimationFrame(frame);
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        let {clientX, clientY} = e;
        clientX -= width / 2;
        clientY -= height / 2;
        mouseX = clientX / (width / 2);
        mouseY = clientY / (height / 2);
    });


    ///////// animation loop

    let start = (Date.now() % (1000 * 60 * 60));
    function frame(t) {
        if (continuePlaying) {
            requestAnimationFrame(frame);
        }
        t += start;
        gl.disable(gl.DEPTH_TEST);

        drawBuffer(gl, edgeProgramInfo, gl.LINES, edgeBuffer, {
            'u_threshold': PROXIMITY_THRESHOLD,
            'u_time': t,
            'u_mouse': [mouseX, mouseY]
        });

        drawBuffer(gl, pointProgramInfo, gl.POINTS, particleBuffer, {
            'u_time': t,
            'u_mouse': [mouseX, mouseY]
        });
    }

    requestAnimationFrame(frame);
}

function drawBuffer(gl, program, DRAW_MODE, buff, uniforms) {
    gl.useProgram(program.program);
    twgl.setUniforms(program, uniforms);
    twgl.drawBufferInfo(gl, DRAW_MODE, buff);
}

function setupGL(height, width, container) {
    let canvas = document.createElement('canvas');
    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    container.appendChild(canvas);
    let gl = twgl.getWebGLContext(canvas);
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return gl;
}

function fillBuffers(gl, program, positions, velocities) {
    let arrays = {
        position: {numComponents: 4, data: positions},
        velocity: {numComponents: 4, data: velocities}
    };

    let buffer = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, program, buffer);
    return buffer;
}

function buildParticleBuffers(count, speed) {
    let particles = new Float32Array(count * 2);
    let velocities = new Float32Array(count * 2);
    let j = count * 2;
    while (j--) {
        particles[j] = random(-1, 1);
        velocities[j] = random(-speed, speed);
    }
    return {particles, velocities};
}

function buildEdgeBuffers(particlePositions, particleVelocities) {
    let k = 0;
    let p = 0;
    let edgesCount = PARTICLE_COUNT * PARTICLE_COUNT;
    let edges = new Float32Array(edgesCount * 8);
    let edgeVelocities = new Float32Array(edgesCount * 8);
    for (let i = 0, len = particlePositions.length; i < len; i += 2) {
        let p1X = particlePositions[i];
        let p1Y = particlePositions[i + 1];
        let v1X = particleVelocities[i];
        let v1Y = particleVelocities[i + 1];
        for (let j = i + 2, leng = particlePositions.length; j < leng; j += 2) {
            let p2X = particlePositions[j];
            let p2Y = particlePositions[j + 1];

            edges[k++] = p1X;
            edges[k++] = p1Y;
            edges[k++] = p2X;
            edges[k++] = p2Y;
            edges[k++] = p2X;
            edges[k++] = p2Y;
            edges[k++] = p1X;
            edges[k++] = p1Y;

            let v2X = particleVelocities[j];
            let v2Y = particleVelocities[j + 1];

            edgeVelocities[p++] = v1X;
            edgeVelocities[p++] = v1Y;
            edgeVelocities[p++] = v2X;
            edgeVelocities[p++] = v2Y;
            edgeVelocities[p++] = v2X;
            edgeVelocities[p++] = v2Y;
            edgeVelocities[p++] = v1X;
            edgeVelocities[p++] = v1Y;
        }
    }

    return {edges, edgeVelocities};
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
