# Lessons from a real run

- **Flush every frame.** On a software renderer, a canvas that is never read back queues frames until a stills
  or render command seems to hang. `film.js` now reads one pixel after each frame; keep that.
- **Stills often, render once.** A 60 s film is 1800 frames; a full render took about 3.5 minutes on a software
  renderer. Directors should work from contact sheets and short clips at half scale.
- **Frames in order.** A film's `draw` runs every frame in sequence (takes and simulations keep state). The
  renderer refuses to skip; a clip from 20 s still draws frames 0 to 599 without grabbing them.
- **A growing MP4 is not finished.** Relay a render only after its process has exited successfully; check the exit status.
- **Audio review.** Use listening tools when available. Otherwise review timing, peak and the loudness
  picture, disclose that the sound was not auditioned, and let the person judge it.
- **Shared scratch folders.** Several agents in one workspace overwrite each other's frame folders and logs.
  Tell each to keep private temporary files under its own subfolder, and to write only its own film file.
- **Never move files to /dev/null.** One agent ran `mv file /dev/null` as root and replaced the device with a
  file for a minute (restored with `mknod -m 666 /dev/null c 1 3`). Delete with `rm`.
- **Resume deliberately.** Respect a user pause or stop. When asked to continue, resume an existing agent
  if supported; otherwise give its saved film and contact sheets to a replacement (see agent-prompts.md).
- **Do not flood the person.** Batch contact sheets (wait a few minutes after a change) and send MP4s at once.
