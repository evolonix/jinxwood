// URL for one of the game's files under public/media/pinochle/: the
// screenshots, Game Center art, icon and clips.
export function asset(path: string): string {
  return "/media/pinochle/" + path.replace(/^\/+/, "");
}
