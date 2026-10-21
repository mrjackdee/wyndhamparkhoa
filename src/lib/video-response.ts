// Small, validated MP4s are capped at 3 MB by the Media collection.
// Byte ranges allow iPhone/Safari playback and seeking without exposing the private Blob URL.
export function videoResponse(bytes: Uint8Array, range: string | null): Response {
  const total = bytes.byteLength;
  const headers: Record<string, string> = {
    'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
  if (!range) return new Response(bytes as BodyInit, { headers: { ...headers, 'Content-Length': String(total) } });
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const invalid = () => new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${total}` } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, total - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= total || start > end) return invalid();
  return new Response(bytes.slice(start, end + 1) as BodyInit, { status: 206, headers: {
    ...headers, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${total}`,
  } });
}
