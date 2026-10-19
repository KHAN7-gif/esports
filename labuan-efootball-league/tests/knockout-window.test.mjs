import assert from 'node:assert/strict';
import {normalizeRoundWindow,resizeRoundWindow,roundAtPointer} from '../.sites-runtime/knockout-window.mjs';
assert.deepEqual(normalizeRoundWindow({start:0,end:0},4),{start:0,end:0});
assert.deepEqual(resizeRoundWindow({start:0,end:0},'end',3,4),{start:0,end:3});
assert.deepEqual(resizeRoundWindow({start:0,end:3},'end',2,4),{start:0,end:2});
assert.deepEqual(resizeRoundWindow({start:0,end:2},'start',1,4),{start:1,end:2});
assert.deepEqual(resizeRoundWindow({start:1,end:2},'start',3,4),{start:2,end:2});
assert.deepEqual(resizeRoundWindow({start:1,end:2},'end',0,4),{start:1,end:1});
assert.deepEqual(normalizeRoundWindow({start:4,end:7},3),{start:2,end:2});
assert.deepEqual(normalizeRoundWindow({start:-4,end:20},4),{start:0,end:3});
for(const count of [1,3,4,5])for(let step=-2;step<=count+2;step++){
 const x=50+step*100;
 assert.equal(roundAtPointer(x,50,100*count,count),Math.max(0,Math.min(count-1,step)));
}
assert.equal(roundAtPointer(449,50,400,4),3);assert.equal(roundAtPointer(50,50,0,4),0);
const previous={start:0,end:0};resizeRoundWindow(previous,'end',3,4);assert.deepEqual(previous,{start:0,end:0});
console.log('PASS: single-round, full-bracket and intermediate windows, both drag endpoints, pointer mapping, keyboard boundaries, stage-count changes and immutable selection.');
