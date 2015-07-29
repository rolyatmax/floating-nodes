precision mediump float;

attribute vec2 position;
attribute vec2 velocity;

uniform float u_time;

varying vec2 v_position;

void main() {
    vec2 v = sin(velocity * 3.0);
    vec2 pos = position + v * u_time;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);

    x = 1.05 - pow(x, 1.2);
    y = 1.05 - pow(y, 1.2);

    x *= xSign;
    y *= ySign;

    v_position = vec2(x, y);

    gl_PointSize = 3.0;
    gl_Position = vec4(x, y, 0, 1);
}
