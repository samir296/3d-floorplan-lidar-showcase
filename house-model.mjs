import * as T from './vendor/three/three.module.js';
import { HOUSE_ROOMS } from './house-data.mjs';

// Metre-based furnished cutaway. Room floors and the inspector share one data source.
export function createHouseModel() {
  const house=new T.Group();house.name='IllustrativeHouse';
  const cache=new Map(),textures=[];
  let seed=91;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function texture(kind) {
    const size=256,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const i=(y*size+x)*4;
      let c;
      if(kind==='wood') {
        const row=Math.floor(y/32),seam=y%32<1||((x+row%2*83)%128<1);
        c=seam?-.12:(Math.sin(x*.15+Math.sin(y*.55)*2)*.025+Math.sin(y*.3)*.04+(random()-.5)*.05);
        data[i]=Math.max(0,Math.min(255,199+c*255));data[i+1]=Math.max(0,Math.min(255,170+c*230));data[i+2]=Math.max(0,Math.min(255,131+c*210));
      } else {
        c=220+(random()-.5)*27+((x+y)%2?4:-4);
        data[i]=c;data[i+1]=c;data[i+2]=c;
      }
      data[i+3]=255;
    }
    const map=new T.DataTexture(data,size,size,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;
    map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(kind==='wood'?3:5,kind==='wood'?3:5);
    map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    textures.push(map);return map;
  }
  const wood=texture('wood'),weave=texture('weave');
  const mat=(color,roughness=.8,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const m={wall:mat(0xf5f1e9),trim:mat(0xe5e1d7),oak:mat(0xffffff,.76,{map:wood}),walnut:mat(0x806349,.72),stone:mat(0xe6e2d8,.63),linen:mat(0xe2d6c4,.96,{map:weave}),fabric:mat(0xb6a28a,1,{map:weave}),white:mat(0xfffdf7,.9),ink:mat(0x243338,.55),orange:mat(0xad5638,.95,{map:weave}),leaf:mat(0x61704b,.92),glass:mat(0xc5e2e4,.15,{transparent:true,opacity:.2,metalness:.08,depthWrite:false}),metal:mat(0x8f9897,.28,{metalness:.75}),rug:mat(0xd7c9b7,1,{map:weave}),window:mat(0xd6e6e8,.42,{emissive:0xaac8d0,emissiveIntensity:.17})};
  let parent=house;
  function box(w,h,d,x,y,z,material=m.wall,target=parent,radius=0) {
    const round=radius||((material===m.linen||material===m.fabric||material===m.white&&h<.3)?Math.min(.065,w/5,h/3,d/5):0);
    const key=`${w}/${h}/${d}/${round}`;
    if(!cache.has(key)) {
      const geometry=new T.BoxGeometry(w,h,d,round?5:1,round?5:1,round?5:1);
      if(round) {
        const points=geometry.attributes.position,p=new T.Vector3(),core=new T.Vector3();
        for(let i=0;i<points.count;i++) {
          p.fromBufferAttribute(points,i);
          core.set(T.MathUtils.clamp(p.x,-w/2+round,w/2-round),T.MathUtils.clamp(p.y,-h/2+round,h/2-round),T.MathUtils.clamp(p.z,-d/2+round,d/2-round));
          p.sub(core).normalize().multiplyScalar(round).add(core);points.setXYZ(i,p.x,p.y,p.z);
        }
        geometry.computeVertexNormals();
      }
      cache.set(key,geometry);
    }
    const mesh=new T.Mesh(cache.get(key),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);return mesh;
  }
  function cylinder(rt,rb,h,x,y,z,material=m.walnut,target=parent,segments=24) {
    const key=`c/${rt}/${rb}/${h}/${segments}`;
    if(!cache.has(key))cache.set(key,new T.CylinderGeometry(rt,rb,h,segments));
    const mesh=new T.Mesh(cache.get(key),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);return mesh;
  }
  function ball(x,y,z,sx,sy,sz,material=m.leaf,target=parent) {
    if(!cache.has('sphere'))cache.set('sphere',new T.SphereGeometry(1,16,10));
    const mesh=new T.Mesh(cache.get('sphere'),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;target.add(mesh);return mesh;
  }
  function legs(x,z,w,d,h,top,material=m.walnut,target=parent) {
    for(const dx of [-1,1])for(const dz of [-1,1])box(.045,h,.045,x+dx*w/2,top-h/2,z+dz*d/2,material,target);
  }
  function plant(x,z,size=1,y=0) {
    cylinder(.17*size,.12*size,.3*size,x,y+.15*size,z,m.stone);
    cylinder(.014,.02,.65*size,x,y+.53*size,z,m.walnut,parent,8);
    for(let i=0;i<10;i++) {
      const a=i*2.4;
      const leaf=ball(x+Math.cos(a)*.2*size,y+(.45+i*.05)*size,z+Math.sin(a)*.2*size,.12*size,.25*size,.045*size);
      leaf.rotation.set(.5*Math.sin(a),a,.8*Math.cos(a));
    }
  }
  function lamp(x,z,y=0,size=1) {
    cylinder(.13*size,.14*size,.035,x,y+.02,z,m.ink);
    cylinder(.017,.017,.32*size,x,y+.18*size,z,m.metal);
    cylinder(.15*size,.21*size,.22*size,x,y+.39*size,z,m.white);
  }
  function picture(x,y,z,w,h,side=false) {
    const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side?Math.PI/2:0;parent.add(group);
    box(w,h,.035,0,0,0,m.walnut,group);box(w-.07,h-.07,.04,0,0,.013,m.white,group);
    box(w*.49,h*.55,.043,-w*.06,-h*.01,.02,m.fabric,group);
    box(w*.2,h*.29,.045,w*.19,h*.12,.025,m.orange,group);
  }
  box(8.36,.23,7.56,0,-.13,0,m.trim);
  const rooms=new Map();
  for(const room of HOUSE_ROOMS) {
    const group=new T.Group();group.name=`room-${room.id}`;group.userData.roomId=room.id;house.add(group);rooms.set(room.id,group);
    const [x1,x2,z1,z2]=room.bounds;
    const floor=box(room.width,.045,room.depth,(x1+x2)/2,.005,(z1+z2)/2,room.id==='bathroom'?m.stone:m.oak,group);
    floor.name=`floor-${room.id}`;floor.userData.roomId=room.id;
  }
  // Cutaway walls retain real door openings, with taller rear walls for depth.
  box(8.32,.25,.16,0,.105,3.69);box(.16,.32,7.4,4.09,.14,0);
  function rearWindow(x,width) {
    box(width,.58,.16,x,.29,-3.69);box(width,.13,.16,x,1.845,-3.69);
    box(width-.08,1.12,.035,x,1.18,-3.705,m.window);
    for(const dx of [-width/2,0,width/2])box(.055,1.2,.11,x+dx,1.18,-3.65,m.white);
    for(const y of [.59,1.78])box(width,.055,.11,x,y,-3.65,m.white);
    box(width+.12,.055,.26,x,.585,-3.59,m.white);
    for(const dx of [-1,1]) {
      const curtain=box(.32,1.58,.07,x+dx*(width/2+.12),1.06,-3.49,m.linen);
      for(let i=0;i<4;i++)cylinder(.021,.021,1.55,curtain.position.x-.12+i*.08,1.06,-3.44,m.linen);
    }
  }
  // Rear wall segments around two actual window openings.
  for(const [left,right] of [[-4.17,-3.45],[-1.05,1.4],[3.2,4.17]])box(right-left,1.91,.16,(left+right)/2,.955,-3.69);
  rearWindow(-2.25,2.4);rearWindow(2.3,1.8);
  box(.16,1.91,7.4,-4.09,.955,0);
  box(.025,.1,7.2,-3.997,.07,0,m.white);
  box(8,.1,.025,0,.07,-3.598,m.white);
  // Interior wall and doors. The kitchen opens into the dining area.
  for(const [back,front,h] of [[-3.6,-2.8,1.2],[-1.5,-1.06,.93],[-.17,.37,.93],[1.34,3.6,.7]])box(.16,h,front-back,.68,h/2,(back+front)/2);
  for(const z of [-1.42,.29])box(3.4,.8,.16,2.38,.4,z);
  function door(z,turn) {
    const hinge=new T.Group();hinge.position.set(.66,0,z);hinge.rotation.y=turn;house.add(hinge);
    box(.05,1.43,.83,0,.745,.415,m.walnut,hinge);
    box(.057,1.24,.67,0,.77,.415,m.oak,hinge);
    box(.065,.027,.09,.06,.73,.7,m.metal,hinge);
  }
  door(-1.06,-1.1);door(.48,-1.25);
  // Living and dining: rounded upholstery, woven rug, low media unit and plants.
  parent=rooms.get('living');
  box(3.55,.025,3.36,-1.86,.043,1.03,m.rug,parent,.025);
  box(.94,.32,2.91,-3.31,.26,.6,m.linen);
  box(.19,.7,2.99,-3.72,.54,.6,m.linen);
  for(const z of [-.87,2.07])box(.96,.59,.19,-3.3,.4,z,m.linen);
  for(let i=0;i<3;i++)box(.73,.17,.85,-3.21,.52,-.32+i*.91,m.white);
  box(1.85,.32,.95,-2.48,.26,1.75,m.linen);box(1.62,.17,.82,-2.38,.52,1.75,m.white);
  for(const [z,material] of [[-.4,m.orange],[.5,m.fabric],[1.35,m.linen]]) {
    const cushion=box(.16,.42,.46,-3.48,.79,z,material);cushion.rotation.z=-.2;
  }
  box(1.18,.1,.8,-1.45,.42,.86,m.ink,parent,.13);legs(-1.45,.86,.87,.53,.31,.37,m.ink);
  box(.3,.055,.23,-1.34,.5,.96,m.white);box(.28,.035,.22,-1.32,.544,.96,m.fabric);
  plant(-1.66,.77,.33,.49);cylinder(.082,.082,.045,-1.22,.495,.69,m.stone);
  cylinder(.34,.34,.36,-.76,.23,2.25,m.fabric);
  // Media cabinet along the left wall, behind the seating group.
  box(.39,.4,1.7,-3.7,.24,-2.3,m.walnut);box(.046,.73,1.36,-3.64,.9,-2.3,m.ink);
  for(const z of [-2.79,-2.31,-1.83])box(.025,.27,.012,-3.49,.24,z,m.trim);
  plant(-3.35,-3.04,1.05);plant(.12,2.95,.78);lamp(-3.62,2.77,0,1.9);
  picture(-3.99,1.15,.4,.84,.62,true);
  // Four-seat dining table in the rear of the open living space.
  box(1.36,.07,.85,-.75,.79,-2.2,m.walnut,parent,.035);legs(-.75,-2.2,1.09,.61,.73,.755);
  for(const x of [-1.14,-.36])for(const side of [-1,1]) {
    const chair=new T.Group();chair.position.set(x,0,-2.2+side*.69);chair.rotation.y=side>0?0:Math.PI;parent.add(chair);
    box(.39,.105,.4,0,.455,0,m.fabric,chair);box(.4,.39,.065,0,.7,.18,m.linen,chair);
    legs(0,0,.28,.27,.39,.403,m.walnut,chair);
  }
  plant(-.79,-2.2,.3,.83);cylinder(.07,.07,.035,-.32,.85,-2.15,m.white);
  // Kitchen: stone worktop, individual fronts, oven, inset sink and tap.
  parent=rooms.get('kitchen');
  box(2.3,.8,.59,1.97,.425,-3.285,m.walnut);
  box(2.36,.065,.66,1.97,.857,-3.25,m.stone);
  for(let i=0;i<4;i++) {
    box(.54,.72,.025,1.13+i*.57,.435,-2.976,m.walnut);
    box(.23,.02,.045,1.13+i*.57,.723,-2.957,m.metal);
    box(.012,.7,.026,.85+i*.57,.435,-2.968,m.ink);
  }
  box(.57,.5,.026,1.7,.41,-2.952,m.ink);box(.5,.29,.03,1.7,.4,-2.932,m.metal);
  box(.4,.23,.035,1.7,.4,-2.912,m.ink);box(.43,.025,.06,1.7,.635,-2.9,m.metal);
  box(.61,.02,.47,1.7,.899,-3.25,m.ink);
  for(const x of [1.55,1.85])for(const z of [-3.38,-3.12])cylinder(.073,.073,.012,x,.916,z,m.metal,parent,24);
  box(.58,.025,.41,2.59,.902,-3.25,m.metal);box(.45,.029,.3,2.59,.914,-3.25,m.ink);
  cylinder(.015,.015,.27,2.59,1.06,-3.48,m.metal,parent,12);box(.03,.03,.2,2.59,1.193,-3.39,m.metal);
  box(.71,1.78,.69,3.56,.916,-3.225,m.walnut);
  for(const y of [.45,1.31])box(.65,.81,.03,3.56,y,-2.865,m.stone);
  for(const y of [.62,1.14])box(.025,.28,.04,3.29,y,-2.84,m.metal);
  box(.39,.05,.26,1.06,.912,-3.2,m.oak);cylinder(.06,.06,.16,1.13,1.015,-3.39,m.stone);
  plant(3.7,-1.94,.6);
  // Bathroom: separate shower enclosure, toilet and a floating vanity.
  parent=rooms.get('bathroom');
  for(let x=.95;x<4;x+=.4)box(.008,.003,1.55,x,.03,-.565,m.trim);
  for(let z=-1.14;z<.21;z+=.4)box(3.24,.003,.008,2.38,.03,z,m.trim);
  box(.94,.07,1.25,3.47,.08,-.55,m.white);
  box(.027,1.43,1.28,2.984,.77,-.55,m.glass);
  cylinder(.015,.015,1.41,2.984,.77,.08,m.metal,parent,10);
  cylinder(.015,.015,1.27,3.78,.74,-1.25,m.metal,parent,10);
  box(.21,.028,.2,3.71,1.375,-1.17,m.metal);
  cylinder(.042,.042,.025,3.47,.12,-.55,m.metal,parent,16);
  box(.71,.48,.43,1.22,.48,-1.025,m.walnut);
  box(.75,.06,.47,1.22,.75,-1.025,m.white);
  ball(1.22,.8,-1.02,.25,.055,.17,m.stone);ball(1.22,.825,-1.02,.19,.025,.11,m.white);
  cylinder(.014,.014,.14,1.22,.86,-1.21,m.metal,parent,10);
  box(.86,1.53,.16,1.22,.765,-1.42,m.wall);
  box(.51,.6,.03,1.22,1.185,-1.322,m.metal);
  box(.44,.075,.21,2.16,.52,-1.115,m.white);
  box(.45,.48,.2,2.16,.33,-1.17,m.white);
  ball(2.16,.27,-.79,.24,.24,.35,m.white);
  const seat=new T.Mesh(new T.TorusGeometry(.205,.035,8,32),m.white);seat.rotation.x=Math.PI/2;seat.scale.y=1.37;seat.position.set(2.16,.475,-.76);parent.add(seat);
  // Bedroom: upholstered bed, folded throw, bedside lamps and a wardrobe.
  parent=rooms.get('bedroom');
  box(2.68,.022,2.9,2.38,.041,2.02,m.rug);
  box(1.79,.28,2.12,2.38,.24,2.06,m.fabric);
  box(1.76,.23,2.09,2.38,.49,2.07,m.white);
  box(1.89,.92,.12,2.38,.52,.995,m.fabric);
  for(const x of [1.95,2.79])box(.66,.14,.42,x,.665,1.34,m.white);
  box(1.8,.06,1.19,2.38,.64,2.48,m.linen);
  box(1.82,.072,.5,2.38,.69,2.63,m.fabric);
  for(let x=1.51;x<3.3;x+=.075)box(.012,.006,.49,x,.729,2.63,m.linen);
  for(const x of [1.18,3.56]) {
    box(.45,.46,.46,x,.27,1.39,m.walnut);box(.38,.018,.025,x,.29,1.63,m.trim);lamp(x,1.39,.5,.78);
  }
  box(.45,.9,1.03,1.07,.46,2.78,m.white);
  for(const z of [2.52,3.04])box(.025,.79,.48,1.31,.48,z,m.linen);
  plant(3.62,3.11,.73);
  house.userData.rooms=rooms;house.userData.textures=textures;
  house.updateMatrixWorld(true);
  return house;
}
