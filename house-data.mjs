// Fictional demonstration home. Values describe this model, not a scanned property.
export const HOUSE_ROOMS = Object.freeze([
  {id:'living', name:'Living & dining', shortName:'Living', number:'01', bounds:[-4, .6, -3.6, 3.6], ceiling:2.7, finish:'Oak flooring', description:'An open living and dining space, with room boundaries ready for review.', anchor:[-1.65,.13,1.3], poster:[35,43], polygon:'119,410 348,100 719,222 826,385 749,455 641,727 158,541'},
  {id:'kitchen', name:'Kitchen', shortName:'Kitchen', number:'02', bounds:[.76, 4, -3.6, -1.5], ceiling:2.7, finish:'Oak flooring', description:'A fitted kitchen with cabinetry, appliances and a connected dining area.', anchor:[2.28,.13,-2.05], poster:[63,26], polygon:'744,238 808,58 1271,189 1190,343 1001,294 939,421 826,383'},
  {id:'bathroom', name:'Bathroom', shortName:'Bath', number:'03', bounds:[.76, 4, -1.34, .21], ceiling:2.7, finish:'Porcelain tile', description:'A separate bathroom with a shower, vanity and clearly defined floor area.', anchor:[2.3,.13,-.52], poster:[76,40], polygon:'1001,295 1196,344 1162,509 1018,467 970,522 931,425'},
  {id:'bedroom', name:'Bedroom', shortName:'Bedroom', number:'04', bounds:[.76, 4, .37, 3.6], ceiling:2.7, finish:'Oak flooring', description:'A private bedroom with a furnished layout and measurable room boundaries.', anchor:[2.3,.13,2.5], poster:[70,65], polygon:'790,476 1001,509 1192,560 1095,869 692,681'}
].map(room => Object.freeze({...room, width:room.bounds[1]-room.bounds[0], depth:room.bounds[3]-room.bounds[2], area:(room.bounds[1]-room.bounds[0])*(room.bounds[3]-room.bounds[2])})));

export const HOUSE_AREA = HOUSE_ROOMS.reduce((sum,room)=>sum+room.area,0);
export function roomAtPoint(x,z) {
  return HOUSE_ROOMS.find(({bounds:[left,right,back,front]})=>x>=left&&x<=right&&z>=back&&z<=front) || null;
}
export function formatLength(metres,unit='metric') {
  if(unit==='metric')return `${metres.toFixed(2)} m`;
  const inches=Math.round(metres/0.0254);
  return `${Math.floor(inches/12)}′ ${inches%12}″`;
}
export function formatArea(squareMetres,unit='metric') {
  return unit==='metric'?`${squareMetres.toFixed(2)} m²`:`${(squareMetres/0.09290304).toFixed(1)} sq ft`;
}
