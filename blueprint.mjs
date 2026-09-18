import {sampleRooms,drawBlueprint,containsPoint} from './blueprint-geometry.mjs';
const card=document.getElementById('blueprintCard'),drawing=document.getElementById('blueprintDrawing');
const canvas=document.getElementById('blueprintCanvas'),ctx=canvas.getContext('2d');
const labels=document.getElementById('blueprintLabels'),dimensions=document.getElementById('blueprintDimensions');
const section=document.getElementById('expertise'),steps=[...section.querySelectorAll('[data-step]')];
const controls=card.querySelector('.blueprint-view-switch');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const captions=['Capture the space','Resolve the geometry','Build the field app','Connect every workflow'];
let width=1,height=1,frame=0,lastTime=0,blend=1,targetBlend=1,selected='living',geometry=null,visible=false;
const buttons=new Map();
const motionAllowed=()=>!reduced.matches&&document.body.dataset.motionPaused!=='true';
function selectRoom(id){
 const room=sampleRooms.find(item=>item.id===id);if(!room)return;selected=id;
 document.getElementById('blueprintRoomName').textContent=room.name;
 document.getElementById('blueprintRoomSize').textContent=`${room.width.toFixed(2)} × ${room.depth.toFixed(2)} m`;
 document.getElementById('blueprintRoomArea').textContent=`${(room.width*room.depth).toFixed(2)} m²`;
 for(const [key,button] of buttons)button.setAttribute('aria-pressed',String(key===id));schedule();
}
function schedule(){if(ctx&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(render);}
function render(now){
 frame=0;if(!visible||document.hidden)return;
 const dt=lastTime?Math.min(.06,(now-lastTime)/1000):1/60;lastTime=now;
 blend=motionAllowed()?blend+(targetBlend-blend)*(1-Math.exp(-dt*13)):targetBlend;
 if(Math.abs(targetBlend-blend)<.001)blend=targetBlend;
 const rect=section.getBoundingClientRect(),progress=Math.min(1,Math.max(0,-rect.top/Math.max(1,rect.height-innerHeight)));
 let phase=0;for(let i=0;i<steps.length;i++)if(steps[i].getBoundingClientRect().top<innerHeight*.65)phase=i;
 document.getElementById('stepNumber').textContent=`0${phase+1} / 04`;
 document.getElementById('stepTitle').textContent=captions[phase];
 card.style.setProperty('--blueprint-progress',String(Math.max(.04,progress)));
 geometry=drawBlueprint(ctx,{width,height,blend,turn:motionAllowed()?(progress-.5)*.17:0,selected,scan:motionAllowed()?(progress*2.4)%1:.5,phase});
 for(const room of geometry.rooms){const button=buttons.get(room.id);button.style.left=`${room.point[0]}px`;button.style.top=`${room.point[1]}px`;}
 for(let i=0;i<2;i++){const el=dimensions.children[i],half=el.offsetWidth/2+5;el.style.left=`${Math.min(width-half,Math.max(half,geometry.dimensions[i][0]))}px`;el.style.top=`${Math.min(height-12,Math.max(12,geometry.dimensions[i][1]))}px`;}
 if(blend!==targetBlend)schedule();
}
function resize(){
 const rect=drawing.getBoundingClientRect();if(!rect.width||!rect.height)return;
 width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);schedule();
}
if(ctx){
 for(const room of sampleRooms){const button=document.createElement('button');button.type='button';button.className='blueprint-label';button.textContent=room.name;button.setAttribute('aria-label',`Select ${room.name.toLowerCase()}: ${room.width.toFixed(2)} by ${room.depth.toFixed(2)} metres`);button.addEventListener('click',()=>selectRoom(room.id));labels.append(button);buttons.set(room.id,button);}
 canvas.addEventListener('click',event=>{const rect=canvas.getBoundingClientRect(),point=[event.clientX-rect.left,event.clientY-rect.top];const room=geometry?.rooms.find(item=>containsPoint(point,item.polygon));if(room)selectRoom(room.id);});
 canvas.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect(),point=[event.clientX-rect.left,event.clientY-rect.top];canvas.style.cursor=geometry?.rooms.some(room=>containsPoint(point,room.polygon))?'pointer':'default';},{passive:true});
 controls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{targetBlend=button.dataset.blueprintView==='3d'?1:0;lastTime=0;for(const item of controls.children)item.setAttribute('aria-pressed',String(item===button));schedule();}));
 new ResizeObserver(resize).observe(drawing);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;resize();schedule();}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'}).observe(drawing);
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
 addEventListener('operator-motion-change',schedule);reduced.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
 selectRoom(selected);drawing.classList.add('is-ready');labels.hidden=false;dimensions.hidden=false;controls.hidden=false;resize();
}
