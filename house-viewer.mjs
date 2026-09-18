import * as T from './vendor/three/three.module.js';
import { createHouseModel } from './house-model.mjs';
import { HOUSE_ROOMS, formatLength } from './house-data.mjs';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

export function createHouseViewer({canvas,viewport,labels,widthLabel,depthLabel,onSelect,onError,onViewChange=()=>{}}) {
  let renderer,environment,house,scene,camera,frame=0,disposed=false,active=true;
  let selected=HOUSE_ROOMS[0],unit='metric',view='3d',width=1,height=1,lastTime=0,dirty=true;
  const initial={yaw:.59,pitch:.88,zoom:1},current={...initial},target={...initial};
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pointers=new Map();let gesture=null;
  const raycaster=new T.Raycaster(),mouse=new T.Vector2(),point=new T.Vector3();
  const geometries=new Set(),materials=new Set(),textures=new Set(),listeners=[];
  const listen=(el,type,fn,options)=>{el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));};
  let resizeObserver;
  const selection=new T.Group();
  const outline=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xb44724,transparent:true,opacity:.8,depthTest:false}));
  const fill=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xf96139,transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}));
  fill.rotation.x=-Math.PI/2;fill.position.y=.048;fill.renderOrder=2;outline.renderOrder=4;
  selection.add(fill,outline);
  let widthAnchor=new T.Vector3(),depthAnchor=new T.Vector3();
  function wake(){if(active&&!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(render);}
  function positionLabel(element,p) {
    point.copy(p).project(camera);
    const half=element.offsetWidth/2+8;
    element.style.left=`${T.MathUtils.clamp((point.x*.5+.5)*width,half,Math.max(half,width-half))}px`;
    element.style.top=`${T.MathUtils.clamp((-.5*point.y+.5)*height,17,Math.max(17,height-17))}px`;
  }
  function render(now) {
    frame=0;
    if(!active||disposed||document.hidden){lastTime=0;return;}
    const dt=lastTime?Math.min((now-lastTime)/1000,.06):1/60;lastTime=now;
    let moving=false;
    for(const key of ['yaw','pitch','zoom']) {
      if(Math.abs(current[key]-target[key])>.0002){current[key]=motion.matches?target[key]:T.MathUtils.damp(current[key],target[key],12,dt);moving=true;}else current[key]=target[key];
    }
    const radius=22;
    camera.position.set(Math.sin(current.yaw)*Math.cos(current.pitch)*radius,Math.sin(current.pitch)*radius+.2,Math.cos(current.yaw)*Math.cos(current.pitch)*radius);
    camera.lookAt(0,.2,0);camera.zoom=current.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    renderer.render(scene,camera);
    for(const room of HOUSE_ROOMS)positionLabel(labels.get(room.id),new T.Vector3(...room.anchor));
    positionLabel(widthLabel,widthAnchor);positionLabel(depthLabel,depthAnchor);
    dirty=false;if(moving)wake();
  }
  function resize() {
    if(!renderer||disposed)return;
    const rect=viewport.getBoundingClientRect();width=rect.width;height=rect.height;
    if(!width||!height)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<550?1.5:1.8));renderer.setSize(width,height,false);
    const aspect=width/height,halfHeight=Math.max(5.95,5.95/aspect);
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();dirty=true;wake();
  }
  function setSelection(room,newUnit=unit) {
    selected=room;unit=newUnit;
    const [x1,x2,z1,z2]=room.bounds,y=.075;
    fill.scale.set(room.width,room.depth,1);fill.position.set((x1+x2)/2,.049,(z1+z2)/2);
    const points=[];
    const line=(a,b)=>points.push(new T.Vector3(...a),new T.Vector3(...b));
    for(const [a,b] of [[[x1,y,z1],[x2,y,z1]],[[x2,y,z1],[x2,y,z2]],[[x2,y,z2],[x1,y,z2]],[[x1,y,z2],[x1,y,z1]]])line(a,b);
    const z=z2+.17,x=x2+.17;
    line([x1,y,z],[x2,y,z]);line([x,y,z1],[x,y,z2]);
    for(const xx of [x1,x2])line([xx,y,z-.1],[xx,y,z+.1]);
    for(const zz of [z1,z2])line([x-.1,y,zz],[x+.1,y,zz]);
    const previous=outline.geometry;outline.geometry=new T.BufferGeometry().setFromPoints(points);previous.dispose();
    widthAnchor.set((x1+x2)/2,y,z+.05);depthAnchor.set(x+.05,y,(z1+z2)/2);
    widthLabel.textContent=formatLength(room.width,unit);depthLabel.textContent=formatLength(room.depth,unit);
    dirty=true;wake();
  }
  function hitRoom(clientX,clientY) {
    const rect=viewport.getBoundingClientRect();
    mouse.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects([...house.userData.rooms.values()],true);
    for(const hit of hits) {
      let node=hit.object;
      while(node&&node!==house){if(node.userData.roomId)return HOUSE_ROOMS.find(room=>room.id===node.userData.roomId);node=node.parent;}
    }
    return null;
  }
  function zoomBy(factor){target.zoom=T.MathUtils.clamp(target.zoom*factor,.75,1.9);dirty=true;wake();}
  function rotate(delta){if(view==='top')setView('3d');target.yaw+=delta;dirty=true;wake();}
  function setView(next) {
    view=next;onViewChange(view);
    if(next==='top'){target.yaw=0;target.pitch=Math.PI/2-.0001;}else{target.yaw=initial.yaw;target.pitch=initial.pitch;}
    dirty=true;wake();
  }
  function reset(){view='3d';onViewChange(view);Object.assign(target,initial);dirty=true;wake();}
  function pointerDown(event) {
    if(event.target.closest('button')||event.button!==0&&event.pointerType!=='touch')return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});viewport.setPointerCapture(event.pointerId);
    if(pointers.size===1)gesture={x:event.clientX,y:event.clientY,yaw:target.yaw,pitch:target.pitch,moved:false,pinch:false};
    else {
      const [a,b]=[...pointers.values()];gesture={pinch:true,moved:true,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:target.zoom};
    }
  }
  function pointerMove(event) {
    if(!pointers.has(event.pointerId)) {
      if(event.pointerType==='mouse'&&active)viewport.style.cursor=hitRoom(event.clientX,event.clientY)?'pointer':'grab';
      return;
    }
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size>1&&gesture?.pinch) {
      const [a,b]=[...pointers.values()];target.zoom=T.MathUtils.clamp(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance,.75,1.9);wake();return;
    }
    if(!gesture||gesture.pinch)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(Math.hypot(dx,dy)>6)gesture.moved=true;
    if(gesture.moved&&view==='3d') {
      target.yaw=gesture.yaw-dx*.007;target.pitch=T.MathUtils.clamp(gesture.pitch+dy*.006,.42,1.5);
      viewport.classList.add('is-dragging');viewport.style.cursor='grabbing';wake();
    }
  }
  function pointerEnd(event) {
    if(!pointers.has(event.pointerId))return;
    if(event.type==='pointerup'&&pointers.size===1&&gesture&&!gesture.moved&&!gesture.pinch) {
      const room=hitRoom(event.clientX,event.clientY);if(room)onSelect(room.id);
    }
    pointers.delete(event.pointerId);
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    if(!pointers.size){gesture=null;viewport.classList.remove('is-dragging');viewport.style.cursor='grab';}
    else if(pointers.size===1)gesture={pinch:true,moved:true};
  }
  function dispose() {
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();listeners.forEach(fn=>fn());
    scene?.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(material=>materials.add(material));if(node.isLight)node.shadow?.dispose();});
    for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();
    environment?.dispose();renderer?.dispose();
  }
  try {
    renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.setClearColor(0xe9eeeb,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    scene=new T.Scene();camera=new T.OrthographicCamera(-7,7,5,-5,.1,80);
    const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
    environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.43;room.dispose();pmrem.dispose();
    scene.add(new T.HemisphereLight(0xf8fcff,0xb7afa0,2.3));
    const key=new T.DirectionalLight(0xfff0d9,3);key.position.set(-5,13,6);key.castShadow=true;
    key.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
    Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:35});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
    const light=new T.DirectionalLight(0xe1f0ff,1.2);light.position.set(7,7,-6);scene.add(light);
    house=createHouseModel();scene.add(house);scene.add(selection);
    const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xe9eeeb,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.25;ground.receiveShadow=true;scene.add(ground);
    scene.updateMatrixWorld(true);setSelection(selected);resize();
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
    listen(viewport,'pointerdown',pointerDown);listen(viewport,'pointermove',pointerMove);listen(viewport,'pointerup',pointerEnd);listen(viewport,'pointercancel',pointerEnd);
    listen(viewport,'lostpointercapture',event=>{pointers.delete(event.pointerId);if(!pointers.size){gesture=null;viewport.classList.remove('is-dragging');}});
    listen(viewport,'wheel',event=>{event.preventDefault();zoomBy(Math.exp(-event.deltaY*.001));},{passive:false});
    listen(viewport,'keydown',event=>{
      if(event.target!==viewport)return;
      const actions={ArrowLeft:()=>rotate(-.2),ArrowRight:()=>rotate(.2),ArrowUp:()=>{if(view==='3d')target.pitch=Math.min(1.5,target.pitch+.12);wake();},ArrowDown:()=>{if(view==='3d')target.pitch=Math.max(.42,target.pitch-.12);wake();},'+':()=>zoomBy(1.15),'=':()=>zoomBy(1.15),'-':()=>zoomBy(1/1.15),Home:reset};
      if(actions[event.key]){event.preventDefault();actions[event.key]();}
    });
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();active=false;cancelAnimationFrame(frame);frame=0;onError(new Error('Graphics context interrupted.'));});
    listen(document,'visibilitychange',()=>{lastTime=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
    render(performance.now());
    return {select:setSelection,setView,rotate,zoom:zoomBy,reset,resize,setActive(value){active=value;lastTime=0;if(!value){cancelAnimationFrame(frame);frame=0;pointers.clear();gesture=null;}else{resize();wake();}},dispose};
  }catch(error){dispose();throw error;}
}
