import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GARGANTUA_PALETTE = {
  hot: new THREE.Vector3(1.0, 0.99, 0.92),
  mid: new THREE.Vector3(1.0, 0.74, 0.22),
  cool: new THREE.Vector3(0.68, 0.22, 0.03),
  neb: new THREE.Vector3(0.14, 0.1, 0.06),
}

const BASE_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const BLACK_HOLE_FRAG = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uCamAngles;
  uniform vec3 uColorHot;
  uniform vec3 uColorMid;
  uniform vec3 uColorCool;
  uniform vec3 uColorNeb;
  varying vec2 vUv;

  float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  float hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm4(vec3 p) {
    float v = 0.0;
    float a = 0.52;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.06 + vec3(0.17, -0.11, 0.23);
      a *= 0.49;
    }
    return v;
  }

  vec3 starColor(float t) {
    vec3 c1 = vec3(0.62, 0.78, 1.00);
    vec3 c2 = vec3(0.95, 0.97, 1.00);
    vec3 c3 = vec3(1.00, 0.90, 0.74);
    vec3 c4 = vec3(1.00, 0.68, 0.45);
    if (t < 0.35) return mix(c1, c2, t / 0.35);
    if (t < 0.75) return mix(c2, c3, (t - 0.35) / 0.40);
    return mix(c3, c4, (t - 0.75) / 0.25);
  }

  vec3 starLayer(vec3 d, float scale, float threshold, float coreSize, float haloSize, float brightness) {
    vec3 p = d * scale;
    vec3 cell = floor(p);
    vec3 f = fract(p) - 0.5;
    vec3 rnd = hash33(cell);
    float presence = step(threshold, rnd.x);
    if (presence < 0.5) return vec3(0.0);

    vec3 offset = (rnd - 0.5) * 0.58;
    vec3 diff = f - offset;
    float dist = length(diff);

    float core = smoothstep(coreSize, 0.004, dist);
    float halo = exp(-dist * haloSize) * 0.38;
    float twinkle = 0.80 + 0.20 * sin(uTime * (0.9 + rnd.y * 1.4) + rnd.z * 62.8);
    float mag = pow(fract(rnd.x * 137.5), 1.8);

    return starColor(rnd.y) * (core + halo) * twinkle * (0.35 + 0.85 * mag) * brightness;
  }

  vec3 deepSpaceSky(vec3 dir) {
    vec3 d = normalize(dir);
    float skyAng = uTime * 0.042;
    float cs = cos(skyAng), sn = sin(skyAng);
    d = vec3(d.x * cs + d.z * sn, d.y, -d.x * sn + d.z * cs);
    float tilt = sin(uTime * 0.025) * 0.05;
    float ct = cos(tilt), st = sin(tilt);
    d = vec3(d.x, d.y * ct - d.z * st, d.y * st + d.z * ct);

    vec3 sky = vec3(0.0);
    sky += starLayer(d, 480.0, 0.935, 0.15, 19.0, 0.85);
    sky += starLayer(d + vec3(0.13, -0.07, 0.21), 220.0, 0.968, 0.12, 15.0, 1.20);

    vec3 pHero = d * 96.0;
    vec3 cHero = floor(pHero);
    vec3 fHero = fract(pHero) - 0.5;
    vec3 rH = hash33(cHero + 41.7);
    if (rH.x > 0.991) {
      vec3 diff = fHero - (rH - 0.5) * 0.52;
      float dist = length(diff);
      float core = smoothstep(0.08, 0.003, dist);
      float halo = exp(-dist * 10.0) * 0.45;
      float tw = 0.84 + 0.16 * sin(uTime * 1.1 + rH.z * 50.0);
      sky += starColor(rH.y) * (core * 1.45 + halo) * tw * 1.25;
    }

    float galCoord = d.y * 0.86 + d.x * 0.36 - d.z * 0.15;
    float bandMask = exp(-galCoord * galCoord * 8.5);
    float cloud1 = fbm4(d * 3.6 + vec3(1.4 + uTime * 0.015, -0.5, 0.9));
    float cloud2 = fbm4(d * 7.8 + vec3(-2.1, 1.3, 3.2));
    float darkRift = smoothstep(0.36, 0.72, cloud2);
    sky += uColorNeb * bandMask * cloud1 * (1.0 - 0.55 * darkRift) * 0.80;

    return sky;
  }

  float samplePlasmaLayer(float rad, float baseAngle, float phase) {
    float shear = phase * (2.2 / pow(rad, 0.72));
    float spiral = baseAngle - shear + 3.4 / sqrt(rad);

    vec3 p1 = vec3(cos(spiral) * 2.3, rad * 1.65, sin(spiral) * 2.3);
    vec3 p2 = vec3(cos(spiral * 2.0) * 3.1, rad * 2.75, sin(spiral * 2.0) * 3.1);

    float n1 = fbm4(p1);
    float n2 = fbm4(p2 + vec3(n1 * 1.35));
    float streamA = pow(smoothstep(0.24, 0.86, n1 * 0.58 + n2 * 0.48), 1.35);
    float streamB = pow(0.5 + 0.5 * sin(rad * 5.2 + n1 * 4.4 - spiral * 2.0), 1.45);
    return mix(streamA, streamA * (0.45 + 0.92 * streamB), 0.65);
  }

  vec3 evalDiskEmission(vec3 hit, vec3 rayDir, out float alpha) {
    float rad = length(hit.xz);
    alpha = 0.0;
    if (rad < 1.65 || rad > 8.6) return vec3(0.0);

    float angle = atan(hit.z, hit.x);
    float baseAngle = angle - uTime * 0.48;

    float ph0 = fract(uTime * 0.14);
    float ph1 = fract(uTime * 0.14 + 0.5);
    float blend = abs(2.0 * ph0 - 1.0);

    float fil0 = samplePlasmaLayer(rad, baseAngle, ph0);
    float fil1 = samplePlasmaLayer(rad, baseAngle, ph1);
    float filaments = mix(fil0, fil1, blend);

    float innerEdge = smoothstep(1.65, 2.05, rad);
    float outerEdge = smoothstep(8.6, 3.6, rad);
    float iscoRing  = exp(-pow((rad - 2.05) * 3.5, 2.0)) * (0.75 + 0.55 * filaments);

    float density = innerEdge * outerEdge * (0.09 + 1.48 * filaments) + iscoRing * 1.05;

    vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
    float doppler = dot(tangent, -rayDir);
    float beam = pow(clamp(1.0 + doppler * 0.52, 0.36, 1.95), 1.6);

    float radialT = pow(clamp(1.0 - (rad - 1.65) / 6.8, 0.0, 1.0), 1.25);
    float temp = clamp((radialT * 0.78 + filaments * 0.52 + iscoRing * 0.48) * (0.65 + 0.42 * beam), 0.0, 1.45);

    vec3 col = mix(uColorCool, uColorMid, smoothstep(0.05, 0.50, temp));
    col = mix(col, uColorHot, smoothstep(0.46, 1.02, temp));
    col += vec3(1.0, 0.99, 0.96) * smoothstep(1.00, 1.45, temp) * 0.52;

    alpha = clamp(density * 0.76, 0.0, 0.96);
    return col * density * beam * 1.55;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
    uv.y -= 0.055;

    float yaw = uCamAngles.x;
    float pitch = uCamAngles.y;
    float camDist = 22.8;

    vec3 ro = vec3(
      camDist * cos(pitch) * sin(yaw),
      camDist * sin(pitch),
      camDist * cos(pitch) * cos(yaw)
    );

    vec3 fwd = normalize(-ro);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);

    float roll = -0.065;
    vec3 rR = right * cos(roll) + up * sin(roll);
    vec3 uR = -right * sin(roll) + up * cos(roll);

    vec3 rd = normalize(fwd * 1.40 + uv.x * rR + uv.y * uR);

    vec3 pos = ro;
    vec3 vel = rd;
    vec3 accum = vec3(0.0);
    float trans = 1.0;
    bool captured = false;
    float minR = 999.0;
    vec3 closestPos = vec3(0.0);

    const float RS = 0.68;
    const float R_PHOTON = 1.5 * RS;

    vec3 hVec = cross(pos, vel);
    float h2 = dot(hVec, hVec);

    float jitter = ign(gl_FragCoord.xy);
    pos += vel * (jitter * 0.05);

    const int STEPS = 156;
    for (int i = 0; i < STEPS; i++) {
      float r = length(pos);
      if (r < minR) {
        minR = r;
        closestPos = pos;
      }

      if (r < RS * 1.03) {
        captured = true;
        break;
      }
      if (r > 50.0 || trans < 0.01) break;

      float stepLen = clamp(r * 0.052, 0.026, 0.85);

      vec3 prevPos = pos;
      vec3 midPos = pos + vel * (stepLen * 0.5);
      float rMid = length(midPos);
      vec3 acc2 = -1.5 * RS * h2 * midPos / pow(max(rMid, 0.55), 5.0);

      vel = normalize(vel + acc2 * stepLen);
      pos += vel * stepLen;

      if (prevPos.y * pos.y <= 0.0) {
        float frac = abs(prevPos.y) / (abs(prevPos.y) + abs(pos.y) + 1e-6);
        vec3 hit = mix(prevPos, pos, frac);
        float diskAlpha = 0.0;
        vec3 diskCol = evalDiskEmission(hit, rd, diskAlpha);
        if (diskAlpha > 0.001) {
          accum += trans * diskCol;
          trans *= (1.0 - diskAlpha * 0.84);
        }
      }

      if (r > 1.6 && r < 8.6 && abs(pos.y) < 0.28) {
        float hEnv = exp(-(pos.y * pos.y) / 0.016);
        float radEnv = smoothstep(1.6, 2.2, r) * smoothstep(8.6, 3.8, r);
        float ang = atan(pos.z, pos.x) - uTime * 0.48 + 3.4 / sqrt(r);
        float swirlH = fbm4(vec3(cos(ang) * 2.3, r * 1.65, sin(ang) * 2.3));
        vec3 hCol = mix(uColorCool, uColorMid, clamp(1.0 - (r - 1.6) / 6.8, 0.0, 1.0));
        accum += trans * hCol * hEnv * radEnv * pow(swirlH, 1.35) * stepLen * 0.85;
      }
    }

    if (!captured) {
      accum += trans * deepSpaceSky(vel);
      float ringAng = atan(closestPos.y, closestPos.x);
      float lightPulse = 0.65
        + 0.22 * sin(ringAng * 2.0 - uTime * 2.2)
        + 0.14 * sin(ringAng * 4.0 - uTime * 3.4)
        + 0.08 * sin(ringAng * 7.0 - uTime * 4.8);
      float ringSharp = exp(-pow((minR - R_PHOTON) * 22.0, 2.0));
      float coronaHalo = exp(-pow((minR - R_PHOTON * 1.18) * 3.8, 2.0)) * 0.32;
      accum += trans * mix(uColorMid, uColorHot, 0.86) * (ringSharp * 1.55 + coronaHalo) * lightPulse;
    }

    vec3 encoded = accum / (1.0 + accum * 0.28);
    gl_FragColor = vec4(clamp(encoded, 0.0, 1.0), 1.0);
  }
