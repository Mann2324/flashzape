import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host=document.getElementById('webgl');
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x090908,.035);
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,100);
camera.position.set(0,.1,7.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9d0c2,0x050505,1.5));
const key=new THREE.DirectionalLight(0xfff0d0,5);key.position.set(3,5,5);scene.add(key);
const rim=new THREE.PointLight(0xbca37b,22,12);rim.position.set(-4,2,3);scene.add(rim);
const fill=new THREE.PointLight(0x6f8792,12,10);fill.position.set(4,-2,-2);scene.add(fill);

const bottle=new THREE.Group();scene.add(bottle);bottle.position.y=-.1;
const bodyMat=new THREE.MeshPhysicalMaterial({color:0x171714,metalness:.22,roughness:.2,clearcoat:1,clearcoatRoughness:.12});
const liquidMat=new THREE.MeshPhysicalMaterial({color:0x4b3821,metalness:.08,roughness:.2,transmission:.12,thickness:1.5,clearcoat:1,transparent:true,opacity:.82});
const metalMat=new THREE.MeshPhysicalMaterial({color:0x9b9280,metalness:.92,roughness:.2,clearcoat:1});
const labelMat=new THREE.MeshBasicMaterial({color:0xd9c6a0});

const body=new THREE.Mesh(new RoundedBoxGeometry(2.15,3.25,.95,8,.22),bodyMat);body.position.y=-.15;bottle.add(body);
const liquid=new THREE.Mesh(new RoundedBoxGeometry(1.82,2.7,.72,8,.18),liquidMat);liquid.position.y=-.38;bottle.add(liquid);
const shoulder=new THREE.Mesh(new RoundedBoxGeometry(1.28,.36,.7,6,.1),bodyMat);shoulder.position.y=1.56;bottle.add(shoulder);
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.48,48),metalMat);neck.position.y=1.93;bottle.add(neck);
const collar=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.11,48),metalMat);collar.position.y=1.72;bottle.add(collar);
const cap=new THREE.Group();bottle.add(cap);cap.position.y=2.48;
const capMesh=new THREE.Mesh(new RoundedBoxGeometry(.92,.9,.82,8,.12),metalMat);cap.add(capMesh);
const capTop=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.08,48),new THREE.MeshStandardMaterial({color:0x171715,metalness:.8,roughness:.16}));capTop.position.y=.47;cap.add(capTop);

// Minimal physical label plate.
const label=new THREE.Mesh(new RoundedBoxGeometry(1.45,.58,.025,4,.04),new THREE.MeshBasicMaterial({color:0x0b0b0a}));label.position.set(0,-.1,.49);bottle.add(label);

