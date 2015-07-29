precision mediump float;

varying vec2 v_position;

uniform float u_time;

void main() {
    float change = 0.00002;

    float r = cos(u_time * v_position.x * change);
    float g = sin(u_time * v_position.y * change);
    float b = sin(u_time * v_position.x * change);

    r = (r / 2.0 + 0.5) * 0.5;
    g = (g / 2.0 + 0.5) * 0.7;
    b = (b / 2.0 + 0.5) * 0.9;

    gl_FragColor = vec4(r, g, b, 0.8);
}
