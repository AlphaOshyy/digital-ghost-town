const state={items:[],flags:{cafe:false,radio:false,arcade:false,cinema:false,house:false},sound:false,player:{x:50,y:82}};
const $=s=>document.querySelector(s);
const panel=$("#panel"),content=$("#panelContent"),toast=$("#toast"),items=$("#items"),town=$("#town"),objective=$("#objective");
let started=false,moveTimer=null;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function save(){localStorage.setItem("dgt-save",JSON.stringify(state))}
function load(){try{const s=JSON.parse(localStorage.getItem("dgt-save")||"null");if(s)Object.assign(state,s)}catch(e){localStorage.removeItem("dgt-save")}}
function notify(t){toast.textContent=t;toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
function addItem(name){if(!state.items.includes(name)){state.items.push(name);renderItems();save();notify("ITEM ACQUIRED: "+name)}}
function renderItems(){items.innerHTML=state.items.map(x=>'<span class="item">'+x+"</span>").join("")}
function openPanel(html){content.innerHTML=html;panel.classList.add("open");panel.setAttribute("aria-hidden","false")}
function closePanel(){panel.classList.remove("open");panel.setAttribute("aria-hidden","true")}
function setObjective(t){objective.textContent="OBJECTIVE: "+t}
function updatePlayer(){let p=$("#player");if(!p){p=document.createElement("div");p.id="player";p.className="player";town.appendChild(p)}p.style.left=state.player.x+"%";p.style.top=state.player.y+"%";highlightNearby()}
function highlightNearby(){document.querySelectorAll(".building").forEach(b=>{const r=b.getBoundingClientRect(),tr=town.getBoundingClientRect(),bx=((r.left+r.width/2-tr.left)/tr.width)*100,by=((r.top+r.height/2-tr.top)/tr.height)*100;const d=Math.hypot(bx-state.player.x,by-state.player.y);b.classList.toggle("near",d<15)})}
function move(dx,dy){if(!started||panel.classList.contains("open"))return;state.player.x=clamp(state.player.x+dx,5,95);state.player.y=clamp(state.player.y+dy,12,91);updatePlayer();save()}
function visit(loc){
 state.flags[loc]=true;save();
 const views={
 cafe:{title:"OLD NET CAFE",sub:"LOCATION 01 / TERMINAL ROOM",html:`<div class="terminal">NET CAFE // NODE 17
STATUS: OFFLINE
LAST USER: UNKNOWN
LAST LOGIN: 2014-08-17 03:17

A CRT monitor flickers.

A single directory remains.

> /ghost
> /messages
> /system

The keyboard still has power.</div><button class="action" id="ghost">OPEN /GHOST</button><button class="action" id="msg">READ LAST MESSAGE</button>`},
 arcade:{title:"ABANDONED ARCADE",sub:"LOCATION 02 / POWER GRID",html:`<div class="terminal">ARCADE CONTROL
CABINET 04: ONLINE
CABINET 05: ONLINE
CABINET 06: UNKNOWN

One machine is running.

Its screen shows a single prompt:

ENTER THE FOUR DIGIT CODE.</div><input id="code" class="input" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="ENTER CODE"><button class="action" id="unlock">SUBMIT CODE</button>`},
 radio:{title:"DEAD RADIO STATION",sub:"LOCATION 03 / BROADCAST ROOM",html:`<div class="terminal">COAST FM 91.7
BROADCAST: TERMINATED

The transmitter hums.

You turn the dial.

A voice breaks through the static.

"Do not go to House 17."

The transmission repeats every 17 seconds.</div><button class="action" id="listen">LISTEN AGAIN</button>`},
 cinema:{title:"EMPTY CINEMA",sub:"LOCATION 04 / SCREEN 02",html:`<div class="terminal">SCREEN 02

NO AUDIENCE
NO STAFF
NO FILM

A projector starts by itself.

Frame 001:
A street.

Frame 002:
The net cafe.

Frame 003:
You.

The image stops.</div><button class="action" id="ticket">CHECK THE SEAT</button>`},
 house:{title:"HOUSE 17",sub:"LOCATION 05 / PRIVATE RESIDENCE",html:`<div class="terminal">HOUSE 17
DOOR LOCK: ACTIVE

A small metal plate beside the door reads:

"THE TOWN REMEMBERS."

There is a slot underneath.

Something is missing.</div><button class="action" id="door">TRY THE DOOR</button>`}
 };
 const v=views[loc];openPanel('<div class="loc">'+v.sub+'</div><h1>'+v.title+"</h1>"+v.html);bind(loc)
}
function bind(loc){
 if(loc==="cafe"){
  $("#ghost").onclick=()=>{addItem("BLACK KEY");setObjective("FIND THE BRASS TOKEN");openPanel('<div class="loc">NET CAFE / GHOST DIRECTORY</div><h1>/GHOST</h1><div class="terminal">USER: GHOST_17\nMESSAGE COUNT: 1\n\n"IF YOU FOUND THIS, THE TOWN IS STILL RUNNING."\n\nA key has been taped under the desk.</div>')}
  $("#msg").onclick=()=>openPanel('<div class="loc">NET CAFE / LAST MESSAGE</div><h1>03:17</h1><div class="terminal">"I LEFT THE RADIO ON.\nIF IT CALLS YOUR NAME,\nDO NOT ANSWER."</div>')
 }
 if(loc==="arcade")$("#unlock").onclick=()=>{if($("#code").value==="0317"){addItem("BRASS TOKEN");setObjective("RETURN TO HOUSE 17");openPanel('<div class="loc">ARCADE / CABINET 04</div><h1>ACCESS GRANTED</h1><div class="terminal">CABINET 04 UNLOCKED.\n\nA brass token falls from the machine.\n\nThe back of it says:\n\n17 / 08 / 14</div>')}else notify("ACCESS DENIED")}
 if(loc==="radio")$("#listen").onclick=()=>notify("STATIC: HOUSE 17... HOUSE 17... HOUSE 17...")
 if(loc==="cinema")$("#ticket").onclick=()=>{addItem("FILM TICKET");setObjective("CHECK THE RADIO SIGNAL");openPanel('<div class="loc">CINEMA / SEAT 17</div><h1>FOUND</h1><div class="terminal">A ticket is wedged under the seat.\n\nSCREEN 02\nROW 03\nSEAT 17\n\nOn the back:\n\n"THE KEY OPENS WHAT THE TOWN CLOSED."</div>')}
 if(loc==="house")$("#door").onclick=()=>{if(state.items.includes("BLACK KEY")&&state.items.includes("BRASS TOKEN")){setObjective("ENDING 01 UNLOCKED");openPanel('<div class="loc">HOUSE 17 / ENTRY</div><h1>THE DOOR OPENS</h1><div class="terminal">The lock accepts both objects.\n\nInside, an old computer turns on.\n\nWELCOME BACK, GHOST_17.\n\nENDING 01\nTHE TOWN IS STILL ONLINE.</div><button class="action" id="resetTown">RESET THE TOWN</button>');$("#resetTown").onclick=()=>{localStorage.removeItem("dgt-save");location.reload()}}else notify("THE DOOR REQUIRES TWO OBJECTS")}
}
document.querySelectorAll(".building").forEach(b=>b.addEventListener("click",()=>visit(b.dataset.location)));
$("#closePanel").addEventListener("click",closePanel);
function startGame(e){if(e){e.preventDefault();e.stopPropagation()}if(started)return;started=true;$("#boot").style.display="none";$("#game").hidden=false;load();renderItems();updatePlayer();notify("SIGNAL LOST. EXPLORE THE TOWN.");try{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})}catch(_){}}
const start=$("#startBtn");start.addEventListener("click",startGame,{passive:false});start.addEventListener("touchend",startGame,{passive:false});start.addEventListener("pointerup",startGame,{passive:false});
document.querySelectorAll("#controls button").forEach(b=>{const go=()=>{const d=b.dataset.dir;move(d==="left"?-4:d==="right"?4:0,d==="up"?-4:d==="down"?4:0)};b.addEventListener("pointerdown",e=>{e.preventDefault();go();clearInterval(moveTimer);moveTimer=setInterval(go,120)});b.addEventListener("pointerup",()=>clearInterval(moveTimer));b.addEventListener("pointercancel",()=>clearInterval(moveTimer));});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePanel();const k=e.key.toLowerCase();if(k==="w"||e.key==="ArrowUp")move(0,-4);if(k==="s"||e.key==="ArrowDown")move(0,4);if(k==="a"||e.key==="ArrowLeft")move(-4,0);if(k==="d"||e.key==="ArrowRight")move(4,0)});
load();renderItems();
