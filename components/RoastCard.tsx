"use client";

import { useMemo } from "react";

type Roast = {
  id: string;
  userName: string;
  roast: string;
  score: number;
  tags: Record<string, number>;
};

const TAG_LABELS: Record<string, string> = {
  protagonista: "Protagonista",
  ilusaoAmorosa: "Ilusão Amorosa",
  idadeJurassica: "Idade Jurássica",
  riscoDeOverdose: "Risco de Overdose",
  crenteOuQuase: "Crente ou Quase",
  militante: "Militante",
  generico: "Genérico",
  original: "Original",
  energiaDeTermino: "Energia de Término",
  vergonhaAlheia: "Vergonha Alheia",
  emo: "Emo",
  zonaLeste: "Zona Leste",
  festaBoteco: "Boteco",
  queen: "Queen",
  gostoMusicalDeSchrodinger: "Schrödinger",
  provavelmenteCantaErrado: "Canta Errado",
  gritosERiffs: "Gritos & Riffs",
  rebelde: "Rebelde",
  metaleiroDeApartamento: "Metaleiro de Apto",
  djNoFogao: "DJ no Fogão",
  sofrenciaParcelada: "Sofrência",
  sambaDeBoteco: "Samba",
  proibidao: "Proibidão",
};

const getColor = (value: number) => {
  if (value < 1) return "bg-red-800";
  if (value < 2) return "bg-red-600";
  if (value < 3) return "bg-orange-600";
  if (value < 4) return "bg-orange-500";
  if (value < 5) return "bg-yellow-500";
  if (value < 6) return "bg-yellow-400";
  if (value < 7) return "bg-lime-400";
  if (value < 8) return "bg-green-400";
  if (value < 9) return "bg-[#1DB954]";
  if (value < 10) return "bg-emerald-400";
  return "bg-teal-400";
};

export default function RoastCard({ data }: { data: Roast }) {
  const topTags = useMemo(() => {
    return Object.entries(data.tags ?? {})
      .sort((a, b) => b[1] - a[1]) // Deterministic sort to avoid hydration errors
      .slice(0, 4);
  }, [data]);

  return (
    <div className="bg-[#121212] border border-[#282828] rounded-2xl p-6 hover:border-[#1DB954] transition-all group">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold truncate">Playlist de {data.userName}</h3>
        <span className="bg-[#1DB954] text-black font-black px-2 py-0.5 rounded text-sm italic">
          {data?.score?.toFixed(1)}/10
        </span>
      </div>

      <div className="mb-6 relative overflow-hidden max-h-[1.625rem] group-hover:max-h-[300px] transition-all duration-500 ease-in-out">
        <p className="text-gray-400 italic text-sm leading-relaxed line-clamp-1 group-hover:line-clamp-none">
          "{data.roast}"
        </p>
      </div>

      <div className="flex flex-col">
        {/* Renderiza as 2 primeiras tags sempre visíveis */}
        <div className="space-y-4">
          {topTags.slice(0, 2).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500">
                <span>{TAG_LABELS[key] || key}</span>
                <span className="text-gray-300">{val.toFixed(1)}</span>
              </div>
              <div className="w-full bg-[#282828] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${getColor(val)} h-full rounded-full transition-all duration-1000`}
                  style={{ width: `${val * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tags ocultas e selo "+X" */}
        {topTags.length > 2 && (
          <>
            {/* Selo que some no hover */}
            <div className="mt-3 text-[10px] text-[#1DB954] font-bold tracking-widest uppercase group-hover:hidden transition-all duration-300">
              +{topTags.length - 2} status ocultos
            </div>

            {/* Container que expande no hover com as tags restantes */}
            <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-[150px] group-hover:opacity-100 group-hover:mt-4 transition-all duration-500 ease-in-out space-y-4">
              {topTags.slice(2).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500">
                    <span>{TAG_LABELS[key] || key}</span>
                    <span className="text-gray-300">{val.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-[#282828] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${getColor(val)} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
