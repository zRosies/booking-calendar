"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface WardItem {
  _id: string;
  name: string;
  slug: string;
  stakeId: string;
}

interface StakeItem {
  _id: string;
  name: string;
  slug: string;
  wards: WardItem[];
}

interface WardSelectDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  defaultStakeSlug?: string;
  defaultWardSlug?: string;
  isDismissible?: boolean;
  onlyWard?: boolean;
  stakeName?: string;
}

export default function WardSelectDialog({
  isOpen,
  onClose,
  defaultStakeSlug,
  defaultWardSlug,
  isDismissible = true,
  onlyWard = false,
  stakeName,
}: WardSelectDialogProps) {
  const router = useRouter();
  const [stakes, setStakes] = useState<StakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStakeSlug, setSelectedStakeSlug] = useState(
    defaultStakeSlug || "",
  );
  const [selectedWardSlug, setSelectedWardSlug] = useState(
    defaultWardSlug || "",
  );

  // Fechar com ESC somente se for descartável (fora da home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDismissible && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDismissible, onClose]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/stakes");
        if (res.ok) {
          const data: StakeItem[] = await res.json();
          setStakes(data);

          if (defaultStakeSlug) {
            const foundStake = data.find((s) => s.slug === defaultStakeSlug);
            if (foundStake) {
              setSelectedStakeSlug(foundStake.slug);
              if (defaultWardSlug) {
                const foundWard = foundStake.wards?.find(
                  (w) => w.slug === defaultWardSlug,
                );
                if (foundWard) {
                  setSelectedWardSlug(foundWard.slug);
                } else if (foundStake.wards?.length > 0) {
                  setSelectedWardSlug(foundStake.wards[0].slug);
                }
              } else if (foundStake.wards?.length > 0) {
                setSelectedWardSlug(foundStake.wards[0].slug);
              }
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar estacas:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen, defaultStakeSlug, defaultWardSlug]);

  if (!isOpen) return null;

  const currentStake = stakes.find((s) => s.slug === selectedStakeSlug);
  const currentWards = currentStake?.wards || [];

  const handleStakeChange = (slug: string) => {
    setSelectedStakeSlug(slug);
    const stake = stakes.find((s) => s.slug === slug);
    if (stake && stake.wards?.length > 0) {
      setSelectedWardSlug(stake.wards[0].slug);
    } else {
      setSelectedWardSlug("");
    }
  };

  const handleGoToCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStakeSlug || !selectedWardSlug) return;
    if (onClose) onClose();
    router.push(`/${selectedStakeSlug}/${selectedWardSlug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop: Efeito Blur Profundo atrás do Almoço dos Missionários */}
      <div
        className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md sm:backdrop-blur-lg transition-all duration-300"
        onClick={isDismissible ? onClose : undefined}
      />

      {/* Pop-up Modal Container */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,32,66,0.3)] border border-white/80 sm:border-slate-200/80 w-full max-w-md overflow-hidden z-10 max-h-[92vh] flex flex-col animate-open my-auto ring-1 ring-slate-900/5">
        {/* Header do Pop-up */}
        <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#1e3a8a] flex items-center justify-center border border-blue-100 shadow-xs text-xl">
              🍲
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 leading-snug tracking-tight">
                {onlyWard ? "Trocar de Ala" : "Almoço com os Missionários"}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {onlyWard
                  ? stakeName || currentStake?.name || "Nesta Estaca"
                  : "Selecione sua congregação para começar"}
              </p>
            </div>
          </div>

          {/* Botão de Fechar: Apenas quando permitido (fora da home) */}
          {isDismissible && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center border border-slate-200/80 shadow-xs active:scale-95"
              aria-label="Fechar"
            >
              <IoClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Corpo do Pop-up */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            {onlyWard
              ? "Selecione para qual ala desta estaca deseja mudar a visualização do calendário."
              : "Por favor, selecione a sua Estaca e Ala para acessar a escala de almoços e agendar um dia com os missionários."}
          </p>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-[#0f2042] rounded-full animate-spin" />
              <span className="text-xs font-medium">
                Carregando congregações...
              </span>
            </div>
          ) : (
            <form onSubmit={handleGoToCalendar} className="space-y-4">
              {/* Se onlyWard for true, exibe a Estaca fixa; senão, exibe o seletor */}
              {onlyWard ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estaca:</span>
                  <span className="font-bold text-[#0f2042]">
                    {stakeName || currentStake?.name || "Estaca Atual"}
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    1. Selecione a Estaca{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStakeSlug}
                    onChange={(e) => handleStakeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white text-slate-800 shadow-2xs"
                    required
                  >
                    <option value="" disabled>
                      -- Selecione a sua Estaca --
                    </option>
                    {stakes.map((s) => (
                      <option key={s._id} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seletor de Ala */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {onlyWard ? "Selecione a Nova Ala" : "2. Selecione a Ala"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedWardSlug}
                  onChange={(e) => setSelectedWardSlug(e.target.value)}
                  disabled={!selectedStakeSlug || currentWards.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white text-slate-800 shadow-2xs disabled:opacity-50 disabled:bg-slate-100"
                  required
                >
                  {!selectedStakeSlug ? (
                    <option value="" disabled>
                      Selecione uma estaca primeiro
                    </option>
                  ) : currentWards.length === 0 ? (
                    <option value="" disabled>
                      Nenhuma ala encontrada nesta estaca
                    </option>
                  ) : (
                    <>
                      <option value="" disabled>
                        -- Selecione a sua Ala --
                      </option>
                      {currentWards.map((w) => (
                        <option key={w._id} value={w.slug}>
                          {w.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Botão de Ação */}
              <button
                type="submit"
                disabled={!selectedStakeSlug || !selectedWardSlug}
                className="w-full mt-2 py-3 px-5 rounded-xl bg-gradient-to-r from-[#0f2042] to-[#1e3a8a] hover:from-[#172554] hover:to-[#1d4ed8] text-white text-sm font-bold shadow-md shadow-[#0f2042]/15 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {onlyWard ? "Mudar para esta Ala" : "Acessar Calendário"}
                </span>
                <FaArrowRight className="w-3.5 h-3.5" />
              </button>

              {onlyWard && (
                <div className="pt-1 text-center">
                  <a
                    href="/"
                    className="text-xs text-slate-500 hover:text-[#1e3a8a] font-medium transition-colors"
                  >
                    &larr; Trocar de Estaca (voltar à página inicial)
                  </a>
                </div>
              )}
            </form>
          )}

          {/* Aviso Legal de Não Afiliação Oficial */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              Iniciativa independente de apoio mútuo comunitário. Não é um
              aplicativo, publicação ou site oficial de A Igreja de Jesus Cristo
              dos Santos dos Últimos Dias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
