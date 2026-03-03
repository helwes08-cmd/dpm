import { z } from "zod";

export const providerPlaylistUrlSchema = z.url("Insira uma URL válida.").refine((val) => {
    return val.includes("spotify.com") || val.includes("youtube.com") || val.includes("youtu.be");
}, {
    message: "O link deve ser do Spotify ou YouTube.",
});
