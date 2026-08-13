/**
 * Hand the browser a file.
 *
 * There is no server to fetch it from and never will be, so the file is built in memory
 * and offered through an object URL. The anchor is created, clicked and thrown away
 * without ever being in the document: a visible link would have to carry a `href` that
 * goes stale the moment the reader types, and this way the name is decided at the click.
 *
 * DOM work, so it lives beside the component rather than in `src/lib` — only the naming is
 * a decision worth unit-testing, and that is `fileNameOf`.
 */
export function downloadText(fileName: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  // Revoking immediately is safe: the click has already handed the download off.
  URL.revokeObjectURL(url);
}
