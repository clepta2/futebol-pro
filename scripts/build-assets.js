import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('.');

const css = fs.readFileSync(path.join(rootDir, 'ponte-suite.css'), 'utf8');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const dados = fs.readFileSync(path.join(rootDir, 'dados-futebol.js'), 'utf8');
const sdk = fs.readFileSync(path.join(rootDir, 'futebol-pro.js'), 'utf8');

const ozproMarkSvg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#a3e635"/>
  <path d="M12 28V12L28 20L12 28Z" fill="#0c1715"/>
</svg>`;

const output = `// site-assets.js — Gerado automaticamente para entrega na Borda Cloudflare Anycast (<5ms)
// 100% Soberano (Zero I/O externo / Zero CDNs)

export const STYLES_CSS = ${JSON.stringify(css)};
export const HTML_INDEX = ${JSON.stringify(html)};
export const DADOS_FUTEBOL_JS = ${JSON.stringify(dados)};
export const FUTEBOL_PRO_SDK_JS = ${JSON.stringify(sdk)};
export const OZPRO_MARK_SVG = ${JSON.stringify(ozproMarkSvg)};
`;

fs.writeFileSync(path.join(rootDir, 'site-assets.js'), output, 'utf8');
console.log(`✅ site-assets.js gerado com sucesso! (${(output.length / 1024).toFixed(1)} KB)`);
