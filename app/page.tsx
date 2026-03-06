"use client";

import { useEffect, useRef, useState } from "react";
import RoastCard from "../components/RoastCard";
import { providerPlaylistUrlSchema } from "../lib/validation";

type AppStep = "home" | "name" | "payment" | "loading" | "result";

type RecentRoast = {
  id: string;
  userName: string;
  score: number;
  roast: string;
  tags: Record<string, number>;
};

type RoastResult = {
  id?: string;
  userName: string;
  score: number;
  roast: string;
  tags: Record<string, number>;
};

type PendingRoast = {
  roastId: string;
  brCode?: string;
  brCodeBase64?: string;
  userName: string;
  url: string;
  anonymous: boolean;
};

const LOADING_PHRASES = [
  "Analisando seu gosto duvidoso…",
  "Detectando padrões de arrependimento…",
  "Consultando o algoritmo da vergonha…",
  "Verificando se isso é realmente sua playlist…",
  "Medindo o nível de clichê…",
  "Carregando drama musical…",
  "Preparando comentários afiados…",
  "Calculando chances de ser excluído do Spotify…",
  "Escutando os hits que você finge que gosta…",
  "Ativando sensor de trap e emo genérico…",
  "Checando se isso é arte ou só ruído…",
  "Conferindo se você tem bom gosto ou só esperança…",
];

function pickThree(arr: string[]) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, 3);
}

const MOCK_RECENT: RecentRoast[] = [
  { id: "1", userName: "Enzo_ofc", score: 2.3, roast: "Sua playlist tem cheiro de pod de uva e falta de atenção paterna.", tags: { generico: 8, energiaDeTermino: 7 } },
  { id: "2", userName: "Crente_Top", score: 4.5, roast: "Ouvir esse gospel ostentação não vai perdoar seus vacilos no sigilo.", tags: { crenteOuQuase: 9, militante: 5 } },
  { id: "3", userName: "Fritador_011", score: 1.2, roast: "Seu cérebro já virou patê de tanto ouvir esse techno de batedeira.", tags: { djNoFogao: 8, riscoDeOverdose: 6 } },
  { id: "4", userName: "Mili_Tante", score: 3.8, roast: "A gente sabe que você não ouve a música, só usa pra validar sua bio do X.", tags: { militante: 9, protagonista: 7 } },
];

const SCORE_LABEL = (s: number) =>
  s < 2 ? "💀 Sem Salvação" : s < 4 ? "😬 Duvidoso" : s < 6 ? "🤔 Mediano" : s < 8 ? "👍 Aceitável" : "🏆 Surpreendente";

