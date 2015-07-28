attribute vec4 position;

varying vec2 v_position;
varying float v_opacity;

uniform float u_threshold;

float dist(vec2 a, vec2 b) {
    float x_diff = a.x - b.x;
    float y_diff = a.y - b.y;
    return sqrt(x_diff * x_diff + y_diff * y_diff);
}

void main() {
    v_position = position.xy;

    float distance = dist(position.xy, position.zw);
    if (distance < u_threshold) {
        v_opacity = 1.0 - distance / u_threshold;
        gl_Position = vec4(position.xy, 0, 1);
    } else {
        v_opacity = 0.0;
    }
}
