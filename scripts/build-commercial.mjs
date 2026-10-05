import {statfsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

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
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next','build','--webpack'], {stdio:'inherit'});
process.exit(result.status ?? 1);
