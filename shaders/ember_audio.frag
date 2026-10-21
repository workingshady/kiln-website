// Embers on the beat: an audio texture drives the sparks and the glow.
// Add an audio file as texture 0; u_bass / u_mid / u_high come for free.
uniform float u_bass, u_mid, u_high; // filled by Kiln from the first audio texture
uniform float u_sparks;  // @slider 0..1 0.7
uniform vec3  u_hot;     // @color #FFC04D

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    // Spectrum bars along the bottom, like coals.
    float spec = texture(iChannel0, vec2(uv.x * 0.5, 0.25)).r;
    vec3 col = vec3(0.05, 0.02, 0.05);
    col += vec3(0.85, 0.25, 0.08) * smoothstep(spec * 0.35 + 0.02, 0.0, uv.y) * (0.6 + u_bass);
    // The kiln mouth breathes with the bass.
    float mouth = length((p - vec2(0.0, -0.05)) * vec2(1.0, 0.8));
    col += u_hot * (0.08 + 0.5 * u_bass) / (0.05 + mouth * mouth * 6.0) * 0.12;
    // Square sparks rise faster on the highs.
    for (int i = 0; i < 3; i++) {
        float s = 30.0 + float(i) * 22.0;
        vec2 g = vec2(uv.x * s, uv.y * s * 1.8 - iTime * (2.0 + 6.0 * u_high) * (1.0 + float(i) * 0.4));
        vec2 id = floor(g), f = fract(g);
        float on = step(1.0 - 0.06 * u_sparks * (1.0 + 2.0 * u_mid), hash(id + float(i) * 7.0));
        float sq = step(abs(f.x - 0.5), 0.18) * step(abs(f.y - 0.5), 0.18);
        col += mix(u_hot, vec3(1.0, 0.45, 0.55), hash(id)) * on * sq * smoothstep(1.0, 0.1, uv.y);
    }
    fragColor = vec4(col, 1.0);
}
