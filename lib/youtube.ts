function extractYoutubeId(url: string): { playlistId?: string, videoId?: string } {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const playlistId = urlObj.searchParams.get("list");

        let videoId = urlObj.searchParams.get("v");
        if (!videoId && urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.slice(1);
        }

        return {
            playlistId: playlistId || undefined,
            videoId: videoId || undefined
        };
    } catch {
        return {};
    }
}

export async function fetchYoutubeTracks(url: string): Promise<string> {
    try {
        const { playlistId, videoId } = extractYoutubeId(url);
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            return `Playlist do YouTube: ${url}`;
        }

        if (playlistId) {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
            );
            const data = await res.json();
            if (!res.ok) return "Playlist do YouTube (erro ao carregar API)";

            const tracks = (data.items || [])
                .map((i: any) => `- ${i.snippet.title}`)
                .filter((t: string) => !t.includes("Deleted video") && !t.includes("Private video"));

            return tracks.length > 0
                ? `Vídeos da playlist do YouTube:\n${tracks.join("\n")}`
                : "Playlist do YouTube (sem vídeos públicos)";
        } else if (videoId) {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
            );
            const data = await res.json();
            if (!res.ok) return "Vídeo do YouTube (erro ao carregar API)";

            if (data.items && data.items.length > 0) {
                return `Vídeo do YouTube:\n- ${data.items[0].snippet.title}`;
            }
            return "Vídeo do YouTube (não encontrado)";
        }

        return `Playlist do YouTube (ID não identificado): ${url}`;
    } catch (err) {
        return `Playlist do YouTube: ${url}`;
    }
}
