import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { translations } from './translations.js';
import naatUrl from './assets/naat.weba?url';
import './style.css';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101e1b');
scene.fog = new THREE.FogExp2('#101e1b', 0.035);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.2, 9.3);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.AmbientLight('#8caa96', 1.35));
const moonLight = new THREE.PointLight('#e5c77e', 42, 18, 2);
moonLight.position.set(1.7, 1.4, 3.8); scene.add(moonLight);
const rimLight = new THREE.PointLight('#5f9a78', 25, 20, 2);
rimLight.position.set(-4, -2, -1); scene.add(rimLight);

const gold = new THREE.MeshStandardMaterial({ color: '#d9bd7c', metalness: 0.78, roughness: 0.24 });
const darkGold = new THREE.MeshStandardMaterial({ color: '#8b7547', metalness: 0.72, roughness: 0.3 });
const moonGroup = new THREE.Group();
scene.add(moonGroup);
const animatedRings = [];
const animatedOrnaments = [];

// A sculpted crescent formed by subtracting two intersecting spheres.
const moonShape = new THREE.Shape();
moonShape.absarc(0, 0, 1.8, -Math.PI * 0.38, Math.PI * 1.38, false);
const cutout = new THREE.Path();
cutout.absarc(0.9, 0.42, 1.52, -Math.PI * 0.4, Math.PI * 1.4, true);
moonShape.holes.push(cutout);
const moon = new THREE.Mesh(new THREE.ExtrudeGeometry(moonShape, { depth: 0.18, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 64 }), gold);
moon.position.set(0.7, 0.15, 0); moon.rotation.z = -0.12; moonGroup.add(moon);

// Fine orbital rings give the centerpiece a floating, dimensional silhouette.
for (const [radius, tilt, material] of [[2.55, 0.28, darkGold], [2.9, -0.35, gold], [3.15, 0.68, darkGold]]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.009, 8, 220), material);
  ring.rotation.x = tilt; ring.rotation.y = 0.12; moonGroup.add(ring);
  animatedRings.push({ ring, tilt, speed: (radius - 2.7) * 0.035 });
}

// Small, patterned medallions orbit the crescent.
for (let i = 0; i < 8; i++) {
  const angle = i / 8 * Math.PI * 2;
  const ornament = new THREE.Group();
  const bead = new THREE.Mesh(new THREE.OctahedronGeometry(i % 2 ? 0.11 : 0.075, 0), i % 2 ? gold : darkGold);
  ornament.add(bead);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 48), darkGold);
  ornament.add(loop);
  ornament.position.set(Math.cos(angle) * 2.9, Math.sin(angle) * 2.9, 0.12);
  ornament.rotation.z = angle;
  moonGroup.add(ornament);
  animatedOrnaments.push({ ornament, angle, speed: i % 2 ? 0.12 : -0.09, radius: 2.9 });
}

// Dim stars in several depth layers create gentle parallax as the visitor drags.
const starCount = 380;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 25;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
  positions[i * 3 + 2] = -1 - Math.random() * 18;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#d8cfaa', size: 0.022, transparent: true, opacity: 0.72, sizeAttenuation: true }));
scene.add(stars);
const starPhases = Float32Array.from({ length: starCount }, () => Math.random() * Math.PI * 2);
const originalStarY = positions.filter((_, i) => i % 3 === 1);

// Hanging lanterns add a second layer of movement around the celestial centerpiece.
const lanterns = [];
function makeLantern(x, y, z, scale, phase) {
  const group = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({ color: '#c9a95f', metalness: 0.8, roughness: 0.28 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#9b7440', emissive: '#a26c2b', emissiveIntensity: 1.15, metalness: 0.18, roughness: 0.28, transparent: true, opacity: 0.72 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.38, 6, 1, true), glassMaterial);
  group.add(body);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.17, 6), frameMaterial);
  cap.position.y = 0.27; group.add(cap);
  const base = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.13, 6), frameMaterial);
  base.rotation.x = Math.PI; base.position.y = -0.25; group.add(base);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 24), frameMaterial);
  crown.position.y = 0.37; group.add(crown);
  const light = new THREE.PointLight('#ffc968', 1.7, 2.8, 2);
  light.position.y = -0.03; group.add(light);
  group.position.set(x, y, z); group.scale.setScalar(scale); scene.add(group);
  lanterns.push({ group, light, phase, baseY: y });
}
makeLantern(-4.1, 1.2, 1.1, 0.78, 0.3);
makeLantern(4.25, -0.7, -0.1, 0.62, 2.1);
makeLantern(-3.6, -2.5, -0.5, 0.48, 3.8);

