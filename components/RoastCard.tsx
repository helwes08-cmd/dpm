"use client";

import { useMemo } from "react";

type Roast = {
  id: string;
  userName: string;
  roast: string;
  score: number;
  metrics: {
    originalidade?: number;
    influenciaDoAlgoritmo?: number;
    energiaDeTermino?: number;
    vergonhaAlheia?: number;
    protagonista?: number;
    ilusaoAmorosa?: number;
    idadeJurassica?: number;
    riscoDeOverdose?: number;
    crente?: number;
    militante?: number;
    energiaFimDeFesta?: number;
  };
};

export default function RoastCard({ data }: { data: Roast }) {
  // Mapeamento de todas as métricas zueiras que criamos
  const metrics = [
    { label: "Originalidade", value: data.metrics.originalidade },
    { label: "Influência do Algoritmo", value: data.metrics.influenciaDoAlgoritmo },
    { label: "Energia de Término", value: data.metrics.energiaDeTermino },
    { label: "Vergonha Alheia", value: data.metrics.vergonhaAlheia },
    { label: "Protagonista", value: data.metrics.protagonista },
    { label: "Ilusão Amorosa", value: data.metrics.ilusaoAmorosa },
    { label: "Idade Jurássica", value: data.metrics.idadeJurassica },
    { label: "Risco de Overdose", value: data.metrics.riscoDeOverdose },
    { label: "Crente de Taubaté", value: data.metrics.crente },
    { label: "Militante de Quarto", value: data.metrics.militante },
    { label: "Fim de Festa", value: data.metrics.energiaFimDeFesta },
  ].filter(m => m.value !== undefined);

  // Seleciona 4 aleatórias para cada card não ser igual
  const randomMetrics = useMemo(() => {
    return [...metrics]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [data]);

  // Lógica de cores: Verde (Bom/Baixo), Amarelo (Médio), Vermelho (Crítico/Zueira)
  const getColor = (value: number) => {
    if (value < 4) return "bg-[#1DB954]"; // Verde Spotify
    if (value < 7) return "bg-yellow-400";
    return "bg-red-600";
  };

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
        {randomMetrics.map((metric, i) => {
          const val = metric.value || 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500">
                <span>{metric.label}</span>
                <span className="text-gray-300">{val.toFixed(1)}</span>
              </div>
              <div className="w-full bg-[#282828] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${getColor(val)} h-full rounded-full transition-all duration-1000`}
                  style={{ width: `${val * 10}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}