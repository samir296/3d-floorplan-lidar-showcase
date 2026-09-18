import {sampleRooms} from './roomplan-demo.mjs';
export {sampleRooms};
export const blueprintWalls=[
  [0,0,582,0,125],[0,0,0,416,105],[582,0,582,416,24],
  [0,416,110,416,24],[190,416,582,416,24],
  [360,0,360,100,65],[360,172,360,280,65],[360,352,360,416,65],[360,240,582,240,65]
];
export function createProjection(width,height,blend=1,turn=0) {
  const angle=.57+turn,cos=Math.cos(angle),sin=Math.sin(angle);
  const raw=(x,z,h=0)=>{
    const dx=x-291,dz=z-208;
    return [(dx*cos-dz*sin)*blend+dx*(1-blend),((dx*sin+dz*cos)*.48-h*.95)*blend+dz*(1-blend)];
  };
  const corners=[];
  for(const x of [-28,622])for(const z of [-20,466])for(const h of [0,125])corners.push(raw(x,z,h));
  const xmin=Math.min(...corners.map(p=>p[0])),xmax=Math.max(...corners.map(p=>p[0]));
  const ymin=Math.min(...corners.map(p=>p[1])),ymax=Math.max(...corners.map(p=>p[1]));
  const scale=Math.min((width-44)/(xmax-xmin),(height-58)/(ymax-ymin));
  const offsetX=width/2-(xmax+xmin)/2*scale,offsetY=height/2-(ymax+ymin)/2*scale;
  return (x,z,h=0)=>{const p=raw(x,z,h);return [offsetX+p[0]*scale,offsetY+p[1]*scale];};
}
export function drawBlueprint(ctx,{width,height,blend=1,turn=0,selected='living',scan=.5,phase=0}) {
  const p=createProjection(width,height,blend,turn);
  ctx.clearRect(0,0,width,height);
  const path=points=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));};
  const polygon=(vertices,fill,stroke=null,lineWidth=1)=>{path(vertices);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}};
  const line=(a,b,color,lineWidth=1,dashes=[])=>{path([a,b]);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dashes);ctx.stroke();ctx.setLineDash([]);};
  const rect=(x,z,w,d,h=0)=>[p(x,z,h),p(x+w,z,h),p(x+w,z+d,h),p(x,z+d,h)];
  // Ground shadow, plinth and clear room surfaces.
  ctx.save();ctx.shadowColor='#00000070';ctx.shadowBlur=28;ctx.shadowOffsetY=12;
  polygon(rect(-10,-10,602,436,-12),'#091a23');ctx.restore();
  polygon([p(-10,426),p(592,426),p(592,426,-15),p(-10,426,-15)],'#183747','#355461');
  polygon([p(592,-10),p(592,426),p(592,426,-15),p(592,-10,-15)],'#102935','#355461');
  polygon(rect(0,0,582,416),'#102e3b','#527d8c',1);
  for(const room of sampleRooms)polygon(room.polygon.map(([x,z])=>p(x,z)),room.id===selected?'#483c33':'#173745','#42616a',.8);
  // Grid is restricted to the floor rather than covering every wall.
  for(let x=25;x<582;x+=25)line(p(x,0),p(x,416),'#8ec5d00f',.7);
  for(let z=25;z<416;z+=25)line(p(0,z),p(582,z),'#8ec5d00f',.7);
  // Scan progression follows the scroll narrative. It is a sample visualization.
  if(phase<2){const x=20+542*scan;polygon([p(x-16,0),p(x+16,0),p(x+16,416),p(x-16,416)],'#ff855216');line(p(x,0),p(x,416),'#ffad79b3',1.2);}
  // Rear walls are drawn first; internal walls are lowered to reveal the rooms.
  for(const [x1,z1,x2,z2,wallHeight] of blueprintWalls){
    const h=wallHeight*blend,a=p(x1,z1),b=p(x2,z2),c=p(x2,z2,h),d=p(x1,z1,h);
    if(blend>.01){polygon([a,b,c,d],z1===z2?'#28515e':'#1d404f','#6d9aab',1);line(d,c,'#c0d8d9',2);}
    line(a,b,'#9abac2',blend>.01?1.2:4);
  }
  // Window openings and mullions on the rear wall.
  for(const [x1,x2] of [[68,228],[425,540]]){
    if(blend>.1){polygon([p(x1,0,42*blend),p(x2,0,42*blend),p(x2,0,103*blend),p(x1,0,103*blend)],'#112c3d','#7fb8c5',1.3);line(p((x1+x2)/2,0,42*blend),p((x1+x2)/2,0,103*blend),'#6a9eaf',1);}
    else line(p(x1,0),p(x2,0),'#66becb',4);
  }
  // Door leaves and their swing arcs use the same room coordinates.
  for(const [x,z,r,start,end] of [[110,416,80,-Math.PI/2,0],[360,100,72,Math.PI/2,Math.PI],[360,280,72,0,Math.PI/2]]){
    const arc=[];for(let i=0;i<=20;i++){const a=start+(end-start)*i/20;arc.push(p(x+Math.cos(a)*r,z+Math.sin(a)*r));}
    path(arc);ctx.strokeStyle='#c49a7570';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);
    line(p(x,z),arc[start===Math.PI/2?20:0],'#cfad89',1.5);
  }
  // The selected floor boundary stays visible above the cutaway surfaces.
  const selectedRoom=sampleRooms.find(room=>room.id===selected)||sampleRooms[0];
  polygon(selectedRoom.polygon.map(([x,z])=>p(x,z)),null,'#ffac80',1.5);
  const a=p(0,450),b=p(582,450),c=p(616,0),d=p(616,416);
  line(a,b,'#89a1a9',1);line(c,d,'#89a1a9',1);
  for(const x of [0,582])line(p(x,442),p(x,458),'#89a1a9',1);
  for(const z of [0,416])line(p(608,z),p(624,z),'#89a1a9',1);
  const centers={living:[178,260],kitchen:[473,134],study:[479,326]};
  return {rooms:sampleRooms.map(room=>({id:room.id,point:p(...centers[room.id]),polygon:room.polygon.map(([x,z])=>p(x,z))})),dimensions:[p(291,457),p(627,208)]};
}
export function containsPoint(point,polygon){
  let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [x,y]=point,[xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }return inside;
}
