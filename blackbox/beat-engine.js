/* BYTEGN.XYZ // BEAT//CITY // BEAT ENGINE // Browser Beta 0.1 */
/* Harmless game logic. The 'blackbox' naming is aesthetic only. */
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo');
  const accuracyEl = document.getElementById('accuracy');
  const judgeEl = document.getElementById('judgement');
  const bestComboEl = document.getElementById('bestCombo');
  const leaderScoreEl = document.getElementById('leaderScore');
  const hypeBar = document.getElementById('hypeBar');
  const energyBar = document.getElementById('energyBar');
  const energyText = document.getElementById('energyText');
  const energyTop = document.getElementById('energyTop');
  const progress = document.getElementById('songProgress');
  const timeNow = document.getElementById('timeNow');
  const timeTotal = document.getElementById('timeTotal');
  const statusText = document.getElementById('statusText');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const difficulty = document.getElementById('difficulty');
  const speedRange = document.getElementById('speedRange');
  const keyButtons = [...document.querySelectorAll('.key-row button')];
  const audioToggle = document.getElementById('audioToggle');

  const laneColors = ['#ff2ba6','#28f0ff','#4f7cff','#b7ff27'];
  const keys = {KeyA:0,KeyS:1,KeyK:2,KeyL:3};
  const songLength = 60;
  const bpm = 128;
  document.getElementById('bpmLabel').textContent = bpm;
  timeTotal.textContent = '1:00';

  let notes=[]; let running=false; let paused=false; let startTime=0; let pauseStarted=0; let pausedAccum=0;
  let score=0, combo=0, bestCombo=0, hits=0, misses=0, totalJudgement=0, energy=100, hype=0;
  let audioCtx=null, beatTimer=null, animationId=null, lastFrame=performance.now(), fpsCounter=60;

  function resize(){const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio||1,2); canvas.width=r.width*dpr; canvas.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);} 
  addEventListener('resize',resize); resize();

  function chart(){
    const mode=difficulty.value; const beat=60/bpm; const density={easy:1,normal:.5,hard:.25}[mode]; const out=[];
    let lane=0;
    for(let t=2;t<songLength-1;t+=density){
      const skip = mode==='easy' ? (Math.floor(t/beat)%3===2) : false;
      if(skip) continue;
      lane = (lane + 1 + (Math.random()>.72?1:0))%4;
      out.push({time:t,lane,hit:false,missed:false});
      if(mode==='hard' && Math.random()>.72) out.push({time:t,lane:(lane+2)%4,hit:false,missed:false});
    }
    return out.sort((a,b)=>a.time-b.time);
  }

  function resetGame(){
    running=false; paused=false; cancelAnimationFrame(animationId); clearInterval(beatTimer); notes=chart(); score=0; combo=0; bestCombo=0; hits=0; misses=0; totalJudgement=0; energy=100; hype=0; pausedAccum=0;
    updateHUD(); progress.value=0; timeNow.textContent='0:00'; judgeEl.textContent='READY'; statusText.textContent='Press START DEMO TRACK'; draw(0);
  }

  function getSongTime(){ return running ? Math.max(0,(performance.now()-startTime-pausedAccum)/1000) : 0; }
  function formatTime(s){s=Math.floor(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}

  function start(){
    resetGame(); running=true; startTime=performance.now(); statusText.textContent='Demo track running'; judgeEl.textContent='GO!';
    if(audioToggle.checked) startAudio(); animationId=requestAnimationFrame(loop);
  }
  function restart(){start()}

  function togglePause(){
    if(!running) return;
    paused=!paused;
    if(paused){pauseStarted=performance.now(); clearInterval(beatTimer); judgeEl.textContent='PAUSED'; statusText.textContent='Paused';}
    else{pausedAccum += performance.now()-pauseStarted; if(audioToggle.checked) startBeatClock(); statusText.textContent='Playing'; animationId=requestAnimationFrame(loop);}
  }

  function startAudio(){
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    startBeatClock();
  }
  function startBeatClock(){
    clearInterval(beatTimer); const beatMs=60000/bpm;
    beatTimer=setInterval(()=>{ if(!running||paused||!audioToggle.checked) return; const t=getSongTime(); synthBeat(t); }, beatMs/2);
  }
  function synthBeat(t){
    if(!audioCtx) return;
    const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type=(Math.floor(t*2)%4===0)?'sine':'triangle'; o.frequency.value=(Math.floor(t*2)%4===0)?70:190; g.gain.setValueAtTime(.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.12,audioCtx.currentTime+.005); g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.12); o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+.14);
  }

  function attemptHit(lane){
    if(!running||paused) return;
    pulseKey(lane); const t=getSongTime(); let candidate=null, delta=999;
    for(const n of notes){if(n.hit||n.missed||n.lane!==lane) continue; const d=Math.abs(n.time-t); if(d<delta){delta=d;candidate=n;} if(n.time>t+.2) break;}
    if(candidate && delta<=.18){candidate.hit=true; hits++; combo++; bestCombo=Math.max(bestCombo,combo); let pts=0, judgement='', quality=0;
      if(delta<=.055){pts=1000; judgement='PERFECT+'; quality=1;} else if(delta<=.10){pts=700; judgement='GREAT'; quality=.85;} else {pts=400; judgement='GOOD'; quality=.65;}
      const mult=1+Math.min(combo,100)/100; score+=Math.round(pts*mult); totalJudgement+=quality; energy=Math.min(100,energy+1.6); hype=Math.min(100,hype+1.15); showJudge(judgement,laneColors[lane]);
    } else {combo=0; energy=Math.max(0,energy-2); showJudge('MISS','#ff5a72');}
    updateHUD();
  }

  function pulseKey(lane){const b=keyButtons[lane]; b.classList.add('active'); setTimeout(()=>b.classList.remove('active'),90)}
  function showJudge(text,color){judgeEl.textContent=text; judgeEl.style.color=color; judgeEl.animate([{transform:'scale(.8)',opacity:.3},{transform:'scale(1.1)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:180});}

  function updateHUD(){
    scoreEl.textContent=score.toLocaleString(); leaderScoreEl.textContent=score.toLocaleString(); comboEl.textContent=combo; bestComboEl.textContent=bestCombo; const attempts=hits+misses; const acc=attempts?Math.max(0,(totalJudgement/attempts)*100):100; accuracyEl.textContent=acc.toFixed(2)+'%'; hypeBar.style.width=hype+'%'; energyBar.style.width=energy+'%'; energyText.textContent=Math.round(energy)+' / 100'; energyTop.textContent=Math.round(energy);
  }

  function loop(now){
    if(!running||paused) return; const t=getSongTime();
    for(const n of notes){if(!n.hit&&!n.missed&&n.time < t-.19){n.missed=true; misses++; combo=0; energy=Math.max(0,energy-3.5); showJudge('MISS','#ff5a72'); updateHUD();}}
    progress.value=Math.min(100,t/songLength*100); timeNow.textContent=formatTime(t); draw(t);
    if(now-lastFrame>500){fpsCounter=Math.round(1000/((now-lastFrame)/30)); document.getElementById('fps').textContent=Math.min(60,Math.max(1,fpsCounter))+'fps'; lastFrame=now;}
    if(t>=songLength||energy<=0){finish(t>=songLength);return;} animationId=requestAnimationFrame(loop);
  }

  function finish(completed){running=false;clearInterval(beatTimer);judgeEl.textContent=completed?'TRACK CLEAR!':'FAILED';statusText.textContent=completed?'Track complete — hit Restart to play again':'Energy depleted — hit Restart';draw(songLength)}

  function draw(t=0){
    const w=canvas.clientWidth,h=canvas.clientHeight; ctx.clearRect(0,0,w,h);
    const topY=25, hitY=h-88, center=w/2, topWidth=w*.34, bottomWidth=w*.86; const laneTop=topWidth/4,laneBottom=bottomWidth/4;
    ctx.save();
    // perspective lane background
    const grad=ctx.createLinearGradient(0,topY,0,hitY);grad.addColorStop(0,'rgba(8,16,38,.38)');grad.addColorStop(1,'rgba(4,8,18,.92)');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(center-topWidth/2,topY);ctx.lineTo(center+topWidth/2,topY);ctx.lineTo(center+bottomWidth/2,hitY);ctx.lineTo(center-bottomWidth/2,hitY);ctx.closePath();ctx.fill();
    for(let i=0;i<=4;i++){const xt=center-topWidth/2+i*laneTop;const xb=center-bottomWidth/2+i*laneBottom;ctx.strokeStyle=i===0||i===4?'rgba(255,255,255,.5)':'rgba(96,144,220,.22)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(xt,topY);ctx.lineTo(xb,hitY);ctx.stroke();}
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.shadowColor='#fff';ctx.shadowBlur=18;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(center-bottomWidth/2,hitY);ctx.lineTo(center+bottomWidth/2,hitY);ctx.stroke();ctx.shadowBlur=0;
    const travelMs=Number(speedRange.value)/1000; // seconds visible
    for(const n of notes){ if(n.hit||n.missed) continue; const dt=n.time-t; if(dt<-.2||dt>travelMs) continue; const p=1-dt/travelMs; const y=topY+(hitY-topY)*p; const widthAt=topWidth+(bottomWidth-topWidth)*p; const laneW=widthAt/4; const x=center-widthAt/2+n.lane*laneW+laneW*.13; const nw=laneW*.74; const nh=12+12*p; ctx.fillStyle=laneColors[n.lane];ctx.shadowColor=laneColors[n.lane];ctx.shadowBlur=18;roundRect(ctx,x,y,nw,nh,6);ctx.fill();ctx.fillStyle='#fff8';roundRect(ctx,x+4,y+3,nw-8,2,2);ctx.fill();ctx.shadowBlur=0; }
    ctx.restore();
  }
  function roundRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}

  document.addEventListener('keydown',e=>{if(keys[e.code]!==undefined){e.preventDefault();attemptHit(keys[e.code]);} if(e.code==='Escape'){e.preventDefault();togglePause();}});
  keyButtons.forEach(b=>{const lane=Number(b.dataset.lane); b.addEventListener('pointerdown',e=>{e.preventDefault();attemptHit(lane)});});
  startBtn.addEventListener('click',start); restartBtn.addEventListener('click',restart); pauseBtn.addEventListener('click',togglePause);
  difficulty.addEventListener('change',()=>{if(!running)resetGame()}); speedRange.addEventListener('input',()=>draw(getSongTime()));
  const modal=document.getElementById('settingsModal');document.getElementById('settingsBtn').onclick=()=>modal.hidden=false;document.getElementById('closeSettings').onclick=()=>modal.hidden=true;modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
  resetGame();
})();
