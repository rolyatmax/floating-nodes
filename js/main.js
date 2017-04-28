/* global requestAnimationFrame XMLHttpRequest */

import {twgl} from 'twgl.js'
import Info from './lib/info'

const PARTICLE_COUNT = 400
const PROXIMITY_THRESHOLD = 0.15
const SPEED = 0.00002

const DARK_BG = [0.2, 0.2, 0.2, 1]
const LIGHT_BG = [0.95, 0.95, 0.95, 0]

// eslint-disable-next-line
new Info({
  url: 'README.md',
  keyTrigger: true,
  container: 'wrapper'
})

let backgrounds = [LIGHT_BG, DARK_BG]
let continuePlaying = true
let mouseX = random(-1, 1)
let mouseY = random(-1, 1)
let shaders = ['js/point.vs', 'js/point.fs', 'js/edge.vs', 'js/edge.fs']

Promise.all(shaders.map(get)).then(main)

function main ([pointVs, pointFs, edgeVs, edgeFs]) {
  /// /////// setup webgl

  let container = document.querySelector('.container')
  let {height, width} = container.getBoundingClientRect()
  let gl = setupGL(container)
  resize(height, width, gl)

  let pointProgramInfo = twgl.createProgramInfo(gl, [pointVs, pointFs])
  let edgeProgramInfo = twgl.createProgramInfo(gl, [edgeVs, edgeFs])

  let {particles, velocities} = buildParticleBuffers(PARTICLE_COUNT, SPEED)
  let {edges, edgeVelocities} = buildEdgeBuffers(particles, velocities)

  let particleBuffer = fillBuffers(gl, pointProgramInfo, particles, velocities, 2)
  let edgeBuffer = fillBuffers(gl, edgeProgramInfo, edges, edgeVelocities, 4)

  let curBg = 0
    // Show dark background based on time of day
  let hour = (new Date()).getHours()
  if (hour < 6 || hour > 19) {
    curBg = 1
    gl.clearColor(...backgrounds[curBg])
  }

  /// /////// event handlers

  document.addEventListener('keydown', (e) => {
    if (e.which === 32) { // spacebar
      continuePlaying = !continuePlaying
      if (continuePlaying) {
        requestAnimationFrame(frame)
      }
    } else if (e.which === 192) { // tilde
      curBg = (curBg + 1) % backgrounds.length
      gl.clearColor(...backgrounds[curBg])
    }
  })

  document.addEventListener('mousemove', (e) => {
    let {clientX, clientY} = e
    clientX -= width / 2
    clientY -= height / 2
    mouseX = clientX / (width / 2)
    mouseY = clientY / (height / 2)
  })

  window.addEventListener('resize', () => {
    let rect = container.getBoundingClientRect()
    height = rect.height
    width = rect.width
    resize(height, width, gl)
  })

  /// ////// animation loop

  let start = (Date.now() % (1000 * 60 * 60))
  function frame (t) {
    if (continuePlaying) {
      requestAnimationFrame(frame)
    }
    t += start
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_CONSTANT_ALPHA)
    if (curBg) {
      gl.clear(gl.COLOR_BUFFER_BIT)
    }

    drawBuffer(gl, pointProgramInfo, gl.POINTS, particleBuffer, {
      'u_time': t,
      'u_mouse': [mouseX, mouseY]
    })

    drawBuffer(gl, edgeProgramInfo, gl.LINES, edgeBuffer, {
      'u_threshold': PROXIMITY_THRESHOLD,
      'u_time': t,
      'u_mouse': [mouseX, mouseY]
    })
  }

  requestAnimationFrame(frame)
}

function drawBuffer (gl, program, DRAW_MODE, buff, uniforms) {
  gl.useProgram(program.program)
  twgl.setUniforms(program, uniforms)
  twgl.drawBufferInfo(gl, DRAW_MODE, buff)
}

function setupGL (container) {
  let canvas = document.createElement('canvas')
  container.appendChild(canvas)
  let gl = twgl.getWebGLContext(canvas)
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  return gl
}

function resize (height, width, gl) {
  let size = Math.max(height, width)
  gl.canvas.style.height = `${size}px`
  gl.canvas.style.width = `${size}px`
  gl.canvas.width = gl.canvas.height = size
  let top = size > height ? (height - size) / 2 : 0
  let left = size > width ? (width - size) / 2 : 0
  gl.canvas.style.position = 'relative'
  gl.canvas.style.top = `${top}px`
  gl.canvas.style.left = `${left}px`
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
}

function fillBuffers (gl, program, positions, velocities, size) {
  let arrays = {
    position: {numComponents: size, data: positions},
    velocity: {numComponents: size, data: velocities}
  }

  let buffer = twgl.createBufferInfoFromArrays(gl, arrays)
  twgl.setBuffersAndAttributes(gl, program, buffer)
  return buffer
}

function buildParticleBuffers (count, speed) {
  let particles = new Float32Array(count * 2)
  let velocities = new Float32Array(count * 2)
  let j = count * 2
  while (j--) {
    particles[j] = random(-1, 1)
    velocities[j] = random(-speed, speed)
  }
  return {particles, velocities}
}

function buildEdgeBuffers (particlePositions, particleVelocities) {
  let k = 0
  let p = 0
  let edgesCount = PARTICLE_COUNT * (PARTICLE_COUNT - 1)
  let edges = new Float32Array(edgesCount * 8 / 2)
  let edgeVelocities = new Float32Array(edgesCount * 8 / 2)
  for (let i = 0, len = particlePositions.length; i < len; i += 2) {
    let p1X = particlePositions[i]
    let p1Y = particlePositions[i + 1]
    let v1X = particleVelocities[i]
    let v1Y = particleVelocities[i + 1]
    for (let j = i + 2, leng = particlePositions.length; j < leng; j += 2) {
      let p2X = particlePositions[j]
      let p2Y = particlePositions[j + 1]

      edges[k++] = p1X
      edges[k++] = p1Y
      edges[k++] = p2X
      edges[k++] = p2Y
      edges[k++] = p2X
      edges[k++] = p2Y
      edges[k++] = p1X
      edges[k++] = p1Y

      let v2X = particleVelocities[j]
      let v2Y = particleVelocities[j + 1]

      edgeVelocities[p++] = v1X
      edgeVelocities[p++] = v1Y
      edgeVelocities[p++] = v2X
      edgeVelocities[p++] = v2Y
      edgeVelocities[p++] = v2X
      edgeVelocities[p++] = v2Y
      edgeVelocities[p++] = v1X
      edgeVelocities[p++] = v1Y
    }
  }

  return {edges, edgeVelocities}
}

function get (url) {
  return new Promise(function (resolve, reject) {
    let request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.onload = function () {
      (this.status >= 200 && this.status < 400 ? resolve : reject)(this.response)
    }
    request.onerror = function () {
      reject(this.response)
    }
    request.send()
  })
}

function random (min, max) {
  return Math.random() * (max - min) + min
}
