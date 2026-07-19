import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

const OPM_VERSION = '0.0.3';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BINARIES_DIR = path.resolve(__dirname, '../src-tauri/binaries');

if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

let hostTarget = '';
try {
  hostTarget = execSync('rustc -vV')
    .toString()
    .split('\n')
    .find((line) => line.startsWith('host:'))
    .split(' ')[1]
    .trim();
} catch {
  if (process.platform === 'linux') {
    hostTarget = 'x86_64-unknown-linux-gnu';
  } else if (process.platform === 'win32') {
    hostTarget = 'x86_64-pc-windows-msvc';
  } else if (process.platform === 'darwin') {
    hostTarget = 'x86_64-apple-darwin';
  }
}

console.log(`[download-opm] Host target detected: ${hostTarget}`);

const targetsToDownload = [hostTarget];

if (hostTarget === 'x86_64-unknown-linux-gnu' && !targetsToDownload.includes('x86_64-pc-windows-msvc')) {
  targetsToDownload.push('x86_64-pc-windows-msvc');
}

async function run() {
  for (const target of targetsToDownload) {
    const isWindows = target.includes('windows') || target.includes('win32') || target.includes('msvc');
    const isLinux = target.includes('linux');
    
    const binaryName = isWindows ? `opm-${target}.exe` : `opm-${target}`;
    const destPath = path.join(BINARIES_DIR, binaryName);

    if (fs.existsSync(destPath)) {
      console.log(`[download-opm] Binary already exists for target ${target}: ${binaryName}`);
      continue;
    }

    let downloadUrl = '';
    let archiveName = '';
    if (isLinux) {
      archiveName = `opm_${OPM_VERSION}_linux_amd64.tar.gz`;
      downloadUrl = `https://github.com/Akrobate/openscad-package-manager/releases/download/${OPM_VERSION}/${archiveName}`;
    } else if (isWindows) {
      archiveName = `opm_${OPM_VERSION}_windows_amd64.tar.gz`;
      downloadUrl = `https://github.com/Akrobate/openscad-package-manager/releases/download/${OPM_VERSION}/${archiveName}`;
    } else {
      console.warn(`[download-opm] OPM binary not officially available for target ${target}. Skipping.`);
      continue;
    }

    const archivePath = path.join(BINARIES_DIR, archiveName);
    console.log(`[download-opm] Downloading ${downloadUrl} to ${archivePath}...`);

    try {
      await downloadFile(downloadUrl, archivePath);
      console.log(`[download-opm] Extracting ${archivePath}...`);
      
      execSync(`tar -xzf "${archivePath}" -C "${BINARIES_DIR}"`);
      
      const extractedName = isWindows ? 'opm.exe' : 'opm';
      const extractedPath = path.join(BINARIES_DIR, extractedName);
      
      if (fs.existsSync(extractedPath)) {
        fs.renameSync(extractedPath, destPath);
        if (!isWindows) {
          fs.chmodSync(destPath, 0o755);
        }
        console.log(`[download-opm] Successfully installed sidecar: ${binaryName}`);
      } else {
        throw new Error(`Extracted file ${extractedName} not found in ${BINARIES_DIR}`);
      }
    } catch (err) {
      console.error(`[download-opm] Failed to set up target ${target}:`, err);
    } finally {
      if (fs.existsSync(archivePath)) {
        try {
          fs.unlinkSync(archivePath);
        } catch {}
      }
    }
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: Status code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    
    request(url);
  });
}

run().catch((err) => {
  console.error('[download-opm] Build script failed:', err);
  process.exit(1);
});