const TAG_LABELS: Record<string, string> = {
  protagonista: "🎭 Protagonista",
  ilusaoAmorosa: "💔 Ilusão Amorosa",
  idadeJurassica: "🦕 Idade Jurássica",
  riscoDeOverdose: "💊 Risco de Overdose",
  crenteOuQuase: "✝️ Crente ou Quase",
  militante: "✊ Militante de Quarto",
  generico: "📊 Influência do Algoritmo",
  original: "✨ Original de Verdade",
  energiaDeTermino: "💨 Energia de Término",
  vergonhaAlheia: "😳 Vergonha Alheia",
  emo: "🖤 Emo Raiz",
  zonaLeste: "🏙️ Zona Leste",
  festaBoteco: "🍺 Festa de Boteco",
  queen: "👑 Queen Energy",
  gostoMusicalDeSchrodinger: "🐱 Gosto Musical de Schrödinger",
  provavelmenteCantaErrado: "🎤 Provavelmente Canta Errado",
  gritosERiffs: "🎸 Gritos e Riffs",
  rebelde: "😤 Rebelde Sem Causa",
  metaleiroDeApartamento: "🤘 Metaleiro de Apartamento",
  djNoFogao: "🎧 DJ no Fogão",
  sofrenciaParcelada: "😢 Sofrência Parcelada",
  sambaDeBoteco: "🥁 Samba de Boteco",
  proibidao: "🚫 Proibidão",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [step, setStep] = useState<AppStep>("home");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [brCode, setBrCode] = useState("");
  const [brCodeBase64, setBrCodeBase64] = useState("");
  const [roastId, setRoastId] = useState("");
  const [loadingPhrases] = useState(() => pickThree(LOADING_PHRASES));
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pixStatus, setPixStatus] = useState<"waiting" | "checking" | "paid">("waiting");
  const [copied, setCopied] = useState(false);
  const [recentRoasts, setRecentRoasts] = useState<RecentRoast[]>([]);
  const [isFetchingRecent, setIsFetchingRecent] = useState(true);
  const [pendingRoasts, setPendingRoasts] = useState<PendingRoast[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Busca os roasts reais
    fetch("/api/recent")
      .then(res => res.json())
      .then(data => {
        if (data.roasts && data.roasts.length > 0) {
          setRecentRoasts(data.roasts);
        } else {
          setRecentRoasts(MOCK_RECENT);
        }
      })
      .catch((e) => {
        console.error(e);
        setRecentRoasts(MOCK_RECENT);
      })
      .finally(() => {
        setIsFetchingRecent(false);
      });

    // Recupera state do localStorage pra não perder o PIX (agora array para suportar múltiplos)
    const savedStr = localStorage.getItem("dpm_pending_roasts");
    if (savedStr) {
      try {
        const saved: PendingRoast[] = JSON.parse(savedStr);
        if (Array.isArray(saved) && saved.length > 0) {
          setPendingRoasts(saved);

          // Se já tem pendências, restaura a última na tela
          const last = saved[saved.length - 1];
          setRoastId(last.roastId);
          setBrCode(last.brCode ?? "");
          setBrCodeBase64(last.brCodeBase64 ?? "");
          setUserName(last.userName);
          setUrl(last.url);
          setAnonymous(last.anonymous);
          setStep("payment");
        }
      } catch (e) {
        localStorage.removeItem("dpm_pending_roasts");
      }
    }
  }, []);

  useEffect(() => {
    if (pendingRoasts.length === 0) return;
    pollingRef.current = setInterval(async () => {
      if (step === "payment") setPixStatus("checking");

      const checks = pendingRoasts.map(async (item) => {
        if (!item.roastId || item.roastId.startsWith("dev-")) return null;
        try {
          const res = await fetch(`/api/pix/status?id=${item.roastId}`);
          const data = await res.json();
          if (data.paid) return item;
        } catch { }
        return null;
      });

      const results = await Promise.all(checks);
      const paidItem = results.find(i => i !== null);

      if (paidItem) {
        clearInterval(pollingRef.current!);

        // Remove o item pago da fila
        const updatedPending = pendingRoasts.filter(p => p.roastId !== paidItem.roastId);
        setPendingRoasts(updatedPending);
        if (updatedPending.length > 0) {
          localStorage.setItem("dpm_pending_roasts", JSON.stringify(updatedPending));
        } else {
          localStorage.removeItem("dpm_pending_roasts");
        }

        // Força a tela para mostrar a finalização deste item específico
        setRoastId(paidItem.roastId);
        setUserName(paidItem.userName);
        setUrl(paidItem.url);
        setStep("payment");
        setPixStatus("paid");
        setTimeout(() => startRoast(paidItem), 1200);
      } else if (step === "payment") {
        setPixStatus("waiting");
      }
    }, 2500);
    return () => clearInterval(pollingRef.current!);
  }, [pendingRoasts, step]);

  useEffect(() => {
    if (step !== "loading") return;
    const total = 5000;
    const tick = 80;
    let elapsed = 0;
    const iv = setInterval(() => {
      elapsed += tick;
      setLoadingProgress(Math.min((elapsed / total) * 100, 100));
      setLoadingIndex(Math.floor((elapsed / total) * 3));
      if (elapsed >= total) clearInterval(iv);
    }, tick);
    return () => clearInterval(iv);
  }, [step]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!val) {
      setUrlError("");
      return;
    }

    const { success, error } = providerPlaylistUrlSchema.safeParse(val);

    if (!success) {
      setUrlError(error.issues[0].message);
    } else {
      setUrlError("");
    }
  };

  const handleDestroy = async () => {
    if (!url.trim()) { inputRef.current?.focus(); return; }

    setLoading(true);
    // Adicionamos um pequeno timeout só pro usuário sentir o clique
    await new Promise(r => setTimeout(r, 400));

    const validation = providerPlaylistUrlSchema.safeParse(url);
    if (!validation.success) {
      // @ts-ignore
      setError(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    setError("");
    setLoading(false);

    if (anonymous) { setUserName("Anônimo Corajoso"); setStep("payment"); }
    else setStep("name");
  };

  const handleNameConfirm = async () => {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    setPixStatus("waiting");
    setStep("payment");
    setError("");
    try {
      const res = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: name, playlistUrl: url, anonymous }),
      });
      const data = await res.json();
      setBrCode(data.brCode ?? "");
      setBrCodeBase64(data.brCodeBase64 ?? "");
      setRoastId(data.roastId ?? "");

      const newItem: PendingRoast = {
        roastId: data.roastId,
        brCode: data.brCode,
        brCodeBase64: data.brCodeBase64,
        userName: name,
        url: url,
        anonymous: anonymous
      };
      const updated = [...pendingRoasts, newItem];
      setPendingRoasts(updated);
      localStorage.setItem("dpm_pending_roasts", JSON.stringify(updated));
    } catch {
      console.warn("PIX não configurado — modo dev");
      setRoastId("dev-" + Date.now());
    }
  };

  const startRoast = async (item?: PendingRoast) => {
    const rUrl = item ? item.url : url;
    const rName = item ? item.userName : userName;
    const rAnon = item ? item.anonymous : anonymous;
    const rId = item ? item.roastId : roastId;

    clearInterval(pollingRef.current!);
    setStep("loading");
    setLoadingProgress(0);
    setLoadingIndex(0);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rUrl, userName: rName, anonymous: rAnon, roastId: rId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar roast");
      await new Promise((r) => setTimeout(r, 5000));
      setResult({
        id: data.roast.id,
        userName,
        score: data.roast.score,
        roast: data.roast.roast,
        tags: data.roast.tags ?? {},
      });
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Algo deu errado. Tente novamente.");
      setStep("home");
    }
  };

  const handleDevSkipPayment = () => startRoast();



  const handleReset = () => {
    setUrl(""); setUserName(""); setNameInput("");
    setResult(null); setError(""); setBrCode(""); setBrCodeBase64("");

    // Remove APENAS o ativo da memória (localStorage e array de polling), preservando outros pendentes
    if (roastId) {
      const updated = pendingRoasts.filter(p => p.roastId !== roastId);
      setPendingRoasts(updated);
      if (updated.length > 0) {
        localStorage.setItem("dpm_pending_roasts", JSON.stringify(updated));
      } else {
        localStorage.removeItem("dpm_pending_roasts");
      }
    }

    setRoastId(""); setStep("home");
    setPixStatus("waiting");
    clearInterval(pollingRef.current!);
  };

  const shareText = result
    ? `🎧 Playlist de ${result.userName} destruída pela IA — Score ${result.score.toFixed(1)}/10\n${result.roast}\n\nDestrua a sua: www.destruaminhaplaylist.com.br`
    : "";

  const shareInstagram = () => {
    if (navigator.share) {
      navigator.share({ title: "Minha Playlist foi Destruída 💀", text: shareText, url: "https://www.destruaminhaplaylist.com.br" });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Texto copiado! Cole nos seus Stories do Instagram.");
    }
  };
  const shareWhatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.destruaminhaplaylist.com.br")}&quote=${encodeURIComponent(shareText)}`, "_blank");

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="fixed inset-0 bg-[#090909] flex flex-col items-center justify-center px-8 z-50">
      <div className="w-14 h-14 rounded-full border-2 border-[#1DB954]/30 border-t-[#1DB954] animate-spin mb-10" />
      <div className="text-center min-h-[5rem] mb-8">
        {loadingPhrases.slice(0, Math.min(loadingIndex + 1, 3)).map((phrase, i) => (
          <p key={i} className={`text-sm mb-2 transition-all ${i === loadingIndex ? "text-white" : "text-gray-700"}`}>
            {i < loadingIndex ? <span className="text-[#1DB954] mr-2">✓</span> : <span className="text-[#1DB954]/60 mr-2">▶</span>}
            {phrase}
          </p>
        ))}
      </div>
      <div className="w-full max-w-xs h-[2px] bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full bg-[#1DB954] rounded-full transition-all duration-150" style={{ width: `${loadingProgress}%` }} />
      </div>
      <p className="text-[10px] text-gray-700 uppercase tracking-widest mt-3">{Math.round(loadingProgress)}%</p>
    </div>
  );

  // ─── RESULT ──────────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const topTags = Object.entries(result.tags).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
        style={{ background: "radial-gradient(ellipse at top, #0d1f12 0%, #090909 60%)" }}>

        <style>{`
          @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-in { animation: fadeInUp .5s ease forwards; }
          .fade-in-2 { animation: fadeInUp .5s .15s ease both; }
          .fade-in-3 { animation: fadeInUp .5s .3s ease both; }
          @keyframes pulse-glow {
            0%,100% { box-shadow: 0 0 30px rgba(29,185,84,0.15), 0 0 60px rgba(29,185,84,0.05); }
            50% { box-shadow: 0 0 50px rgba(29,185,84,0.3), 0 0 100px rgba(29,185,84,0.1); }
          }
          .card-glow { animation: pulse-glow 3s ease-in-out infinite; }
        `}</style>

        {/* Card resultado */}
        <div id="result-card" className="card-glow fade-in w-full max-w-sm rounded-3xl p-7 mb-6 relative overflow-hidden border border-[#1DB954]/30"
          style={{ background: "linear-gradient(145deg, #0f1a11 0%, #0a0a0a 100%)" }}>

          {/* Glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, #1DB954, transparent)" }} />

          <p className="text-[9px] text-[#1DB954]/50 uppercase tracking-[0.3em] mb-6 text-center font-bold">
            www.destruaminhaplaylist.com.br
          </p>

          {/* Nome */}
          <div className="text-center mb-5">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.25em] mb-1">Playlist de</p>
            <h2 className="text-white font-black text-3xl leading-none" style={{ fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.03em" }}>
              {result.userName}
            </h2>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4 mb-6 py-4 rounded-2xl border border-[#1DB954]/10 bg-[#1DB954]/5">
            <div className="text-center">
              <p className="text-[#1DB954] font-black leading-none" style={{ fontSize: "4rem", textShadow: "0 0 30px rgba(29,185,84,0.6)", fontFamily: "'Arial Black', sans-serif" }}>
                {result?.score?.toFixed(1)}
              </p>
              <p className="text-gray-600 text-xs tracking-widest">/10</p>
            </div>
            <div className="h-12 w-px bg-[#1DB954]/20" />
            <p className="text-base text-white font-black">{SCORE_LABEL(result?.score)}</p>
          </div>

          {/* Roast — sem aspas, sem itálico, texto maior */}
          <div className="rounded-2xl p-5 mb-5 border border-[#222]" style={{ background: "#111" }}>
            <p className="text-gray-200 text-base leading-relaxed text-center font-medium">
              {result.roast}
            </p>
          </div>

          {/* 8 atributos em grid 2 colunas */}
          {topTags.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {topTags.map(([key, val]) => (
                <div key={key} className="rounded-xl px-3 py-2 border border-[#1e1e1e]" style={{ background: "#0d0d0d" }}>
                  <p className="text-[10px] text-gray-400 mb-[6px] leading-tight font-semibold">{TAG_LABELS[key] || key}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${val * 10}%`, boxShadow: "0 0 6px rgba(29,185,84,0.5)" }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold w-6 text-right">{val.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share */}
        <div className="fade-in-2 w-full max-w-sm mb-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center mb-3">Compartilhar</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={shareInstagram}
              className="py-3 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f] text-xs font-bold text-gray-400 hover:border-pink-500/40 hover:text-pink-400 transition-all flex items-center justify-center gap-2">
              📸 Instagram
            </button>
            <button onClick={shareWhatsapp}
              className="py-3 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f] text-xs font-bold text-gray-400 hover:border-[#25D366]/40 hover:text-[#25D366] transition-all flex items-center justify-center gap-2">
              💬 WhatsApp
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={shareFacebook}
              className="py-3 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f] text-xs font-bold text-gray-400 hover:border-[#1877F2]/40 hover:text-[#1877F2] transition-all flex items-center justify-center gap-2">
              👍 Facebook
            </button>
            <button onClick={shareTwitter}
              className="py-3 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f] text-xs font-bold text-gray-400 hover:border-[#1DA1F2]/40 hover:text-[#1DA1F2] transition-all flex items-center justify-center gap-2">
              🐦 Twitter/X
            </button>
          </div>
        </div>

        <button onClick={handleReset}
          className="fade-in-3 w-full max-w-sm py-4 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/5 text-[#1DB954] font-black text-sm tracking-widest uppercase hover:bg-[#1DB954]/10 transition-all active:scale-95">
          🔄 Destruir Outra Playlist?
        </button>
      </div>
    );
  }

  // ─── HOME ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col items-center py-12 px-4">

      {/* MODAL — Nome */}
      {step === "name" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#222] rounded-3xl p-8 text-center" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
            <p className="text-3xl mb-2">👤</p>
            <h2 className="text-white font-black text-xl mb-1" style={{ fontFamily: "'Arial Black', sans-serif" }}>Como te chamam?</h2>
            <p className="text-gray-600 text-xs mb-6 uppercase tracking-widest">Pra constar na execução pública</p>
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameConfirm()}
              type="text"
              placeholder="Seu nome ou apelido..."
              maxLength={30}
              className="w-full py-4 px-4 rounded-xl text-base bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-gray-700 focus:border-[#1DB954] focus:outline-none mb-4 text-center"
            />
            <button onClick={handleNameConfirm} disabled={!nameInput.trim()} className="w-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-30 text-black font-black py-4 rounded-xl text-sm tracking-widest uppercase transition-all active:scale-95">
              CONTINUAR →
            </button>
            <button onClick={() => setStep("home")} className="mt-3 text-xs text-gray-700 hover:text-gray-500 transition-colors uppercase tracking-widest block w-full">
              Cancelar e Voltar ao Início
            </button>
          </div>
        </div>
      )}

      {/* MODAL — PIX */}
      {step === "payment" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#222] rounded-3xl p-8 text-center" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
            <p className="text-3xl mb-2">💸</p>
            <h2 className="text-white font-black text-xl mb-1" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              R$ 4,97 pra gente ter coragem de ouvir :)
            </h2>
            <p className="text-[#1DB954]/80 text-xs mb-5">
              Você já pagou mais por coisa pior...
            </p>
            <div className="mx-auto mb-6 w-full flex flex-col items-center justify-center gap-4">
              {brCodeBase64 ? (
                <>
                  <img src={`data:image/png;base64,${brCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-xl p-2 bg-white" />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(brCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full bg-[#1DB954] hover:bg-green-500 text-black font-black py-4 rounded-xl text-sm transition-all"
                  >
                    {copied ? "✓ Copiado" : "Pix Copia e Cola"}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-[#1a1a1a] text-gray-400 font-bold py-4 rounded-xl animate-pulse text-sm transition-all"
                >
                  Gerando PIX...
                </button>
              )}
            </div>
            <div className="mb-5 py-3 rounded-xl bg-[#111] border border-[#1a1a1a]">
              {pixStatus === "paid" ? (
                <p className="text-[#1DB954] text-sm font-black">✓ Pagamento confirmado! Iniciando destruição…</p>
              ) : pixStatus === "checking" ? (
                <p className="text-gray-500 text-xs">🔄 Verificando pagamento…</p>
              ) : (
                <p className="text-gray-600 text-xs">⏳ Aguardando seu PIX…</p>
              )}
            </div>
            {(process.env.NODE_ENV === "development") && (
              <button onClick={handleDevSkipPayment} className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-black py-4 rounded-xl text-sm tracking-widest uppercase transition-all active:scale-95 mb-3" style={{ boxShadow: "0 4px 20px rgba(29,185,84,0.3)" }}>
                🛠 DEV: Pular Pagamento
              </button>
            )}
            <button onClick={handleReset} className="text-xs text-gray-700 hover:text-red-500 transition-colors uppercase tracking-widest block w-full mt-4">
              Cancelar e Voltar do Início
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 italic">Experimento social totalmente científico</p>
      <h1 className="text-5xl md:text-6xl font-black text-white mb-2 text-center tracking-tighter">
        DESTRUA SUA <span className="text-[#1DB954]">PLAYLIST</span>
      </h1>
      <p className="text-lg text-gray-400 mb-10 text-center max-w-lg">
        Cole sua playlist favorita e <span className="uppercase font-bold text-gray-200">submeta</span> a sua dignidade musical ao julgamento da nossa IA ácida.
      </p>

      {/* INPUT */}
      <div className="w-full max-w-2xl mb-16">
        {urlError && <p className="text-red-500 text-sm mt-2 px-2">{urlError}</p>}
        <div className="flex flex-col min-[480px]:relative min-[480px]:flex-row items-center mb-4 gap-4 min-[480px]:gap-0">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🎧</span>
            <input
              ref={inputRef}
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDestroy()}
              type="text"
              placeholder="Link do Spotify ou YouTube..."
              className="w-full py-5 pl-12 pr-4 min-[480px]:pr-32 rounded-xl text-lg bg-[#1a1a1a] border border-[#333] text-white focus:border-[#1DB954] focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleDestroy}
            disabled={loading || !!urlError || !url}
            className="w-full min-[480px]:w-auto min-[480px]:absolute min-[480px]:right-2 bg-[#1DB954] hover:bg-green-500 text-black font-bold py-3 px-6 rounded-lg transition-all active:scale-95 whitespace-nowrap"
          >
            {loading ? "JULGANDO..." : "DESTRUIR"}
          </button>
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
        {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
      </div>

      {/* MURAL */}
      <div className="w-full max-w-5xl">
        <h3 className="flex items-center justify-center gap-2 text-white font-bold mb-8 uppercase tracking-widest text-sm">
          <span>🔥</span> RECENTEMENTE DESTRUÍDAS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {isFetchingRecent ? (
            Array.from({ length: 4 }).map((_, i) => <RoastCardSkeleton key={i} />)
          ) : (
            recentRoasts.map((item) => <RoastCard key={item.id} data={item} />)
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-20 text-center max-w-md border-t border-[#282828] pt-8">
        <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-tighter">
          Ei, ei, ei! <br />Você sabe que é apenas humor e não vai acabar a nossa amizade por isso, né?
        </p>
      </div>
    </div>
  );
}

function RoastCardSkeleton() {
  return (
    <div className="bg-[#121212] border border-[#282828] rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 bg-[#282828] rounded w-1/3"></div>
        <div className="h-6 bg-[#282828] rounded w-12"></div>
      </div>
      <div className="mb-6">
        <div className="h-4 bg-[#282828] rounded w-full mb-2"></div>
        <div className="h-4 bg-[#282828] rounded w-5/6"></div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between mb-1">
              <div className="h-3 bg-[#282828] rounded w-1/4"></div>
              <div className="h-3 bg-[#282828] rounded w-8"></div>
            </div>
            <div className="w-full bg-[#282828] rounded-full h-1.5"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
