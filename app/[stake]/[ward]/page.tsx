import React from "react";
import { notFound } from "next/navigation";
import { StakeService } from "@/app/api/services/stake.service";
import Calendar from "@/app/components/calendar";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    stake: string;
    ward: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stake, ward } = await params;
  const match = await StakeService.getWardBySlugs(stake, ward);

  if (!match) {
    return {
      title: "Ala não encontrada | Calendário de Almoços",
    };
  }

  return {
    title: `${match.ward.name} - ${match.stake.name} | Calendário de Almoços`,
    description: `Agendamento e escala de almoço com os missionários da ${match.ward.name}, ${match.stake.name}.`,
  };
}

export default async function WardCalendarPage({ params }: PageProps) {
  const { stake: stakeSlug, ward: wardSlug } = await params;

  const match = await StakeService.getWardBySlugs(stakeSlug, wardSlug);

  if (!match) {
    return (
      <main className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
            ⛪
          </div>
          <h1 className="text-xl font-black text-slate-900">
            Ala não encontrada
          </h1>
          <p className="text-sm text-slate-500">
            Não encontramos a ala <strong>&quot;{wardSlug}&quot;</strong> na estaca{" "}
            <strong>&quot;{stakeSlug}&quot;</strong>.
          </p>
          <div className="w-full pt-2">
            <a
              href="/"
              className="block w-full py-2.5 px-4 rounded-xl bg-[#0f2042] text-white text-xs font-bold hover:bg-[#1e3a8a] transition-all text-center"
            >
              Escolher Ala
            </a>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Ferramenta independente comunitária &bull; Não oficial da Igreja
          </p>
        </div>
      </main>
    );
  }

  return (
    <Calendar
      wardId={String(match.ward._id)}
      wardName={match.ward.name}
      stakeName={match.stake.name}
      stakeSlug={match.stake.slug}
      wardSlug={match.ward.slug}
      isHome={false}
    />
  );
}
