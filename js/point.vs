attribute vec2 position;
attribute vec2 velocity;

uniform vec2 mouse;
uniform float elapsed;

varying vec2 v_position;

void main() {
    vec2 v = sin(velocity * 3.0);
    vec2 pos = mouse * 0.01 + position + v * elapsed;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);

    float power = (cos(elapsed / 10.0) / 2.0) + 0.2;
    float mult = (1.0 - sin(elapsed / 5.0) / 5.0) + 0.5;

    if (position.x > 0.0) {
        x = (0.6 - pow(x, power)) * mult;
        y = (0.6 - pow(y, power)) * mult;
    } else {
        x = (1.0 - pow(x, power)) * mult;
        y = (1.0 - pow(y, power)) * mult;
    }

    x *= xSign;
    y *= ySign;

    v_position = vec2(x, y);

    gl_PointSize = 2.0;
    gl_Position = vec4(x, y, 0, 1);
}
