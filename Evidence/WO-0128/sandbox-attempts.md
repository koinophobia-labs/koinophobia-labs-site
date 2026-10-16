# Initial sandbox attempts

- `npx tsx --test tests/app-homes.test.ts tests/site-audit.test.ts tests/redirects.test.ts` could not create its IPC pipe: `listen EPERM ... /T/tsx-501/63745.pipe`. The unchanged command was rerun with local IPC permission and passed 20/20; see tests.log.
- The initial `npm run build` remained at compilation inside the sandbox. Only this task's npm / Next build processes (63679 / 63697) were terminated. The exact command succeeded with network / build worker permissions; see build.log. Its partial output remains in build-initial.log.
- `gh auth status` initially appeared invalid inside the network sandbox; the authorized network retry confirmed the existing login. No credentials were changed.
