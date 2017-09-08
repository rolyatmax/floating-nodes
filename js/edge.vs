attribute vec3 position;
attribute vec3 otherPosition;
attribute vec3 velocity;
attribute vec3 otherVelocity;

varying vec3 v_position;
varying float v_opacity;

uniform vec2 mouse;
uniform float elapsed;
uniform float threshold;
uniform mat4 projection;
uniform mat4 view;

float tri(float x) {
    return 2.0 * abs(2.0 * (x - floor(x + 0.5))) - 1.0;
}

vec3 get_position(vec3 p, vec3 v, float t) {
    v = sin(v * 3.0);
    vec3 pos = vec3(mouse.x, mouse.y, 0) * 0.01 + p + v * t;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);
    float z = sin(pos.z * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);
    float zSign = z / abs(z);

    float power = (cos(elapsed / 10.0) / 2.0) + 0.2;
    float mult = (1.0 - sin(elapsed / 5.0) / 5.0) + 0.5;

    if (p.x > 0.0) {
        x = (0.6 - pow(x, power)) * mult;
        y = (0.6 - pow(y, power)) * mult;
        z = (0.6 - pow(z, power)) * mult;
    } else {
        x = (1.0 - pow(x, power)) * mult;
        y = (1.0 - pow(y, power)) * mult;
        z = (1.0 - pow(z, power)) * mult;
    }

    x *= xSign;
    y *= ySign;
    z *= zSign;

    return vec3(x, y, z);
}

void main() {
    vec3 pos1 = get_position(position, velocity, elapsed);
    vec3 pos2 = get_position(otherPosition, otherVelocity, elapsed);

    v_position = pos1;
    float dist = distance(pos1, pos2);
    if (dist < threshold) {
        v_opacity = 1.0 - dist / threshold;
        gl_Position = projection * view * vec4(pos1, 1);
    } else {
        v_opacity = 0.0;
        gl_Position = vec4(0, 0, 0, 0);
    }
}
