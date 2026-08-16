/* BYTEGN.XYZ // BEAT//CITY // BEAT ENGINE // Browser Beta 0.2 */
(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const laneColors = ['#ff2ba6','#28f0ff','#4f7cff','#b7ff27'];
  const keys = {KeyA:0,KeyS:1,KeyK:2,KeyL:3};
  const tracks = [
    {id:'midnight-run',title:'Midnight Run',artist:'NOVA REIGN',city:'Charlotte',genre:'Electro Pop',bpm:128,length:60,accent:'#ff2ba6',seed:11},
    {id:'rain-switch',title:'Rain Switch',artist:'MIMI.exe',city:'Charlotte',genre:'Future Funk',bpm:136,length:64,accent:'#a94cff',seed:23},
    {id:'city-lights',title:'City Lights',artist:'KATSUU',city:'Charlotte',genre:'Synthwave',bpm:118,length:62,accent:'#28f0ff',seed:37},
    {id:'tokyo-midnight',title:'Tokyo Midnight',artist:'YUKI TANAKA',city:'Demo Node',genre:'Electro',bpm:144,length:66,accent:'#b7ff27',seed:51}
  ];

  const els = {
    score:$('score'), combo:$('combo'), accuracy:$('accuracy'), judge:$('judgement'), bestCombo:$('bestCombo'), leaderScore:$('leaderScore'), hypeBar:$('hypeBar'), energyBar:$('energyBar'), energyText:$('energyText'), energyTop:$('energyTop'), progress:$('songProgress'), timeNow:$('timeNow'), timeTotal:$('timeTotal'), status:$('statusText'), start:$('startBtn'), mobileStart:$('mobileStartBtn'), restart:$('restartBtn'), pause:$('pauseBtn'), difficulty:$('difficulty'), speed:$('speedRange'), audio:$('audioToggle'), mobileFocus:$('mobileFocusToggle'), title:$('titleLabel'), artist:$('artistLabel'), city:$('cityLabel'), genre:$('genreLabel'), bpm:$('bpmLabel'), cover:$('coverArt'), coverTitle:$('coverTitle'), coverArtist:$('coverArtist'), queue:$('queueList'), discover:$('discoverGrid')
  };

  let currentTrack = tracks[0], notes=[], running=false, paused=false, startTime=0, pauseStarted=0, pausedAccum=0;
  let score=0, combo=0, bestCombo=0, hits=0, misses=0, totalJudgement=0, energy=100, hype=0;
  let audioCtx=null, beatTimer=null, animationId=null, lastFrame=performance.now(), frames=0;
  let stats = loadJSON('beatcity.stats',{bestScore:0,bestCombo:0,bestAccuracy:0,clears:0});

  function loadJSON(k, fallback){try{return JSON.parse(localStorage.getItem(k))||fallback}catch{return fallback}}
  function saveStats(){localStorage.setItem('beatcity.stats',JSON.stringify(stats));renderProfile()}
  function fmt(s){s=Math.floor(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
  function rng(seed){let x=Math.sin(seed++)*10000;return x-Math.floor(x)}

  function resize(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw(getSongTime())}
  addEventListener('resize',resize);

  function chart(){
    const mode=els.difficulty.value, beat=60/currentTrack.bpm, density={easy:beat,normal:beat/2,hard:beat/4}[mode];
    const out=[];let lane=currentTrack.seed%4, n=0;
    for(let t=2;t<currentTrack.length-1;t+=density){
      const rv=rng(currentTrack.seed+n++); if(mode==='easy' && rv>.72) continue;
      lane=(lane+1+(rv>.82?1:0))%4; out.push({time:t,lane,hit:false,missed:false});
      if(mode==='hard' && rng(currentTrack.seed+n++)>.82) out.push({time:t,lane:(lane+2)%4,hit:false,missed:false});
    }
    return out.sort((a,b)=>a.time-b.time);
  }

  function selectTrack(id, goPlay=true){
    const t=tracks.find(x=>x.id===id); if(!t)return; currentTrack=t;
    els.title.textContent=t.title;els.artist.textContent=t.artist;els.city.textContent=t.city;els.genre.textContent=t.genre;els.bpm.textContent=t.bpm;els.timeTotal.textContent=fmt(t.length);els.coverArtist.textContent=t.artist;els.coverTitle.innerHTML=t.title.toUpperCase().replace(' ','<br>');els.cover.style.background=`radial-gradient(circle at 70% 20%,${t.accent}cc,transparent 35%),linear-gradient(145deg,#0b1743,#2c0b40 50%,#061b2a)`;
    renderTrackLists();resetGame(); if(goPlay) switchView('play');
  }

  function renderTrackLists(){
    els.queue.innerHTML=tracks.map(t=>`<button class="queue-item ${t.id===currentTrack.id?'active':''}" data-track="${t.id}"><span class="mini-art" style="background:linear-gradient(135deg,${t.accent},#14213d)"></span><div><b>${t.title}</b><small>${t.artist} · ${t.bpm} BPM</small></div></button>`).join('');
    els.discover.innerHTML=tracks.map(t=>`<article class="panel discover-card" data-track="${t.id}" style="--accent:${t.accent}"><div class="discover-art"></div><div class="discover-body"><span class="artist">${t.artist}</span><h2>${t.title}</h2><p>${t.city} · ${t.genre} · ${t.bpm} BPM</p><button class="primary" data-track="${t.id}">PLAY DEMO</button></div></article>`).join('');
  }

  function resetGame(){running=false;paused=false;cancelAnimationFrame(animationId);clearInterval(beatTimer);notes=chart();score=0;combo=0;bestCombo=0;hits=0;misses=0;totalJudgement=0;energy=100;hype=0;pausedAccum=0;updateHUD();els.progress.value=0;els.timeNow.textContent='0:00';els.judge.textContent='READY';els.status.textContent=`Ready: ${currentTrack.title}`;draw(0)}
  function getSongTime(){return running?Math.max(0,(performance.now()-startTime-pausedAccum)/1000):0}
  function start(){resetGame();running=true;startTime=performance.now();els.status.textContent=`Playing ${currentTrack.title}`;els.judge.textContent='GO!';if(els.audio.checked)startAudio();if(innerWidth<=800&&els.mobileFocus.checked)enterGameMode();animationId=requestAnimationFrame(loop)}
  function restart(){start()}
  function togglePause(){if(!running)return;paused=!paused;if(paused){pauseStarted=performance.now();clearInterval(beatTimer);els.judge.textContent='PAUSED';els.status.textContent='Paused'}else{pausedAccum+=performance.now()-pauseStarted;if(els.audio.checked)startBeatClock();els.status.textContent='Playing';animationId=requestAnimationFrame(loop)}}

  function startAudio(){audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();startBeatClock()}
  function startBeatClock(){clearInterval(beatTimer);const beatMs=60000/currentTrack.bpm;beatTimer=setInterval(()=>{if(!running||paused||!els.audio.checked)return;synthBeat(getSongTime())},beatMs/2)}
  function synthBeat(t){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();const step=Math.floor(t*currentTrack.bpm/30);o.type=step%4===0?'sine':'triangle';o.frequency.value=step%4===0?68+(currentTrack.seed%9):180+(currentTrack.seed%40);g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.11,audioCtx.currentTime+.005);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.11);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.13)}

  function attemptHit(lane){
    if(!running||paused)return;pulseKey(lane);const t=getSongTime();let candidate=null,delta=999;
    for(const n of notes){if(n.hit||n.missed||n.lane!==lane)continue;const d=Math.abs(n.time-t);if(d<delta){delta=d;candidate=n}if(n.time>t+.22)break}
    if(candidate&&delta<=.18){candidate.hit=true;hits++;combo++;bestCombo=Math.max(bestCombo,combo);let pts=0,judgement='',quality=0;if(delta<=.055){pts=1000;judgement='PERFECT+';quality=1}else if(delta<=.10){pts=700;judgement='GREAT';quality=.85}else{pts=400;judgement='GOOD';quality=.65}score+=Math.round(pts*(1+Math.min(combo,100)/100));totalJudgement+=quality;energy=Math.min(100,energy+1.6);hype=Math.min(100,hype+1.15);showJudge(judgement,laneColors[lane])}else{combo=0;energy=Math.max(0,energy-2);showJudge('MISS','#ff5a72')}updateHUD()
  }
  function pulseKey(lane){const b=[...document.querySelectorAll('.key-row button')][lane];b.classList.add('active');setTimeout(()=>b.classList.remove('active'),90)}
  function showJudge(text,color){els.judge.textContent=text;els.judge.style.color=color;els.judge.animate([{transform:'scale(.8)',opacity:.3},{transform:'scale(1.1)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:180})}
  function accuracy(){const attempts=hits+misses;return attempts?Math.max(0,(totalJudgement/attempts)*100):100}
  function updateHUD(){els.score.textContent=score.toLocaleString();els.leaderScore.textContent=score.toLocaleString();els.combo.textContent=combo;els.bestCombo.textContent=bestCombo;els.accuracy.textContent=accuracy().toFixed(2)+'%';els.hypeBar.style.width=hype+'%';els.energyBar.style.width=energy+'%';els.energyText.textContent=Math.round(energy)+' / 100';els.energyTop.textContent=Math.round(energy);$('challengeScore').textContent=`${Math.min(score,50000).toLocaleString()} / 50,000`;$('challengeCombo').textContent=`${Math.min(bestCombo,50)} / 50`}

  function loop(now){if(!running||paused)return;const t=getSongTime();for(const n of notes){if(!n.hit&&!n.missed&&n.time<t-.19){n.missed=true;misses++;combo=0;energy=Math.max(0,energy-3.5);showJudge('MISS','#ff5a72');updateHUD()}}els.progress.value=Math.min(100,t/currentTrack.length*100);els.timeNow.textContent=fmt(t);draw(t);frames++;if(now-lastFrame>=1000){$('fps').textContent=Math.min(60,frames)+'fps';frames=0;lastFrame=now}if(t>=currentTrack.length||energy<=0){finish(t>=currentTrack.length);return}animationId=requestAnimationFrame(loop)}
  function finish(completed){running=false;clearInterval(beatTimer);const acc=accuracy();els.judge.textContent=completed?'TRACK CLEAR!':'FAILED';els.status.textContent=completed?`${currentTrack.title} complete`:'Energy depleted';stats.bestScore=Math.max(stats.bestScore,score);stats.bestCombo=Math.max(stats.bestCombo,bestCombo);stats.bestAccuracy=Math.max(stats.bestAccuracy,acc);if(completed)stats.clears++;saveStats();$('challengeAccuracy').textContent=completed&&acc>=90?'CLEARED ✓':'Not cleared';draw(currentTrack.length)}

  function draw(t=0){
    const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);const topY=25,hitY=h-88,center=w/2,topWidth=w*.34,bottomWidth=w*.86,laneTop=topWidth/4,laneBottom=bottomWidth/4;ctx.save();const grad=ctx.createLinearGradient(0,topY,0,hitY);grad.addColorStop(0,'rgba(8,16,38,.38)');grad.addColorStop(1,'rgba(4,8,18,.92)');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(center-topWidth/2,topY);ctx.lineTo(center+topWidth/2,topY);ctx.lineTo(center+bottomWidth/2,hitY);ctx.lineTo(center-bottomWidth/2,hitY);ctx.closePath();ctx.fill();for(let i=0;i<=4;i++){const xt=center-topWidth/2+i*laneTop,xb=center-bottomWidth/2+i*laneBottom;ctx.strokeStyle=i===0||i===4?'rgba(255,255,255,.5)':'rgba(96,144,220,.22)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(xt,topY);ctx.lineTo(xb,hitY);ctx.stroke()}ctx.strokeStyle='rgba(255,255,255,.9)';ctx.shadowColor='#fff';ctx.shadowBlur=18;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(center-bottomWidth/2,hitY);ctx.lineTo(center+bottomWidth/2,hitY);ctx.stroke();ctx.shadowBlur=0;const travelMs=Number(els.speed.value)/1000;for(const n of notes){if(n.hit||n.missed)continue;const dt=n.time-t;if(dt<-.2||dt>travelMs)continue;const p=1-dt/travelMs,y=topY+(hitY-topY)*p,widthAt=topWidth+(bottomWidth-topWidth)*p,laneW=widthAt/4,x=center-widthAt/2+n.lane*laneW+laneW*.13,nw=laneW*.74,nh=12+12*p;ctx.fillStyle=laneColors[n.lane];ctx.shadowColor=laneColors[n.lane];ctx.shadowBlur=18;roundRect(ctx,x,y,nw,nh,6);ctx.fill();ctx.fillStyle='#fff8';roundRect(ctx,x+4,y+3,nw-8,2,2);ctx.fill();ctx.shadowBlur=0}ctx.restore()
  }
  function roundRect(c,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath()}

  function switchView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.viewPanel===name));document.querySelectorAll('#mainNav [data-view]').forEach(b=>b.classList.toggle('nav-active',b.dataset.view===name));scrollTo({top:0,behavior:'smooth'});if(name==='play')setTimeout(resize,40)}
  function enterGameMode(){document.querySelector('.game-stage').classList.add('mobile-focus');document.body.classList.add('game-focused');setTimeout(resize,50)}
  function exitGameMode(){document.querySelector('.game-stage').classList.remove('mobile-focus');document.body.classList.remove('game-focused');setTimeout(resize,50)}
  async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.()}catch{}}
  function renderProfile(){$('profileScore').textContent=stats.bestScore.toLocaleString();$('profileCombo').textContent=stats.bestCombo;$('profileAccuracy').textContent=stats.bestAccuracy.toFixed(2)+'%';$('profileClears').textContent=stats.clears}

  const chatKey='beatcity.chat.v02', channel='BroadcastChannel' in window?new BroadcastChannel('beatcity-chat-v02'):null;
  let messages=loadJSON(chatKey,[{name:'BYTEGN.BOT',text:'CITY ROOM online. This Beta 0.2 chat is local to your browser until the realtime backend is connected.',time:Date.now()}]);
  function renderChat(){const box=$('messages');box.innerHTML=messages.slice(-60).map(m=>`<div class="message"><div class="message-avatar">${esc(m.name).slice(0,3).toUpperCase()}</div><div><div class="message-head"><b>${esc(m.name)}</b><time>${new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></div><p>${esc(m.text)}</p></div></div>`).join('');box.scrollTop=box.scrollHeight}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function saveChat(){localStorage.setItem(chatKey,JSON.stringify(messages));renderChat();channel?.postMessage(messages)}
  channel?.addEventListener('message',e=>{messages=e.data;renderChat()});
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();const name=$('chatName').value.trim()||'YOU',text=$('chatInput').value.trim();if(!text)return;messages.push({name,text,time:Date.now()});$('chatInput').value='';saveChat()});
  $('clearChat').onclick=()=>{messages=[];saveChat()};

  document.addEventListener('click',e=>{const view=e.target.closest('[data-view]');if(view){switchView(view.dataset.view);return}const track=e.target.closest('[data-track]');if(track){selectTrack(track.dataset.track,true)}});
  document.addEventListener('keydown',e=>{if(keys[e.code]!==undefined){e.preventDefault();attemptHit(keys[e.code])}if(e.code==='Escape'){if(document.body.classList.contains('game-focused'))exitGameMode();else{e.preventDefault();togglePause()}}});
  document.querySelectorAll('.key-row button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();attemptHit(Number(b.dataset.lane))}));
  els.start.onclick=start;els.mobileStart.onclick=start;els.restart.onclick=restart;els.pause.onclick=togglePause;$('mobileExitBtn').onclick=exitGameMode;$('fullscreenBtn').onclick=fullscreen;els.difficulty.addEventListener('change',()=>{if(!running)resetGame()});els.speed.addEventListener('input',()=>draw(getSongTime()));
  const modal=$('settingsModal');$('settingsBtn').onclick=()=>modal.hidden=false;$('closeSettings').onclick=()=>modal.hidden=true;modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});

  renderTrackLists();renderProfile();renderChat();selectTrack(currentTrack.id,false);resize();
})();