// A subtle eight-point star medallion at the center of the orbital geometry.
const medallion = new THREE.Group();
for (let i = 0; i < 8; i++) {
  const ray = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 4), i % 2 ? darkGold : gold);
  ray.position.y = 0.48; ray.rotation.z = Math.PI; ray.rotation.z += i * Math.PI / 4;
  medallion.add(ray);
}
medallion.position.set(-2.25, -1.75, 0.45); medallion.scale.setScalar(0.65); moonGroup.add(medallion);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.045;
controls.enablePan = false; controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 2.8; controls.maxPolarAngle = Math.PI / 1.8;
controls.rotateSpeed = 0.38;
let pointerX = 0;
addEventListener('pointermove', (e) => { pointerX = (e.clientX / innerWidth - 0.5) * 0.16; });

// A lightweight custom cursor leaves a brief, fading sparkle trail.
const sparkCursor = document.querySelector('#sparkCursor');
let lastSparkAt = 0;
let touchHideTimer;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function emitSpark(x, y, burst = false) {
  const glyph = document.createElement('span');
  glyph.className = 'spark-trail';
  glyph.textContent = Math.random() > 0.45 ? '✦' : '✧';
  const angle = Math.random() * Math.PI * 2;
  const distance = burst ? 22 + Math.random() * 35 : 10 + Math.random() * 27;
  const duration = burst ? 650 + Math.random() * 300 : 450 + Math.random() * 450;
  const sparkX = Math.cos(angle) * distance;
  const sparkY = Math.sin(angle) * distance - 10;
  glyph.style.left = `${x}px`;
  glyph.style.top = `${y}px`;
  glyph.style.setProperty('--spark-x', `${sparkX}px`);
  glyph.style.setProperty('--spark-y', `${sparkY}px`);
  glyph.style.setProperty('--spark-mid-x', `${sparkX * 0.35}px`);
  glyph.style.setProperty('--spark-mid-y', `${sparkY * 0.35}px`);
  glyph.style.setProperty('--spark-size', `${7 + Math.random() * 9}px`);
  glyph.style.setProperty('--spark-duration', `${duration}ms`);
  document.body.appendChild(glyph);
  window.setTimeout(() => glyph.remove(), duration + 80);
}
window.addEventListener('pointermove', (event) => {
  sparkCursor.style.left = `${event.clientX}px`;
  sparkCursor.style.top = `${event.clientY}px`;
  sparkCursor.classList.add('is-visible');
  if (!reducedMotion.matches && event.timeStamp - lastSparkAt > 35) {
    emitSpark(event.clientX, event.clientY);
    lastSparkAt = event.timeStamp;
  }
  if (event.pointerType === 'touch') {
    window.clearTimeout(touchHideTimer);
    touchHideTimer = window.setTimeout(() => sparkCursor.classList.remove('is-visible'), 600);
  }
});
window.addEventListener('pointerdown', (event) => {
  sparkCursor.classList.add('is-burst');
  window.setTimeout(() => sparkCursor.classList.remove('is-burst'), 360);
  if (!reducedMotion.matches) for (let i = 0; i < 5; i++) emitSpark(event.clientX, event.clientY, true);
});
document.addEventListener('pointerleave', () => sparkCursor.classList.remove('is-visible'));
document.querySelectorAll('iframe').forEach((frame) => frame.addEventListener('pointerenter', () => sparkCursor.classList.remove('is-visible')));

const clock = new THREE.Clock();
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function animate() {
  const t = clock.getElapsedTime();
  const motion = motionPreference.matches ? 0.16 : 1;
  moonGroup.rotation.y = Math.sin(t * 0.18) * 0.14 * motion + pointerX;
  moonGroup.rotation.x = Math.sin(t * 0.24) * 0.035 * motion;
  moon.position.y = 0.15 + Math.sin(t * 0.7) * 0.075 * motion;
  moon.rotation.z = -0.12 + Math.sin(t * 0.24) * 0.025 * motion;
  animatedRings.forEach(({ ring, tilt, speed }, i) => {
    ring.rotation.x = tilt + Math.sin(t * (0.25 + i * 0.07)) * 0.055 * motion;
    ring.rotation.z = Math.sin(t * speed + i) * 0.13 * motion;
  });
  animatedOrnaments.forEach(({ ornament, angle, speed, radius }, i) => {
    const orbitAngle = angle + t * speed * motion;
    ornament.position.set(Math.cos(orbitAngle) * radius, Math.sin(orbitAngle) * radius, 0.12 + Math.sin(t + i) * 0.1 * motion);
    ornament.rotation.z = orbitAngle + Math.sin(t * 0.7 + i) * 0.18 * motion;
  });
  medallion.rotation.z = t * 0.12 * motion;
  stars.rotation.y = t * 0.012 * motion;
  const starPositions = starGeometry.attributes.position;
  for (let i = 0; i < starCount; i++) {
    starPositions.array[i * 3 + 1] = originalStarY[i] + Math.sin(t * 0.38 + starPhases[i]) * 0.11 * motion;
  }
  starPositions.needsUpdate = true;
  stars.material.opacity = 0.6 + Math.sin(t * 1.15) * 0.12 * motion;
  lanterns.forEach(({ group, light, phase, baseY }, i) => {
    group.rotation.z = Math.sin(t * 0.55 + phase) * 0.14 * motion;
    group.position.y = baseY + Math.sin(t * 0.65 + phase) * 0.11 * motion;
    light.intensity = 1.2 + (Math.sin(t * 2.4 + phase) + 1) * 0.45 * motion;
  });
  moonLight.intensity = 36 + Math.sin(t * 0.9) * 5 * motion;
  controls.update(); renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Stagger each invitation section into view as guests scroll down the page.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.verse-panel, .events > .section-label, .events > h2, .countdown, .event, .calendar-link, .blessing > *, .location > *, footer > *').forEach((element) => {
  element.classList.add('reveal');
  revealObserver.observe(element);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = innerWidth < 700 ? 11.8 : 9.3;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
});

