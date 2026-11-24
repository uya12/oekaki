'use strict';
// 公開するときに、index.html の OGP（og:url・og:image・twitter:image）を絶対URLに書きかえる。
// SNS（X・LINE・Discord など）は、相対パスの画像を読めないことが多いため。
// SITE_URL は actions/configure-pages の base_url（例：https://example.github.io/oekaki）
const fs = require('fs');
const base = (process.env.SITE_URL || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) { console.log('SITE_URL がないので、OGP は相対パスのまま'); process.exit(0); }
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8'), n = 0;
html = html.replace(/(<meta (?:property|name)="(?:og:url|og:image|twitter:image)" content=")\.\/([^"]*)"/g, (_, head, rest) => { n++; return `${head}${base}/${rest}"`; });
fs.writeFileSync(file, html);
console.log(`OGP の URL を ${n} か所、${base}/ から始まる形にしました`);
