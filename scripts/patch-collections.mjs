import fs from 'node:fs';

let content = fs.readFileSync('playground/src/site/collections.ts', 'utf8').replace(/\r\n/g, '\n');
content = content.replace("from '../src/schema';", "from '@interstellarcms/cms/src/schema';");
content = content.replace("from '../lib/contactBar';", "from '@interstellarcms/cms/lib/contactBar';");
content = content.replace("from '@site/standardPages';", "from '@interstellarcms/cms/site/standardPages';");
fs.writeFileSync('playground/src/site/collections.ts', content, 'utf8');
console.log('Patched playground/src/site/collections.ts');
