precision mediump float;

varying vec2 v_position;

void main() {
    float r = (v_position.x / 2.0 + 0.5) * 0.5;
    float g = (v_position.y / 2.0 + 0.5) * 0.7;
    float b = (v_position.x / 2.0 + 0.5) * 0.9;
    gl_FragColor = vec4(r, g, b, 0.8);
}
