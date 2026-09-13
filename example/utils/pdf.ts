import { Directory, File, Paths } from 'expo-file-system';

const pdfsDir = new Directory(Paths.cache, 'pdfs');
// Separate from pdfsDir so a user-chosen export filename can never collide
// with (and overwrite) one of this app's own in-use working files.
const exportsDir = new Directory(Paths.cache, 'exports');

function ensureDir(dir: Directory) {
  if (!dir.exists) {
    dir.create();
  }
}

/**
 * A writable path for a demo PDF, in the app's cache directory (safe on both
 * platforms - unlike a hardcoded `/data/local/tmp/...` path, which some
 * Android system images don't let apps write to at all).
 *
 * @returns `{ path, uri }` - `path` is a plain filesystem path for this
 * library's `save`/`open`, `uri` is a `file://` URI for `<PdfView uri={...} />`.
 */
export function demoPdfPath(name: string): { path: string; uri: string } {
  ensureDir(pdfsDir);
  const file = new File(pdfsDir, `${name}.pdf`);
  return { path: file.uri.replace(/^file:\/\//, ''), uri: file.uri };
}

/**
 * Copies `sourcePath` to a new file named `filename` (sanitized, `.pdf`
 * appended if missing) in the app's cache directory, and returns its
 * `file://` URI - ready to hand to `expo-sharing`'s `shareAsync`, since
 * sharing/saving the *original* working file directly would let the OS's
 * share sheet overwrite or rename a file this app still writes to on the
 * next operation.
 */
export async function copyForExport(
  sourcePath: string,
  filename: string
): Promise<string> {
  ensureDir(exportsDir);
  const safeName = filename.trim().replace(/[/\\]/g, '_') || 'export';
  const withExtension = safeName.toLowerCase().endsWith('.pdf')
    ? safeName
    : `${safeName}.pdf`;
  // File's constructor requires a `file:///` URI, not a bare path - sourcePath
  // is the stripped `path` half of demoPdfPath()'s return value, meant for
  // native save()/open() calls, so the scheme has to be added back here.
  const sourceUri = sourcePath.startsWith('file://')
    ? sourcePath
    : `file://${sourcePath}`;
  const source = new File(sourceUri);
  const destination = new File(exportsDir, withExtension);
  if (destination.exists) {
    destination.delete();
  }
  await source.copy(destination);
  return destination.uri;
}
