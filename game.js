import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const $=s=>document.querySelector(s);
const canvas=$("#world");
let renderer,scene,camera,clock,started=false;
const keys={};
const state={items:[],flags:{},player:{x:0,z:34},energy:100};
const world={size:180};
const buildings=[
 {id:"cafe",name:"NET CAFE",x:-58,z:-48,w:30,d:22,h:10,color:0x173847},
 {id:"radio",name:"COAST FM",x:5,z:-58,w:26,d:20,h:9,color:0x293a3d},
 {id:"arcade",name:"ARCADE",x:57,z:-45,w:30,d:21,h:9,color:0x35283e},
 {id:"cinema",name:"CINEMA",x:-58,z:48,w:36,d:23,h:10,color:0x40332d},
 {id:"house",name:"HOUSE 17",x:57,z:48,w:30,d:24,h:9,color:0x29382e}
];
const objects=[
 {x:-25,z:-5,type:"car",label:"ABANDONED TAXI"},
 {x:0,z:8,type:"bus",label:"NIGHT BUS"},
 {x:28,z:5,type:"vending",label:"VENDING MACHINE"},
 {x:-25,z:25,type:"phone",label:"PAYPHONE"},
 {x:72,z:8,type:"dumpster",label:"DUMPSTER"},
 {x:-2,z:-31,type:"bench",label:"BUS STOP"},
 {x:23,z:57,type:"bike",label:"BICYCLE"},
 {x:-43,z:12,type:"poster",label:"MISSING POSTER"}
];
const npcs=[
 {x:-35,z:-7,name:"THE MAN",color:0x263b4b,skin:0xa97863,speed:.7,phase:0},
 {x:18,z:19,name:"THE GIRL",color:0x45364b,skin:0x9b705d,speed:.55,phase:2},
 {x:35,z:-10,name:"DELIVERY BOY",color:0x304a3e,skin:0xa77c67,speed:.8,phase:4},
 {x:70,z:28,name:"STRANGER",color:0x4a302c,skin:0x9b705d,speed:.45,phase:1}
];
const solids=buildings.map(b=>({x:b.x,z:b.z,w:b.w,d:b.d}));

function load(){try{const s=JSON.parse(localStorage.getItem("dgt-save")||"null");if(s)Object.assign(state,s)}catch{}}
function save(){localStorage.setItem("dgt-save",JSON.stringify(state))}
function objective(v){$("#objective").textContent="OBJECTIVE: "+v}
function toast(v){const e=$("#toast");e.textContent=v;e.classList.add("toastshow");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("toastshow"),2200)}
function addItem(v){if(!state.items.includes(v)){state.items.push(v);$("#items").innerHTML=state.items.map(x=>'<span class="item">'+x+"</span>").join("");save();toast("ACQUIRED // "+v)}}

