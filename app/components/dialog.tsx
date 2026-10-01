"use client";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { Events } from "./calendar";
import {
  IoClose,
  IoCalendarOutline,
  IoLocationOutline,
  IoCallOutline,
} from "react-icons/io5";
import { FaTrashAlt, FaUser } from "react-icons/fa";
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
  onDelete,
}) => {
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState({ save: false, delete: false });

  const isEditing = Boolean(event);

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
    if (isLoading.save) return;

    setIsLoading((prev) => ({ ...prev, save: true }));
    try {
      const targetDate = event ? event.date : dayPicked.toISOString();

      const newOrUpdatedEvent: Events = {
        date: targetDate,
        memberName: memberName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim() || "Almoço da ala",
      };

      await onSave(newOrUpdatedEvent);
      onClose();
    } catch (err) {
      console.error("Error saving event:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete || isLoading.delete) return;
    if (!confirm("Tem certeza que deseja cancelar este almoço?")) return;

    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await onDelete(event.date);
      onClose();
    } catch (err) {
      console.error("Error deleting event:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop: Soft & Translucent */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog: Soft, Light & Centered */}
      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,32,66,0.12)] border border-slate-100 w-full max-w-lg overflow-hidden z-10 max-h-[92vh] flex flex-col animate-open my-auto">
        {/* Modal Header: Clean & Soft */}
        <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center border border-blue-100/80 shadow-2xs">
              <IoCalendarOutline className="w-5 h-5 text-[#1e3a8a]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
                {isEditing ? "Detalhes do Almoço" : "Marcar Almoço"}
              </h2>
              <p className="text-xs font-semibold text-[#1e3a8a] capitalize">
                {format(dayPicked, "EEEE, d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center"
            aria-label="Fechar"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 focus:border-[#1e3a8a] transition-all bg-slate-50/50 hover:bg-white focus:bg-white font-medium"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 focus:border-[#1e3a8a] transition-all bg-slate-50/50 hover:bg-white focus:bg-white font-medium"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 focus:border-[#1e3a8a] transition-all bg-slate-50/50 hover:bg-white focus:bg-white font-medium"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 focus:border-[#1e3a8a] transition-all bg-slate-50/50 hover:bg-white focus:bg-white resize-none font-medium"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading.delete}
                className="order-2 sm:order-1 flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-600 font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading.delete ? (
                  <LuLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FaTrashAlt className="w-3.5 h-3.5" />
                )}
                <span>Cancelar Almoço</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading.save}
              className="order-1 sm:order-2 flex-1 px-5 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] active:bg-[#0f2042] text-white font-bold text-sm shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading.save && <LuLoader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isEditing ? "Salvar Alterações" : "Confirmar Agendamento"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dialog;
