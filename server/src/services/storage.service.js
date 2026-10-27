import fs from 'node:fs/promises';
import path from 'node:path';

export const UPLOAD_DIR = path.join(import.meta.dirname, '..', '..', 'uploads');
// Call once when the server starts so the folder always exists.
export async function ensureUploadDir() {
 await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
// Turn a storage key into a full path.
// path.basename throws away any "../" a bad key might contain (see section 8).
export function pathFor(key) {
 return path.join(UPLOAD_DIR, path.basename(key));
}
// Delete the bytes. "Already gone" (ENOENT) is not an error for us.
export async function removeStored(key) {
 try {
 await fs.unlink(pathFor(key));
 } catch (error) {
 if (error.code !== 'ENOENT') throw error; // real problems still surface
 }
}