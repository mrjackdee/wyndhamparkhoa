import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isSilentMP4 } from "../src/lib/silent-mp4";
test("silent MP4 validator accepts the exported video and rejects audio, truncation and false file types", () => {
  const video = fs.readFileSync("assets/meeting-2026-10-17-additions/community-meeting-silent.mp4");
  assert.equal(isSilentMP4(video), true);
  const audio = Buffer.from(video); const handler = audio.indexOf(Buffer.from("vide"));
  assert.ok(handler > 0); audio.write("soun",handler);
  assert.equal(isSilentMP4(audio), false);
  assert.equal(isSilentMP4(video.subarray(0,video.length-100)), false);
  assert.equal(isSilentMP4(Buffer.from("not a video")), false);
});