const target = new Date('2027-01-17T12:00:00+05:30').getTime();
const pad = (n) => String(n).padStart(2, '0');
const count = (n) => new Intl.NumberFormat(document.documentElement.lang === 'ur' ? 'ur-PK' : document.documentElement.lang === 'hi' ? 'hi-IN' : 'en-US').format(n);
function updateCountdown() {
  const left = target - Date.now();
  if (left <= 0) { document.querySelector('.countdown').innerHTML = `<p class="time">${translations[document.documentElement.lang].countdownDone}</p>`; return; }
  document.querySelector('#days').textContent = count(Math.floor(left / 86400000));
  document.querySelector('#hours').textContent = count(Math.floor(left / 3600000) % 24).padStart(2, '0');
  document.querySelector('#minutes').textContent = count(Math.floor(left / 60000) % 60).padStart(2, '0');
  document.querySelector('#seconds').textContent = count(Math.floor(left / 1000) % 60).padStart(2, '0');
}
updateCountdown(); setInterval(updateCountdown, 1000);

const audio = document.querySelector('#naatAudio');
audio.src = naatUrl;
function setLanguage(language) {
  const lang = translations[language] ? language : 'en';
  const copy = translations[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  document.title = copy.pageTitle.replace('&amp;', '&');
  Object.keys(copy).forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.innerHTML = copy[id];
  });
  document.querySelectorAll('.language-select').forEach((select) => { select.value = lang; });
  document.querySelector('#openCard').setAttribute('aria-label', copy.openCardLabel);
  document.querySelector('#scene').setAttribute('aria-label', copy.canvasLabel);
  document.querySelector('.map iframe').title = copy.mapTitle;
  document.querySelector('#music').setAttribute('aria-label', audio.paused ? copy.musicPlay : copy.musicPause);
  setMusicPlaying(!audio.paused);
  updateCountdown();
}
document.querySelectorAll('.language-select').forEach((select) => select.addEventListener('change', () => setLanguage(select.value)));
setLanguage('en');

const gate = document.querySelector('#cardGate');
const openCard = document.querySelector('#openCard');
document.body.classList.add('card-locked');

function setMusicPlaying(playing) {
  const copy = translations[document.documentElement.lang] || translations.en;
  document.querySelector('#musicLabel').textContent = playing ? copy.musicPause : copy.musicPlay;
  document.querySelector('#musicIcon').textContent = playing ? '♫' : '♪';
  document.querySelector('#music').setAttribute('aria-label', playing ? copy.musicPause : copy.musicPlay);
}
audio.addEventListener('play', () => setMusicPlaying(true));
audio.addEventListener('pause', () => setMusicPlaying(false));

openCard.addEventListener('click', () => {
  if (gate.classList.contains('is-opening')) return;
  gate.classList.add('is-opening');
  openCard.setAttribute('aria-expanded', 'true');
  // The invitation tap also unlocks audio playback in browsers that require a gesture.
  audio.play().then(() => setMusicPlaying(true)).catch(() => {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const openDuration = reduceMotion ? 120 : 2850;
  window.setTimeout(() => {
    gate.classList.add('is-gone');
    document.body.classList.remove('card-locked');
  }, openDuration);
  window.setTimeout(() => gate.remove(), openDuration + 950);
});

document.querySelector('#music').addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); setMusicPlaying(true); }
    catch { document.querySelector('#musicLabel').textContent = translations[document.documentElement.lang].musicError; setTimeout(() => setMusicPlaying(false), 2200); }
  } else { audio.pause(); setMusicPlaying(false); }
});
