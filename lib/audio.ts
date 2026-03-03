import { fetchSpotifyTracks } from "./spotify";
import { fetchYoutubeTracks } from "./youtube";

export async function resolveAudioTracks(url: string): Promise<string> {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return fetchYoutubeTracks(url);
    }
    return fetchSpotifyTracks(url);
}
