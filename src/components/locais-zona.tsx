import { useMemo, useState } from "react";
import locaisRaw from "@/data/locais-zona-2026.json";
import votosRaw from "@/data/votos.json";

type Local = [string, string, number, number, number, number, number, string, string, number[]];
type CidadesJson = Record<string, Record<string, Local[]>>;

const locais = locaisRaw as unknown as CidadesJson;
const fmt = (n: number) => n.toLocaleString("pt-BR");

type VotoRow = [string, number, number, number];
const votos = votosRaw as VotoRow[];

const TOTAIS: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const [c, , ano, v] of votos) {
    if (ano === 2026) m[c] = (m[c] ?? 0) + v;
  }
  return m;
})();

type Zona = { zona: string; total: number; locais: Local[] };
type Cidade = { nome: string; total: number; zonas: Zona[]; zonaLider: string; liderTotal: number };

const CIDADES: Cidade[] = Object.entries(locais)
  .map(([nome, zmap]) => {
    const zonas: Zona[] = Object.entries(zmap)
      .map(([z, ls]) => ({ zona: z, total: ls.reduce((s, l) => s + l[2], 0), locais: ls }))
      .sort((a, b) => Number(a.zona) - Number(b.zona));
    const total = zonas.reduce((s, z) => s + z.total, 0);
    const lider = zonas.reduce((best, z) => (z.total > best.total ? z : best));
    return { nome, total, zonas, zonaLider: lider.zona, liderTotal: lider.total };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const POR_NOME = new Map(CIDADES.map((c) => [c.nome, c]));
const INICIAL = CIDADES.reduce((best, c) => (c.total > best.total ? c : best));

type Ordem = "local" | "votos" | "endereco" | "bairro";

const BTN_TOPO =
  "inline-flex w-[120px] cursor-pointer justify-center rounded-lg border-2 px-3.5 py-2 text-sm font-semibold transition-all duration-150 hover:-translate-y-[1px] active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const BTN_TOPO_ON =
  "border-transparent bg-gradient-to-b from-card to-neutral-200 text-nav shadow-[0_4px_0_0_rgba(0,0,0,0.35)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.4)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.35)]";
const BTN_TOPO_OFF =
  "border-black/25 bg-gradient-to-b from-nav-foreground/30 to-nav-foreground/10 text-nav-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.45)] hover:from-nav-foreground/40 hover:to-nav-foreground/20 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.5)] active:shadow-[0_1px_0_0_rgba(0,0,0,0.45)]";
const BTN_TOPO_ESTATICO =
  "inline-flex w-[120px] justify-center rounded-lg border-2 border-black/20 bg-gradient-to-b from-nav-foreground/20 to-nav-foreground/5 px-3.5 py-2 text-sm font-semibold text-nav-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.4)]";

const BTN_ZONA_ON =
  "border-emerald-800/70 bg-gradient-to-b from-success to-success/80 text-white shadow-[0_4px_0_0_rgba(12,75,42,0.9)] hover:shadow-[0_5px_0_0_rgba(12,75,42,0.9)] active:shadow-[0_1px_0_0_rgba(12,75,42,0.9)]";
const BTN_ZONA_OFF =
  "border-success/45 bg-gradient-to-b from-card to-success/10 text-foreground shadow-[0_4px_0_0_rgba(20,110,60,0.4)] hover:from-success/20 hover:to-success/15 hover:shadow-[0_5px_0_0_rgba(20,110,60,0.45)] active:shadow-[0_1px_0_0_rgba(20,110,60,0.4)]";

export function LocaisZona() {
  const [cidade, setCidade] = useState(INICIAL.nome);
  const [zonaSel, setZonaSel] = useState(INICIAL.zonaLider);
  const [ordem, setOrdem] = useState<Ordem>("votos");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const info = POR_NOME.get(cidade) ?? INICIAL;
  const zona =
    info.zonas.find((z) => z.zona === zonaSel) ??
    info.zonas.find((z) => z.zona === info.zonaLider) ??
    info.zonas[0] ??
    null;
  const linhas = useMemo(() => {
    if (!zona) return [];
    const ls = [...zona.locais];
    if (ordem === "local") ls.sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
    else if (ordem === "endereco") ls.sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
    else if (ordem === "bairro")
      ls.sort(
        (a, b) =>
          (a[7] || "").localeCompare(b[7] || "", "pt-BR") || a[0].localeCompare(b[0], "pt-BR"),
      );
    else ls.sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0], "pt-BR"));
    if (dir === "desc") ls.reverse();
    return ls;
  }, [zona, ordem, dir]);

  const trocarOrdem = (k: Ordem) => {
    if (k === ordem) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setOrdem(k);
      setDir("asc");
    }
  };

  const trocar = (nome: string) => {
    const c = POR_NOME.get(nome);
    if (!c) return;
    setCidade(nome);
    setZonaSel(c.zonaLider);
  };

  const v26Total = TOTAIS[cidade] ?? 0;

  return (
    <section className="relative rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[2rem] font-semibold">Votos por zona e local de votação em 2026</h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border-2 border-nav/40 bg-nav/5 px-4 py-3 text-sm shadow-sm">
        <select
          value={cidade}
          onChange={(e) => trocar(e.target.value)}
          aria-label="Escolher cidade"
          className="w-64 rounded-md border-2 border-nav/40 bg-nav/10 px-4 py-2 text-sm font-medium shadow-sm"
        >
          {CIDADES.map((c) => (
            <option key={c.nome}>{c.nome}</option>
          ))}
        </select>
        <span className="font-medium text-foreground">Nº de Zona(s): {info.zonas.length}</span>
        <span className="font-medium text-foreground">
          Mais votada: Zona {info.zonaLider} — {fmt(info.liderTotal)} votos
        </span>
        <span className="font-medium text-foreground">
          Total de votos nesta cidade em 2026: {fmt(v26Total)}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-[repeat(auto-fill,140px)] gap-2">
        {info.zonas.map((z) => {
          const marcada = z.zona === zonaSel;
          return (
            <label key={z.zona} className="inline-flex">
              <input
                type="radio"
                name="zona-locais"
                className="peer sr-only"
                checked={marcada}
                onChange={() => setZonaSel(z.zona)}
              />
              <span
                className={`inline-flex h-10 w-full cursor-pointer items-center justify-center truncate rounded-lg border-2 px-2 text-sm font-semibold transition-all duration-150 hover:-translate-y-[1px] active:translate-y-[3px] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${
                  marcada ? BTN_ZONA_ON : BTN_ZONA_OFF
                }`}
              >
                <span className="whitespace-nowrap">
                  Zona {z.zona} - {fmt(z.total)}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {!zona ? (
        <p className="text-sm text-muted-foreground">Selecione uma zona.</p>
      ) : (
        <div className="max-h-[340px] overflow-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-nav">
              <tr className="text-left text-nav-foreground">
                {(
                  [
                    { key: "local", label: "Local", cls: "w-[28%] text-left" },
                    { key: "votos", label: "Votos", cls: "w-[16%] text-center" },
                    { key: "endereco", label: "Endereço", cls: "w-[22%] text-center" },
                    { key: "bairro", label: "Bairro", cls: "w-[18%] text-center" },
                  ] as { key: Ordem; label: string; cls: string }[]
                ).map((col) => {
                  const ativo = ordem === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={ativo ? (dir === "asc" ? "ascending" : "descending") : "none"}
                      className={`py-2 px-4 ${col.cls}`}
                    >
                      <button
                        type="button"
                        onClick={() => trocarOrdem(col.key)}
                        aria-label={`Ordenar por ${col.label} — ${
                          ativo && dir === "asc" ? "decrescente" : "crescente"
                        }`}
                        title={`Ordenar por ${col.label}`}
                        className={`${BTN_TOPO} ${ativo ? BTN_TOPO_ON : BTN_TOPO_OFF}`}
                      >
                        {col.label}
                        {ativo && <span aria-hidden="true">{dir === "asc" ? " ▲" : " ▼"}</span>}
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="w-[16%] px-4 py-2 text-center">
                  <span className={BTN_TOPO_ESTATICO}>Seções</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={`${l[0]}-${i}`} className="border-b">
                  <td className="px-4 py-2">{l[0]}</td>
                  <td className="px-4 py-2 text-center font-semibold">{fmt(l[2])}</td>
                  <td className="px-4 py-2 text-muted-foreground">{l[1]}</td>
                  <td className="px-4 py-2 text-muted-foreground">{l[7] || "—"}</td>
                  <td
                    className="px-4 py-2 text-center text-muted-foreground"
                    title={l[9].join(", ")}
                  >
                    {l[9].length > 0 ? `${l[9].length} seções` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
