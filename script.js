import * as THREE from 'three';

const sceneEl=document.querySelector('#scene');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,sceneEl.clientWidth/sceneEl.clientHeight,.1,100);
camera.position.set(0,0.25,6.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(sceneEl.clientWidth,sceneEl.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
sceneEl.appendChild(renderer.domElement);

const group=new THREE.Group();
scene.add(group);
const gold=new THREE.MeshPhysicalMaterial({color:0x8e6b3d,metalness:.72,roughness:.22,clearcoat:1,clearcoatRoughness:.15});
const darkGlass=new THREE.MeshPhysicalMaterial({color:0x17120d,metalness:.12,roughness:.12,transmission:.25,transparent:true,opacity:.94,clearcoat:1});
const labelMat=new THREE.MeshStandardMaterial({color:0xd4b276,metalness:.35,roughness:.3});
const bottle=new THREE.Mesh(new THREE.BoxGeometry(1.72,2.55,.9,8,8,8),darkGlass);bottle.position.y=-.35;group.add(bottle);
const shoulders=new THREE.Mesh(new THREE.CylinderGeometry(.86,.86,.3,64),darkGlass);shoulders.position.y=.98;group.add(shoulders);
const neck=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.48,48),gold);neck.position.y=1.35;group.add(neck);
const cap=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.62,6,6,6),gold);cap.position.y=1.9;group.add(cap);
const label=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.62),labelMat);label.position.set(0,-.34,.47);group.add(label);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,12,80),new THREE.MeshBasicMaterial({color:0xb88d51,transparent:true,opacity:.55}));ring.rotation.x=Math.PI/2;ring.position.y=-1.55;group.add(ring);
scene.add(new THREE.HemisphereLight(0xe7d8bb,0x080604,2.3));
const key=new THREE.DirectionalLight(0xffdca4,5);key.position.set(3,4,5);scene.add(key);
const rim=new THREE.PointLight(0x8d5c2d,14,8);rim.position.set(-3,1,2);scene.add(rim);

let targetX=0,targetY=0,mouseX=0,mouseY=0;
window.addEventListener('pointermove',e=>{mouseX=(e.clientX/innerWidth-.5);mouseY=(e.clientY/innerHeight-.5);targetX=mouseX*.45;targetY=mouseY*.25});
function resize(){const w=sceneEl.clientWidth,h=sceneEl.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}
window.addEventListener('resize',resize);
function animate(){requestAnimationFrame(animate);group.rotation.y+=(targetX-group.rotation.y)*.035;group.rotation.x+=(-targetY-group.rotation.x)*.035;group.position.y=Math.sin(Date.now()*.001)*.035;ring.rotation.z+=.008;renderer.render(scene,camera)}animate();

let count=0;const countEl=document.querySelector('#bagCount');const toast=document.querySelector('#toast');
document.querySelectorAll('.add').forEach(btn=>btn.addEventListener('click',()=>{count++;countEl.textContent=count;toast.textContent=`${btn.closest('.product').dataset.name} added to your bag.`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}));

const modal=document.querySelector('#modal');document.querySelector('#discoverBtn').onclick=()=>modal.classList.add('open');document.querySelector('#closeModal').onclick=()=>modal.classList.remove('open');modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.querySelectorAll('.choices button').forEach(btn=>btn.onclick=()=>{document.querySelector('#result').textContent=`Your signature: ${btn.dataset.scent}. We think it will become the scent people remember you by.`});
document.querySelector('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();toast.textContent='Welcome to the house of NOIRÉ.';toast.classList.add('show');e.target.reset();setTimeout(()=>toast.classList.remove('show'),2500)});
