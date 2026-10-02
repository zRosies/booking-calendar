import { StakeService } from "./api/services/stake.service";
import Calendar from "./components/calendar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const stakes = await StakeService.getAllStakesWithWards();
    const defaultStake = stakes[0];
    const defaultWard = defaultStake?.wards?.[0];

    return (
      <Calendar
        wardId={defaultWard ? String(defaultWard._id) : undefined}
        wardName={defaultWard?.name || "Ala Galeão"}
        stakeName={defaultStake?.name || "Estaca Rio de Janeiro Ilha"}
        stakeSlug={defaultStake?.slug || "ilha"}
        wardSlug={defaultWard?.slug || "galeao"}
        defaultSelectorOpen={true}
        isHome={true}
      />
    );
  } catch (err) {
    console.error("Erro ao carregar dados na home:", err);
    return <Calendar defaultSelectorOpen={true} isHome={true} />;
  }
}
