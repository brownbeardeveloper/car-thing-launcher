# Car Thing Video Launcher

A home screen for the Spotify Car Thing that plays short videos. Turn the dial to switch videos.

## Change the videos

1. Put your videos (straight from the phone is fine) in [`apps/car-thing-launcher/videos/`](apps/car-thing-launcher/videos/).
2. Edit titles and descriptions in [`videos.json`](apps/car-thing-launcher/videos/videos.json) in the same folder.

## Put it on the Car Thing

You need: a Car Thing running [bridgething](https://bridgething.com), a USB cable, [Bun](https://bun.sh) and
ffmpeg (`brew install ffmpeg`).

```sh
bun install    # first time only
bun run push   # every time you change something; shrinks new videos first
```

Something wrong? `bun run --cwd apps/car-thing-launcher push --release` brings back the original home screen.

## Try it on your computer

```sh
bun run dev
```

Shift + scroll = dial · `1`–`4` = preset buttons · `Esc` = back
