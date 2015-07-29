precision mediump float;

attribute vec2 position;
attribute vec2 velocity;

uniform float u_time;

varying vec2 v_position;

void main() {
    vec2 pos = position + velocity * u_time;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);

    x = pow(x, 1.1) * 2.0 - 1.0;
    y = pow(y, 1.1) * 2.0 - 1.0;

    v_position = vec2(y, x);

    gl_PointSize = 3.0;
    gl_Position = vec4(x, y, 0, 1);
}
