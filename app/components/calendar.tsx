"use client";
import React, { useEffect, useState, useMemo } from "react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
  startOfWeek,
  differenceInDays,
  addDays,
  subDays,
} from "date-fns";
import { pt } from "date-fns/locale/pt";
import { FaPlus, FaEye, FaStar } from "react-icons/fa";

import Dialog from "./dialog";
import Accordions from "./accordions";
import WardSelectDialog from "./ward-select-dialog";
export interface Events {
  date: string;
  memberName: string;
  address: string;
  phone: string;
  notes: string;
  wardId?: string;
}

export interface CalendarProps {
  wardId?: string;
  wardName?: string;
  stakeName?: string;
  stakeSlug?: string;
  wardSlug?: string;
  defaultSelectorOpen?: boolean;
  isHome?: boolean;
}

async function getEvents(wardId?: string) {
  const url = wardId ? `/api/calendar?wardId=${encodeURIComponent(wardId)}` : "/api/calendar";
  const data = await fetch(url);
  if (!data.ok) {
    throw new Error(`HTTP error! status: ${data.status} \n ${data.text()}`);
  }
  const json = await data.json();
  return json;
}

const DAYS_OF_WEEK = [
  { full: "Segunda", short: "Seg" },
  { full: "Terça", short: "Ter" },
  { full: "Quarta", short: "Qua" },
  { full: "Quinta", short: "Qui" },
  { full: "Sexta", short: "Sex" },
  { full: "Sábado", short: "Sáb" },
  { full: "Domingo", short: "Dom" },
];

