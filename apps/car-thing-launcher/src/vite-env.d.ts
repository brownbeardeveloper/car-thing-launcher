/// <reference types="vite/client" />

declare module 'virtual:videos' {
  export type Video = {
    src: string;
    /** still frame for the start page; null shows a frame of the video instead */
    poster: string | null;
    title: string;
    description: string;
    /** seconds, read from the file at build time; null when it could not be read */
    duration: number | null;
  };
  const videos: Video[];
  export default videos;
}
