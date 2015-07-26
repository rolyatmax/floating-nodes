import twgl from 'twgl.js';
import Particle from './particle';
import {range, random} from 'utils';

const PARTICLE_COUNT = 10;

let container = document.querySelector('.container');
let shaders = ['js/gl.vs', 'js/gl.fs'];
Promise.all(shaders.map(get)).then(main);

let {height, width} = container.getBoundingClientRect();
let canvas = document.createElement('canvas');
canvas.style.height = `${height}px`;
canvas.style.width = `${width}px`;
container.appendChild(canvas);
let gl = twgl.getWebGLContext(canvas);
let programInfo = twgl.createProgramInfo(gl, [vs, fs]);
twgl.resizeCanvasToDisplaySize(gl.canvas);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


function main([vs, fs]) {
    let particles = range(PARTICLE_COUNT).map(() => {
        let pos = [random(-1, 1), random(-1, 1)];
        let inertia = [random(-0.1, 0.1), random(-0.1, 0.1)];
        return new Particle(pos, inertia);
    });

    function frame(i) {
        if (continuePlaying) {
            requestAnimationFrame(frame);
        }
        let pts = particles.reduce((memo, particle) => memo.concat(particle.update()), []);
        let arrays = {position: {size: 2, data: pts}};
        let bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, gl.POINTS, bufferInfo);
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
