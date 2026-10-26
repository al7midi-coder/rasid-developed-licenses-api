/**
 * Word export: the rendered minutes HTML is packaged as MHTML (multipart/related) so Word opens it as a normal
 * document with the logos embedded. Page, fonts and RTL come from the same HTML used for the PDF.
 */
export function toWordMhtml(html: string, title: string): string {
  const parts: { loc: string; mime: string; b64: string }[] = [];
  let n = 0;
  let body = html.replace(/@font-face\{[^}]*\}/g, '').replace(/data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)/gi, (_m, mime: string, b64: string) => {
    const loc = `img${++n}.${(mime.split('/')[1] ?? 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg')}`;
    parts.push({ loc, mime, b64 });
    return loc;
  });
  body = body.replace(/<html /i, '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" ')
    .replace('</head>', '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:BiDi/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:14mm 12mm 16mm 12mm}</style></head>');
  const b = '----=_Rasid_Minutes_' + Date.now().toString(36);
  const wrap = (s: string) => s.replace(/(.{76})/g, '$1\r\n');
  const out: string[] = [
    'MIME-Version: 1.0', `Content-Type: multipart/related; type="text/html"; boundary="${b}"`, '',
    `--${b}`, 'Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64', 'Content-Location: file:///minutes.htm', '', wrap(Buffer.from(body, 'utf-8').toString('base64')), ''
  ];
  for (const p of parts) out.push(`--${b}`, `Content-Type: ${p.mime}`, 'Content-Transfer-Encoding: base64', `Content-Location: ${p.loc}`, '', wrap(p.b64), '');
  out.push(`--${b}--`, '');
  void title;
  return out.join('\r\n');
}
