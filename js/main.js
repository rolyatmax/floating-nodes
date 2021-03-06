import createRegl from 'regl'
import fit from 'canvas-fit'
import Info from './lib/info'
const createCamera = require('3d-view-controls')
const mat4 = require('gl-mat4')
const glslify = require('glslify')

const PARTICLE_COUNT = 600
const PROXIMITY_THRESHOLD = 0.4
const SPEED = 0.008

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
const camera = createCamera(canvas)
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

camera.zoomSpeed = 4
camera.lookAt(
  [0, 0, 3],
  [0, 0, 0],
  [0, 0, 0]
)

window.camera = camera

let curBg = 1 // Show dark background by default

const globalDraw = createGlobalRenderer()
const drawPoints = createPointsRenderer(particles, velocities)
const drawEdges = createEdgesRenderer(particles, velocities)

let cancel
let start = 0
function startLoop () {
  const tick = regl.frame(({ time }) => {
    start = start || time
    const elapsed = time - start
    camera.tick()
    camera.center = [
      Math.sin(time / 3) * 2,
      Math.cos(time / 3) * 2,
      Math.sin(time / 2) * 2
    ]
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
      projection: ({viewportWidth, viewportHeight}) => (
        mat4.perspective([],
          Math.PI / 2,
          viewportWidth / viewportHeight,
          0.01,
          1000)
      ),
      view: () => camera.matrix,
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
        srcRGB: 'src alpha',
        dstRGB: 1,
        srcAlpha: 1,
        dstAlpha: 1
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

    count: particles.length / 3,

    primitive: 'points'
  })
}

function createEdgesRenderer (particles, velocities) {
  const { edgePoints, otherEdgePoints, edgeVelocities, otherEdgeVelocities } = buildEdgeBuffers(particles, velocities)
  return regl({
    vert: glslify.file('./edge.vs'),
    frag: glslify.file('./edge.fs'),

    attributes: {
      position: edgePoints,
      otherPosition: otherEdgePoints,
      velocity: edgeVelocities,
      otherVelocity: otherEdgeVelocities
    },

    count: edgePoints.length / 3, // is this right?

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
  let particles = new Float32Array(count * 3)
  let velocities = new Float32Array(count * 3)
  let j = count * 3
  while (j--) {
    particles[j] = random(-1, 1)
    velocities[j] = random(-speed, speed)
  }
  return {particles, velocities}
}

function buildEdgeBuffers (particlePositions, particleVelocities) {
  let k = 0
  let p = 0
  let l = 0
  let n = 0
  let edgesCount = PARTICLE_COUNT * (PARTICLE_COUNT - 1)
  let edgePoints = new Float32Array(edgesCount * 3)
  let otherEdgePoints = new Float32Array(edgesCount * 3)
  let edgeVelocities = new Float32Array(edgesCount * 3)
  let otherEdgeVelocities = new Float32Array(edgesCount * 3)
  for (let i = 0, len = particlePositions.length; i < len; i += 3) {
    let p1X = particlePositions[i]
    let p1Y = particlePositions[i + 1]
    let p1Z = particlePositions[i + 2]
    let v1X = particleVelocities[i]
    let v1Y = particleVelocities[i + 1]
    let v1Z = particleVelocities[i + 2]
    for (let j = i + 3, leng = particlePositions.length; j < leng; j += 3) {
      let p2X = particlePositions[j]
      let p2Y = particlePositions[j + 1]
      let p2Z = particlePositions[j + 2]

      edgePoints[k++] = p1X
      edgePoints[k++] = p1Y
      edgePoints[k++] = p1Z

      otherEdgePoints[l++] = p2X
      otherEdgePoints[l++] = p2Y
      otherEdgePoints[l++] = p2Z

      edgePoints[k++] = p2X
      edgePoints[k++] = p2Y
      edgePoints[k++] = p2Z

      otherEdgePoints[l++] = p1X
      otherEdgePoints[l++] = p1Y
      otherEdgePoints[l++] = p1Z

      let v2X = particleVelocities[j]
      let v2Y = particleVelocities[j + 1]
      let v2Z = particleVelocities[j + 2]

      edgeVelocities[p++] = v1X
      edgeVelocities[p++] = v1Y
      edgeVelocities[p++] = v1Z

      otherEdgeVelocities[n++] = v2X
      otherEdgeVelocities[n++] = v2Y
      otherEdgeVelocities[n++] = v2Z

      edgeVelocities[p++] = v2X
      edgeVelocities[p++] = v2Y
      edgeVelocities[p++] = v2Z

      otherEdgeVelocities[n++] = v1X
      otherEdgeVelocities[n++] = v1Y
      otherEdgeVelocities[n++] = v1Z
    }
  }

  return { edgePoints, otherEdgePoints, edgeVelocities, otherEdgeVelocities }
}

function random (min, max) {
  return Math.random() * (max - min) + min
}
