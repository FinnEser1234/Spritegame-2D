import net from 'net';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';
import process from 'process';

function findFreePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(startPort, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}

function spawnCommand(command, args, options = {}) {
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', command, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        ...options,
      })
    : spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        ...options,
      });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  return child;
}

const port = await findFreePort(3001);
console.log(`Starte Spiel auf Port ${port} und öffne Ngrok-Tunnel...`);

// First compile TypeScript
const compileProcess = process.platform === 'win32'
  ? spawn('cmd.exe', ['/c', 'npm run tsc'], { stdio: 'inherit', shell: false })
  : spawn('bash', ['-c', 'npm run tsc'], { stdio: 'inherit', shell: false });

await new Promise((resolve, reject) => {
  compileProcess.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`TypeScript compilation failed with code ${code}`));
  });
  compileProcess.on('error', reject);
});

const nodeCommand = 'node';
const localNgrokCommand = process.platform === 'win32'
  ? resolve(process.cwd(), 'node_modules/.bin/ngrok.cmd')
  : resolve(process.cwd(), 'node_modules/.bin/ngrok');
const ngrokCommand = existsSync(localNgrokCommand)
  ? localNgrokCommand
  : (process.platform === 'win32' ? 'npx.cmd' : 'npx');

const serverProcess = spawnCommand(nodeCommand, [resolve(process.cwd(), 'dist/server.js')], {
  env: {
    ...process.env,
    PORT: String(port),
    NO_PORT_FALLBACK: 'true',
  },
});

let ngrokProcess = null;
let ngrokStarted = false;
let ngrokUrlPrinted = false;
let ngrokAuthErrorPrinted = false;

async function printNgrokUrl() {
  if (ngrokUrlPrinted) return;

  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    if (!response.ok) {
      console.log('[DEBUG] Ngrok API noch nicht bereit...');
      return;
    }

    const data = await response.json();
    const tunnels = Array.isArray(data?.tunnels) ? data.tunnels : [];
    console.log(`[DEBUG] ${tunnels.length} Tunnel(s) gefunden`);
    const publicTunnel = tunnels.find((tunnel) => typeof tunnel?.public_url === 'string' && tunnel.public_url.startsWith('https://'));

    if (publicTunnel?.public_url) {
      ngrokUrlPrinted = true;
      console.log(`\n✅ Ngrok-Link: ${publicTunnel.public_url}\n`);
    }
  } catch (err) {
    console.log(`[DEBUG] Ngrok API Fehler: ${err.message}`);
  }
}

function startNgrok() {
  if (ngrokStarted) return;
  ngrokStarted = true;
  const ngrokArgs = existsSync(localNgrokCommand)
    ? ['http', String(port)]
    : ['ngrok', 'http', String(port)];

  ngrokProcess = spawnCommand(ngrokCommand, ngrokArgs);
  console.log(`Ngrok wird auf Port ${port} aufgebaut...`);

  const linkPoller = setInterval(() => {
    printNgrokUrl();
    if (ngrokUrlPrinted) {
      clearInterval(linkPoller);
    }
  }, 800);

  ngrokProcess.on('exit', () => {
    clearInterval(linkPoller);
  });

  ngrokProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    if (!ngrokAuthErrorPrinted && /authentication failed|authtoken|ERR_NGROK_4018/i.test(text)) {
      ngrokAuthErrorPrinted = true;
      console.error('Ngrok ist nicht eingerichtet. Bitte einmal ausführen: ngrok config add-authtoken <DEIN_TOKEN>');
      console.error('Token bekommst du hier: https://dashboard.ngrok.com/get-started/your-authtoken');
    }
  });

  printNgrokUrl();
}

serverProcess.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  console.log(`[STDOUT] ${text}`);
  if (text.includes(`Twilight Specter TS-Server auf Port`)) {
    console.log('✅ Server ist hochgefahren! Starte Ngrok...');
    startNgrok();
  }
});

serverProcess.on('exit', (code) => {
  if (ngrokProcess) {
    ngrokProcess.kill();
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  if (ngrokProcess) {
    ngrokProcess.kill('SIGINT');
  }
  process.exit(0);
});
