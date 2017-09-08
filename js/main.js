import createRegl from 'regl'
import fit from 'canvas-fit'
import Info from './lib/info'
const glslify = require('glslify')

const PARTICLE_COUNT = 400
const PROXIMITY_THRESHOLD = 0.12
const SPEED = 0.02

const DARK_BG = [0.2, 0.2, 0.2, 1]
const LIGHT_BG = [0.95, 0.95, 0.95, 0]

// eslint-disable-next-line
new Info({
  url: 'README.md',
  keyTrigger: true,
  container: 'wrapper'
})

let backgrounds = [LIGHT_BG, DARK_BG]
let mouseX = random(-1, 1)
let mouseY = random(-1, 1)

const { particles, velocities } = buildParticleBuffers(PARTICLE_COUNT, SPEED)

const container = document.querySelector('.container')
const canvas = container.appendChild(document.createElement('canvas'))
const regl = createRegl(canvas)
const resize = fit(canvas)
resize.parent = () => {
  const height = window.innerHeight
  const width = window.innerWidth
  const largestDimension = Math.max(width, height)
  canvas.style.top = `${(height - largestDimension) / 2}px`
  canvas.style.left = `${(width - largestDimension) / 2}px`
  return [largestDimension, largestDimension]
}
resize()
window.addEventListener('resize', resize, false)

let curBg = 0
  // Show dark background based on time of day
let hour = (new Date()).getHours()
if (hour < 6 || hour > 19) {
  curBg = 1
}

const globalDraw = createGlobalRenderer()
const drawPoints = createPointsRenderer(particles, velocities)
const drawEdges = createEdgesRenderer(particles, velocities)

let cancel
let start = 0
function startLoop () {
  const tick = regl.frame(({ time }) => {
    start = start || time
    const elapsed = time - start
    // debugger;
    if (curBg) {
      regl.clear({
        color: backgrounds[curBg],
        depth: 1
      })
    }
    globalDraw({
      elapsed: elapsed,
      mouse: [mouseX, mouseY],
      threshold: PROXIMITY_THRESHOLD
    }, () => {
      drawPoints()
      drawEdges()
    })
  })
  cancel = tick.cancel
}

startLoop()

function createGlobalRenderer () {
  return regl({
    uniforms: {
      elapsed: regl.prop('elapsed'),
      mouse: regl.prop('mouse'),
      threshold: regl.prop('threshold')
    },

    depth: {
      enable: false
    },

    blend: {
      enable: true,
      func: {
        src: 1,
        dst: 'one minus constant alpha'
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      }
    }
  })
}

function createPointsRenderer (particles, velocities) {
  return regl({
    vert: glslify.file('./point.vs'),
    frag: glslify.file('./point.fs'),

    attributes: {
      position: particles,
      velocity: velocities
    },

    count: particles.length / 2,

    primitive: 'points'
  })
}

function createEdgesRenderer (particles, velocities) {
  const { edges, edgeVelocities } = buildEdgeBuffers(particles, velocities)
  return regl({
    vert: glslify.file('./edge.vs'),
    frag: glslify.file('./edge.fs'),

    attributes: {
      position: edges,
      velocity: edgeVelocities
    },

    count: edges.length / 4, // is this right?

    primitive: 'lines'
  })
}

/// /////// event handlers

document.addEventListener('keydown', (e) => {
  if (e.which === 32) { // spacebar
    if (cancel) {
      cancel()
      cancel = null
    } else {
      startLoop()
    }
  } else if (e.which === 192) { // tilde
    curBg = (curBg + 1) % backgrounds.length
  }
})

canvas.addEventListener('mousemove', (e) => {
  let { offsetX, offsetY } = e
  offsetX -= canvas.width / 2
  offsetY -= canvas.height / 2
  mouseX = offsetX / (canvas.width / 2)
  mouseY = -offsetY / (canvas.height / 2)
})

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

function random (min, max) {
  return Math.random() * (max - min) + min
}
