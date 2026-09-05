const { spawn, execSync } = require('child_process');
const path = require('path');

function getPythonCommand() {
  const candidates = ['py', 'python3', 'python'];
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch (e) {
      // try next candidate
    }
  }
  return null;
}

const pyCmd = getPythonCommand();
if (!pyCmd) {
  console.error('[PYRAVEX] Error: No Python interpreter found (tested: py, python3, python). Please ensure Python is installed.');
  process.exit(1);
}

const backendDir = path.join(__dirname, '..', 'backend');
console.log(`[PYRAVEX BACKEND] Initializing FastAPI server via '${pyCmd}' in ${backendDir}...`);

const child = spawn(
  pyCmd,
  ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});
