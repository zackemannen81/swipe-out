import { ROUTE_LAB } from './track-labs.js';
import { suggestBoostPads } from './track-pads.js';
export const RACEWAY_LAB = {
  ...structuredClone(ROUTE_LAB), id:'raceway-lab', name:'TEST · Raceway Workshop', roadStyle:'raceway',
  pointWidths:[20,20,18,16,14,12,14,18,22,22,20,16,12,16,20],
  pads:[],
};
RACEWAY_LAB.pads = suggestBoostPads(RACEWAY_LAB);
RACEWAY_LAB.pads.push({id:'brake-demo',type:'brake',progress:0.025,offset:-3.5});
const branch=RACEWAY_LAB.branches[0];
RACEWAY_LAB.pads.push({id:'route-boost',type:'boost',progress:(branch.start+branch.end)/2,offset:0,routeId:branch.id});
