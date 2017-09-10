attribute vec3 position;
attribute vec3 velocity;

uniform vec2 mouse;
uniform float elapsed;
uniform mat4 projection;
uniform mat4 view;

varying vec3 v_position;

void main() {
    vec3 v = sin(velocity * 3.0);
    vec3 pos = vec3(mouse.x, mouse.y, 0) * 0.01 + position + v * elapsed;

    float x = sin(pos.x * 4.0);
    float y = sin(pos.y * 4.0);
    float z = sin(pos.z * 4.0);

    float xSign = x / abs(x);
    float ySign = y / abs(y);
    float zSign = z / abs(z);

    float power = (cos(elapsed / 10.0) / 2.0) + 0.2;
    float mult = (1.0 - sin(elapsed / 5.0) / 5.0) + 0.5;

    if (position.x > 0.0) {
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

    v_position = vec3(x, y, z);

    gl_PointSize = 2.0;
    gl_Position = projection * view * vec4(x, y, z, 1.0);
}