const Calendar: React.FC<CalendarProps> = ({
  wardId,
  wardName,
  stakeName,
  stakeSlug,
  wardSlug,
  defaultSelectorOpen = false,
  isHome = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Events[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [wardDialogOpen, setWardDialogOpen] = useState(defaultSelectorOpen);

  // Modal dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    date: Date;
    event?: Events | null;
  }>({
    isOpen: false,
    date: new Date(),
    event: null,
  });

  // Current month at top (index 0) followed by 6 predecessor months (7 months total)
  const months = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i <= 6; i++) {
      list.push(subMonths(currentMonth, i));
    }
    return list;
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents(wardId);
      setEvents(data[0]?.events || []);
      setError(null);
    } catch (err) {
      console.error("Error in fetching events:", err);
      setError(`Erro ao carregar almoços: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchEvents();
  }, [wardId]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleGoToday = () => {
    setCurrentMonth(new Date());
  };

  // Calendar day interval calculations
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start, end });

  // Starting day of week: Monday is 1
  const startOfCalendar = startOfWeek(start, { weekStartsOn: 1 });
  const leadingOffset = differenceInDays(start, startOfCalendar);

  // Generate leading days from previous month
  const leadingDays = Array.from({ length: leadingOffset }).map((_, i) =>
    subDays(start, leadingOffset - i),
  );

  // Total cells so far: leadingDays + monthDays
  const totalSoFar = leadingDays.length + monthDays.length;
  // Complete row: 35 or 42 cells
  const targetTotal = totalSoFar <= 35 ? 35 : 42;
  const trailingCount = targetTotal - totalSoFar;
  const trailingDays = Array.from({ length: trailingCount }).map((_, i) =>
    addDays(end, i + 1),
  );

  // Match event for day
  const getEventForDay = (day: Date): Events | undefined => {
    return events.find((evt) => {
      try {
        return isSameDay(parseISO(evt.date), day);
      } catch {
        return isSameDay(new Date(evt.date), day);
      }
    });
  };

  // Event handlers for Save and Delete (Real backend API)
  const handleSaveEvent = async (savedEvent: Events) => {
    const existingIndex = events.findIndex((e) => {
      try {
        return isSameDay(parseISO(e.date), parseISO(savedEvent.date));
      } catch {
        return isSameDay(new Date(e.date), new Date(savedEvent.date));
      }
    });

    const payloadToSend = wardId ? { ...savedEvent, wardId } : savedEvent;

    if (existingIndex >= 0) {
      const response = await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: payloadToSend }),
      });
      if (!response.ok) {
        throw new Error("Falha ao atualizar almoço");
      }
    } else {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
      });
      if (!response.ok) {
        throw new Error("Falha ao agendar almoço");
      }
    }

    await fetchEvents();
  };

  const handleDeleteEvent = async (dateStr: string) => {
    const response = await fetch(
      `/api/calendar/${encodeURIComponent(dateStr)}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error("Falha ao cancelar almoço");
    }

    await fetchEvents();
  };

  const handleOpenNewDialog = (day: Date) => {
    setDialogState({
      isOpen: true,
      date: day,
      event: null,
    });
  };

  const handleOpenEditDialog = (day: Date, event: Events) => {
    setDialogState({
      isOpen: true,
      date: day,
      event,
    });
  };

  // Count events for current month
  const currentMonthEventsCount = useMemo(() => {
    return events.filter((evt) => {
      try {
        const d = parseISO(evt.date);
        return (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        );
      } catch {
        const d = new Date(evt.date);
        return (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        );
      }
    }).length;
  }, [events, currentMonth]);

  if (!isClient || (loading && events.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] gap-3">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-[#0f2042] rounded-full animate-spin" />
        <div className="text-[#0f2042] font-bold text-sm tracking-tight">
          Carregando calendário...
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] p-4 text-center gap-3">
        <p className="text-rose-600 font-semibold text-sm">{error}</p>
        <button
          onClick={() => fetchEvents()}
          className="px-4 py-2 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-sm transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-slate-800 p-1 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-start items-center">
      <div className="w-full max-w-[1520px] mx-auto flex flex-col gap-3">
        {/* Stake and Ward Breadcrumb Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {stakeName && (
              <>
                <span className="text-slate-500 font-semibold">{stakeName}</span>
                <span className="text-slate-300">/</span>
              </>
            )}
            <span className="text-[#0f2042] font-black text-sm sm:text-base">
              {wardName || "Ala Galeão"}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setWardDialogOpen(true)}
              className="text-[11px] sm:text-xs font-bold text-[#1e3a8a] hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-all active:scale-95"
            >
              Trocar Ala
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-3 sm:gap-5 lg:gap-8 items-start lg:items-stretch">
          {/* ======================================================== */}
          {/* CALENDAR SECTION (FIRST ON MOBILE via order-1 lg:order-2) */}
          {/* ======================================================== */}
        <section className="order-1 lg:order-2 flex-1 w-full bg-white rounded-xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_30px_rgba(15,32,66,0.04)] p-1.5 sm:p-5 md:p-7 flex flex-col gap-2 sm:gap-5 overflow-hidden">
          {/* Header Controls: Navigation and Month Title */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 border-b border-slate-100">
            {/* Month & Year Title */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight">
                {format(currentMonth, "MMMM yyyy", { locale: pt })}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-[#0f2042] border border-slate-200">
                <FaStar className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>{currentMonthEventsCount} no mês</span>
              </span>
            </div>

            {/* Navigation Buttons: Hoje, Prev, Next */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleGoToday}
                className="px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-white bg-[#0f2042] hover:bg-[#1e3a8a] transition-all shadow-xs"
              >
                Hoje
              </button>

              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 p-0.5 sm:p-1 rounded-lg sm:rounded-2xl border border-slate-200/90">
                <button
                  onClick={handlePrevMonth}
                  aria-label="Mês anterior"
                  className="w-6 h-6 sm:w-9 sm:h-9 rounded sm:rounded-xl bg-white hover:bg-slate-100 text-slate-800 shadow-xs flex items-center justify-center transition-all border border-slate-200/80"
                >
                  <IoIosArrowBack className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  aria-label="Próximo mês"
                  className="w-6 h-6 sm:w-9 sm:h-9 rounded sm:rounded-xl bg-white hover:bg-slate-100 text-slate-800 shadow-xs flex items-center justify-center transition-all border border-slate-200/80"
                >
                  <IoIosArrowForward className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center pb-0.5 sm:pb-1 text-slate-500 font-bold text-[10px] sm:text-xs md:text-sm tracking-tight sm:tracking-wider uppercase">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div key={idx} className="py-0.5 sm:py-1 truncate">
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            ))}
          </div>

          {/* 7-Column Days Grid: Tight, balanced mobile spacing matching reference */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2.5 md:gap-3 lg:gap-3.5 w-full">
            {/* Leading days from previous month */}
            {leadingDays.map((day, index) => {
              const dayEvent = getEventForDay(day);
              return (
                <div
                  key={`lead-${index}`}
                  onClick={() =>
                    dayEvent
                      ? handleOpenEditDialog(day, dayEvent)
                      : handleOpenNewDialog(day)
                  }
                  className="relative rounded-lg sm:rounded-2xl md:rounded-[22px] bg-slate-50/70 border border-slate-200/60 p-1 sm:p-2 md:p-3 min-h-[54px] sm:min-h-[82px] md:min-h-[105px] lg:min-h-[120px] flex flex-col justify-between cursor-pointer group opacity-35 hover:opacity-75 transition-all"
                >
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 pl-0.5">
                    {format(day, "d")}
                  </span>

                  {/* Centered Plus Sign with Pulsing Beacon Ring */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative flex items-center justify-center pointer-events-auto">
                      <span className="absolute w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full bg-[#1e3a8a]/20 animate-pulse-radar pointer-events-none" />
                      <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center text-slate-500 animate-pulse-button group-hover:text-[#1e3a8a] group-hover:scale-110 transition-all z-10">
                        <FaPlus className="w-2 h-2 sm:w-3 sm:h-3 text-slate-500 group-hover:text-[#1e3a8a] transition-transform duration-300 group-hover:rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current Month Days */}
            {monthDays.map((day, index) => {
              const dayEvent = getEventForDay(day);
              const isCurrentToday = isToday(day);
              const hasEvent = Boolean(dayEvent);

              if (hasEvent && dayEvent) {
                // Booked Day Card: Proportions tailored for mobile
                return (
                  <div
                    key={`month-day-${index}`}
                    onClick={() => handleOpenEditDialog(day, dayEvent)}
                    className={`relative rounded-lg sm:rounded-2xl md:rounded-[22px] border-2 border-[#4069d8] shadow-[0_2px_10px_rgba(15,32,66,0.06)] sm:shadow-[0_4px_16px_rgba(15,32,66,0.08)] hover:shadow-lg p-0.5 sm:p-1.5 md:p-2.5 min-h-[54px] sm:min-h-[85px] md:min-h-[110px] lg:min-h-[125px] flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] group ${
                      isCurrentToday
                        ? "bg-[#fefce8] ring-1 sm:ring-2 ring-amber-300/80"
                        : "bg-white"
                    }`}
                  >
                    {/* Top Row: Day Number + Edit Icon */}
                    <div className="flex items-center justify-between px-0.5">
                      {isCurrentToday ? (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-[#0f2042] text-white flex items-center justify-center font-black text-[9px] sm:text-xs md:text-sm shadow-xs ring-1 ring-amber-300/80">
                          {format(day, "d")}
                        </div>
                      ) : (
                        <span className="font-black text-[#0f2042] text-[10px] sm:text-sm md:text-base pl-0.5 leading-none">
                          {format(day, "d")}
                        </span>
                      )}

                      {/* View Details Icon for Booked Days */}
                      <span
                        className="p-0.5 rounded text-slate-400 group-hover:text-[#1e3a8a] transition-colors"
                        title="Ver detalhes do almoço"
                      >
                        <FaEye className="w-2 h-2 sm:w-3 sm:h-3 text-[#1e3a8a]" />
                      </span>
                    </div>

                    {/* Event Pill: Member name fits cleanly on mobile */}
                    <div className="bg-slate-50 border border-slate-200 rounded sm:rounded-xl p-0.5 sm:p-1.5 mt-auto flex flex-col justify-center transition-all group-hover:bg-slate-100/90 shadow-2xs">
                      <p className="font-extrabold text-[#0f2042] text-[9px] sm:text-xs md:text-sm truncate leading-tight text-center sm:text-left block">
                        {dayEvent.memberName}
                      </p>
                      <p className="hidden sm:block text-[#1e3a8a] text-[8px] sm:text-[10px] md:text-xs truncate font-semibold mt-0.5">
                        {dayEvent.notes || "Sem observações"}
                      </p>
                    </div>
                  </div>
                );
              }

              // Empty Day Card: Tailored proportions for mobile + Eye-catching Pulsing Plus
              return (
                <div
                  key={`month-day-${index}`}
                  onClick={() => handleOpenNewDialog(day)}
                  className={`relative rounded-lg sm:rounded-2xl md:rounded-[22px] shadow-[0_1px_6px_rgba(0,0,0,0.02)] sm:shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#1e3a8a]/40 hover:shadow-md p-0.5 sm:p-2 md:p-3 min-h-[54px] sm:min-h-[85px] md:min-h-[110px] lg:min-h-[125px] flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
                    isCurrentToday
                      ? "bg-[#fefce8] border-2 border-amber-300/90 ring-1 sm:ring-2 ring-amber-300/40"
                      : "bg-white border border-slate-200/90"
                  }`}
                >
                  {/* Top Left Day Number */}
                  <div className="flex items-center justify-between px-0.5">
                    {isCurrentToday ? (
                      <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-[#0f2042] text-white flex items-center justify-center font-black text-[9px] sm:text-xs md:text-sm shadow-xs ring-1 ring-amber-300/80">
                        {format(day, "d")}
                      </div>
                    ) : (
                      <span className="text-slate-800 font-bold text-[10px] sm:text-sm md:text-base transition-colors pl-0.5 leading-none">
                        {format(day, "d")}
                      </span>
                    )}
                  </div>

                  {/* Centered Plus Sign with Pulsing Beacon Ring */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative flex items-center justify-center pointer-events-auto">
                      {/* Animated Pulse Radar Ring */}
                      <span className="absolute w-6 h-6 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-full bg-[#1e3a8a]/18 animate-pulse-radar pointer-events-none" />

                      {/* Button with gentle breathing pulse and hover rotation */}
                      <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white shadow-2xs sm:shadow-sm border border-slate-200/90 flex items-center justify-center text-[#1e3a8a] animate-pulse-button group-hover:scale-115 group-hover:shadow-md group-hover:border-[#1e3a8a]/50 transition-all duration-300 z-10">
                        <FaPlus className="w-2 h-2 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-[#1e3a8a] transition-transform duration-300 group-hover:rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Trailing days from next month */}
            {trailingDays.map((day, index) => {
              const dayEvent = getEventForDay(day);
              return (
                <div
                  key={`trail-${index}`}
                  onClick={() =>
                    dayEvent
                      ? handleOpenEditDialog(day, dayEvent)
                      : handleOpenNewDialog(day)
                  }
                  className="relative rounded-lg sm:rounded-2xl md:rounded-[22px] bg-slate-50/70 border border-slate-200/60 p-1 sm:p-2 md:p-3 min-h-[54px] sm:min-h-[82px] md:min-h-[105px] lg:min-h-[120px] flex flex-col justify-between cursor-pointer group opacity-35 hover:opacity-75 transition-all"
                >
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-400 pl-0.5">
                    {format(day, "d")}
                  </span>

                  {/* Centered Plus Sign with Pulsing Beacon Ring */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative flex items-center justify-center pointer-events-auto">
                      <span className="absolute w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full bg-[#1e3a8a]/20 animate-pulse-radar pointer-events-none" />
                      <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center text-slate-500 animate-pulse-button group-hover:text-[#1e3a8a] group-hover:scale-110 transition-all z-10">
                        <FaPlus className="w-2 h-2 sm:w-3 sm:h-3 text-slate-500 group-hover:text-[#1e3a8a] transition-transform duration-300 group-hover:rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SIDEBAR SECTION (BELOW ON MOBILE via order-2 lg:order-1)  */}
        {/* ======================================================== */}
        <aside className="order-2 lg:order-1 w-full lg:w-[340px] xl:w-[380px] shrink-0 bg-white rounded-xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_24px_rgba(15,32,66,0.03)] p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 lg:self-stretch">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3 shrink-0">
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Almoços da Ala
              </h1>
              <p className="text-xs text-[#1e3a8a] font-semibold mt-0.5">
                Ala Galeão • Missionários
              </p>
            </div>
            <div className="relative px-2.5 py-1 sm:py-1.5 rounded-full bg-[#0f2042] text-white text-[11px] sm:text-xs font-bold shadow-xs inline-flex items-center gap-1.5">
              <FaStar className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
              <span>
                {currentMonthEventsCount}{" "}
                {currentMonthEventsCount === 1 ? "almoço" : "almoços"}
              </span>
            </div>
          </div>

          {/* Quick Info / Legend */}
          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 border border-slate-200 text-xs text-slate-700 flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-2 font-bold text-[#0f2042]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] animate-pulse" />
              <span>Status do Mês Atual</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Toque no botão pulsante{" "}
              <strong className="text-[#0f2042]">+</strong> para agendar um
              almoço ou no card reservado para ver os detalhes. O
              dia de hoje está destacado em amarelo.
            </p>
          </div>

          {/* Accordion Months List (Current month + 6 predecessor months) */}
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico por Mês
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                (Atual e 6 anteriores)
              </span>
            </div>
            <Accordions
              months={months}
              events={events}
              currentMonth={currentMonth}
              onSelectEvent={(evt) =>
                handleOpenEditDialog(new Date(evt.date), evt)
              }
            />
          </div>
        </aside>
      </div>

      {/* Booking and Details Dialog */}
      {dialogState.isOpen && (
        <Dialog
          isOpen={dialogState.isOpen}
          onClose={() =>
            setDialogState({
              isOpen: false,
              date: dialogState.date,
              event: null,
            })
          }
          dayPicked={dialogState.date}
          event={dialogState.event}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Ward Selector Dialog with Backdrop Blur */}
      <WardSelectDialog
        isOpen={wardDialogOpen}
        onClose={() => setWardDialogOpen(false)}
        defaultStakeSlug={isHome ? undefined : stakeSlug}
        defaultWardSlug={isHome ? undefined : wardSlug}
        stakeName={stakeName}
        onlyWard={!isHome && Boolean(stakeSlug)}
        isDismissible={!isHome}
      />
      </div>

      {/* Footer com Aviso Legal / Disclaimer Não Oficial */}
      <footer className="w-full text-center text-xs text-slate-400 py-6 mt-6 border-t border-slate-200/60 max-w-[1520px] flex flex-col items-center gap-1">
        <p className="font-semibold text-slate-500">
          Calendário de Almoço com os Missionários &bull; Apoio mútuo e comunitário
        </p>
        <p className="text-[11px] text-slate-400 max-w-2xl text-center leading-normal">
          Este site é uma ferramenta voluntária e independente para organização de membros locais. Não é uma publicação, aplicativo ou página oficial de A Igreja de Jesus Cristo dos Santos dos Últimos Dias.
        </p>
      </footer>
    </main>
  );
};

export default Calendar;
