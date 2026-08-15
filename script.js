(() => {
  const stage=document.getElementById('stage');
  const progressBar=document.getElementById('progressBar'), progressText=document.getElementById('progressText');
  const chapter=document.getElementById('chapter'), hint=document.getElementById('hint');
  const loader=document.getElementById('loader');

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.1,100); camera.position.set(0,1.1,10);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15; stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcccccc,0x080808,1.3));
  const key=new THREE.DirectionalLight(0xffffff,4.2); key.position.set(4,6,6); scene.add(key);
  const rim=new THREE.PointLight(0x5f7fa0,18,15); rim.position.set(-5,3,2); scene.add(rim);
  const warm=new THREE.PointLight(0xd8a26a,11,12); warm.position.set(5,1,-3); scene.add(warm);

  const car=new THREE.Group(); scene.add(car); car.position.y=-.55;
  const paint=new THREE.MeshPhysicalMaterial({color:0x1c2228,metalness:.78,roughness:.16,clearcoat:1,clearcoatRoughness:.08});
  const glass=new THREE.MeshPhysicalMaterial({color:0x07090b,metalness:.1,roughness:.06,transmission:.18,transparent:true,opacity:.9,clearcoat:1});
  const black=new THREE.MeshStandardMaterial({color:0x030303,metalness:.85,roughness:.22});
  const lightMat=new THREE.MeshStandardMaterial({color:0xeaf5ff,emissive:0xbadfff,emissiveIntensity:7});
  const tireMat=new THREE.MeshStandardMaterial({color:0x030303,roughness:.72,metalness:.05});
  const metal=new THREE.MeshStandardMaterial({color:0x8f969d,metalness:1,roughness:.2});

  const box=(w,h,d,x,y,z,mat,rad=0)=>{const g=rad?new THREE.BoxGeometry(w,h,d,6,3,6):new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;return m};
  const body=box(5.8,.65,2.18,0,.35,0,paint); car.add(body);
  const hood=box(2.2,.28,2.02,-1.75,.72,0,paint); car.add(hood);
  const rear=box(1.65,.5,2.04,2.05,.62,0,paint); car.add(rear);
  const roof=new THREE.Mesh(new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),paint); roof.scale.set(2.05,.72,1.05); roof.position.set(.25,1.02,0); car.add(roof);
  const windshield=box(1.6,.5,1.86,.02,1.03,0,glass); windshield.rotation.z=-.05; car.add(windshield);
  const sideGlass=box(1.65,.45,.035,.45,1.02,1.01,glass); sideGlass.rotation.z=-.08; car.add(sideGlass); sideGlass=sideGlass.clone(); sideGlass.position.z=-1.01; car.add(sideGlass);
  const splitter=box(5.6,.1,2.25,-.05,.03,0,black); car.add(splitter);
  const side=box(5.4,.22,.08,0,.4,1.12,metal); car.add(side); car.add(side.clone().translateZ(-2.24));
  const frontBar=box(1.9,.06,.06,-2.92,.55,1.08,lightMat); car.add(frontBar); const frontBar2=frontBar.clone();frontBar2.position.z=-1.08;car.add(frontBar2);
  const grille=box(1.2,.18,.08,-2.93,.34,0,black); car.add(grille);
  const wheels=[];
  [-1.85,1.85].forEach(x=>[-1.14,1.14].forEach(z=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.28,40),tireMat);w.rotation.x=Math.PI/2;w.position.set(x,.02,z);car.add(w);wheels.push(w);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.3,32),metal);hub.rotation.x=Math.PI/2;hub.position.copy(w.position);car.add(hub)}));
  const under=box(4.8,.12,1.8,0,-.08,0,black);car.add(under);

  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x070707,metalness:.35,roughness:.35})); floor.rotation.x=-Math.PI/2;floor.position.y=-.62;scene.add(floor);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(18,3),new THREE.MeshBasicMaterial({color:0x24384c,transparent:true,opacity:.2}));glow.rotation.x=-Math.PI/2;glow.position.y=-.6;glow.position.z=1;scene.add(glow);

  const dustN=260, pos=new Float32Array(dustN*3); for(let i=0;i<dustN;i++){pos[i*3]=(Math.random()-.5)*14;pos[i*3+1]=Math.random()*4-1;pos[i*3+2]=(Math.random()-.5)*10-3} const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3)); const dust=new THREE.Points(pg,new THREE.PointsMaterial({color:0xb7c7d8,size:.018,transparent:true,opacity:.35}));scene.add(dust);

  let target=0,current=0,started=false;
  const clamp=v=>Math.max(0,Math.min(1,v));
  function setProgress(p){target=clamp(p);started=true;hint.style.opacity='0'}
  addEventListener('scroll',()=>{const r=document.querySelector('.reveal').getBoundingClientRect(); const p=clamp(-r.top/(r.height-innerHeight));setProgress(p)}, {passive:true});
  let drag=false,lastX=0;
  renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX});
  addEventListener('pointerup',()=>drag=false);
  addEventListener('pointermove',e=>{if(!drag)return;setProgress(target+(lastX-e.clientX)/innerWidth*.75);lastX=e.clientX;window.scrollTo(0,document.querySelector('.reveal').offsetTop+target*(document.querySelector('.reveal').offsetHeight-innerHeight))});

  function animate(){requestAnimationFrame(animate);current+=(target-current)*.075;const p=current;
    car.rotation.y=-.8+p*Math.PI*2.3; car.rotation.x=(.02+p*.035); car.position.y=-.55+Math.sin(p*Math.PI)*.22; car.scale.setScalar(.82+p*.22);
    camera.position.x=Math.sin(p*Math.PI*2.1)*1.9; camera.position.y=1.0+Math.sin(p*Math.PI)*.45; camera.position.z=10.2-p*4.5; camera.lookAt(0,.55,0);
    wheels.forEach(w=>w.rotation.z=p*5);
    glow.material.opacity=.08+p*.25; dust.rotation.y=p*.3;
    progressBar.style.width=(p*100)+'%';progressText.textContent=String(Math.round(p*100)).padStart(2,'0');
    const ch=p<.25?'01 / SILHOUETTE':p<.52?'02 / THE FORM':p<.76?'03 / LIGHT SIGNATURE':'04 / THE REVEAL';chapter.textContent=ch;
    document.querySelector('.spec-power').style.opacity=p>.42?.9:0;document.querySelector('.spec-speed').style.opacity=p>.58?.9:0;
    renderer.render(scene,camera);
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8))});
  setTimeout(()=>{document.querySelector('.loader-line i').classList.add('run')},80);setTimeout(()=>{loader.style.opacity='0';setTimeout(()=>loader.remove(),850)},1500);
  animate();
})();