`

const BLUR_H_FRAG = `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;
  varying vec2 vUv;

  vec3 bright(vec3 c) {
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    return c * smoothstep(0.42, 0.92, lum);
  }

  void main() {
    vec3 sum = bright(texture2D(tDiffuse, vUv).rgb) * 0.227027;
    vec2 s1 = vec2(uTexel.x * 2.4, 0.0);
    vec2 s2 = vec2(uTexel.x * 5.2, 0.0);
    vec2 s3 = vec2(uTexel.x * 9.0, 0.0);
    vec2 s4 = vec2(uTexel.x * 14.0, 0.0);

    sum += (bright(texture2D(tDiffuse, vUv + s1).rgb) + bright(texture2D(tDiffuse, vUv - s1).rgb)) * 0.1945946;
    sum += (bright(texture2D(tDiffuse, vUv + s2).rgb) + bright(texture2D(tDiffuse, vUv - s2).rgb)) * 0.1216216;
    sum += (bright(texture2D(tDiffuse, vUv + s3).rgb) + bright(texture2D(tDiffuse, vUv - s3).rgb)) * 0.054054;
    sum += (bright(texture2D(tDiffuse, vUv + s4).rgb) + bright(texture2D(tDiffuse, vUv - s4).rgb)) * 0.016216;

    gl_FragColor = vec4(sum, 1.0);
  }
