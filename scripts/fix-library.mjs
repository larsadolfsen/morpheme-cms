import fs from 'fs';
let code = fs.readFileSync('src/Library.tsx', 'utf8');
code = code.replace('href: #,', "href: '#' + id,");
fs.writeFileSync('src/Library.tsx', code, 'utf8');
console.log('Fixed Library.tsx syntax error successfully');
