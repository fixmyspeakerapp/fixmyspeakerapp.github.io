(()=>{
// Mapping confirmed by spectral analysis: vibrate.mp3 = steady ~195 Hz pulse (water), sound.mp3 = stepped 530-1780 Hz sweep (dust).
const MODES={water:{name:"Water Eject",src:"vibrate.mp3"},dust:{name:"Dust Removal",src:"sound.mp3"}};
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const fmt=t=>isFinite(t)?Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0"):"0:00";
const AC=window.AudioContext||window.webkitAudioContext;let ctx;
const getCtx=()=>{if(!AC)return null;ctx=ctx||new AC();if(ctx.state==="suspended")ctx.resume();return ctx};
let stopCleaner=()=>{};
// ---- Tone tests ----
let osc,tgain,ttimer;
const tstat=t=>{const e=$("#tstat");if(e)e.textContent=t};
function stopTone(msg){clearTimeout(ttimer);if(osc){const o=osc,g=tgain;osc=null;try{g.gain.setTargetAtTime(0,ctx.currentTime,.015);o.stop(ctx.currentTime+.08)}catch(e){}}
 $$("[data-t]").forEach(b=>b.setAttribute("aria-pressed","false"));if(msg)tstat(msg)}
function tone(f,p,b){const c=getCtx();if(!c){$("#terr").textContent="Web Audio is not supported in this browser.";return}
 $("#terr").textContent="";stopCleaner();stopTone();
 osc=c.createOscillator();tgain=c.createGain();osc.frequency.value=f;tgain.gain.value=0;osc.connect(tgain);
 if(c.createStereoPanner){const pn=c.createStereoPanner();pn.pan.value=p;tgain.connect(pn);pn.connect(c.destination)}else tgain.connect(c.destination);
 osc.start();tgain.gain.setTargetAtTime($("#tvol").value/100*.5,c.currentTime,.015);
 b.setAttribute("aria-pressed","true");tstat("Playing "+f+" Hz");
 ttimer=setTimeout(()=>stopTone("Stopped"),8000)}
$$("[data-t]").forEach(b=>b.addEventListener("click",()=>{
 if(b.getAttribute("aria-pressed")==="true"){stopTone("Stopped");return}
 const d=b.dataset;tone(d.t==="freq"?+$("#fq").value:+d.f,+(d.p||0),b)}));
const fq=$("#fq");if(fq)fq.oninput=()=>{$("#fqv").textContent=fq.value+" Hz";if(osc)osc.frequency.value=+fq.value;const f=$('[data-t=freq]');if(osc&&f.getAttribute("aria-pressed")==="true")tstat("Playing "+fq.value+" Hz")};
const tv=$("#tvol");if(tv)tv.oninput=()=>{if(osc)tgain.gain.value=tv.value/100*.5};
const ts=$("#tstop");if(ts)ts.onclick=()=>stopTone("Stopped");
// ---- Cleaner ----
const tool=$("#tool");if(tool){
const a=new Audio();a.preload="none";let mode="water",loaded=null,state="ready",gainNode=null,useGain=false;
a.volume=.8;useGain=Math.abs(a.volume-.8)>.01; // iOS ignores audio.volume, so use a gain node there
const el={st:$("#st"),box:$("#stbox"),bar:$("#bar"),fill:$("#bar i"),cur:$("#cur"),tot:$("#tot"),rem:$("#rem"),vol:$("#vol"),play:$("#play"),pause:$("#pause"),resume:$("#resume"),stop:$("#stop"),err:$("#err"),mode:$("#modename")};
const msg={ready:"Ready",loading:"Loading audio...",paused:"Paused",playing:()=>"Playing: "+MODES[mode].name};
function ui(s,text){state=s;const m=text||(typeof msg[s]==="function"?msg[s]():msg[s]);el.st.textContent=m;el.box.classList.toggle("on",s==="playing");
 el.play.disabled=s!=="ready";el.pause.disabled=s!=="playing";el.resume.disabled=s!=="paused";el.stop.disabled=s==="ready"}
function progress(){const d=a.duration,c=a.currentTime;const pc=d?c/d*100:0;el.fill.style.width=pc+"%";el.bar.setAttribute("aria-valuenow",Math.round(pc));
 el.cur.textContent=fmt(c);el.rem.textContent="-"+fmt(d?d-c:0)}
function resetAll(text){a.pause();try{a.currentTime=0}catch(e){}progress();ui("ready",text)}
function fail(m){a.pause();el.err.textContent=m;ui("ready","Error");loaded=null}
stopCleaner=()=>{if(state!=="ready")resetAll()};
$$(".tab").forEach(b=>b.addEventListener("click",()=>{
 if(b.dataset.mode===mode&&b.getAttribute("aria-selected")==="true")return;
 $$(".tab").forEach(x=>x.setAttribute("aria-selected",String(x===b)));
 mode=b.dataset.mode;el.mode.textContent=MODES[mode].name;el.err.textContent="";
 a.pause();a.removeAttribute("src");a.load();loaded=null;el.tot.textContent="0:00";progress();ui("ready")}));
el.play.onclick=async()=>{el.err.textContent="";stopTone("Stopped");ui("loading");
 if(loaded!==mode){a.src=MODES[mode].src;loaded=mode}
 if(useGain&&!gainNode){try{const c=getCtx();gainNode=c.createGain();c.createMediaElementSource(a).connect(gainNode);gainNode.connect(c.destination);gainNode.gain.value=el.vol.value/100}catch(e){useGain=false}}
 else if(useGain)getCtx();
 try{a.currentTime=0}catch(e){}
 try{await a.play()}catch(e){if(state==="loading")fail("Playback was blocked or the audio could not load. Check your volume and silent mode, then try again.")}};
el.pause.onclick=()=>{ui("paused");a.pause()};
el.resume.onclick=()=>{ui("loading");a.play().catch(()=>fail("Could not resume playback."))};
el.stop.onclick=()=>resetAll();
el.vol.oninput=()=>{const v=el.vol.value/100;if(useGain&&gainNode)gainNode.gain.value=v;else a.volume=v};
a.onplaying=()=>{if(state==="loading"||state==="playing")ui("playing")};
a.onwaiting=()=>{if(state==="playing")el.st.textContent="Buffering..."};
a.onloadedmetadata=()=>{el.tot.textContent=fmt(a.duration);progress()};
a.ontimeupdate=progress;
a.onended=()=>resetAll("Finished");
a.onerror=()=>{if(a.getAttribute("src"))fail("The audio file failed to load. Check your connection and try again.")};
ui("ready");
if(!window.Audio||!a.canPlayType||!a.canPlayType("audio/mpeg")){el.err.textContent="This browser cannot play MP3 audio. Please update or switch browser.";el.play.disabled=true}}
// ---- Contact form (never fakes success) ----
const f=$("#cform");if(f)f.addEventListener("submit",async e=>{e.preventDefault();const m=$("#cmsg");m.className="msg err";
 if(f.hp.value)return;
 if(!f.name.value.trim()||!/^\S+@\S+\.\S+$/.test(f.email.value)||!f.subject.value.trim()||f.message.value.trim().length<10){m.textContent="Please fill every field with a valid email and a message of at least 10 characters.";return}
 const ep=f.dataset.endpoint;if(!ep){m.textContent="This form is not connected to a mail backend yet, so your message was not sent.";return}
 try{const r=await fetch(ep,{method:"POST",body:new FormData(f)});if(!r.ok)throw 0;m.className="msg ok";m.textContent="Message sent. Thank you.";f.reset()}catch(x){m.textContent="Sending failed. Please try again later."}});
})();
