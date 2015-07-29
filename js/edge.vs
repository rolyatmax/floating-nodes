precision mediump float;

attribute vec4 position;
attribute vec4 velocity;

varying vec2 v_position;
varying float v_opacity;

uniform float u_time;
uniform float u_threshold;

float dist(vec2 a, vec2 b) {
    float x_diff = a.x - b.x;
    float y_diff = a.y - b.y;
    return sqrt(x_diff * x_diff + y_diff * y_diff);
}

vec2 get_position(vec2 p, vec2 v, float t) {
    v = sin(v * 3.0);
    vec2 pos = p + v * t;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);

    x = 1.05 - pow(x, 1.2);
    y = 1.05 - pow(y, 1.2);

    x *= xSign;
    y *= ySign;

    return vec2(x, y);
}

void main() {
    vec2 pos1 = get_position(position.xy, velocity.xy, u_time);
    vec2 pos2 = get_position(position.zw, velocity.zw, u_time);

    v_position = pos1;
    float distance = dist(pos1, pos2);
    if (distance < u_threshold) {
        v_opacity = 1.0 - distance / u_threshold;
        gl_Position = vec4(pos1, 0, 1);
    } else {
        v_opacity = 0.0;
        gl_Position = vec4(0, 0, 0, 1);
    }
}
