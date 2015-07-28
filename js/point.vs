attribute vec2 position;

varying vec2 v_position;

void main() {
    v_position = position;
    gl_PointSize = 5.0;
    gl_Position = vec4(position, 0, 1);
}
