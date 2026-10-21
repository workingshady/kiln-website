precision mediump float;
// Heat haze: footage shimmering over a kiln. Mobile-style effect (GLSL ES 1.00).
varying vec2 tc;
uniform sampler2D frameTexture;
uniform float uniform_progress;   // driven 0..1 (Loop) by default
uniform float u_heat;   // @slider 0..1 0.8
uniform float u_rise;   // @slider 0..2 0.8
uniform float u_split;  // @slider 0..0.02 0.006
uniform vec3  u_warm;   // @color #FF8A3D
uniform bool  u_still;  // @toggle   still air: no embers

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    float t = uniform_progress * 6.2832;
    // Hot air rises, so the shimmer is strongest low in the frame.
    float strength = u_heat * smoothstep(0.0, 1.0, tc.y) * 0.045;
    vec2 q = vec2(noise(tc * vec2(9.0, 4.0) + vec2(0.0, t * u_rise)), noise(tc * vec2(7.0, 3.0) - vec2(t * u_rise, 0.0)));
    vec2 uv = tc + (q - 0.5) * strength;
    vec3 col;
    col.r = texture2D(frameTexture, uv + vec2(u_split, 0.0)).r;
    col.g = texture2D(frameTexture, uv).g;
    col.b = texture2D(frameTexture, uv - vec2(u_split, 0.0)).b;
    // Warm the highlights toward the kiln colour.
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * u_warm * 1.6, smoothstep(0.35, 1.0, luma) * u_heat);
    if (!u_still) {
        vec2 cell = floor(vec2(tc.x * 40.0, tc.y * 70.0 - t * 3.0));
        float e = step(0.985, hash(cell));
        col += vec3(1.0, 0.6, 0.25) * e * smoothstep(0.2, 1.0, tc.y) * 0.9;
    }
    gl_FragColor = vec4(col, 1.0);
}
