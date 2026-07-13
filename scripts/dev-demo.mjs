import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const child = spawn('npx', ['next', 'dev', '-p', '3001'], {
  cwd: root,
  env: {
    ...process.env,
    DATA_DIR: path.join(root, 'data-demo'),
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
