const state={items:[],flags:{cafe:false,radio:false,arcade:false,cinema:false,house:false},sound:false};
const $=s=>document.querySelector(s);
const panel=$("#panel"), content=$("#panelContent"), toast=$("#toast"), items=$("#items");
function save(){localStorage.setItem("dgt-save",JSON.stringify(state))}
function load(){try{Object.assign(state,JSON.parse(localStorage.getItem("dgt-save"))||{})}catch(e){}}
function notify(t){toast.textContent=t;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}
function addItem(name){if(!state.items.includes(name)){state.items.push(name);renderItems();save();notify("ITEM ACQUIRED: "+name)}}
function renderItems(){items.innerHTML=state.items.map(x=>'<span class="item">'+x+'</span>').join("")}
function openPanel(html){content.innerHTML=html;panel.classList.add("open");panel.setAttribute("aria-hidden","false")}
function closePanel(){panel.classList.remove("open");panel.setAttribute("aria-hidden","true")}
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

ENTER THE FOUR DIGIT CODE.</div><input id="code" class="input" inputmode="numeric" maxlength="4" placeholder="ENTER CODE"><button class="action" id="unlock">SUBMIT CODE</button>`},
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
const v=views[loc];openPanel('<div class="loc">'+v.sub+'</div><h1>'+v.title+'</h1>'+v.html);bind(loc)
}
function bind(loc){
 if(loc==="cafe"){
  $("#ghost").onclick=()=>{addItem("BLACK KEY");openPanel('<div class="loc">NET CAFE / GHOST DIRECTORY</div><h1>/GHOST</h1><div class="terminal">USER: GHOST_17
MESSAGE COUNT: 1

"IF YOU FOUND THIS, THE TOWN IS STILL RUNNING."

A key has been taped under the desk.</div>')}
  $("#msg").onclick=()=>openPanel('<div class="loc">NET CAFE / LAST MESSAGE</div><h1>03:17</h1><div class="terminal">"I LEFT THE RADIO ON.
IF IT CALLS YOUR NAME,
DO NOT ANSWER."</div>')
 }
 if(loc==="arcade")$("#unlock").onclick=()=>{if($("#code").value==="0317"){addItem("BRASS TOKEN");openPanel('<div class="loc">ARCADE / CABINET 04</div><h1>ACCESS GRANTED</h1><div class="terminal">CABINET 04 UNLOCKED.

A brass token falls from the machine.

The back of it says:

17 / 08 / 14</div>')}else notify("ACCESS DENIED")}
 if(loc==="radio")$("#listen").onclick=()=>notify("STATIC: HOUSE 17... HOUSE 17... HOUSE 17...")
 if(loc==="cinema")$("#ticket").onclick=()=>{addItem("FILM TICKET");openPanel('<div class="loc">CINEMA / SEAT 17</div><h1>FOUND</h1><div class="terminal">A ticket is wedged under the seat.

SCREEN 02
ROW 03
SEAT 17

On the back:

"THE KEY OPENS WHAT THE TOWN CLOSED."</div>')}
 if(loc==="house")$("#door").onclick=()=>{if(state.items.includes("BLACK KEY")&&state.items.includes("BRASS TOKEN")){openPanel('<div class="loc">HOUSE 17 / ENTRY</div><h1>THE DOOR OPENS</h1><div class="terminal">The lock accepts both objects.

Inside, an old computer turns on.

WELCOME BACK, GHOST_17.

ENDING 01
THE TOWN IS STILL ONLINE.</div><button class="action" onclick="localStorage.removeItem(\'dgt-save\');location.reload()">RESET THE TOWN</button>')}else notify("THE DOOR REQUIRES TWO OBJECTS")}
}
document.querySelectorAll(".building").forEach(b=>b.addEventListener("click",()=>visit(b.dataset.location)));
$("#closePanel").onclick=closePanel;
$("#startBtn").onclick=()=>{$("#boot").remove();$("#game").hidden=false;document.body.requestFullscreen?.().catch(()=>{});load();renderItems();notify("SIGNAL LOST. EXPLORE THE TOWN.")};
document.querySelectorAll("#controls button").forEach(b=>b.addEventListener("click",()=>notify("MOVE "+b.dataset.dir.toUpperCase())));
load();renderItems();
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePanel()});
