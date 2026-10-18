(function(root){'use strict';
const W=360,H=520,MAX_INK=650,MAX_PATHS=4,LIFE=12;
const levels=[
{clouds:[180],flowers:[65,180,295],need:2,wind:0},
{clouds:[95],flowers:[65,180,295],need:2,wind:0},
{clouds:[265],flowers:[65,180,295],need:2,wind:0},
{clouds:[90,270],flowers:[65,180,295],need:3,wind:0},
{clouds:[180],flowers:[50,160,290],need:3,wind:12},
{clouds:[100,250],flowers:[65,180,295],need:3,wind:-15},
{clouds:[180],flowers:[55,180,305],need:3,wind:0,rocks:[{x:135,y:260,w:90}]},
{clouds:[75,285],flowers:[65,180,295],need:3,wind:10},
{clouds:[180],flowers:[65,180,295],need:4,wind:-18,rocks:[{x:120,y:280,w:120}]},
{clouds:[95,265],flowers:[55,180,305],need:4,wind:18},
{clouds:[180],flowers:[55,180,305],need:4,wind:0,rocks:[{x:70,y:235,w:80},{x:220,y:300,w:75}]},
{clouds:[65,180,295],flowers:[55,180,305],need:4,wind:14,rocks:[{x:140,y:250,w:80}]}
];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function create(index=0){index=Math.max(0,Math.min(11,index|0));const l=levels[index];return{index,time:0,spawn:0,serial:0,phase:'playing',paths:[],drops:[],flowers:l.flowers.map(x=>({x,y:460,water:0,need:l.need})),events:[],missed:0,delivered:0,drawn:0,rng:76543+index,clouds:[...l.clouds],wind:l.wind,rocks:l.rocks||[]};}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
function length(points){let n=0;for(let i=1;i<points.length;i++)n+=distance(points[i-1],points[i]);return n;}
function addPath(s,points){if(s.phase!=='playing'||!Array.isArray(points))return false;const p=[];let remaining=MAX_INK;for(const v of points){if(!Number.isFinite(v.x)||!Number.isFinite(v.y))return false;const q={x:Math.max(8,Math.min(352,v.x)),y:Math.max(105,Math.min(430,v.y))};if(p.length){let d=distance(p.at(-1),q);if(d<3)continue;if(d>remaining){const t=remaining/d,a=p.at(-1);p.push({x:a.x+(q.x-a.x)*t,y:a.y+(q.y-a.y)*t});break;}remaining-=d;}p.push(q);if(p.length>=160)break;}if(p.length<2||length(p)<12)return false;
if(s.paths.length>=MAX_PATHS)s.paths.shift();s.paths.push({id:++s.serial,points:p,life:LIFE});s.drawn++;return true;}
function spawn(s,x,y=86){const d={x,y,px:x,py:y,vx:s.wind*.35,vy:20,route:null,last:-1,age:0};s.drops.push(d);return d;}
function aim(s,path){const a=path.points[0],b=path.points.at(-1);if(Math.abs(a.y-b.y)>8)return a.y>b.y?-1:1;const target=s.flowers.filter(f=>f.water<f.need).sort((x,y)=>Math.abs(x.x-(a.x+b.x)/2)-Math.abs(y.x-(a.x+b.x)/2))[0]||s.flowers[1];return Math.abs(a.x-target.x)<Math.abs(b.x-target.x)?-1:1;}
function collide(s,d){let best=null;for(const p of s.paths){if(p.id===d.last)continue;for(let i=0;i<p.points.length-1;i++){const a=p.points[i],b=p.points[i+1],dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<2)continue;const den=dx*(d.y-d.py)-dy*(d.x-d.px);if(Math.abs(den)<.00001)continue;const u=((d.px-a.x)*(d.y-d.py)-(d.py+3-a.y)*(d.x-d.px))/den,t=((d.px-a.x)*dy-(d.py+3-a.y)*dx)/den;if(u>=0&&u<=1&&t>=0&&t<=1&&d.vy>0){if(!best||t<best.t)best={p,i,u,t,x:a.x+dx*u,y:a.y+dy*u};}}}if(best){const b=best;d.x=b.x;d.y=b.y-3;d.route={id:b.p.id,i:b.i,u:b.u,dir:aim(s,b.p)};d.vx=0;d.vy=0;}}
function route(s,d,dt){const r=d.route,p=s.paths.find(p=>p.id===r.id);if(!p){d.route=null;d.vy=25;return;}let left=105*dt,guard=0;while(left>0&&guard++<160){let a=p.points[r.i],b=p.points[r.i+1];if(!a||!b){d.route=null;return;}const len=distance(a,b),toEnd=len*(r.dir>0?1-r.u:r.u);if(left<toEnd&&len){r.u+=r.dir*left/len;left=0;d.x=a.x+(b.x-a.x)*r.u;d.y=a.y+(b.y-a.y)*r.u-3;}else{left-=toEnd;d.x=r.dir>0?b.x:a.x;d.y=(r.dir>0?b.y:a.y)-3;r.i+=r.dir;r.u=r.dir>0?0:1;if(r.i<0||r.i>=p.points.length-1){d.route=null;d.last=p.id;d.vx=Math.sign((b.x-a.x)*r.dir)*24;d.vy=30;return;}}}}
function tick(s,dt){s.time+=dt;s.spawn-=dt;for(const p of s.paths)p.life-=dt;s.paths=s.paths.filter(p=>p.life>0);if(s.spawn<=0){s.spawn+=.9;const n=s.serial++%s.clouds.length;if(s.drops.length<48)spawn(s,s.clouds[n]+(random(s)-.5)*30);}
for(const d of s.drops){d.age+=dt;d.px=d.x;d.py=d.y;if(d.route)route(s,d,dt);else{d.vx+=(s.wind-d.vx)*dt*.7;d.vy=Math.min(155,d.vy+180*dt);d.x+=d.vx*dt;d.y+=d.vy*dt;collide(s,d);if(!d.route)for(const rock of s.rocks)if(d.py<rock.y&&d.y>=rock.y&&d.x>rock.x&&d.x<rock.x+rock.w){d.x=d.x<rock.x+rock.w/2?rock.x-4:rock.x+rock.w+4;d.vx=d.x<rock.x?-30:30;d.y=rock.y+2;}}
if(d.y>=438&&!d.done){const f=s.flowers.find(f=>Math.abs(f.x-d.x)<25&&f.water<f.need);d.done=true;if(f){f.water++;s.delivered++;s.events.push({type:f.water===f.need?'bloom':'water',x:f.x,y:f.y,flower:s.flowers.indexOf(f)});}else{s.missed++;s.events.push({type:'miss',x:d.x,y:488});}}}
s.drops=s.drops.filter(d=>!d.done&&d.age<16&&d.x>-40&&d.x<400&&d.y<540);if(s.flowers.every(f=>f.water>=f.need)){s.phase='won';s.events.push({type:'won'});}}
function step(s,dt){if(s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;let remaining=Math.min(dt,.1);while(remaining>0&&s.phase==='playing'){const n=Math.min(remaining,1/120);tick(s,n);remaining-=n;}}
function stars(s){return s.phase==='won'?(s.missed<=5?3:s.missed<=18?2:1):0;}
const api={W,H,MAX_INK,MAX_PATHS,LIFE,levels,create,addPath,step,spawn,length,stars};root.RainEngine=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
