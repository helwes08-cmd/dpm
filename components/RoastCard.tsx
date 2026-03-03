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
  ilusao_amorosa: "Ilusão Amorosa",
  idade_jurassica: "Idade Jurássica",
  risco_de_overdose: "Risco de Overdose",
  crente_ou_quase: "Crente ou Quase",
  militante: "Militante",
  generico: "Genérico",
  original: "Original",
  energia_de_termino: "Energia de Término",
  vergonha_alheia: "Vergonha Alheia",
  emo: "Emo",
  zona_leste: "Zona Leste",
  festa_boteco: "Boteco",
  queen: "Queen",
  gosto_musical_de_schrodinger: "Schrödinger",
  provavelmente_canta_errado: "Canta Errado",
  gritos_e_riffs: "Gritos & Riffs",
  rebelde: "Rebelde",
  metaleiro_de_apartamento: "Metaleiro de Apto",
  dj_no_fogao: "DJ no Fogão",
  sofrencia_parcelada: "Sofrência",
  samba_de_boteco: "Samba",
  proibidao: "Proibidão",
};

const getColor = (value: number) => {
  if (value < 4) return "bg-[#1DB954]";
  if (value < 7) return "bg-yellow-400";
  return "bg-red-600";
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
          {data.score.toFixed(1)}/10
        </span>
      </div>

      <p className="text-gray-400 italic text-sm mb-6 leading-relaxed">
        "{data.roast}"
      </p>

      <div className="space-y-4">
        {topTags.map(([key, val]) => (
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
    </div>
  );
}