`

const BLUR_V_FRAG = `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;
  varying vec2 vUv;

  void main() {
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
    vec2 s1 = vec2(0.0, uTexel.y * 2.0);
    vec2 s2 = vec2(0.0, uTexel.y * 4.2);
    vec2 s3 = vec2(0.0, uTexel.y * 7.2);
    vec2 s4 = vec2(0.0, uTexel.y * 11.0);

    sum += (texture2D(tDiffuse, vUv + s1).rgb + texture2D(tDiffuse, vUv - s1).rgb) * 0.1945946;
    sum += (texture2D(tDiffuse, vUv + s2).rgb + texture2D(tDiffuse, vUv - s2).rgb) * 0.1216216;
    sum += (texture2D(tDiffuse, vUv + s3).rgb + texture2D(tDiffuse, vUv - s3).rgb) * 0.054054;
    sum += (texture2D(tDiffuse, vUv + s4).rgb + texture2D(tDiffuse, vUv - s4).rgb) * 0.016216;

    gl_FragColor = vec4(sum, 1.0);
  }
`

const COMPOSITE_FRAG = `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float uTime;
  varying vec2 vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 dir = vUv - 0.5;
    float dist2 = dot(dir, dir);
    vec2 ca = dir * dist2 * 0.0045;

    vec3 baseCol = vec3(
      texture2D(tScene, vUv + ca).r,
      texture2D(tScene, vUv).g,
      texture2D(tScene, vUv - ca).b
    );
    vec3 bloom = texture2D(tBloom, vUv).rgb;

    vec3 col = baseCol + bloom * 0.92;
    col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
    col = pow(clamp(col, 0.0, 1.0), vec3(0.96));

    float vig = smoothstep(1.15, 0.25, length(dir * vec2(1.2, 1.0)));
    col *= mix(0.62, 1.0, vig);

    float grain = (rand(vUv * 800.0 + fract(uTime)) - 0.5) * 0.016;
    col = clamp(col + grain, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function BlackHoleCanvas() {
  const canvasHostRef = useRef(null)

  useEffect(() => {
    const container = canvasHostRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    })
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const initW = container.clientWidth || window.innerWidth
    const initH = container.clientHeight || window.innerHeight
    renderer.setPixelRatio(dpr)
    renderer.setSize(initW, initH)
    container.appendChild(renderer.domElement)

    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    }

    const rtScene = new THREE.WebGLRenderTarget(
      Math.floor(initW * dpr),
      Math.floor(initH * dpr),
      rtOpts,
    )
    const rtBloomH = new THREE.WebGLRenderTarget(
      Math.floor(initW * dpr * 0.5),
      Math.floor(initH * dpr * 0.5),
      rtOpts,
    )
    const rtBloomV = new THREE.WebGLRenderTarget(
      Math.floor(initW * dpr * 0.5),
      Math.floor(initH * dpr * 0.5),
      rtOpts,
    )

    const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const quadGeo = new THREE.PlaneGeometry(2, 2)

    const bhUniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(initW * dpr, initH * dpr) },
      uCamAngles: { value: new THREE.Vector2(0.0, 0.085) },
      uColorHot: { value: GARGANTUA_PALETTE.hot.clone() },
      uColorMid: { value: GARGANTUA_PALETTE.mid.clone() },
      uColorCool: { value: GARGANTUA_PALETTE.cool.clone() },
      uColorNeb: { value: GARGANTUA_PALETTE.neb.clone() },
    }

    const matBH = new THREE.ShaderMaterial({
      uniforms: bhUniforms,
      vertexShader: BASE_VERT,
      fragmentShader: BLACK_HOLE_FRAG,
    })
    const sceneBH = new THREE.Scene()
    sceneBH.add(new THREE.Mesh(quadGeo, matBH))

    const blurHUniforms = {
      tDiffuse: { value: rtScene.texture },
      uTexel: { value: new THREE.Vector2(1 / (initW * dpr), 1 / (initH * dpr)) },
    }
    const matBlurH = new THREE.ShaderMaterial({
      uniforms: blurHUniforms,
      vertexShader: BASE_VERT,
      fragmentShader: BLUR_H_FRAG,
    })
    const sceneBlurH = new THREE.Scene()
    sceneBlurH.add(new THREE.Mesh(quadGeo, matBlurH))

    const blurVUniforms = {
      tDiffuse: { value: rtBloomH.texture },
      uTexel: {
        value: new THREE.Vector2(1 / (initW * dpr * 0.5), 1 / (initH * dpr * 0.5)),
      },
    }
    const matBlurV = new THREE.ShaderMaterial({
      uniforms: blurVUniforms,
      vertexShader: BASE_VERT,
      fragmentShader: BLUR_V_FRAG,
    })
    const sceneBlurV = new THREE.Scene()
    sceneBlurV.add(new THREE.Mesh(quadGeo, matBlurV))

    const compUniforms = {
      tScene: { value: rtScene.texture },
      tBloom: { value: rtBloomV.texture },
      uTime: { value: 0 },
    }
    const matComp = new THREE.ShaderMaterial({
      uniforms: compUniforms,
      vertexShader: BASE_VERT,
      fragmentShader: COMPOSITE_FRAG,
    })
    const sceneComp = new THREE.Scene()
    sceneComp.add(new THREE.Mesh(quadGeo, matComp))

    let targetYaw = 0.0
    let targetPitch = 0.085
    let curYaw = 0.0
    let curPitch = 0.085
    let dragYaw = 0.0
    let dragPitch = 0.085
    let isDragging = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = () => {
      isDragging = false
    }
    const onPointerMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        dragYaw -= dx * 0.0042
        dragPitch = Math.max(-0.48, Math.min(0.68, dragPitch + dy * 0.0036))
      } else {
        const nx = e.clientX / Math.max(1, window.innerWidth) - 0.5
        const ny = e.clientY / Math.max(1, window.innerHeight) - 0.5
        targetYaw = dragYaw + nx * 0.3
        targetPitch = Math.max(-0.45, Math.min(0.65, dragPitch + ny * 0.18))
      }
    }

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      const rw = Math.floor(w * dpr)
      const rh = Math.floor(h * dpr)
      renderer.setSize(w, h)
      rtScene.setSize(rw, rh)
      rtBloomH.setSize(Math.floor(rw * 0.5), Math.floor(rh * 0.5))
      rtBloomV.setSize(Math.floor(rw * 0.5), Math.floor(rh * 0.5))
      bhUniforms.uRes.value.set(rw, rh)
      blurHUniforms.uTexel.value.set(1 / rw, 1 / rh)
      blurVUniforms.uTexel.value.set(1 / (rw * 0.5), 1 / (rh * 0.5))
    }

    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let rafId = 0

    const renderLoop = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      bhUniforms.uTime.value += dt
      compUniforms.uTime.value += dt

      const goalYaw = isDragging ? dragYaw : targetYaw
      const goalPitch = isDragging ? dragPitch : targetPitch
      curYaw += (goalYaw - curYaw) * 0.05
      curPitch += (goalPitch - curPitch) * 0.05
      bhUniforms.uCamAngles.value.set(curYaw, curPitch)

      renderer.setRenderTarget(rtScene)
      renderer.render(sceneBH, orthoCam)

      renderer.setRenderTarget(rtBloomH)
      renderer.render(sceneBlurH, orthoCam)

      renderer.setRenderTarget(rtBloomV)
      renderer.render(sceneBlurV, orthoCam)

      renderer.setRenderTarget(null)
      renderer.render(sceneComp, orthoCam)

      rafId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => {
      cancelAnimationFrame(rafId)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      quadGeo.dispose()
      matBH.dispose()
      matBlurH.dispose()
      matBlurV.dispose()
      matComp.dispose()
      rtScene.dispose()
      rtBloomH.dispose()
      rtBloomV.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={canvasHostRef}
      className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
    />
  )
}
