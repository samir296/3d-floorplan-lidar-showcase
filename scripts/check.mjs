import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const {drawBlueprint,containsPoint,sampleRooms}=await import(pathToFileURL(path.join(root,'blueprint-geometry.mjs')));
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
for(const [width,height] of [[256,170],[342,220],[664,440],[830,560]]){
 for(const blend of [0,.5,1]){
  const g=drawBlueprint(ctx,{width,height,blend});
  for(const room of g.rooms){
   assert(containsPoint(room.point,room.polygon),`${width}: ${room.id} center is selectable`);
   for(const p of room.polygon) assert(p.every(Number.isFinite));
   assert(room.point[0]>0&&room.point[0]<width&&room.point[1]>0&&room.point[1]<height);
  }
 }
}
class Element{
 constructor(){this.style={setProperty(){}};this.dataset={};this.children=[];this.handlers={};this.attributes={};this.classList={add(){}};this.offsetWidth=50;this.textContent='';}
 setAttribute(k,v){this.attributes[k]=v;}
 append(x){this.children.push(x);}
 addEventListener(k,v){this.handlers[k]=v;}
 getBoundingClientRect(){return {width:342,height:220,top:0,left:0,bottom:220};}
 querySelectorAll(){return this.children;}
}
const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
get('blueprintCanvas').getContext=()=>ctx;
const controls=new Element();controls.children=[new Element(),new Element()];controls.children[0].dataset.blueprintView='3d';controls.children[1].dataset.blueprintView='top';
get('blueprintCard').querySelector=()=>controls;
get('blueprintDimensions').children=[new Element(),new Element()];
get('expertise').children=[new Element()];
const clicks={};globalThis.document={getElementById:get,createElement:()=>new Element(),body:{dataset:{}},hidden:false,addEventListener:(n,f)=>clicks[n]=f,querySelector:()=>null};
globalThis.matchMedia=()=>({matches:true,addEventListener(){}});
globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
let queue=[];globalThis.requestAnimationFrame=f=>(queue.push(f),queue.length);globalThis.cancelAnimationFrame=()=>{};
globalThis.ResizeObserver=class{constructor(f){this.f=f;}observe(){this.f();}};
globalThis.IntersectionObserver=class{constructor(f){this.f=f;}observe(){this.f([{isIntersecting:true}]);}};
globalThis.addEventListener=()=>{};
await import(pathToFileURL(path.join(root,'blueprint.mjs')));
const flush=()=>{let guard=0;while(queue.length&&guard++<10){const q=queue;queue=[];q.forEach(f=>f(100));}};
flush();
for(const room of sampleRooms){
 const b=get('blueprintLabels').children.find(x=>x.textContent===room.name);assert(b);
 b.handlers.click();flush();
 assert.equal(get('blueprintRoomName').textContent,room.name);
 assert.equal(get('blueprintRoomArea').textContent,`${(room.width*room.depth).toFixed(2)} m²`);
 assert.equal(get('blueprintRoomSize').textContent,`${room.width.toFixed(2)} × ${room.depth.toFixed(2)} m`);
 assert.equal(b.attributes['aria-pressed'],'true');
}
for(const control of controls.children){control.handlers.click();flush();assert.equal(control.attributes['aria-pressed'],'true');}

const {HOUSE_ROOMS,HOUSE_AREA,roomAtPoint,formatLength,formatArea}=await import(pathToFileURL(path.join(root,'house-data.mjs')));
for(const room of HOUSE_ROOMS){assert.equal(roomAtPoint((room.bounds[0]+room.bounds[1])/2,(room.bounds[2]+room.bounds[3])/2).id,room.id);assert(room.area>0);}
assert.equal(roomAtPoint(100,100),null);assert.equal(formatLength(.3048,'imperial'),"1′ 0″");assert.equal(formatArea(.09290304,'imperial'),'1.0 sq ft');
assert(Math.abs(HOUSE_AREA-HOUSE_ROOMS.reduce((a,r)=>a+r.area,0))<1e-8);
const {createHouseModel}=await import(pathToFileURL(path.join(root,'house-model.mjs')));
const model=createHouseModel();let meshes=0;model.traverse(object=>{if(object.isMesh){meshes++;assert(object.geometry.attributes.position.count>0);}});assert(meshes>30);
console.log(`PASS: room selection, both blueprint views, mobile/desktop hit regions, unit conversion and ${meshes} house meshes. No browser rendering assertions.`);
