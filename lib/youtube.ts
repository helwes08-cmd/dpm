export async function resolveYoutubePlaylist(url: string): Promise<string[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY ausente nas variáveis de ambiente.");
    }

    try {
        const urlObj = new URL(url);
        const playlistId = urlObj.searchParams.get("list");

        if (!playlistId) {
            throw new Error("URL do YouTube inválida ou parâmetro 'list' (ID da playlist) não encontrado.");
        }

        // Buscando apenas os 50 primeiros itens para economizar tokens na openai
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Erro ao buscar playlist no YouTube: ${errorData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        const tracks: string[] = [];

        for (const item of data.items) {
            const title = item.snippet?.title;
            // YouTube video titles usually contain the artist and song, though formatting varies vastly
            if (title && title !== "Private video" && title !== "Deleted video") {
                tracks.push(title);
            }
        }

        return tracks;
    } catch (err: any) {
        throw new Error(`Não foi possível resolver a playlist do YouTube: ${err.message}`);
    }
}
