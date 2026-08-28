const fs = require('fs');
let c = fs.readFileSync('src/modules/invitation/components/invitation-slug-editor.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/modules/invitation/components/invitation-slug-editor.tsx', c);
