import { spawn, execSync } from 'node:child_process';
import http from 'node:http';

console.log('=== STARTING MATERIAL DESIGN 3 THEME & BACKEND DEMO ===\n');

// 1. Verificér MD3 compliance
console.log('[1/3] Kører Material Design 3 validering...');
try {
  execSync('npm run check:md3', { stdio: 'inherit' });
} catch (err) {
  console.error('MD3 tjek fejlede:', err);
  process.exit(1);
}

// Funktion til at tjekke om server svarer
function checkServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// 2. Tjek om dev server allerede kører på port 4321
console.log('\n[2/3] Undersøger Astro Playground server (port 4321)...');
const isRunning = await checkServer('http://localhost:4321/');

if (isRunning) {
  console.log('✓ Serveren kører allerede på port 4321!');
  const frontendOk = await checkServer('http://localhost:4321/');
  const backendOk = await checkServer('http://localhost:4321/editor/');

  console.log('\n[3/3] Status for demoer:');
  console.log(`- Frontend Showcase:           ${frontendOk ? '✓ KLAR (HTTP 200)' : '✗ FEJLEDE'} -> http://localhost:4321/`);
  console.log(`- Backend Administrations-editor: ${backendOk ? '✓ KLAR (HTTP 200)' : '✗ FEJLEDE'} -> http://localhost:4321/editor/`);
  console.log('\nAlt er klar!');
  process.exit(0);
}

console.log('Starter lokal Astro server (playground)...');
const server = spawn('npm', ['run', 'playground'], {
  stdio: 'inherit',
  shell: true
});

// Vent på at Astro serveren er klar
let ready = false;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 500));
  if (await checkServer('http://localhost:4321/')) {
    ready = true;
    break;
  }
}

if (!ready) {
  console.error('Kunne ikke forbinde til Astro playground på port 4321 inden for 15 sekunder.');
  process.exit(1);
}

const frontendOk = await checkServer('http://localhost:4321/');
const backendOk = await checkServer('http://localhost:4321/editor/');

console.log('\n[3/3] Status for demoer:');
console.log(`- Frontend Showcase:           ${frontendOk ? '✓ KLAR (HTTP 200)' : '✗ FEJLEDE'} -> http://localhost:4321/`);
console.log(`- Backend Administrations-editor: ${backendOk ? '✓ KLAR (HTTP 200)' : '✗ FEJLEDE'} -> http://localhost:4321/editor/`);
console.log('\n✓ Demoen er aktiv og kører.');

// Hold processen aktiv, så dev-serveren ikke afsluttes utilsigtet
await new Promise((resolve) => {
  server.on('exit', resolve);
  process.on('SIGINT', () => {
    server.kill();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.kill();
    process.exit(0);
  });
});
