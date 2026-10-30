(()=>{
// Mapping confirmed by spectral analysis: vibrate.mp3 = steady ~195 Hz pulse (water), sound.mp3 = stepped 530-1780 Hz sweep (dust).
const MODES={water:{name:"Water Eject",src:"/vibrate.mp3"},dust:{name:"Dust Removal",src:"/sound.mp3"}};
const $=s=>document.querySelector(s),fmt=t=>isFinite(t)?Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0"):"0:00";
const tool=$("#tool");if(tool){
const a=new Audio();a.preload="none";let mode="water",loaded=null;
const el={st:$("#st"),box:$("#stbox"),bar:$("#bar i"),cur:$("#cur"),tot:$("#tot"),rem:$("#rem"),vol:$("#vol"),play:$("#play"),pause:$("#pause"),resume:$("#resume"),stop:$("#stop"),err:$("#err"),mode:$("#modename")};
const set=(t,on)=>{el.st.textContent=t;el.box.classList.toggle("on",!!on)};
const ui=s=>{el.play.disabled=s!=="ready";el.pause.disabled=s!=="playing";el.resume.disabled=s!=="paused";el.stop.disabled=s==="ready"};
const reset=()=>{a.pause();el.bar.style.width="0";el.cur.textContent="0:00";el.rem.textContent="-0:00";set("Ready",false);ui("ready")};
const fail=m=>{el.err.textContent=m;set("Error",false);ui("ready")};
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===b));
 mode=b.dataset.mode;el.mode.textContent=MODES[mode].name;el.err.textContent="";
 a.pause();a.removeAttribute("src");a.load();loaded=null;el.tot.textContent="0:00";reset()}));
el.play.onclick=async()=>{el.err.textContent="";
 if(loaded!==mode){a.src=MODES[mode].src;loaded=mode;set("Loading audio...",false)}
 a.currentTime=0;try{await a.play()}catch(e){fail("Playback was blocked or the audio could not load. Check your volume and try again.")}};
el.pause.onclick=()=>a.pause();
el.resume.onclick=()=>a.play().catch(()=>fail("Could not resume playback."));
el.stop.onclick=()=>{a.currentTime=0;reset()};
el.vol.oninput=()=>a.volume=el.vol.value/100;a.volume=.8;
a.onplaying=()=>{set("Playing: "+MODES[mode].name,true);ui("playing")};
a.onpause=()=>{if(!a.ended&&a.currentTime>0&&a.src){set("Paused",false);ui("paused")}};
a.onwaiting=()=>set("Buffering...",false);
a.onloadedmetadata=()=>el.tot.textContent=fmt(a.duration);
a.ontimeupdate=()=>{if(!a.duration)return;el.bar.style.width=a.currentTime/a.duration*100+"%";el.cur.textContent=fmt(a.currentTime);el.rem.textContent="-"+fmt(a.duration-a.currentTime)};
a.onended=()=>{reset();set("Finished",false)};
a.onerror=()=>{if(a.getAttribute("src"))fail("The audio file failed to load. Check your connection and try again.")};
ui("ready");}
// Speaker tests (Web Audio)
let ctx,osc,gain,pan;
const stopT=()=>{try{osc&&osc.stop()}catch(e){}osc=null;document.querySelectorAll("[data-t]").forEach(b=>b.setAttribute("aria-pressed","false"))};
function tone(f,p,b){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){$("#terr").textContent="Web Audio is not supported in this browser.";return}
 ctx=ctx||new AC();ctx.resume();stopT();osc=ctx.createOscillator();gain=ctx.createGain();osc.frequency.value=f;
 gain.gain.value=($("#tvol").value/100)*.5;osc.connect(gain);
 if(ctx.createStereoPanner){pan=ctx.createStereoPanner();pan.pan.value=p;gain.connect(pan);pan.connect(ctx.destination)}else gain.connect(ctx.destination);
 osc.start();b.setAttribute("aria-pressed","true");$("#tstat").textContent="Playing "+f+" Hz";
 setTimeout(()=>{if(osc){stopT();$("#tstat").textContent="Stopped"}},8000)}
document.querySelectorAll("[data-t]").forEach(b=>b.addEventListener("click",()=>{
 if(b.getAttribute("aria-pressed")==="true"){stopT();$("#tstat").textContent="Stopped";return}
 const d=b.dataset;tone(d.t==="freq"?+$("#fq").value:+d.f,+(d.p||0),b)}));
const fq=$("#fq");if(fq)fq.oninput=()=>{$("#fqv").textContent=fq.value+" Hz";if(osc)osc.frequency.value=+fq.value};
const tv=$("#tvol");if(tv)tv.oninput=()=>{if(gain)gain.gain.value=tv.value/100*.5};
const ts=$("#tstop");if(ts)ts.onclick=()=>{stopT();$("#tstat").textContent="Stopped"};
// Contact form: never fake success
const f=$("#cform");if(f)f.addEventListener("submit",async e=>{e.preventDefault();const m=$("#cmsg");m.className="msg err";
 if(f.hp.value)return;
 if(!f.name.value.trim()||!/^\S+@\S+\.\S+$/.test(f.email.value)||!f.subject.value.trim()||f.message.value.trim().length<10){m.textContent="Please fill every field with a valid email and a message of at least 10 characters.";return}
 const ep=f.dataset.endpoint;if(!ep){m.textContent="This form is not connected to a mail backend yet, so your message was not sent.";return}
 try{const r=await fetch(ep,{method:"POST",body:new FormData(f)});if(!r.ok)throw 0;m.className="msg ok";m.textContent="Message sent. Thank you.";f.reset()}catch(x){m.textContent="Sending failed. Please try again later."}});
})();
