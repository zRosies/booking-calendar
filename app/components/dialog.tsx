"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { Events } from "./calendar";
import { IoClose, IoLocationOutline, IoCallOutline } from "react-icons/io5";
import { FaUser, FaWhatsapp } from "react-icons/fa";
import { LuLoader2 } from "react-icons/lu";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayPicked: Date;
  event?: Events | null;
  onSave: (event: Events) => Promise<void> | void;
  onDelete?: (date: string) => Promise<void> | void;
}

const Dialog: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  dayPicked,
  event,
  onSave,
}) => {
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isInfoMode = Boolean(event);

  useEffect(() => {
    if (event) {
      setMemberName(event.memberName || "");
      setPhone(event.phone || "");
      setAddress(event.address || "");
      setNotes(event.notes || "");
    } else {
      setMemberName("");
      setPhone("");
      setAddress("");
      setNotes("");
    }
  }, [event, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isInfoMode) return;

    setIsLoading(true);
    try {
      const targetDate = dayPicked.toISOString();

      const newEvent: Events = {
        date: targetDate,
        memberName: memberName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim() || "Almoço da ala",
      };

      await onSave(newEvent);
      onClose();
    } catch (err) {
      console.error("Error saving event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPhone = event?.phone ? event.phone.replace(/\D/g, "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop: Efeito Blur Profundo e Elegante */}
      <div
        className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md sm:backdrop-blur-lg transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog: Pop-up Moderno e Elevado */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,32,66,0.3)] border border-white/80 sm:border-slate-200/80 w-full max-w-lg overflow-hidden z-10 max-h-[92vh] flex flex-col animate-open my-auto ring-1 ring-slate-900/5">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#1e3a8a] flex items-center justify-center border border-blue-100 shadow-xs text-xl">
              {isInfoMode ? "🍽️" : "🍲"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
                  {isInfoMode ? "Detalhes do Almoço" : "Agendar Almoço"}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isInfoMode
                      ? "bg-blue-100 text-[#1e3a8a] border border-blue-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {isInfoMode ? "Confirmado" : "Disponível"}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 capitalize mt-0.5">
                {format(dayPicked, "EEEE, d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center border border-slate-200/80 shadow-xs active:scale-95"
            aria-label="Fechar"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODO 1: DIALOG DE INFO (Somente Visualização de Detalhes)  */}
        {/* ======================================================== */}
        {isInfoMode && event ? (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll">
            {/* Membro / Família Anfitriã */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center shrink-0 border border-blue-100 text-base">
                <FaUser />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Família / Membro Anfitrião
                </span>
                <h3 className="text-base font-black text-slate-900 truncate">
                  {event.memberName}
                </h3>
              </div>
            </div>

            {/* Contato / WhatsApp */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 text-lg">
                <IoCallOutline />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Telefone de Contato
                </span>
                {event.phone ? (
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-slate-800">
                      {event.phone}
                    </span>
                    {cleanPhone.length >= 8 && (
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-xs"
                      >
                        <FaWhatsapp className="w-3.5 h-3.5" />
                        <span>Conversar no WhatsApp</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Não informado</span>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center shrink-0 border border-blue-100 text-lg">
                <IoLocationOutline />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Endereço do Almoço
                </span>
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {event.address || (
                    <span className="text-slate-400 font-normal italic">
                      Endereço não informado
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Observações / Recado */}
            {event.notes && (
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 text-base">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Observações / Cardápio
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {event.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Aviso Informativo de Edição Restrita */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
              <span className="text-sm">🔒</span>
              <span>
                Para alterar ou desmarcar este almoço, por favor contate a liderança da missão da sua ala.
              </span>
            </div>

            {/* Botão de Fechar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] text-center"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO 2: FORMULÁRIO DE NOVO AGENDAMENTO                   */
          /* ======================================================== */
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll"
          >
            {/* Member Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome do Membro / Família <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaUser className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Ex: Rosane, Betinha, Bispo e Família"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Telefone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IoCallOutline className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (21) 98765-4321"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Endereço Completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IoLocationOutline className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua Cambaúba, 450 - Galeão"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Observações / Recado
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Almoço às 12:30. Preferência sem glúten, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white resize-none font-medium shadow-2xs"
              />
            </div>

            {/* Buttons Footer */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="order-1 sm:order-2 flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f2042] to-[#1e3a8a] hover:from-[#172554] hover:to-[#1d4ed8] text-white font-bold text-sm shadow-md shadow-[#0f2042]/15 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading && <LuLoader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmar Almoço</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Dialog;
