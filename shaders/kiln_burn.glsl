precision mediump float;
// Kiln burn: the first clip chars away from the middle, edged with embers.
uniform float edge;      // = 0.08
uniform float roughness; // = 4.0
uniform vec3  u_ember;   // @color #FFB347

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec4 transition(vec2 uv) {
    vec2 c = uv - 0.5;
    float n = 0.6 * noise(uv * roughness) + 0.3 * noise(uv * roughness * 2.7) + 0.1 * noise(uv * roughness * 7.0);
    float burn = length(c) * 0.9 + n * 0.55;
    float front = progress * (1.6 + edge) - edge;
    float t = smoothstep(front, front + edge, burn);
    float glow = smoothstep(front - edge * 0.6, front, burn) * (1.0 - t);
    vec4 from = getFromColor(uv);
    // Char the old clip just ahead of the flame.
    from.rgb *= mix(0.15, 1.0, smoothstep(front + edge, front + edge * 3.0, burn));
    vec4 col = mix(getToColor(uv), from, t);
    col.rgb += u_ember * glow * 1.8;
    return col;
}
