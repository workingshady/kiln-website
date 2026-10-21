// Crackle glaze: a fired ceramic surface. Every control comes from a comment.
uniform float u_scale;    // @slider 2..16 7
uniform float u_crackle;  // @slider 0..1 0.65
uniform float u_pool;     // @slider 0..1 0.5
uniform vec3  u_glaze;    // @color #2F7F86
uniform vec3  u_clay;     // @color #B5603E
uniform bool  u_wet;      // @toggle

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}
// Distance to the nearest crack (edge of a Voronoi cell).
float cracks(vec2 p) {
    vec2 n = floor(p), f = fract(p);
    vec2 mg, mr;
    float md = 8.0;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 r = g + hash2(n + g) - f;
        float d = dot(r, r);
        if (d < md) { md = d; mr = r; mg = g; }
    }
    md = 8.0;
    for (int j = -2; j <= 2; j++)
    for (int i = -2; i <= 2; i++) {
        vec2 g = mg + vec2(float(i), float(j));
        vec2 r = g + hash2(n + g) - f;
        if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
    }
    return md;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec2 p = uv * u_scale;
    // Glaze pools thicker toward the bottom of the pot and runs in drips.
    float drip = 0.5 + 0.5 * sin(uv.x * 23.0 + sin(uv.x * 7.0) * 2.0);
    float thick = clamp(u_pool + (0.5 - uv.y) * 0.9 + drip * 0.15, 0.0, 1.0);
    vec3 col = mix(u_glaze * 1.5, u_glaze * 0.45, thick);
    float c = cracks(p) + 0.35 * cracks(p * 2.7 + 3.1) * 0.4;
    float line = 1.0 - smoothstep(0.0, 0.035 + 0.04 * (1.0 - u_crackle), c);
    col = mix(col, u_clay * 0.5, line * u_crackle);
    // Bare clay at the foot ring.
    col = mix(col, u_clay, smoothstep(-0.38, -0.44, uv.y));
    // Studio light: one soft highlight, sharper when the glaze is wet.
    vec2 l = uv - vec2(-0.25 + 0.1 * sin(iTime * 0.4), 0.22);
    float spec = exp(-dot(l, l) * (u_wet ? 60.0 : 14.0));
    col += spec * (u_wet ? 0.9 : 0.35);
    col *= 1.0 - 0.4 * dot(uv, uv);
    fragColor = vec4(col, 1.0);
}
