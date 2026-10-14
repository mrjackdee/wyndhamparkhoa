import { put, get, del } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
const pathname = 'setup-check/' + randomUUID() + '.txt';
let stored;
try {
  stored = await put(pathname, 'WPHOA synthetic storage verification', { access: 'private', addRandomSuffix: false });
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200 || await new Response(result.stream).text() !== 'WPHOA synthetic storage verification') throw new Error('Read verification failed');
  const anonymous = await fetch(stored.url);
  if (anonymous.ok) throw new Error('Private object was publicly accessible');
  console.log('Private storage write/read and anonymous-access denial verified.');
} catch {
  console.error('Private storage verification failed.');
  process.exitCode = 1;
} finally {
  if (stored) await del(stored.url);
}
