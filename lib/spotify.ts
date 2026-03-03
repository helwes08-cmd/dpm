export async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Credenciais do Spotify ausentes nas variáveis de ambiente.");
    }

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(clientId + ":" + clientSecret).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Erro ao obter token do Spotify: ${data.error_description || data.error}`);
    }

    return data.access_token;
}

export async function resolveSpotifyPlaylist(url: string): Promise<string[]> {
    const token = await getSpotifyToken();

    // Ex: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
    const playlistIdMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!playlistIdMatch || !playlistIdMatch[1]) {
        throw new Error("URL do Spotify inválida ou ID da playlist não encontrado.");
    }
    const playlistId = playlistIdMatch[1];

    // Buscando apenas os 50 primeiros itens para economizar tokens na openai
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(name,artists(name)))`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Erro ao buscar playlist no Spotify: ${errorData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const tracks: string[] = [];

    for (const item of data.items) {
        const track = item.track;
        if (track) {
            const artistNames = track.artists.map((a: any) => a.name).join(", ");
            tracks.push(`${artistNames} - ${track.name}`);
        }
    }

    return tracks;
}
