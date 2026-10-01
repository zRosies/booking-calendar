"use client";
import { format, isSameDay, isSameMonth, parseISO } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { useState, useEffect } from "react";
import { Events } from "./calendar";
import { IoChevronDown, IoChevronUp, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";

interface AccordionsProps {
  months: Date[];
  events: Events[];
  currentMonth?: Date;
  onSelectEvent?: (event: Events) => void;
}

export default function Accordions({
  months,
  events,
  currentMonth = new Date(),
  onSelectEvent,
}: AccordionsProps) {
  // Find the index of the month matching currentMonth
  const getCurrentMonthIndex = () => {
    const idx = months.findIndex((m) => isSameMonth(m, currentMonth));
    return idx >= 0 ? idx : 0;
  };

  const [openAccordion, setOpenAccordion] = useState<number | null>(getCurrentMonthIndex());

  // Automatically sync and open the active month when currentMonth changes
  useEffect(() => {
    const idx = getCurrentMonthIndex();
    setOpenAccordion(idx);
  }, [currentMonth, months]);

  const handleAccordionToggle = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const groupEventsByMonth = () => {
    const grouped: { [key: string]: Events[] } = {};

    events.forEach((event) => {
      try {
        const eventDate = parseISO(event.date);
        const monthKey: string = format(eventDate, "MMMM yyyy", { locale: pt });

        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }

        grouped[monthKey].push(event);
      } catch (err) {
        console.error("Error formatting date:", event.date, err);
      }
    });

    return grouped;
  };

  const today = new Date();
  const groupedEvents = groupEventsByMonth();

  return (
    <div
      className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 w-full max-h-[500px] lg:max-h-none"
      style={{ scrollbarWidth: "thin" }}
    >
      {months.map((month, index) => {
        const monthLabel: string = format(month, "MMMM yyyy", { locale: pt });
        const isOpen: boolean = openAccordion === index;
        const isCurrentViewMonth = isSameMonth(month, currentMonth);
        const monthEvents: Events[] = (groupedEvents[monthLabel] || []).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return (
          <div
            key={index}
            className={`w-full shrink-0 rounded-2xl border overflow-hidden shadow-2xs transition-all duration-200 ${
              isCurrentViewMonth
                ? "border-[#1e3a8a]/40 ring-1 ring-[#1e3a8a]/20 bg-white"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            }`}
          >
            <button
              onClick={() => handleAccordionToggle(index)}
              className={`w-full text-left px-3.5 sm:px-4 py-3 sm:py-3.5 flex justify-between items-center transition-colors gap-2 ${
                isCurrentViewMonth
                  ? "bg-gradient-to-r from-blue-50/60 to-slate-50 text-slate-900"
                  : "bg-slate-50 hover:bg-slate-100/70 text-slate-800"
              }`}
            >
              {/* Left Side: Month Name + "Atual" badge */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-xs sm:text-sm text-slate-900 capitalize truncate">
                  {monthLabel}
                </span>
                {isCurrentViewMonth && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1e3a8a] text-white shrink-0 inline-flex items-center justify-center leading-normal">
                    Atual
                  </span>
                )}
              </div>

              {/* Right Side: Aligned Count Badge with Star + Chevron Icon */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative inline-flex items-center justify-center">
                  {monthEvents.length > 0 && (
                    <FaStar className="absolute -top-1.5 -right-1 w-2.5 h-2.5 text-amber-400 fill-amber-400 drop-shadow-xs" />
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/90 text-slate-800 inline-flex items-center justify-center min-w-[22px] leading-normal">
                    {monthEvents.length}
                  </span>
                </div>
                <span className="text-slate-400 flex items-center justify-center w-4 h-4">
                  {isOpen ? (
                    <IoChevronUp className="w-4 h-4 text-[#1e3a8a]" />
                  ) : (
                    <IoChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </span>
              </div>
            </button>

            {/* List of appointments for this month with dedicated overflow scroll */}
            {isOpen && (
              <div className="p-2.5 sm:p-3 bg-slate-50/50 border-t border-slate-100 max-h-[300px] sm:max-h-[360px] overflow-y-auto custom-scroll pr-1.5 space-y-2">
                {monthEvents.length > 0 ? (
                  monthEvents.map((event, eventIndex) => {
                    const isTodayEvent = isSameDay(new Date(event.date), today);
                    return (
                      <div
                        key={eventIndex}
                        onClick={() => onSelectEvent && onSelectEvent(event)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                          isTodayEvent
                            ? "bg-[#fefce8] border-amber-300 ring-1 ring-amber-300/60 shadow-xs"
                            : "bg-white border-slate-200/90 hover:border-[#1e3a8a] hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {event.memberName}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[#0f2042] font-bold text-[10px] sm:text-[11px] whitespace-nowrap border border-slate-200">
                            {format(new Date(event.date), "dd/MM (EEE)", {
                              locale: pt,
                            })}
                          </span>
                        </div>

                        {event.address && (
                          <div className="flex items-start gap-1.5 text-slate-600 mt-1">
                            <IoLocationOutline className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0 mt-0.5" />
                            <span className="line-clamp-1 font-medium text-[11px] sm:text-xs">
                              {event.address}
                            </span>
                          </div>
                        )}

                        {event.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 mt-0.5">
                            <IoCallOutline className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                            <span className="font-medium text-[11px] sm:text-xs">
                              {event.phone}
                            </span>
                          </div>
                        )}

                        {event.notes && (
                          <p className="text-slate-500 italic mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] sm:text-[11px]">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-4 text-xs text-slate-400 font-medium">
                    Nenhum almoço marcado para este mês ainda.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