// Scent vapor particles.
const particleCount=420;const positions=new Float32Array(particleCount*3);const speeds=[];
for(let i=0;i<particleCount;i++){positions[i*3]=(Math.random()-.5)*1.8;positions[i*3+1]=1.85+Math.random()*2.5;positions[i*3+2]=(Math.random()-.5)*1.3;speeds.push(.15+Math.random()*.5)}
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const pMat=new THREE.PointsMaterial({color:0xd9c6a0,size:.026,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
const vapor=new THREE.Points(pGeo,pMat);scene.add(vapor);

// Fine mist burst used when the atomizer is pressed.
const mist=[];
function burst(){
  for(let i=0;i<80;i++){const g=new THREE.SphereGeometry(.012+Math.random()*.012,6,6);const m=new THREE.MeshBasicMaterial({color:0xd9c6a0,transparent:true,opacity:.65});const q=new THREE.Mesh(g,m);q.position.set(.03,2.08,.55);q.userData={life:1,vel:new THREE.Vector3(.12+Math.random()*.2,(Math.random()-.5)*.06,(Math.random()-.5)*.15)};scene.add(q);mist.push(q)}
  gsap.to(cap.position,{y:2.64,duration:.25,ease:'power2.out',yoyo:true,repeat:1});
}

let scrollState={rot:0,cap:0,bottleY:-.1,scale:1};
function setupScroll(){
  gsap.registerPlugin(ScrollTrigger);
  gsap.timeline({scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom bottom',scrub:1.15}})
    .to(scrollState,{rot:Math.PI*2.35,duration:.28,ease:'none'},0)
    .to(scrollState,{cap:1,duration:.12,ease:'power2.inOut'},.15)
    .to(scrollState,{bottleY:.35,scale:1.08,duration:.25,ease:'power2.inOut'},.24)
    .to(scrollState,{bottleY:-.15,scale:.86,duration:.25,ease:'power2.inOut'},.53)
    .to(scrollState,{rot:Math.PI*4.4,bottleY:0,scale:.98,duration:.32,ease:'power1.inOut'},.7)
    .to(scrollState,{cap:0,bottleY:-.05,scale:.82,duration:.18,ease:'power2.in'},.88);
  gsap.from('.hero-left',{opacity:0,y:35,duration:1.2,ease:'power3.out',delay:.5});
  gsap.from('.hero-right',{opacity:0,y:20,duration:1,ease:'power3.out',delay:.8});
  gsap.utils.toArray('.note-card,.story-text,.specs div').forEach(el=>gsap.from(el,{scrollTrigger:{trigger:el,start:'top 85%'},opacity:0,y:30,duration:.8,ease:'power3.out'}));
  gsap.from('.giant',{scrollTrigger:{trigger:'.giant',start:'top 80%'},x:-80,opacity:0,duration:1.2,ease:'power3.out'});
  gsap.from('.finale-word',{scrollTrigger:{trigger:'.finale',start:'top 80%'},scale:.7,opacity:0,duration:1.3,ease:'power3.out'});
}
setupScroll();

function animate(){requestAnimationFrame(animate);const t=performance.now()*.001;
  bottle.rotation.y=scrollState.rot+Math.sin(t*.55)*.035;bottle.rotation.x=Math.sin(t*.35)*.025;bottle.position.y=scrollState.bottleY;bottle.scale.setScalar(scrollState.scale);
  cap.position.y=2.48+scrollState.cap*.82;
  const pos=pGeo.attributes.position.array;
  for(let i=0;i<particleCount;i++){let y=pos[i*3+1];y+=speeds[i]*.003;if(y>5.1)y=1.8;pos[i*3+1]=y;pos[i*3]+=Math.sin(t+ i)*.0007}
  pGeo.attributes.position.needsUpdate=true;pMat.opacity=scrollState.cap*.25;
  mist.forEach((q,i)=>{q.position.addScaledVector(q.userData.vel,.035);q.userData.life-=.018;q.material.opacity=Math.max(0,q.userData.life*.55);q.scale.multiplyScalar(1.012);if(q.userData.life<=0){scene.remove(q)}});
  renderer.render(scene,camera);
}
animate();

const spray=document.getElementById('sprayBtn');spray.addEventListener('click',()=>{burst();gsap.fromTo(spray,{scale:1},{scale:1.05,duration:.12,yoyo:true,repeat:1})});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});

// Bag interaction.
let bagCount=0;const bag=document.getElementById('cart'),backdrop=document.getElementById('cartBackdrop');
function openBag(){bag.classList.add('open');backdrop.classList.add('open');bag.setAttribute('aria-hidden','false')}
function closeBag(){bag.classList.remove('open');backdrop.classList.remove('open');bag.setAttribute('aria-hidden','true')}
document.getElementById('bagBtn').onclick=openBag;document.getElementById('cartClose').onclick=closeBag;backdrop.onclick=closeBag;
document.getElementById('buyBtn').onclick=()=>{bagCount=1;document.getElementById('bagCount').textContent=bagCount;document.getElementById('cartTotal').textContent='₹8,900';openBag()};

window.addEventListener('load',()=>{setTimeout(()=>{const l=document.getElementById('loader');l.style.opacity='0';setTimeout(()=>l.remove(),1000)},900)});
