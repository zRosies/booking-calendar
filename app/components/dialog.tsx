"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { Events } from "./calendar";
import { IoClose, IoLocationOutline, IoCallOutline } from "react-icons/io5";
import { FaUser, FaWhatsapp } from "react-icons/fa";
import {
  LuLoader2,
  LuTrash2,
  LuPencil,
  LuArrowLeft,
  LuShieldCheck,
  LuAlertTriangle,
} from "react-icons/lu";
import {
  getOrCreateGuestId,
  isGuestModePreferred,
  setGuestModePreferred,
  saveGuestBooking,
  hasGuestToken,
  removeGuestBooking,
  hasGuestBookingForDate,
} from "../utils/guest-session";
import Image from "next/image";

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export interface CurrentUser {
  id?: string;
  email: string;
  name: string;
  picture?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayPicked: Date;
  event?: Events | null;
  currentUser?: CurrentUser | null;
  onSave: (event: Events) => Promise<void> | void;
  onDelete?: (date: string, guestToken?: string) => Promise<void> | void;
}

export const formatPhoneNumber = (value: string): string => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const Dialog: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  dayPicked,
  event,
  currentUser,
  onSave,
  onDelete,
}) => {
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para agendamento de novo almoço
  const [newBookingStep, setNewBookingStep] = useState<"choice" | "form">(
    "choice",
  );

  // Estados para almoço já existente
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Verifica propriedade do almoço: o ID do usuário deve bater com o ID do evento (memberId, userEmail ou guest_id)
  const isExistingEvent = Boolean(event);
  const currentGuestId =
    typeof window !== "undefined" ? getOrCreateGuestId() : "";

  const isOwner = Boolean(
    event &&
      // 1. O ID do usuário bate diretamente com o memberId do evento
      ((currentUser?.id &&
        event.memberId &&
        String(currentUser.id) === String(event.memberId)) ||
        // 2. O e-mail do usuário bate com o userEmail do evento
        (currentUser?.email &&
          event.userEmail &&
          currentUser.email.toLowerCase() === event.userEmail.toLowerCase()) ||
        // 3. O guest_uuid deste navegador bate com o guestToken do evento
        (event.guestToken &&
          ((currentGuestId && currentGuestId === event.guestToken) ||
            hasGuestToken(event.guestToken))) ||
        // 4. Este navegador agendou esta data (reconhece agendamento local mesmo se salvo anteriormente)
        (!event.userEmail && hasGuestBookingForDate(event.date))),
  );

  // Inicializa dados do formulário quando o modal abre ou o evento muda
  useEffect(() => {
    if (event) {
      setMemberName(event.memberName || "");
      setPhone(formatPhoneNumber(event.phone || ""));
      setAddress(event.address || "");
      setNotes(event.notes || "");
      setIsEditing(false);
      setIsConfirmingDelete(false);
    } else {
      // Novo agendamento: se usuário já está logado no Google ou já optou pelo modo convidado, pula direto para o formulário
      setMemberName(currentUser?.name || "");
      setPhone("");
      setAddress("");
      setNotes("");
      const shouldSkipChoice = Boolean(currentUser || isGuestModePreferred());
      setNewBookingStep(shouldSkipChoice ? "form" : "choice");
      setIsEditing(false);
      setIsConfirmingDelete(false);
    }
  }, [event, isOpen, currentUser]);

  // Fecha modal com a tecla ESC
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

  // Redireciona para login Google
  const handleGoogleLogin = () => {
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    const bookDateParam = encodeURIComponent(dayPicked.toISOString());
    window.location.href = `/api/auth/google?bookDate=${bookDateParam}&returnUrl=${returnUrl}`;
  };

  // Salvar novo almoço ou edição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const targetDate = dayPicked.toISOString();

      if (isExistingEvent && event) {
        // Modo Edição de Almoço Existente
        const updatedEvent: Events = {
          ...event,
          date: targetDate,
          memberName: memberName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || "Almoço da ala",
        };

        await onSave(updatedEvent);
        setIsEditing(false);
        onClose();
      } else {
        // Modo Novo Agendamento
        let guestToken: string | undefined = undefined;
        let authProvider: "google" | "guest" = "guest";

        if (currentUser) {
          authProvider = "google";
        } else {
          // Usuário no modo convidado: usa o guestId único e persistente do navegador
          guestToken = getOrCreateGuestId();
          saveGuestBooking(guestToken, targetDate);
          authProvider = "guest";
        }

        const newEvent: Events = {
          date: targetDate,
          memberName: memberName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || "Almoço da ala",
          userEmail: currentUser?.email,
          userName: currentUser?.name,
          guestToken,
          authProvider,
        };

        await onSave(newEvent);
        onClose();
      }
    } catch (err) {
      console.error("Erro ao salvar almoço:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Exclusão / Cancelamento de Almoço
  const handleDelete = async () => {
    if (!event || !onDelete || isLoading) return;
    setIsLoading(true);
    try {
      if (event.guestToken) {
        removeGuestBooking(event.guestToken);
      }
      await onDelete(event.date, event.guestToken);
      onClose();
    } catch (err) {
      console.error("Erro ao cancelar almoço:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPhone = event?.phone ? event.phone.replace(/\D/g, "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop com Blur Profundo */}
      <div
        className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md sm:backdrop-blur-lg transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Elevado */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,32,66,0.3)] border border-white/80 sm:border-slate-200/80 w-full max-w-lg overflow-hidden z-10 max-h-[92vh] flex flex-col animate-open my-auto ring-1 ring-slate-900/5">
        {/* ======================================================== */}
        {/* MODAL HEADER                                             */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#1e3a8a] flex items-center justify-center border border-blue-100 shadow-xs text-xl">
              {isExistingEvent ? "🍽️" : "🍲"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
                  {isExistingEvent
                    ? isEditing
                      ? "Editar Almoço"
                      : "Detalhes do Almoço"
                    : "Agendar Almoço"}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isExistingEvent
                      ? "bg-blue-100 text-[#1e3a8a] border border-blue-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {isExistingEvent ? "Confirmado" : "Disponível"}
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
        {/* CORPO DO MODAL BASEADO NO ESTADO                        */}
        {/* ======================================================== */}

        {/* -------------------------------------------------------- */}
        {/* CENÁRIO 1: ALMOÇO EXISTENTE                              */}
        {/* -------------------------------------------------------- */}
        {isExistingEvent && event ? (
          isEditing ? (
            /* Formulário de Edição do Proprietário */
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll"
            >
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-[#1e3a8a] font-medium flex items-center gap-2">
                <LuPencil className="w-4 h-4 shrink-0" />
                <span>Atualize os dados do seu agendamento abaixo:</span>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Membro / Família{" "}
                  <span className="text-rose-500">*</span>
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
                    placeholder="Ex: Família Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IoCallOutline className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="Ex: (21) 98765-4321"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Endereço */}
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

              {/* Observações */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Observações / Cardápio
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {notes.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Almoço às 12:30. Preferência sem glúten, etc."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white resize-none font-medium shadow-2xs"
                />
              </div>

              {/* Botões Salvar / Cancelar Edição */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="order-2 sm:order-1 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all text-center"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="order-1 sm:order-2 flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f2042] to-[#1e3a8a] hover:from-[#172554] hover:to-[#1d4ed8] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <LuLoader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          ) : (
            /* Visualização de Detalhes (Read-Only ou Painel do Dono) */
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll">
              {/* Badge de Propriedade se o usuário for o criador */}
              {isOwner && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <LuShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Você agendou este almoço</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200">
                    {event.authProvider === "google"
                      ? "Conta Google"
                      : "Neste Navegador"}
                  </span>
                </div>
              )}

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
                    <span className="text-sm text-slate-400 italic">
                      Não informado
                    </span>
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

              {/* Confirmação de Cancelamento */}
              {isConfirmingDelete ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <LuAlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Deseja realmente desmarcar este almoço?</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Esta data ficará livre para outro membro da ala agendar.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 rounded-xl bg-white border border-rose-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                    >
                      Não, Manter
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isLoading && (
                        <LuLoader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>Sim, Desmarcar</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Botões de Ação para o Dono ou Aviso de Bloqueio para Terceiros */}
              {isOwner ? (
                !isConfirmingDelete && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] border border-blue-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <LuPencil className="w-3.5 h-3.5" />
                      <span>Editar Dados</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <LuTrash2 className="w-3.5 h-3.5" />
                      <span>Desmarcar Almoço</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
                  <span className="text-base leading-none">🔒</span>
                  <div className="leading-snug">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Edição restrita ao criador
                    </span>
                    Apenas quem agendou este almoço pode alterá-lo ou
                    cancelá-lo. Para qualquer ajuste, contate a liderança da
                    missão da sua ala.
                  </div>
                </div>
              )}

              {/* Botão de Fechar */}
              {!isConfirmingDelete && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] text-center"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              )}
            </div>
          )
        ) : /* -------------------------------------------------------- */
        /* CENÁRIO 2: NOVO AGENDAMENTO                              */
        /* -------------------------------------------------------- */
        newBookingStep === "choice" && !currentUser ? (
          /* PASSO 1: ESCOLHA ENTRE GOOGLE OAUTH OU CONVIDADO */
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Como deseja agendar seu almoço?
              </h3>
              <p className="text-xs text-slate-500">
                Para sua comodidade e segurança, selecione uma das opções
                abaixo:
              </p>
            </div>

            {/* OPÇÃO 1: GOOGLE (RECOMENDADO) */}
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border-2 border-blue-200/80 hover:border-blue-400 transition-all shadow-sm flex flex-col gap-3 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center shrink-0">
                  <GoogleIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      Conectar com Google
                    </h4>
                    <span className="text-[10px] font-extrabold bg-[#1e3a8a] text-white px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Seu agendamento fica salvo na sua conta. Você poderá
                    gerenciar, editar ou cancelar o almoço em qualquer celular
                    ou computador.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300/90 shadow-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group-hover:border-blue-300"
              >
                <GoogleIcon />
                <span>Entrar com Google e Agendar</span>
              </button>
            </div>

            {/* DIVISOR */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ou
              </span>
            </div>

            {/* OPÇÃO 2: CONTINUAR SEM LOGIN (COM AVISO EXPLÍCITO) */}
            <div className="rounded-2xl p-4 sm:p-5 bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900">
                <LuAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-amber-900">
                    Continuar sem login
                  </h5>
                  <p className="text-amber-800 leading-relaxed text-[11px] sm:text-xs">
                    <strong>Atenção:</strong> Se você não logar, você{" "}
                    <strong>não terá um cadastro</strong> e este agendamento
                    ficará vinculado <strong>apenas a este navegador</strong>.
                    Você <strong>não poderá</strong> gerenciar, editar ou
                    cancelar este almoço de outro dispositivo ou se limpar os
                    dados do navegador.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGuestModePreferred(true);
                  setNewBookingStep("form");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-bold text-xs sm:text-sm border border-amber-300/80 transition-all active:scale-[0.98] text-center"
              >
                Continuar sem login
              </button>
            </div>

            {/* BOTÃO CANCELAR */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm transition-all text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* PASSO 2: FORMULÁRIO DE NOVO AGENDAMENTO (USUÁRIO GOOGLE OU CONVIDADO) */
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scroll"
          >
            {/* Barra de Status de Autenticação */}
            {currentUser ? (
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/90 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser.picture ? (
                    <Image
                      src={currentUser.picture}
                      alt={currentUser.name}
                      width={100}
                      height={100}
                      className="w-7 h-7 rounded-full border border-blue-200 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate text-xs">
                    <span className="font-bold text-slate-800 block truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Google Conectado
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-medium">
                  <LuAlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Modo sem login (salvo neste navegador)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGuestModePreferred(false);
                    setNewBookingStep("choice");
                  }}
                  className="text-[10px] font-bold text-[#1e3a8a] hover:underline flex items-center gap-1"
                >
                  <LuArrowLeft className="w-3 h-3" />
                  <span>Conectar Google</span>
                </button>
              </div>
            )}

            {/* Nome do Membro */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome do Membro / Família{" "}
                <span className="text-rose-500">*</span>
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
                  placeholder="Ex: Família Silva ou Betinha"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Telefone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IoCallOutline className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  placeholder="Ex: (21) 98765-4321"
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white font-medium shadow-2xs"
                />
              </div>
            </div>

            {/* Endereço */}
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

            {/* Observações */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Observações / Cardápio
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {notes.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Almoço às 12:30. Preferência sem glúten, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 focus:border-[#1e3a8a] transition-all bg-slate-50/70 hover:bg-white focus:bg-white resize-none font-medium shadow-2xs"
              />
            </div>

            {/* Botões do Rodapé */}
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
