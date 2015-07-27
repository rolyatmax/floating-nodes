attribute vec2 position;
attribute float opacity;

varying vec2 v_position;
varying float v_opacity;

void main() {
    v_opacity = opacity;
    v_position = position;
    gl_PointSize = 5.0;
    gl_Position = vec4(position, 0, 1);
}
