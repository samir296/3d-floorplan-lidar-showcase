import { HOUSE_ROOMS, HOUSE_AREA, formatLength, formatArea } from './house-data.mjs';

const $=id=>document.getElementById(id);
const dialog=$('houseDialog'),viewport=$('houseViewport'),canvas=$('houseCanvas');
const start=$('houseStart'),previewTargets=$('housePreviewTargets'),roomMenu=$('houseRoomMenu');
const roomList=$('houseRoomList'),labelLayer=$('houseRoomLabels'),dimensionLayer=$('houseDimensionLabels');
const viewButtons=[...dialog.querySelectorAll('[data-house-view]')],unitButtons=[...dialog.querySelectorAll('[data-house-unit]')];
const modelControls=[...viewButtons,...['houseRotateLeft','houseRotateRight','houseZoomOut','houseZoomIn','houseReset'].map($)];
const labels=new Map(),listButtons=new Map();
let selected=HOUSE_ROOMS[0],unit='metric',viewer=null,loading=null,failed=false,opener=null,previousOverflow='';
const svgNS='http://www.w3.org/2000/svg';

function hitMap(container,onSelect) {
  const svg=document.createElementNS(svgNS,'svg');svg.classList.add('house-hit-map');svg.setAttribute('viewBox','0 0 1448 1086');svg.setAttribute('aria-hidden','true');
  for(const room of HOUSE_ROOMS) {
    const polygon=document.createElementNS(svgNS,'polygon');polygon.setAttribute('points',room.polygon);polygon.dataset.room=room.id;
    polygon.addEventListener('click',()=>onSelect(room.id));svg.append(polygon);
  }
  container.append(svg);return svg;
}
const previewMap=hitMap(previewTargets,id=>openExplorer(id));
const fallbackMap=hitMap(viewport,id=>selectRoom(id));
fallbackMap.classList.add('house-fallback-hit-map');
function markPreview(id) {
  for(const polygon of previewMap.children)polygon.classList.toggle('is-active',polygon.dataset.room===id);
}
for(const room of HOUSE_ROOMS) {
  const hot=document.createElement('button');hot.type='button';hot.className='house-hotspot';hot.style.left=`${room.poster[0]}%`;hot.style.top=`${room.poster[1]}%`;
  hot.innerHTML=`<span aria-hidden="true">+</span>${room.shortName}`;hot.setAttribute('aria-label',`Explore ${room.name.toLowerCase()} and its dimensions`);hot.setAttribute('aria-haspopup','dialog');
  hot.addEventListener('click',()=>openExplorer(room.id));hot.addEventListener('pointerenter',()=>markPreview(room.id));hot.addEventListener('pointerleave',()=>markPreview(null));hot.addEventListener('focus',()=>markPreview(room.id));hot.addEventListener('blur',()=>markPreview(null));previewTargets.append(hot);
  const menu=document.createElement('button');menu.type='button';menu.innerHTML=`${room.name}<span>${formatArea(room.area)}</span>`;menu.setAttribute('aria-haspopup','dialog');menu.addEventListener('click',()=>openExplorer(room.id));roomMenu.append(menu);
  const label=document.createElement('button');label.type='button';label.className='house-room-label';label.textContent=room.shortName;label.setAttribute('aria-label',`Select ${room.name.toLowerCase()}`);label.setAttribute('aria-pressed','false');label.addEventListener('click',()=>selectRoom(room.id));labelLayer.append(label);labels.set(room.id,label);
  const list=document.createElement('button');list.type='button';list.setAttribute('aria-pressed','false');list.addEventListener('click',()=>selectRoom(room.id));roomList.append(list);listButtons.set(room.id,list);
}
function updateViewButtons(view) {
  for(const button of viewButtons)button.setAttribute('aria-pressed',String(button.dataset.houseView===view));
  $('houseViewHelp').textContent=view==='top'?'Click a room · scroll or pinch to zoom':'Drag to orbit · click a room';
}
function selectRoom(id,announce=true) {
  const room=HOUSE_ROOMS.find(item=>item.id===id);if(!room)return;
  selected=room;
  $('houseSelectedName').textContent=room.name;$('houseSelectedDescription').textContent=room.description;
  $('houseSelectedArea').textContent=formatArea(room.area,unit);$('houseSelectedWidth').textContent=formatLength(room.width,unit);$('houseSelectedDepth').textContent=formatLength(room.depth,unit);
  $('houseSelectedHeight').textContent=formatLength(room.ceiling,unit);$('houseSelectedFinish').textContent=room.finish;$('houseTotalArea').textContent=formatArea(HOUSE_AREA,unit);
  for(const item of HOUSE_ROOMS) {
    const chosen=item.id===id;labels.get(item.id).setAttribute('aria-pressed',String(chosen));
    const button=listButtons.get(item.id);button.setAttribute('aria-pressed',String(chosen));button.innerHTML=`${item.name}<span>${formatArea(item.area,unit)}</span>`;
  }
  for(const polygon of fallbackMap.children)polygon.classList.toggle('is-active',polygon.dataset.room===id);
  if(viewer&&!failed)viewer.select(room,unit);
  if(announce)$('houseSelectionStatus').textContent=`${room.name}: ${formatLength(room.width,unit)} wide by ${formatLength(room.depth,unit)} long. Floor area ${formatArea(room.area,unit)}.`;
}
function positionFallbackLabels() {
  if(viewer&&!failed)return;
  const width=viewport.clientWidth,height=viewport.clientHeight;
  const imageWidth=Math.min(width,height*4/3),imageHeight=imageWidth*.75,left=(width-imageWidth)/2,top=(height-imageHeight)/2;
  for(const room of HOUSE_ROOMS) {
    const label=labels.get(room.id);label.style.left=`${left+imageWidth*room.poster[0]/100}px`;label.style.top=`${top+imageHeight*room.poster[1]/100}px`;
  }
}
function unavailable(error) {
  failed=true;viewer?.dispose();viewer=null;
  viewport.classList.remove('is-ready');dimensionLayer.hidden=true;fallbackMap.hidden=false;
  $('houseLoading').hidden=true;$('houseRenderStatus').hidden=false;
  $('houseRenderStatus').textContent='Showing the room preview. Select a room to explore its sample dimensions.';
  $('houseModelLabel').textContent='ROOM PREVIEW';$('houseViewHelp').textContent='Select a room to see its dimensions';
  for(const control of modelControls)control.disabled=true;
  positionFallbackLabels();console.warn('House model preview:',error);
}
async function prepareModel() {
  if(failed)return;
  if(viewer){viewer.setActive(true);return;}
  if(!loading)loading=import('./house-viewer.mjs');
  try {
    const module=await loading;if(!dialog.open||failed)return;
    if(!viewer)viewer=module.createHouseViewer({canvas,viewport,labels,widthLabel:$('houseWidthLabel'),depthLabel:$('houseDepthLabel'),onSelect:selectRoom,onError:unavailable,onViewChange:updateViewButtons});
    viewer.select(selected,unit);viewer.setActive(true);viewport.classList.add('is-ready');
    dimensionLayer.hidden=false;fallbackMap.hidden=true;$('houseLoading').hidden=true;
    for(const control of modelControls)control.disabled=false;
  }catch(error){unavailable(error);}
}
function openExplorer(id=selected.id) {
  selectRoom(id,false);
  if(dialog.open)return;
  opener=document.activeElement;previousOverflow=document.body.style.overflow;
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  document.body.style.overflow='hidden';positionFallbackLabels();
  $('houseClose').focus({preventScroll:true});
  prepareModel();
}
function closeExplorer(){if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');cleanup();}}
function cleanup(){viewer?.setActive(false);document.body.style.overflow=previousOverflow;opener?.focus({preventScroll:true});}
$('houseClose').addEventListener('click',closeExplorer);dialog.addEventListener('close',cleanup);
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeExplorer();
});
start.addEventListener('click',()=>openExplorer());
for(const button of unitButtons)button.addEventListener('click',()=>{
  unit=button.dataset.houseUnit;for(const item of unitButtons)item.setAttribute('aria-pressed',String(item===button));selectRoom(selected.id);
});
for(const button of viewButtons)button.addEventListener('click',()=>viewer?.setView(button.dataset.houseView));
$('houseRotateLeft').addEventListener('click',()=>viewer?.rotate(-Math.PI/8));$('houseRotateRight').addEventListener('click',()=>viewer?.rotate(Math.PI/8));
$('houseZoomIn').addEventListener('click',()=>viewer?.zoom(1.18));$('houseZoomOut').addEventListener('click',()=>viewer?.zoom(1/1.18));$('houseReset').addEventListener('click',()=>viewer?.reset());
new ResizeObserver(()=>{if(dialog.open)positionFallbackLabels();}).observe(viewport);
addEventListener('pagehide',event=>{if(!event.persisted)viewer?.dispose();});
selectRoom(selected.id,false);dimensionLayer.hidden=true;previewTargets.hidden=false;roomMenu.hidden=false;start.hidden=false;$('housePreviewHint').hidden=false;
