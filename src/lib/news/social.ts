export type SocialVideo = { provider: "tiktok" | "instagram"; id: string; url: string; embedUrl: string; label: string };
/**
 * Recognizes a public TikTok video or Instagram reel/post link and returns the provider's own embed player.
 * Nothing is downloaded or re-hosted: the video plays from TikTok or Instagram when the visitor presses play.
 */
export function parseSocialVideo(value: string | null | undefined): SocialVideo | null {
  if (!value) return null;
  let u: URL;
  try { u = new URL(value.trim()); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  if (host === "www.tiktok.com" || host === "tiktok.com" || host === "m.tiktok.com") {
    const m = u.pathname.match(/^\/@([\w.-]{1,40})\/video\/(\d{8,25})\/?$/);
    if (!m) return null;
    return { provider: "tiktok", id: m[2], url: `https://www.tiktok.com/@${m[1]}/video/${m[2]}`, embedUrl: `https://www.tiktok.com/player/v1/${m[2]}?rel=0`, label: `TikTok · @${m[1]}` };
  }
  if (host === "www.instagram.com" || host === "instagram.com") {
    const m = u.pathname.match(/^\/(?:[\w.]{1,40}\/)?(reel|reels|p)\/([\w-]{5,40})\/?$/);
    if (!m) return null;
    const kind = m[1] === "p" ? "p" : "reel";
    return { provider: "instagram", id: m[2], url: `https://www.instagram.com/${kind}/${m[2]}/`, embedUrl: `https://www.instagram.com/${kind}/${m[2]}/embed/`, label: kind === "reel" ? "Instagram · Reel" : "Instagram" };
  }
  return null;
}
