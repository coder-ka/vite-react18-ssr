export function createDummyIndexHtml(clientEntry: string) {
  return `<!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <script type="module" src="${clientEntry}"></script>
      </body>
    </html>
    `;
}
