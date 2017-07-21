attribute vec4 position;
attribute vec4 velocity;

varying vec2 v_position;
varying float v_opacity;

uniform vec2 mouse;
uniform float elapsed;
uniform float threshold;

float dist(vec2 a, vec2 b) {
    float x_diff = a.x - b.x;
    float y_diff = a.y - b.y;
    return sqrt(x_diff * x_diff + y_diff * y_diff);
}

float tri(float x) {
    return 2.0 * abs(2.0 * (x - floor(x + 0.5))) - 1.0;
}

vec2 get_position(vec2 p, vec2 v, float t) {
    v = sin(v * 3.0);
    vec2 pos = mouse * 0.01 + p + v * t;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);

    float power = (cos(elapsed / 10.0) / 2.0) + 0.2;
    float mult = (1.0 - sin(elapsed / 5.0) / 5.0) + 0.5;

    if (p.x > 0.0) {
        x = (0.6 - pow(x, power)) * mult;
        y = (0.6 - pow(y, power)) * mult;
    } else {
        x = (1.0 - pow(x, power)) * mult;
        y = (1.0 - pow(y, power)) * mult;
    }

    x *= xSign;
    y *= ySign;

    return vec2(x, y);
}

void main() {
    vec2 pos1 = get_position(position.xy, velocity.xy, elapsed);
    vec2 pos2 = get_position(position.zw, velocity.zw, elapsed);

    v_position = pos1;
    float distance = dist(pos1, pos2);
    if (distance < threshold) {
        v_opacity = 1.0 - distance / threshold;
        gl_Position = vec4(pos1, 0, 1);
    } else {
        v_opacity = 0.0;
        gl_Position = vec4(0, 0, 0, 0);
    }
}
