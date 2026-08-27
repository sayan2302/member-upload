/**
 * Direct native browser download utility
 * Uses synchronous anchor click during the user click event to preserve transient user activation.
 * This prevents modern Chrome/Edge from blocking the download as an unsolicited programmatic popup.
 */
export function downloadFile(url, fallbackFilename) {
  if (!url) return;

  const a = document.createElement('a');
  a.style.position = 'fixed';
  a.style.left = '-9999px';
  a.style.top = '-9999px';
  a.href = url;
  if (fallbackFilename) {
    a.download = fallbackFilename;
  }
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    try {
      if (a.parentNode) a.parentNode.removeChild(a);
    } catch (_) {}
  }, 2000);
}
