import {twgl} from 'twgl.js';
import {range, random} from 'utils';

const PARTICLE_COUNT = 350;
const PROXIMITY_THRESHOLD = 0.13;
const SPEED = 0.00002;

let container = document.querySelector('.container');
let shaders = ['js/point.vs', 'js/point.fs', 'js/edge.vs', 'js/edge.fs'];
Promise.all(shaders.map(get)).then(main);


function main([pointVs, pointFs, edgeVs, edgeFs]) {
    let {height, width} = container.getBoundingClientRect();
    let canvas = document.createElement('canvas');
    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    container.appendChild(canvas);
    let gl = twgl.getWebGLContext(canvas);
    let pointProgramInfo = twgl.createProgramInfo(gl, [pointVs, pointFs]);
    let edgeProgramInfo = twgl.createProgramInfo(gl, [edgeVs, edgeFs]);
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let particlePositions = new Float32Array(PARTICLE_COUNT * 2);
    let particleVelocities = new Float32Array(PARTICLE_COUNT * 2);
    let j = PARTICLE_COUNT * 2;
    while (j--) {
        particlePositions[j] = random(-1, 1);
        particleVelocities[j] = random(-SPEED, SPEED);
    }
    let {edges, velocities} = getEdges(particlePositions, particleVelocities);

    let continuePlaying = true;
    document.addEventListener('keydown', (e) => {
        if (e.which === 32) { // spacebar
            continuePlaying = !continuePlaying;
            if (continuePlaying) {
                requestAnimationFrame(frame);
            }
        }
    });

    let mouseX = random(-1, 1);
    let mouseY = random(-1, 1);
    document.addEventListener('mousemove', (e) => {
        let {clientX, clientY} = e;
        clientX -= width / 2;
        clientY -= height / 2;
        mouseX = clientX / (width / 2);
        mouseY = clientY / (height / 2);
    });

    let edgeArrays = {
        position: {numComponents: 4, data: edges},
        velocity: {numComponents: 4, data: velocities}
    };


    let particleArrays = {
        position: {numComponents: 2, data: particlePositions},
        velocity: {numComponents: 2, data: particleVelocities}
    };


    let particleBuffer = twgl.createBufferInfoFromArrays(gl, particleArrays);
    twgl.setBuffersAndAttributes(gl, pointProgramInfo, particleBuffer);

    let edgeBuffer = twgl.createBufferInfoFromArrays(gl, edgeArrays);
    twgl.setBuffersAndAttributes(gl, edgeProgramInfo, edgeBuffer);

    let start = (Date.now() % (1000 * 60 * 60));

    function frame(t) {
        if (continuePlaying) {
            requestAnimationFrame(frame);
        }

        t += start;

        gl.disable(gl.DEPTH_TEST);

        gl.useProgram(edgeProgramInfo.program);
        twgl.setUniforms(edgeProgramInfo, {
            'u_threshold': PROXIMITY_THRESHOLD,
            'u_time': t,
            'u_mouse': [mouseX, mouseY]
        });
        twgl.drawBufferInfo(gl, gl.LINES, edgeBuffer);

        gl.useProgram(pointProgramInfo.program);
        twgl.setUniforms(pointProgramInfo, {
            'u_time': t,
            'u_mouse': [mouseX, mouseY]
        });
        twgl.drawBufferInfo(gl, gl.POINTS, particleBuffer);
    }

    requestAnimationFrame(frame);
}

function getEdges(particlePositions, particleVelocities) {
    let k = 0;
    let p = 0;
    let edgesCount = PARTICLE_COUNT * PARTICLE_COUNT;
    let edges = new Float32Array(edgesCount * 8);
    let velocities = new Float32Array(edgesCount * 8);
    for (let i = 0, len = particlePositions.length; i < len; i += 2) {
        let p1X = particlePositions[i];
        let p1Y = particlePositions[i + 1];
        let v1X = particleVelocities[i];
        let v1Y = particleVelocities[i + 1];
        for (let j = i + 2, len = particlePositions.length; j < len; j += 2) {
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

            velocities[p++] = v1X;
            velocities[p++] = v1Y;
            velocities[p++] = v2X;
            velocities[p++] = v2Y;
            velocities[p++] = v2X;
            velocities[p++] = v2Y;
            velocities[p++] = v1X;
            velocities[p++] = v1Y;
        }
    }
    return {edges, velocities};
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
