import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AssembleiaPE,
  ComposicaoAssembleiaPE,
  TituloAssembleiaPE,
} from "@/components/assembleia-pe";
import { LocaisZona } from "@/components/locais-zona";
import raw from "@/data/votos.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel Eleitoral — João Paulo do PT (2022 x 2026)" },
      {
        name: "description",
        content:
          "Comparativo de votos de João Paulo do PT para Deputado Estadual em 2022 e 2026, por cidade e zona.",
      },
      { property: "og:title", content: "Painel Eleitoral — João Paulo do PT" },
      { property: "og:description", content: "Votação 2022 x 2026 por cidade e zona eleitoral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Row = [string, number, number, number];
const rows = raw as Row[];
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (a: number, b: number) =>
  a === 0
    ? b > 0
      ? "novo"
      : "—"
    : `${(((b - a) / a) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

type City = { cidade: string; v22: number; v26: number; diff: number; pctText: string };
type CityBase = Omit<City, "pctText">;

const TODAS = "__TODAS__";

const pctText = (c: CityBase) =>
  c.v22 === 0 ? (c.v26 > 0 ? "novo" : "—") : `${c.diff > 0 ? "+" : ""}${pct(c.v22, c.v26)}`;

const ABREVIA: Record<string, string> = {
  "JABOATÃO DOS GUARARAPES": "JABOATÃO",
  "VITÓRIA DE SANTO ANTÃO": "VITÓRIA DE STO ANTÃO",
  "CABO DE SANTO AGOSTINHO": "CABO DE STO AGOST.",
  "BELÉM DO SÃO FRANCISCO": "BELÉM DO S. FRANCISCO",
  "SANTA MARIA DO CAMBUCÁ": "STA MARIA DO CAMBUCÁ",
};
const nomeCidade = (c: string) => ABREVIA[c] ?? c;

function useData() {
  return useMemo(() => {
    const m = new Map<string, CityBase>();
    for (const [c, , ano, v] of rows) {
      const o = m.get(c) ?? { cidade: c, v22: 0, v26: 0, diff: 0 };
      if (ano === 2022) o.v22 += v;
      else o.v26 += v;
      o.diff = o.v26 - o.v22;
      m.set(c, o);
    }
    const cities = [...m.values()]
      .map((c) => ({ ...c, pctText: pctText(c) }))
      .sort((a, b) => a.cidade.localeCompare(b.cidade));
    const t22 = cities.reduce((s, c) => s + c.v22, 0);
    const t26 = cities.reduce((s, c) => s + c.v26, 0);
    return { cities, t22, t26 };
  }, []);
}

function Card({
  label,
  value,
  sub,
  tone,
  details,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
  details?: ReactNode;
  bg?: string;
}) {
  const [open, setOpen] = useState(false);
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const clickable = Boolean(details);
  const content = (
    <div
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={label}
      aria-expanded={clickable ? open : undefined}
      onClick={clickable && !canHover ? () => setOpen((o) => !o) : undefined}
      className={[
        "h-full rounded-xl border p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        bg ?? "bg-card",
        clickable
          ? "cursor-pointer select-none shadow-[0_4px_0_0_rgba(0,0,0,0.18)] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.18)] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
          : "shadow-sm",
        open
          ? "translate-y-[3px] shadow-[0_1px_0_0_rgba(0,0,0,0.18)] hover:translate-y-[3px] hover:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
          : "",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {clickable ? (
          <>
            {label}: <span className="normal-case">(Clique)</span>
          </>
        ) : (
          label
        )}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );

  if (!details) return content;

  if (canHover) {
    return (
      <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={150}>
        <HoverCardTrigger
          asChild
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
        >
          {content}
        </HoverCardTrigger>
        <HoverCardContent
          className="w-[440px] max-w-[calc(100vw-32px)] border-2 border-nav/70 bg-hovercard shadow-lg"
          collisionPadding={16}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <p className="mb-3 font-semibold">{label}</p>
          <div className="max-h-80 overflow-auto">{details}</div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <div className="relative h-full">
      {content}
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[440px] max-w-[calc(100vw-32px)] rounded-md border-2 border-nav/70 bg-hovercard p-4 shadow-lg">
          <p className="mb-3 font-semibold">{label}</p>
          <div className="max-h-80 overflow-auto">{details}</div>
        </div>
      )}
    </div>
  );
}

type LabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: string | number;
};

function BarPctLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  color,
}: LabelProps & { color: string }) {
  const text = typeof value === "string" ? value : "";
  if (!text) return null;
  const neg = width < 0;
  return (
    <text
      x={x + width + (neg ? -6 : 6)}
      y={y + height / 2}
      dy="0.35em"
      textAnchor={neg ? "end" : "start"}
      fontSize={10}
      fontWeight={600}
      fill={color}
    >
      {text}
    </text>
  );
}

function VoteTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: City }[];
}) {
  const city = payload?.[0]?.payload;
  if (!active || !city) return null;
  return (
    <div className="max-w-[calc(100vw-32px)] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md">
      <p className="mb-2 font-semibold">{nomeCidade(city.cidade)}</p>
      <p className="flex flex-wrap gap-x-5">
        <span>
          2022: <strong>{fmt(city.v22)}</strong>
        </span>
        <span>
          2026: <strong>{fmt(city.v26)}</strong>
        </span>
      </p>
      <p className="mt-2">
        Diferença:{" "}
        <strong className={city.diff >= 0 ? "text-success" : "text-danger"}>
          {city.diff > 0 ? "+" : ""}
          {fmt(city.diff)}
        </strong>
      </p>
    </div>
  );
}

function BarraShape(arg: unknown) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill = "currentColor",
    fillOpacity = 1,
    pctText: pct = "",
    background,
  } = (arg ?? {}) as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    fillOpacity?: number;
    pctText?: string;
    background?: { x?: number; y?: number; width?: number; height?: number };
  };
  const bx = background?.x ?? Math.min(x, x + width);
  const by = background?.y ?? y;
  const bw = background?.width ?? Math.abs(width);
  const bh = background?.height ?? height;
  return (
    <g>
      <rect x={bx} y={by} width={bw} height={bh} fill="transparent" pointerEvents="all" />
      <rect
        x={Math.min(x, x + width)}
        y={y}
        width={Math.abs(width)}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      <BarPctLabel x={x} y={y} width={width} height={height} value={pct} color={fill} />
    </g>
  );
}

function TickCidade({
  payload,
  x = 0,
  y = 0,
  textAnchor = "end",
  fill = "#666",
  fontSize,
  className,
}: {
  payload?: { value?: unknown };
  x?: number;
  y?: number;
  textAnchor?: "start" | "middle" | "end";
  fill?: string;
  fontSize?: number;
  className?: string;
}) {
  const label = typeof payload?.value === "string" ? payload.value : "";
  if (!label) return null;
  return (
    <text
      x={x}
      y={y}
      dy="0.35em"
      textAnchor={textAnchor}
      fill={fill}
      fontSize={fontSize}
      className={className}
    >
      {nomeCidade(label)}
    </text>
  );
}

function Chart({ title, data, color }: { title: string; data: City[]; color: string }) {
  const [page, setPage] = useState(0);
  const porPagina = 15;
  const lastPage = Math.max(0, Math.ceil(data.length / porPagina) - 1);
  const visible = data.slice(page * porPagina, (page + 1) * porPagina);
  return (
    <div className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="mb-1 font-semibold">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="default"
            size="icon"
            className="bg-nav text-nav-foreground hover:bg-nav/90"
            aria-label={`Retroceder — ${title}`}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="bg-nav text-nav-foreground hover:bg-nav/90"
            aria-label={`Avançar — ${title}`}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mb-3 flex justify-end">
        <span className="mr-[74px] text-xs text-muted-foreground" aria-live="polite">
          {page * porPagina + 1}–{Math.min((page + 1) * porPagina, data.length)} de {data.length}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={440}>
        <BarChart data={visible} layout="vertical" margin={{ left: 0, right: 74 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            fontSize={11}
            domain={[(min: number) => (min < 0 ? min * 1.45 : min), (max: number) => max]}
          />
          <YAxis
            type="category"
            dataKey="cidade"
            width={125}
            fontSize={10}
            interval={0}
            tick={<TickCidade />}
          />
          <Tooltip content={<VoteTooltip />} />
          <Bar
            dataKey="diff"
            name="Diferença"
            fill={color}
            isAnimationActive={false}
            shape={BarraShape}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type SortKey = "cidade" | "v22" | "v26" | "diff" | "pct";

const COLUNAS: { key: SortKey; label: string; cls: string; grande?: boolean }[] = [
  { key: "cidade", label: "Cidade", cls: "w-[40%]", grande: true },
  { key: "v22", label: "2022", cls: "w-[15%]" },
  { key: "v26", label: "2026", cls: "w-[15%]" },
  { key: "diff", label: "dif.", cls: "w-[15%]" },
  { key: "pct", label: "%", cls: "w-[15%]" },
];

const sortValue = (c: City, k: SortKey): number =>
  k === "v22"
    ? c.v22
    : k === "v26"
      ? c.v26
      : k === "diff"
        ? c.diff
        : k === "pct"
          ? c.v22 === 0
            ? c.v26 > 0
              ? Number.POSITIVE_INFINITY
              : 0
            : (c.v26 - c.v22) / c.v22
          : 0;

function Dashboard() {
  const { cities, t22, t26 } = useData();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cidade");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const up = cities.filter((c) => c.diff >= 0).sort((a, b) => b.diff - a.diff);
  const down = cities.filter((c) => c.diff < 0).sort((a, b) => a.diff - b.diff);
  const diff = t26 - t22;
  const grew = cities.filter((c) => c.diff > 0).length;
  const fell = cities.filter((c) => c.diff < 0).length;
  const newCities = cities.filter((c) => c.v22 === 0 && c.v26 > 0);
  const zero22 = newCities.length;
  const best26 = [...cities].sort((a, b) => b.v26 - a.v26)[0];
  const top15 = [...cities].sort((a, b) => b.v26 - a.v26).slice(0, 15);
  const top15total = top15.reduce((s, c) => s + c.v26, 0);
  const top15share = top15total / t26;

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const list = useMemo(() => {
    const base =
      filter === TODAS ? cities : filter ? cities.filter((c) => c.cidade === filter) : [];
    const sorted = [...base].sort((a, b) =>
      sortKey === "cidade"
        ? a.cidade.localeCompare(b.cidade, "pt-BR")
        : sortValue(a, sortKey) - sortValue(b, sortKey),
    );
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }, [cities, filter, sortKey, sortDir]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-8">
      <TituloAssembleiaPE />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Votos 2022" value={fmt(t22)} bg="bg-muted" />
        <Card label="Votos 2026" value={fmt(t26)} bg="bg-muted" />
        <Card
          label="Diferença"
          value={`${diff > 0 ? "+" : ""}${fmt(diff)}`}
          tone={diff >= 0 ? "up" : "down"}
          sub="votos"
          bg="bg-nav/10"
        />
        <Card
          label="Variação %"
          value={pct(t22, t26)}
          tone={diff >= 0 ? "up" : "down"}
          bg="bg-nav/10"
        />
        <Card
          label="Cidades com crescimento"
          value={fmt(grew)}
          tone="up"
          sub={`${fell} com queda`}
          bg="bg-success/15"
        />
        <Card
          label="Novas cidades"
          value={fmt(zero22)}
          sub="0 votos em 2022, votos em 2026"
          bg="bg-chart-4/40"
          details={
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left">Cidade</th>
                  <th className="pb-2 text-right">2022</th>
                  <th className="pb-2 text-right">2026</th>
                </tr>
              </thead>
              <tbody>
                {newCities.map((c) => (
                  <tr key={c.cidade} className="border-b">
                    <td className="py-2 pr-3">{c.cidade}</td>
                    <td className="text-right">{fmt(c.v22)}</td>
                    <td className="pl-3 text-right">{fmt(c.v26)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
        <Card
          label="Maior votação 2026"
          value={best26?.cidade ?? "—"}
          sub={`${fmt(best26?.v26 ?? 0)} votos`}
          bg="bg-danger/10"
        />
        <Card
          label="Concentração top 15"
          value={`${(top15share * 100).toFixed(1)}%`}
          sub="dos votos de 2026"
          bg="bg-hovercard"
          details={
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left">Cidade</th>
                  <th className="pb-2 text-right">2026</th>
                </tr>
              </thead>
              <tbody>
                {top15.map((c) => (
                  <tr key={c.cidade} className="border-b">
                    <td className="py-2 pr-3">{c.cidade}</td>
                    <td className="text-right">{fmt(c.v26)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{fmt(top15total)}</td>
                </tr>
              </tfoot>
            </table>
          }
        />
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <Chart
          title="Cidades com maior crescimento numérico de votos"
          data={up}
          color="var(--success)"
        />
        <Chart
          title="Cidades com maior queda numérica de votos"
          data={down}
          color="var(--danger)"
        />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-[2rem] font-semibold">Votos por cidade</h3>
        <div className="mb-3 mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <span className="whitespace-nowrap">Cidade</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-64 rounded-md border-2 border-nav/40 bg-nav/10 px-4 py-2 text-sm font-medium shadow-sm"
            >
              <option value="">Selecione uma cidade</option>
              <option value={TODAS}>Todas as cidades</option>
              {cities.map((c) => (
                <option key={c.cidade} value={c.cidade}>
                  {c.cidade}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="max-h-[410px] overflow-x-auto overflow-y-auto overscroll-x-contain">
          <table className="w-full min-w-[860px] table-fixed text-sm bg-nav/10">
            <thead className="sticky top-0 z-10 bg-nav">
              <tr className="text-center text-nav-foreground">
                {COLUNAS.map((col) => {
                  const ativo = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={ativo ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      className={`px-4 py-2 ${col.cls}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        aria-label={`Ordenar por ${col.label} — ${
                          ativo && sortDir === "asc" ? "decrescente" : "crescente"
                        }`}
                        title={`Ordenar por ${col.label}`}
                        className="flex min-h-14 w-full items-center justify-center gap-1 rounded-md border-2 border-black/20 bg-gradient-to-b from-white to-neutral-200 px-2 py-2 text-[11px] leading-tight font-bold uppercase tracking-wide text-nav shadow-[0_4px_0_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:-translate-y-[1px] hover:from-chart-4 hover:to-amber-300 hover:text-black hover:shadow-[0_5px_0_0_rgba(0,0,0,0.45)] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-4"
                      >
                        <span className={`text-center ${col.grande ? "text-sm" : ""}`}>
                          {col.label}
                        </span>
                        {ativo && <span aria-hidden="true">{sortDir === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-muted-foreground">
                    Selecione uma cidade para consultar a votação
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.cidade} className="border-b text-center hover:bg-nav/20">
                    <td className="py-2 px-4 text-left">
                      <span className="block truncate">{c.cidade}</span>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">{fmt(c.v22)}</td>
                    <td className="py-2 px-4 whitespace-nowrap">{fmt(c.v26)}</td>
                    <td
                      className={`py-2 px-4 font-semibold whitespace-nowrap ${c.diff >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {c.diff > 0 ? "+" : ""}
                      {fmt(c.diff)}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap text-muted-foreground">
                      {pct(c.v22, c.v26)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <LocaisZona />

      <ComposicaoAssembleiaPE />

      <AssembleiaPE />
    </main>
  );
}
