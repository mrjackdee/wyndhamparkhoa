import test from 'node:test';
import assert from 'node:assert/strict';
import { videoResponse } from '../src/lib/video-response';
test('MP4 response supports full, initial, open and suffix ranges; rejects invalid ranges', async () => {
 const bytes=new Uint8Array([0,1,2,3,4,5]);
 assert.equal(videoResponse(bytes,null).status,200);
 for(const [range,expected] of [['bytes=0-1',[0,1]],['bytes=3-',[3,4,5]],['bytes=-2',[4,5]]] as const) {
  const r=videoResponse(bytes,range);assert.equal(r.status,206);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],expected);
 }
 for(const range of ['bytes=10-','bytes=4-2','bytes=0-1,3-4','bytes=-0','broken']) assert.equal(videoResponse(bytes,range).status,416);
});
