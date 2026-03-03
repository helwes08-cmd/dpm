async function getSpotifyToken(): Promise<string> {
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
        },
        body: "grant_type=client_credentials",
    });
    const data = await res.json();
    return data.access_token;
}

function extractSpotifyId(url: string): string | null {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

export async function fetchSpotifyTracks(url: string): Promise<string> {
    try {
        const id = extractSpotifyId(url);
        if (!id) return "Playlist do Spotify (ID nao identificado)";
        const token = await getSpotifyToken();
        const res = await fetch(
            `https://api.spotify.com/v1/playlists/${id}/tracks?limit=50&fields=items(track(name,artists))`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const tracks: string[] = data.items
            ?.filter((i: any) => i.track)
            .map((i: any) => `- ${i.track.name} de ${i.track.artists[0]?.name}`) ?? [];
        return tracks.length > 0
            ? `Musicas da playlist:\n${tracks.join("\n")}`
            : "Playlist do Spotify (sem faixas publicas)";
    } catch {
        return `Playlist do Spotify: ${url}`;
    }
}