function mat(c,rough=.8,metal=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal})}
function box(w,h,d,c){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c))}
function cyl(r,h,c,seg=12){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat(c))}
function label(text,color="#bcecff",size=0.8){
 const cv=document.createElement("canvas"),cx=cv.getContext("2d");cv.width=512;cv.height=96;
 cx.fillStyle="rgba(2,7,10,.82)";cx.fillRect(0,0,512,96);cx.strokeStyle="#294b5b";cx.strokeRect(2,2,508,92);
 cx.font="700 28px monospace";cx.fillStyle=color;cx.textAlign="center";cx.textBaseline="middle";cx.fillText(text,256,48);
 const tex=new THREE.CanvasTexture(cv);const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});const s=new THREE.Sprite(m);s.scale.set(size*5,size,1);return s;
}
function addBuilding(b){
 const g=new THREE.Group();g.position.set(b.x,0,b.z);
 const body=box(b.w,b.h,b.d,b.color);body.position.y=b.h/2;g.add(body);
 const roof=box(b.w+1.5,.7,b.d+1.5,0x11191d);roof.position.y=b.h+.35;g.add(roof);
 const door=box(3.4,5,.35,0x06090b);door.position.set(0,2.5,b.d/2+.2);g.add(door);
 for(let x=-1;x<=1;x++){for(let y=0;y<2;y++){const win=box(3.5,2.8,.22,0x78d9ee);win.material.emissive=new THREE.Color(0x1c6b83);win.material.emissiveIntensity=.65;win.position.set(x*(b.w/3),b.h-2.4-y*3.6,b.d/2+.18);g.add(win)}}
 const sign=label(b.name);sign.position.set(0,b.h+2.1,0);g.add(sign);
 scene.add(g);
}
function addStreet(){
 const road=mat(0x11191d);
 const a=box(world.size,0.08,18,road);a.position.y=.04;scene.add(a);
 const b=box(18,.08,world.size,road);b.position.y=.045;scene.add(b);
 const line=mat(0xc3b68a);
 for(let x=-90;x<90;x+=10){const m=box(5,.09,.12,line);m.position.set(x,.11,0);scene.add(m)}
 for(let z=-90;z<90;z+=10){const m=box(.12,.09,5,line);m.position.set(0,.11,z);scene.add(m)}
}
function addLamp(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);const pole=cyl(.09,5.5,0x33444b,8);pole.position.y=2.75;g.add(pole);
 const arm=box(1.4,.09,.09,0x33444b);arm.position.set(.55,5.2,0);g.add(arm);
 const bulb=cyl(.22,.22,0x9feeff,12);bulb.position.set(1.1,5.05,0);g.add(bulb);
 const light=new THREE.PointLight(0x72dfff,7,14,2);light.position.set(1.1,5,0);g.add(light);scene.add(g);
}
function addObject(o){
 const g=new THREE.Group();g.position.set(o.x,0,o.z);g.userData=o;
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(2.2,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.38,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.06;g.add(shadow);
 if(o.type==="car"){const body=box(5,1.3,2.5,0x263b43);body.position.y=1;g.add(body);const top=box(2.8,.8,2.1,0x0e171b);top.position.y=1.8;g.add(top);[-1,1].forEach(x=>[-.8,.8].forEach(z=>{const w=cyl(.42,.3,0x07090a,12);w.rotation.z=Math.PI/2;w.position.set(x*2.1,.5,z);g.add(w)}))}
 else if(o.type==="bus"){const body=box(7,2.8,2.7,0x344b50);body.position.y=1.8;g.add(body);for(let x=-2.5;x<=2.5;x+=1.3){const w=box(.9,1.1,2.82,0x101b20);w.position.set(x,2.1,0);g.add(w)}}
 else if(o.type==="vending"){const body=box(1.5,3.4,1,0x245267);body.position.y=1.7;g.add(body);const glow=box(1.1,1.4,.05,0x69ddff);glow.material.emissive=new THREE.Color(0x39bce6);glow.material.emissiveIntensity=1.5;glow.position.set(0,2,-.53);g.add(glow)}
 else if(o.type==="phone"){const pole=cyl(.1,3.5,0x3d5158,8);pole.position.y=1.75;g.add(pole);const top=box(.9,1,.55,0x4c6770);top.position.y=3.35;g.add(top)}
 else if(o.type==="dumpster"){const d=box(4,1.6,2,0x294239);d.position.y=.8;g.add(d)}
 else if(o.type==="bench"){const seat=box(3.2,.25,.7,0x704f37);seat.position.y=1;g.add(seat);for(const x of[-1.2,1.2]){const leg=box(.18,1.2,.5,0x3d2c22);leg.position.set(x,.5,0);g.add(leg)}}
 else if(o.type==="bike"){for(const x of[-.9,.9]){const w=new THREE.Mesh(new THREE.TorusGeometry(.55,.06,8,18),mat(0x82aab2));w.rotation.x=Math.PI/2;w.position.set(x,.65,0);g.add(w)}const frame=box(1.7,.08,.08,0x82aab2);frame.position.y=1.05;g.add(frame)}
 else {const p=box(2.8,2.2,.12,0x8b3038);p.position.y=1.1;g.add(p);const s=label("MISSING", "#ffe2d5", .55);s.position.set(0,1.2,-.15);g.add(s)}
 const tag=label(o.label,"#8de6ff",.42);tag.position.y=3.7;g.add(tag);scene.add(g);
}
function makeCharacter(n,isPlayer=false){
 const g=new THREE.Group();g.position.set(n.x,0,n.z);g.userData.n=n;
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.8,18),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.45,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;g.add(shadow);
 const legs=new THREE.Group();for(const x of[-.22,.22]){const leg=box(.25,.9,.25,0x111820);leg.position.set(x,.45,0);legs.add(leg)}g.add(legs);g.userData.legs=legs;
 const torso=box(.9,1.35,.55,isPlayer?0x0c3448:n.color);torso.position.y=1.55;g.add(torso);
 const head=cyl(.38,.72,n.skin,16);head.position.y=2.55;g.add(head);
 const hair=cyl(.41,.28,0x101214,16);hair.position.y=2.9;g.add(hair);
 const eye1=box(.07,.06,.04,0x9deeff),eye2=eye1.clone();eye1.position.set(-.13,2.58,.36);eye2.position.set(.13,2.58,.36);g.add(eye1,eye2);
 if(isPlayer){const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.025,6,32),new THREE.MeshBasicMaterial({color:0x67dcff,transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring)}
 scene.add(g);return g;
}
function addRain(){
 const n=700,geo=new THREE.BufferGeometry(),p=new Float32Array(n*3);
 for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*world.size;p[i*3+1]=Math.random()*18;p[i*3+2]=(Math.random()-.5)*world.size}
 geo.setAttribute("position",new THREE.BufferAttribute(p,3));const m=new THREE.PointsMaterial({color:0x83dfff,size:.075,transparent:true,opacity:.7});scene.add(new THREE.Points(geo,m));
}
function setup(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x02070b);scene.fog=new THREE.FogExp2(0x061016,.012);
 camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,300);
 clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0x6ca1bd,0x071014,1.4));
 const moon=new THREE.DirectionalLight(0x8ccfff,2.1);moon.position.set(-40,70,-50);moon.castShadow=true;scene.add(moon);
 const ground=box(world.size,.15,world.size,0x071015);ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
 addStreet();[[-82,-82],[82,-82],[-82,82],[82,82],[-10,-40],[35,38]].forEach(p=>addLamp(p[0],p[1]));
 buildings.forEach(addBuilding);objects.forEach(addObject);addRain();
 const playerObj=makeCharacter({x:state.player.x,z:state.player.z},true);playerObj.userData.isPlayer=true;
 window.playerObj=playerObj;
 npcs.forEach(n=>{n.homeX=n.x;n.homeZ=n.z;n.targetX=n.x;n.targetZ=n.z;n.obj=makeCharacter(n)});
 window.addEventListener("resize",resize);
}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
function blocked(x,z){for(const b of solids){if(x>b.x-b.w/2-1&&x<b.x+b.w/2+1&&z>b.z-b.d/2-1&&z<b.z+b.d/2+1)return true}return false}
function move(dt){
 if($("#panel").classList.contains("open"))return;
 let x=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),z=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
 if(!x&&!z)return;
 const len=Math.hypot(x,z);x/=len;z/=len;const speed=7.2, nx=state.player.x+x*speed*dt,nz=state.player.z+z*speed*dt;
 if(Math.abs(nx)<world.size/2-3&&!blocked(nx,state.player.z))state.player.x=nx;
 if(Math.abs(nz)<world.size/2-3&&!blocked(state.player.x,nz))state.player.z=nz;
 playerObj.userData.moving=true;playerObj.rotation.y=Math.atan2(x,z);
}
function nearest(){
 let best=null,dist=3.6;
 for(const b of buildings){const d=Math.hypot(state.player.x-b.x,state.player.z-b.z);if(d<Math.max(b.w,b.d)/2+3&&d<dist+5){dist=d;best={kind:"place",id:b.id,name:b.name}}}
 for(const o of objects){const d=Math.hypot(state.player.x-o.x,state.player.z-o.z);if(d<dist){dist=d;best={kind:"object",obj:o,name:o.label}}}
 return best;
}
function interactPlace(id){
 if(id==="cafe"){addItem("BLACK KEY");objective("FIND THE BRASS TOKEN");panel("THE GHOST DIRECTORY","NET CAFE / NODE 17",`CRT STATUS: ONLINE\nUSER: GHOST_17\n\n"IF YOU FOUND THIS, THE TOWN IS STILL RUNNING."\n\nA black key was hidden beneath the desk.`)}
 else if(id==="arcade"){panel("CABINET 04","ARCADE / POWER GRID","HIGH SCORE: 0317\nPLAYER: UNKNOWN\n\nThe machine accepts one code.",true);setTimeout(()=>{const a=$("#action");if(a)a.onclick=()=>{const c=$("#code");if(c&&c.value==="0317"){addItem("BRASS TOKEN");objective("RETURN TO HOUSE 17");panel("ACCESS GRANTED","ARCADE / CABINET 04","A brass token drops from the machine.\n\n17 / 08 / 14")}else toast("ACCESS DENIED")}},0)}
 else if(id==="radio"){toast("STATIC // HOUSE 17");objective("CHECK THE CINEMA")}
 else if(id==="cinema"){addItem("FILM TICKET");objective("OPEN HOUSE 17");panel("SEAT 17","CINEMA / SCREEN 02","FRAME 001 — OLD COAST ROAD\nFRAME 002 — NET CAFE\nFRAME 003 — YOU\n\nThe projector knows where you are.")}
 else if(id==="house"){if(state.items.includes("BLACK KEY")&&state.items.includes("BRASS TOKEN"))panel("THE DOOR OPENS","HOUSE 17 / ENTRY","WELCOME BACK, GHOST_17.\n\nENDING 01\nTHE TOWN IS STILL ONLINE.");else toast("THE DOOR REQUIRES THE KEY + TOKEN")}
}
function useObject(o){state.flags[o.type]=true;save();if(o.type==="phone"){panel("PAYPHONE","OLD COAST ROAD","LINE 03\n\n...ring...\n\nYOU SHOULD NOT BE HERE.\n\nThe line goes dead.");objective("FIND HOUSE 17")}else if(o.type==="vending"){addItem("OLD TOKEN")}else if(o.type==="car"){toast("THE TAXI RADIO IS STILL PLAYING");objective("FOLLOW THE RADIO SIGNAL")}else if(o.type==="poster"){panel("MISSING","WALL POSTER","MISSING\n\nGHOST_17\nLAST SEEN: 03:17\n\nThe photograph looks exactly like you.")}else toast(o.label+" // NOTHING HAPPENS")}
function panel(title,sub,body,code=false){$("#panelContent").innerHTML='<div class="loc">'+sub+'</div><div class="panel-title">'+title+'</div><div class="terminal">'+body.replace(/\n/g,"<br>")+'</div>'+(code?'<input id="code" class="input" maxlength="4" inputmode="numeric" placeholder="ENTER CODE"><button class="action" id="action">UNLOCK CABINET</button>':"");$("#panel").classList.add("open")}
function updateNPC(n,t){if(Math.hypot(n.targetX-n.x,n.targetZ-n.z)<1){n.targetX=n.homeX+(Math.random()-.5)*18;n.targetZ=n.homeZ+(Math.random()-.5)*18}const a=Math.atan2(n.targetX-n.x,n.targetZ-n.z);n.x+=Math.sin(a)*n.speed*.016;n.z+=Math.cos(a)*n.speed*.016;n.obj.position.set(n.x,0,n.z);n.obj.rotation.y=a;n.obj.userData.legs.rotation.z=Math.sin(t*7+n.phase)*.18}
function loop(){
 const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 move(dt);
 if(playerObj){playerObj.position.set(state.player.x,0,state.player.z);playerObj.userData.legs.rotation.z=Math.sin(t*9)*.15}
 npcs.forEach(n=>updateNPC(n,t));
 const target=new THREE.Vector3(state.player.x,1.7,state.player.z);
 const camPos=new THREE.Vector3(state.player.x,8.5,state.player.z+10.5);camera.position.lerp(camPos,.09);camera.lookAt(target);
 const n=nearest();if(n){$("#interact").textContent="E / "+n.name;$("#interact").classList.add("show");$("#location").textContent=n.name}else{$("#interact").classList.remove("show");$("#location").textContent="OLD COAST ROAD"}
 renderer.render(scene,camera);requestAnimationFrame(loop);
}
function start(){if(started)return;started=true;$("#boot").style.opacity="0";setTimeout(()=>$("#boot").remove(),650);$("#game").hidden=false;load();$("#items").innerHTML=state.items.map(x=>'<span class="item">'+x+"</span>").join("");setup();toast("WEBGL WORLD ONLINE // 03:17");loop()}
$("#startBtn").addEventListener("click",start,{once:true});
$("#startBtn").addEventListener("touchend",e=>{e.preventDefault();start()},{once:true});
$("#closePanel").onclick=()=>$("#panel").classList.remove("open");
window.addEventListener("keydown",e=>{keys[e.key]=true;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key==="e"||e.key==="E"||e.key==="Enter"){const n=nearest();if(n)n.kind==="place"?interactPlace(n.id):useObject(n.obj)}if(e.key==="Escape")$("#panel").classList.remove("open")});
window.addEventListener("keyup",e=>keys[e.key]=false);
document.querySelectorAll("#controls button").forEach(b=>{const k=b.dataset.key;const map={up:"w",down:"s",left:"a",right:"d"};const on=e=>{e.preventDefault();keys[map[k]]=true};const off=e=>{e.preventDefault();keys[map[k]]=false};b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off)});
load();