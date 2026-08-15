const host = document.getElementById('webgl');

if (host && window.THREE) {
  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090908, 0.035);
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0.15, 7.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd9d0c2, 0x050505, 1.5));
  const key = new THREE.DirectionalLight(0xfff0d0, 5); key.position.set(3, 5, 5); scene.add(key);
  const rim = new THREE.PointLight(0xbca37b, 22, 12); rim.position.set(-4, 2, 3); scene.add(rim);
  const fill = new THREE.PointLight(0x6f8792, 12, 10); fill.position.set(4, -2, -2); scene.add(fill);

  const bottle = new THREE.Group();
  scene.add(bottle);
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x171714, metalness: .22, roughness: .2, clearcoat: 1, clearcoatRoughness: .12 });
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x4b3821, metalness: .08, roughness: .2, transmission: .12, thickness: 1.5, clearcoat: 1, transparent: true, opacity: .82 });
  const metalMat = new THREE.MeshPhysicalMaterial({ color: 0x9b9280, metalness: .92, roughness: .2, clearcoat: 1 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 3.25, .95), bodyMat);
  body.position.y = -.15; bottle.add(body);
  const liquid = new THREE.Mesh(new THREE.BoxGeometry(1.82, 2.7, .72), liquidMat);
  liquid.position.y = -.38; bottle.add(liquid);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.28, .36, .7), bodyMat);
  shoulder.position.y = 1.56; bottle.add(shoulder);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .48, 48), metalMat);
  neck.position.y = 1.93; bottle.add(neck);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.49, .49, .11, 48), metalMat);
  collar.position.y = 1.72; bottle.add(collar);

  const cap = new THREE.Group();
  bottle.add(cap); cap.position.y = 2.48;
  const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .9, 48), metalMat);
  cap.add(capMesh);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .08, 48), new THREE.MeshStandardMaterial({ color: 0x171715, metalness: .8, roughness: .16 }));
  capTop.position.y = .49; cap.add(capTop);

  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .58), new THREE.MeshBasicMaterial({ color: 0x0b0b0a }));
  label.position.set(0, -.1, .49); bottle.add(label);

  // A lightweight scent trail visible during the opening sequence.
  const particleCount = 320;
  const positions = new Float32Array(particleCount * 3);
  const speeds = [];
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - .5) * 1.8;
    positions[i * 3 + 1] = 1.85 + Math.random() * 2.5;
    positions[i * 3 + 2] = (Math.random() - .5) * 1.3;
    speeds.push(.15 + Math.random() * .5);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xd9c6a0, size: .026, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(pGeo, pMat));

  const state = { rot: 0, cap: 0, y: -.1, scale: 1 };
  const tl = window.gsap && window.ScrollTrigger ? gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 1 } }) : null;
  if (tl) {
    gsap.registerPlugin(ScrollTrigger);
    tl.to(state, { rot: Math.PI * 2.2, duration: .28, ease: 'none' }, 0)
      .to(state, { cap: 1, duration: .13, ease: 'power2.inOut' }, .15)
      .to(state, { y: .35, scale: 1.08, duration: .25, ease: 'power2.inOut' }, .25)
      .to(state, { y: -.15, scale: .86, duration: .25, ease: 'power2.inOut' }, .53)
      .to(state, { rot: Math.PI * 4.2, y: 0, scale: .98, duration: .32, ease: 'power1.inOut' }, .70)
      .to(state, { cap: 0, y: -.05, scale: .82, duration: .18, ease: 'power2.in' }, .88);
  }

  function burst() {
    for (let i = 0; i < 55; i++) {
      const q = new THREE.Mesh(new THREE.SphereGeometry(.012 + Math.random() * .018, 6, 6), new THREE.MeshBasicMaterial({ color: 0xd9c6a0, transparent: true, opacity: .7 }));
      q.position.set(.03, 2.08, .55);
      q.userData = { life: 1, vel: new THREE.Vector3(.12 + Math.random() * .2, (Math.random() - .5) * .06, (Math.random() - .5) * .15) };
      scene.add(q);
      setTimeout(() => { scene.remove(q); q.geometry.dispose(); q.material.dispose(); }, 900);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() * .001;
    bottle.rotation.y = state.rot + Math.sin(t * .55) * .035;
    bottle.rotation.x = Math.sin(t * .35) * .025;
    bottle.position.y = state.y;
    bottle.scale.setScalar(state.scale);
    cap.position.y = 2.48 + state.cap * .82;
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += speeds[i] * .003;
      if (pos[i * 3 + 1] > 5.1) pos[i * 3 + 1] = 1.8;
      pos[i * 3] += Math.sin(t + i) * .0007;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = state.cap * .22;
    renderer.render(scene, camera);
  }
  animate();

  document.getElementById('sprayBtn')?.addEventListener('click', () => {
    burst();
    gsap?.fromTo('#sprayBtn', { scale: 1 }, { scale: 1.05, duration: .12, yoyo: true, repeat: 1 });
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  });
}

// Bag interaction.
let bagCount = 0;
const bag = document.getElementById('cart');
const backdrop = document.getElementById('cartBackdrop');
const openBag = () => { bag?.classList.add('open'); backdrop?.classList.add('open'); bag?.setAttribute('aria-hidden', 'false'); };
const closeBag = () => { bag?.classList.remove('open'); backdrop?.classList.remove('open'); bag?.setAttribute('aria-hidden', 'true'); };
document.getElementById('bagBtn')?.addEventListener('click', openBag);
document.getElementById('cartClose')?.addEventListener('click', closeBag);
backdrop?.addEventListener('click', closeBag);
document.getElementById('buyBtn')?.addEventListener('click', () => { bagCount = 1; document.getElementById('bagCount').textContent = bagCount; document.getElementById('cartTotal').textContent = '₹8,900'; openBag(); });

window.addEventListener('load', () => setTimeout(() => { const l = document.getElementById('loader'); if (l) { l.style.opacity = '0'; setTimeout(() => l.remove(), 900); } }, 800));
