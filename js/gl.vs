attribute vec2 position;
attribute float distance;

varying vec2 v_position;
varying float v_distance;

void main() {
    v_distance = distance;
    v_position = position;
    gl_PointSize = 5.0;
    gl_Position = vec4(position, 0, 1);
}
