// Dunes at dusk: a procedural backdrop, rendered in Kiln and used as footage.
uniform float u_sun;    // @slider 0..1 0.42
uniform vec3  u_sky;    // @color #FF7A45

// Sums of sines: smooth everywhere, so no seams in the ridgelines.
float ridge(float x, float seed) {
    return 0.5 + 0.22 * sin(x * 1.7 + seed) + 0.12 * sin(x * 3.9 + seed * 1.3) + 0.05 * sin(x * 8.3 + seed * 2.1);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float x = uv.x * iResolution.x / iResolution.y;
    // Sky: soot at the top, the kiln mouth at the horizon.
    vec3 col = mix(u_sky * 1.1, vec3(0.07, 0.03, 0.09), smoothstep(0.25, 0.95, uv.y));
    col = mix(col, vec3(1.0, 0.85, 0.55), exp(-abs(uv.y - 0.36) * 9.0) * 0.55);
    // Sun, sinking.
    vec2 sp = vec2(0.5 * iResolution.x / iResolution.y, 0.38 + 0.25 * u_sun);
    float d = length(vec2(x, uv.y) - sp);
    col += vec3(1.0, 0.75, 0.4) * smoothstep(0.09, 0.085, d);
    col += vec3(1.0, 0.5, 0.2) * 0.12 / (1.0 + d * 30.0);
    // Four dune layers, each darker and closer, lit from the sun along the crest.
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float h = 0.40 - fi * 0.085 + ridge(x * (1.0 + fi * 0.35) + iTime * 0.02 * (fi + 1.0), fi * 11.0) * (0.10 + fi * 0.05);
        vec3 sand = mix(vec3(0.78, 0.36, 0.2), vec3(0.16, 0.05, 0.08), fi / 3.0);
        vec3 dune = sand * (0.55 + 0.45 * smoothstep(h - 0.25, h, uv.y));
        dune += vec3(1.0, 0.6, 0.3) * smoothstep(h - 0.012, h, uv.y) * (0.35 - fi * 0.08);
        col = mix(col, dune, smoothstep(h + 0.002, h - 0.002, uv.y));
    }
    fragColor = vec4(col, 1.0);
}
