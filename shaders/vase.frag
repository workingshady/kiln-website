// A glazed vase turning on the wheel: raymarched, lit like a kiln shelf.
uniform float u_spin;   // @slider 0..2 0.6
uniform vec3  u_glaze;  // @color #2F7F86
uniform vec3  u_clay;   // @color #B5603E
uniform float u_gloss;  // @slider 0..1 0.7

// Vase profile: radius as a function of height.
float profile(float y) {
    return 0.30 + 0.16 * sin(y * 3.2 + 0.6) - 0.10 * smoothstep(0.35, 0.62, y) + 0.05 * smoothstep(0.6, 0.72, y);
}
float sdVase(vec3 p) {
    float y = clamp(p.y, -0.6, 0.72);
    float r = length(p.xz) - profile(y);
    float caps = max(p.y - 0.72, -0.6 - p.y);
    return max(r * 0.6, caps);
}
float map(vec3 p) { return min(sdVase(p), p.y + 0.6); }
vec3 normal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.08, 3.6), rd = normalize(vec3(uv, -1.7));
    float t = 0.0;
    for (int i = 0; i < 90; i++) {
        float d = map(ro + rd * t);
        if (d < 0.001 || t > 6.0) break;
        t += d;
    }
    // Background: the glow of an open kiln behind the shelf.
    vec3 col = mix(vec3(0.05, 0.02, 0.05), vec3(0.45, 0.14, 0.06), smoothstep(0.6, -0.4, length(uv - vec2(0.0, -0.1))));
    if (t < 6.0) {
        vec3 p = ro + rd * t, n = normal(p);
        vec3 l = normalize(vec3(-0.6, 0.7, 0.8));
        float diff = max(dot(n, l), 0.0);
        if (p.y < -0.59) {
            col = vec3(0.12, 0.06, 0.06) * (0.4 + diff);             // shelf
        } else {
            float a = atan(p.z, p.x) + iTime * u_spin;            // turning
            float drip = smoothstep(0.0, 0.08, p.y + 0.15 + 0.08 * sin(a * 9.0) + 0.04 * sin(a * 23.0));
            vec3 base = mix(u_clay, u_glaze * (0.6 + 0.6 * smoothstep(0.7, -0.2, p.y)), drip);
            vec3 h = normalize(l - rd);
            float spec = pow(max(dot(n, h), 0.0), mix(8.0, 90.0, u_gloss)) * drip * u_gloss;
            float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
            col = base * (0.15 + 0.85 * diff) + spec + rim * vec3(1.0, 0.5, 0.2) * 0.5;
        }
    }
    col *= 1.0 - 0.3 * dot(uv, uv);
    fragColor = vec4(pow(col, vec3(0.9)), 1.0);
}
