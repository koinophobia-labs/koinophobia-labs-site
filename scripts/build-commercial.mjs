import {statfsSync} from 'node:fs';
import {spawn} from 'node:child_process';

// Keep the founder's 10 GB reserve on every build worker. Estimates include
// Next output, file tracing, and transient files; dependency installation is
// completed by the host before this command runs.
const destinations = [...new Set([process.cwd(), process.env.TMPDIR || '/tmp'])];
for (const destination of destinations) {
  const disk = statfsSync(destination);
  const free = disk.bavail * disk.bsize;
  const peakAdditional = 3_000_000_000;
  console.log(JSON.stringify({destination, free, peakAdditional, reserve:10_000_000_000}));
  if (free - peakAdditional < 10_000_000_000) {
    console.error('Infrastructure blocker: insufficient build headroom. Work and evidence were preserved.');
    process.exit(1);
  }
}
// The hosted Turbopack Google-font resolver failed on the production baseline.
// Next's supported webpack build avoids that failure without changing fonts.
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','build','--webpack'], {stdio:'inherit'});
let stoppedForHeadroom = false;
const monitor = setInterval(() => {
  for (const destination of destinations) {
    const disk = statfsSync(destination);
    if (disk.bavail * disk.bsize < 10_500_000_000) {
      console.error('Infrastructure blocker: stopping this build before the 10 GB reserve is breached. Evidence preserved.');
      stoppedForHeadroom = true;
      child.kill('SIGTERM');
      break;
    }
  }
}, 2000);
child.on('error', error => { clearInterval(monitor); console.error(error); process.exit(1); });
child.on('close', code => { clearInterval(monitor); process.exit(stoppedForHeadroom ? 1 : code ?? 1); });
