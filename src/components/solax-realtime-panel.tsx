import { BAT_STATUS, INVERTER_STATUS, type SolaxRealtime } from "@/lib/solax";

function val(v: number | string | null, unit = ""): string {
  if (v === null || v === undefined) return "—";
  return `${v}${unit ? " " + unit : ""}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-800">{value}</dd>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h4>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

/** Plný přehled všech realtime hodnot ze Solax invertoru. */
export function SolaxRealtimePanel({ r }: { r: SolaxRealtime }) {
  const statusLabel = r.inverterStatus
    ? `${INVERTER_STATUS[r.inverterStatus] ?? "Neznámý"} (${r.inverterStatus})`
    : "—";
  const batStatusLabel = r.batStatus
    ? `${BAT_STATUS[r.batStatus] ?? "Neznámý"} (${r.batStatus})`
    : "—";

  return (
    <div className="mt-4 space-y-5 border-t border-zinc-200 pt-4">

      <Section title="Identifikace">
        <Row label="Sériové číslo střídače" value={val(r.inverterSn)} />
        <Row label="Sériové číslo WiFi modulu" value={val(r.sn)} />
        <Row label="Jmenovitý výkon" value={val(r.ratedPower, "kW")} />
        <Row label="Typ střídače" value={val(r.inverterType)} />
        <Row label="Stav střídače" value={statusLabel} />
        <Row label="Čas záznamu" value={val(r.uploadTime)} />
        <Row label="Časová zóna" value={val(r.timeZone)} />
      </Section>

      <Section title="AC výstup">
        <Row label="Celkový výkon" value={val(r.acpower, "W")} />
        <Row label="Napětí L1 / L2 / L3" value={`${val(r.vac1)} / ${val(r.vac2)} / ${val(r.vac3)} V`} />
        <Row label="Proud L1 / L2 / L3" value={`${val(r.iac1)} / ${val(r.iac2)} / ${val(r.iac3)} A`} />
        <Row label="Výkon L1 / L2 / L3" value={`${val(r.pac1)} / ${val(r.pac2)} / ${val(r.pac3)} W`} />
        <Row label="Frekvence L1 / L2 / L3" value={`${val(r.fac1)} / ${val(r.fac2)} / ${val(r.fac3)} Hz`} />
      </Section>

      <Section title="DC vstup – MPPT trackery">
        <Row label="Napětí MPPT 1 / 2 / 3 / 4" value={`${val(r.vdc1)} / ${val(r.vdc2)} / ${val(r.vdc3)} / ${val(r.vdc4)} V`} />
        <Row label="Proud MPPT 1 / 2 / 3 / 4" value={`${val(r.idc1)} / ${val(r.idc2)} / ${val(r.idc3)} / ${val(r.idc4)} A`} />
        <Row label="Výkon MPPT 1 / 2 / 3 / 4" value={`${val(r.powerdc1)} / ${val(r.powerdc2)} / ${val(r.powerdc3)} / ${val(r.powerdc4)} W`} />
      </Section>

      <Section title="Energie">
        <Row label="Dnešní výnos" value={val(r.yieldtoday, "kWh")} />
        <Row label="Celkový výnos" value={val(r.yieldtotal, "kWh")} />
        <Row label="Celkový výnos FV" value={val(r.pvenergy, "kWh")} />
        <Row label="Výkon do sítě" value={val(r.feedinpower, "W")} />
        <Row label="Celková energie do sítě" value={val(r.feedinenergy, "kWh")} />
        <Row label="Celková energie ze sítě" value={val(r.consumeenergy, "kWh")} />
        <Row label="Celkový vstupní výkon AC" value={val(r.acenergyin, "kWh")} />
        <Row label="Výkon měřič 2" value={val(r.feedinpowerM2, "W")} />
        <Row label="Energie do sítě – měřič 2" value={val(r.feedinenergyM2, "kWh")} />
        <Row label="Energie ze sítě – měřič 2" value={val(r.consumeenergyM2, "kWh")} />
      </Section>

      <Section title="Baterie">
        <Row label="Stav nabití (SOC)" value={val(r.soc, "%")} />
        <Row label="Napětí baterie" value={val(r.batVoltage, "V")} />
        <Row label="Proud baterie" value={val(r.batCurrent, "A")} />
        <Row label="Výkon baterie" value={val(r.batPower, "W")} />
        <Row label="Teplota baterie" value={val(r.battemper, "°C")} />
        <Row label="Stav baterie" value={batStatusLabel} />
        <Row label="Počet cyklů" value={val(r.batcycle)} />
        <Row label="Celkové nabití" value={val(r.chargeEnergy, "kWh")} />
        <Row label="Celkové vybití" value={val(r.dischargeEnergy, "kWh")} />
        <Row label="Zbývající energie" value={val(r.surplusEnergy, "%")} />
      </Section>

      <Section title="Teploty">
        <Row label="Teplota chladiče" value={val(r.temperature, "°C")} />
        <Row label="Teplota uvnitř zařízení" value={val(r.temperBoard, "°C")} />
      </Section>

      <Section title="EPS (záložní výstup)">
        <Row label="Napětí EPS A / B / C" value={`${val(r.veps1)} / ${val(r.veps2)} / ${val(r.veps3)} V`} />
        <Row label="Proud EPS A / B / C" value={`${val(r.ieps1)} / ${val(r.ieps2)} / ${val(r.ieps3)} A`} />
        <Row label="Výkon EPS A / B / C" value={`${val(r.peps1)} / ${val(r.peps2)} / ${val(r.peps3)} W`} />
        <Row label="Frekvence EPS" value={val(r.epsfreq, "Hz")} />
      </Section>

    </div>
  );
}
