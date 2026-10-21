import { videoResponse } from "./video-response";
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types';
import { getStorageFilePath } from '@payloadcms/plugin-cloud-storage/utilities';
import { put, get, del } from '@vercel/blob';

// Payload checks media access before invoking staticHandler. Never expose a Blob URL.
export const privateBlobAdapter: Adapter = ({ collection, prefix = 'media' }) => ({
  name: 'wphoa-private-blob',
  handleUpload: async ({ file, storageFilePath }) => {
    await put(storageFilePath, file.buffer, {
      access: 'private', addRandomSuffix: false, contentType: file.mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  },
  handleDelete: async ({ storageFilePath }) => {
    await del(storageFilePath, { token: process.env.BLOB_READ_WRITE_TOKEN });
  },
  staticHandler: async (req, { doc, params: { filename } }) => {
    try {
      const pathname = await getStorageFilePath({ collection, collectionPrefix: prefix, doc, filename, req });
      const result = await get(pathname, { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN });
      if (!result || result.statusCode !== 200) return new Response(null, { status: 404 });
      if (result.blob.contentType === 'video/mp4') {
        const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
        return videoResponse(bytes, req.headers.get('range'));
      }
      return new Response(result.stream, { headers: {
        'Content-Type': result.blob.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      } });
    } catch { return new Response(null, { status: 404 }); }
  },
});
export const privateBlobStorage = () => cloudStoragePlugin({
  collections: { media: { adapter: privateBlobAdapter, disableLocalStorage: true, prefix: process.env.HOA_QA_SCHEMA ? 'qa/' + process.env.HOA_QA_SCHEMA : 'media' } },
});
