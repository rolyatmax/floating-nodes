import {twgl} from 'twgl.js';
import {range, random} from 'utils';

const PARTICLE_COUNT = 250;
const PROXIMITY_THRESHOLD = 0.25;
const SPEED = 0.0002;

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
    let edges = getEdges(particlePositions);

    let continuePlaying = true;
    document.addEventListener('keydown', (e) => {
        if (e.which === 32) { // spacebar
            continuePlaying = !continuePlaying;
            if (continuePlaying) {
                requestAnimationFrame(frame);
            }
        }
    });

    let uniforms = {'u_threshold': PROXIMITY_THRESHOLD};
    let edgeArrays = {position: {numComponents: 4, data: edges}};
    let particleArrays = {position: {numComponents: 2, data: particlePositions}};

    function frame(i) {
        if (continuePlaying) {
            requestAnimationFrame(frame);
        }

        gl.disable(gl.DEPTH_TEST);

        update(particlePositions, particleVelocities, edges);

        let start = Date.now();

        let edgeBuffer = twgl.createBufferInfoFromArrays(gl, edgeArrays);
        gl.useProgram(edgeProgramInfo.program);
        twgl.setUniforms(edgeProgramInfo, uniforms);
        twgl.setBuffersAndAttributes(gl, edgeProgramInfo, edgeBuffer);
        twgl.drawBufferInfo(gl, gl.LINES, edgeBuffer);

        if ((i | 0) % 3 === 0) console.log(`elapsed: ${Date.now() - start}`);

        let particleBuffer = twgl.createBufferInfoFromArrays(gl, particleArrays);
        gl.useProgram(pointProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, pointProgramInfo, particleBuffer);
        twgl.drawBufferInfo(gl, gl.POINTS, particleBuffer);
    }

    requestAnimationFrame(frame);
}

function update(particlePositions, particleVelocities, edges) {
    let k = 0;
    for (let i = 0, len = particlePositions.length; i < len; i += 2) {
        particlePositions[i] += particleVelocities[i];
        particlePositions[i + 1] += particleVelocities[i + 1];

        for (let j = 0, len = particlePositions.length; j < len; j += 2) {
            edges[k++] += particleVelocities[i];
            edges[k++] += particleVelocities[i + 1];
            edges[k++] += particleVelocities[j];
            edges[k++] += particleVelocities[j + 1];
            edges[k++] += particleVelocities[j];
            edges[k++] += particleVelocities[j + 1];
            edges[k++] += particleVelocities[i];
            edges[k++] += particleVelocities[i + 1];
        }

        if (particlePositions[i] > 1 || particlePositions[i] < -1) {
            particleVelocities[i] *= -1;
        }
        if (particlePositions[i + 1] > 1 || particlePositions[i + 1] < -1) {
            particleVelocities[i + 1] *= -1;
        }
    }
}

function getEdges(particlePositions) {
    let k = 0;
    let edgesCount = PARTICLE_COUNT * PARTICLE_COUNT;
    let edges = new Float32Array(edgesCount * 8);
    for (let i = 0, len = particlePositions.length; i < len; i += 2) {
        let p1X = particlePositions[i];
        let p1Y = particlePositions[i + 1];
        for (let j = 0, len = particlePositions.length; j < len; j += 2) {
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
        }
    }
    return edges;
}

function dist([startX, startY], [endX, endY]) {
    let changeX = endX - startX;
    let changeY = endY - startY;
    return Math.sqrt(changeX * changeX + changeY * changeY);
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
