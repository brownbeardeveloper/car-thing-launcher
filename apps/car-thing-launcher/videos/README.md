# Videos

1. Put a video here, e.g. `beach.mp4` or `beach.mov`, straight from the phone.
2. Add a line for it in `videos.json` (the order here is the order on screen):

   ```json
   { "file": "beach.mp4", "title": "Beach day", "description": "At sunset" },
   ```

3. Optional cover image: `beach.jpg` next to the video.
4. Run `bun run push`. It shrinks the video to the screen size and puts it on the Car Thing. The original is
   kept in `originals/`.

If the build stops with an error, check the file name spelling and the commas in `videos.json`.
