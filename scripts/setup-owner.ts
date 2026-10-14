import { randomBytes } from 'node:crypto';
import { getPayload } from 'payload';
import config from '../src/payload.config';

async function main() {
  if (!process.env.VERCEL || process.env.VERCEL_ENV !== 'production') throw new Error('Production setup only');
  const p = await getPayload({ config });
  const email = 'jackdee.sync@gmail.com';
  const existing = await p.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 });
  if (existing.totalDocs) {
    console.log('Owner account already exists. No password changed or email resent.');
    return;
  }
  if ((await p.count({ collection: 'users' })).totalDocs) throw new Error('Existing users require administrator-led invitation');
  await p.create({ collection: 'users', data: { email, name: 'Jack Dee', role: 'administrator', active: true, password: randomBytes(48).toString('base64url') } });
  // Payload creates a limited-lived reset token and sends its standard setup link.
  // Never log the returned token, password, or message contents.
  await p.forgotPassword({ collection: 'users', data: { email } });
  console.log('Owner account created. Password setup message accepted by email transport.');
}
main().then(() => process.exit(0)).catch(() => { console.error('Owner setup did not complete. Inspect account state before retrying; no credentials logged.'); process.exit(1); });
