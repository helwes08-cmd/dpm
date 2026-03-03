"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import RoastCard from "../components/RoastCard";

const playlistUrlSchema = z
  .string()
  .url("Isso não parece ser um link válido...")
  .refine((url) => ["spotify.com", "open.spotify.com", "music.youtube.com", "youtube.com"].some((domain) => url.includes(domain)), {
    message: "O link precisa ser do Spotify ou YouTube Music!",
  });


type RecentRoast = {
  id: string;
  userName: string;
  score: number;
  roast: string;
  metrics: any;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecentRoast | null>(null); // Resultado da IA atual
  const [recent, setRecent] = useState<RecentRoast[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!val) {
      setUrlError("");
      return;
    }

    const { success, error } = playlistUrlSchema.safeParse(val);
    
    if (!success) {
      setUrlError(error.issues[0].message);
    } else {
      setUrlError("");
    }
  };

  // Função para chamar a API real que criamos
  const destroyPlaylist = async () => {
    const result = playlistUrlSchema.safeParse(url);
    if (!result.success) {
      setUrlError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, anonymous }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Criamos o objeto do resultado com as métricas que a IA gerou (ou fakes se não vierem)
      const newRoast: RecentRoast = {
        id: Date.now().toString(),
        userName: anonymous ? "Anônimo" : "Você",
        score: data.roast.score,
        roast: data.roast.roast,
        metrics: data.roast.metrics || {
          originalidade: Math.random() * 10,
          vergonhaAlheia: Math.random() * 10,
          riscoDeOverdose: Math.random() * 10,
          crente: Math.random() * 10,
        },
      };

      setResult(newRoast);

      // Adiciona ao mural se não for anônimo
      if (!anonymous) {
        setRecent((prev) => [newRoast, ...prev].slice(0, 10));
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err) {
      alert("Erro ao destruir: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col items-center py-12 px-4 font-sans">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 italic">Experimento social totalmente científico</p>
      <h1 className="text-5xl md:text-6xl font-black text-white mb-2 text-center tracking-tighter">
        DESTRUA SUA <span className="text-[#1DB954]">PLAYLIST</span>
      </h1>
      <p className="text-lg text-gray-400 mb-10 text-center max-w-lg">
        Sua dignidade musical acaba aqui.
      </p>

      <div className="w-full max-w-2xl mb-16">
        <div className="relative flex flex-col mb-4">
          <div className="relative flex items-center w-full">
            <span className="absolute left-4 text-gray-500 text-xl">🎧</span>
            <input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              type="text"
              placeholder="Link da playlist do Spotify ou YouTube Music..."
              className={`w-full py-5 pl-12 pr-32 rounded-xl text-lg bg-[#1a1a1a] border text-white focus:outline-none transition-all ${urlError ? "border-red-500 focus:border-red-500" : "border-[#333] focus:border-[#1DB954]"
                }`}
            />
            <button
              onClick={destroyPlaylist}
              disabled={loading || !!urlError || !url}
              className="absolute right-2 bg-[#1DB954] hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-all active:scale-95"
            >
              {loading ? "JULGANDO..." : "DESTRUIR"}
            </button>
          </div>
          {urlError && <p className="text-red-500 text-sm mt-2 px-2">{urlError}</p>}
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <label className="flex items-center cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              <div className="block bg-gray-600 w-10 h-6 rounded-full" />
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-[#1DB954]" />
            </div>
            <div className="ml-3 text-sm text-gray-400">🙈 Destruição anônima</div>
          </label>
        </div>
      </div>

      {/* EXIBE O RESULTADO ATUAL AQUI */}
      {result && (
        <div ref={resultRef} className="w-full max-w-2xl mb-20 animate-in fade-in zoom-in duration-500">
          <h2 className="text-center text-[#1DB954] font-bold mb-4 uppercase tracking-widest">O Veredito:</h2>
          <RoastCard data={result} />
        </div>
      )}

      {/* MURAL */}
      <div className="w-full max-w-5xl">
        <h3 className="flex items-center justify-center gap-2 text-white font-bold mb-8 uppercase tracking-widest text-sm">
          <span>🔥</span> RECENTEMENTE DESTRUÍDAS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {recent.length > 0 ? (
            recent.map((item) => <RoastCard key={item.id} data={item} />)
          ) : (
            <p className="text-center col-span-full text-gray-600 italic">Ninguém foi humilhado ainda hoje...</p>
          )}
        </div>
      </div>
    </div>
  );
}