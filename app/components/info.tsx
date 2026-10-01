"use client";
import React, { useMemo } from "react";
import { Events } from "./calendar";
import { format, isSameDay, parseISO } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { IoClose, IoLocationOutline, IoCallOutline, IoCalendarOutline } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  dayPicked: Date;
  bookedDates: Events[];
}

const Information: React.FC<ModalProps> = ({
  isOpen,
  bookedDates,
  onClose,
  dayPicked,
}) => {
  const bookedData: Events | undefined = useMemo(() => {
    return bookedDates.find((element) => {
      try {
        return isSameDay(parseISO(element.date), dayPicked);
      } catch {
        return isSameDay(new Date(element.date), dayPicked);
      }
    });
  }, [isOpen, bookedDates, dayPicked]);

  if (!isOpen || !bookedData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Soft & Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={() => onClose(false)}
      />

      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,32,66,0.12)] border border-slate-100 max-w-md w-full overflow-hidden z-10 animate-open my-auto">
        {/* Header: Light & Airy */}
        <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center border border-blue-100/80 shadow-2xs">
              <IoCalendarOutline className="w-5 h-5 text-[#1e3a8a]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Informações do Almoço
              </h3>
              <p className="text-xs text-[#1e3a8a] font-semibold capitalize">
                {format(dayPicked, "EEEE, d 'de' MMMM", { locale: pt })}
              </p>
            </div>
          </div>

          <button
            onClick={() => onClose(false)}
            className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a]">
              Membro / Família
            </span>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {bookedData.memberName}
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-2.5">
              <IoLocationOutline className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-500 block">Endereço</span>
                <span className="font-semibold text-slate-900">{bookedData.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <IoCallOutline className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-500 block">Telefone</span>
                <span className="font-semibold text-slate-900">{bookedData.phone}</span>
              </div>
            </div>

            {bookedData.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 block mb-1">Observações</span>
                <p className="text-xs italic text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                  {bookedData.notes}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onClose(false)}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-sm transition-all shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Information;
