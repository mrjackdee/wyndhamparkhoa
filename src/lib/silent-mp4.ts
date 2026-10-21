// Validate a bounded ISO-BMFF MP4: a video track is required and audio tracks are rejected.
// This does not remove audio. Files must be exported without audio before uploading.
export function isSilentMP4(data: Buffer): boolean {
  let video = false, movie = false, media = false;
  const walk = (start: number, end: number, depth: number): boolean => {
    if (depth > 8) return false;
    let offset = start;
    while (offset < end) {
      if (offset + 8 > end) return false;
      let size = data.readUInt32BE(offset), header = 8;
      const kind = data.toString("ascii", offset + 4, offset + 8);
      if (size === 1) { if (offset + 16 > end) return false; const n = data.readBigUInt64BE(offset + 8); if (n > BigInt(data.length)) return false; size = Number(n); header = 16; }
      if (size === 0) size = end - offset;
      if (size < header || offset + size > end) return false;
      if (kind === "moov") movie = true;
      if (kind === "mdat") media = size > header;
      if (["moov", "trak", "mdia"].includes(kind) && !walk(offset + header, offset + size, depth + 1)) return false;
      if (kind === "hdlr") {
        if (size < header + 12) return false;
        const handler = data.toString("ascii", offset + header + 8, offset + header + 12);
        if (handler === "soun") return false;
        if (handler === "vide") video = true;
      }
      offset += size;
    }
    return offset === end;
  };
  return data.length > 24 && data.toString("ascii", 4, 8) === "ftyp" && walk(0, data.length, 0) && movie && media && video;
}
