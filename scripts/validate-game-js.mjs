import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)];
if (!scripts.length) throw new Error('index.html daxilində JavaScript tapılmadı');
new vm.Script(scripts[0][1], { filename: 'index.html:inline-script' });
console.log('JavaScript sintaksisi düzgündür; əsas oyun skripti parse edildi.');
