const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(pending=false){const timers=new Set(),contexts=[],notes=[];let resume;
class Context{constructor(){this.state='suspended';this.currentTime=10;this.destination={};contexts.push(this);}resume(){if(pending)return new Promise(r=>resume=()=>{this.state='running';r();});this.state='running';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}createOscillator(){return{frequency:{},connect(){return this;},start:t=>notes.push(t),stop(){}};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;}};}}
const env={window:{AudioContext:Context},setInterval(fn){const id={fn};timers.add(id);return id;},clearInterval:id=>timers.delete(id)};vm.runInNewContext(fs.readFileSync(__dirname+'/music.js','utf8'),env);return{music:env.RainMusic.create(),timers,contexts,notes,resume:()=>resume()};}
(async()=>{
let f=fixture();assert.equal(f.contexts.length,0);assert.equal(f.timers.size,0);f.music.effect(0,true);assert.equal(f.notes.length,0);console.log('PASS no music or context before user start');
await Promise.all([f.music.start(),f.music.start(),f.music.start()]);assert.equal(f.contexts.length,1);assert.equal(f.timers.size,1);assert(f.notes.length>0);console.log('PASS repeated starts create one music scheduler');
f.music.set(false);assert.equal(f.timers.size,0);assert.equal(f.contexts[0].state,'closed');const n=f.notes.length;f.music.effect(0,true);await f.music.start();assert.equal(f.notes.length,n);console.log('PASS mute stops music and blocks effects');
f=fixture(true);const waiting=f.music.start();f.music.stop();f.resume();await waiting;assert.equal(f.timers.size,0);assert.equal(f.notes.length,0);console.log('PASS stop cancels a pending audio resume');
})().catch(e=>{console.error(e);process.exitCode=1;});



