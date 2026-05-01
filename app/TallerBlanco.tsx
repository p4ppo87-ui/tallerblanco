"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://seygknzlruftfezcjpim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWdrbnpscnVmdGZlemNqcGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjY3MDQsImV4cCI6MjA5MTAwMjcwNH0.vODo6mIsy2QY2f1Mh5GstMJfQ3U5YmPBxDmmzozorWQ"
);

const TOPE_MONOTRIBUTO = 70113407;
const estadoColor: Record<string, string> = {
  completado: "#22c55e",
  "en proceso": "#f59e0b",
  pendiente: "#94a3b8",
  "esperando repuesto": "#f97316",
};
const estadoBg: Record<string, string> = {
  completado: "#052e16",
  "en proceso": "#431407",
  pendiente: "#1e293b",
  "esperando repuesto": "#431407",
};

function calcGananciaOrden(o: any): number {
  const items: any[] = o.repuestos || o.items || [];
  const costoRepuestos = items.reduce((s: number, item: any) => {
    const costo = Number(item.costo_compra ?? item.costoCompra ?? item.costo ?? 0);
    const cant = Number(item.cantidad ?? 1);
    return s + costo * cant;
  }, 0);
  return Number(o.costo || 0) - costoRepuestos;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { background: #0a0f1a; }
  body { overscroll-behavior: none; }

  .app {
    min-height: 100vh;
    min-height: 100dvh;
    background: #0a0f1a;
    color: #e2e8f0;
    font-family: 'Courier New', monospace;
    display: flex;
    flex-direction: column;
    max-width: 480px;
    margin: 0 auto;
  }

  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-bottom: 2px solid #f97316;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .logo { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #f97316; }
  .fecha { font-size: 10px; color: #64748b; letter-spacing: 1px; }

  .main {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    padding-bottom: 90px;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: #0f172a;
    border-top: 2px solid #f97316;
    display: flex;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 4px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    gap: 3px;
  }
  .nav-btn.active { background: #1e293b; }
  .nav-icon { font-size: 20px; line-height: 1; }
  .nav-label { font-size: 9px; letter-spacing: 1px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .nav-btn.active .nav-label { color: #f97316; }

  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .kpi-card {
    background: #0f172a;
    border-radius: 8px;
    padding: 14px 12px;
    border-left: 3px solid var(--accent);
  }
  .kpi-label { font-size: 9px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .kpi-val { font-size: 22px; font-weight: 900; color: var(--accent); line-height: 1; }
  .kpi-sub { font-size: 9px; color: #475569; margin-top: 4px; }

  .card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .card-title {
    font-size: 10px;
    letter-spacing: 3px;
    color: #f97316;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .orden-item {
    padding: 12px 0;
    border-bottom: 1px solid #1e293b;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .orden-item:last-child { border-bottom: none; padding-bottom: 0; }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  .btn {
    border: none;
    border-radius: 6px;
    padding: 12px 20px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
    cursor: pointer;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-primary { background: #f97316; color: #0a0f1a; }
  .btn-success { background: #166534; color: #4ade80; }
  .btn-danger  { background: #7f1d1d; color: #f87171; }
  .btn-ghost   { background: #1e293b; color: #94a3b8; }
  .btn-sm { padding: 8px 14px; font-size: 11px; min-height: 36px; border-radius: 4px; }
  .btn-full { width: 100%; }
  .btn-fab {
    position: fixed;
    bottom: 80px;
    right: calc(50% - 228px);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f97316;
    color: #0a0f1a;
    border: none;
    font-size: 28px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(249,115,22,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;
  }
  @media (max-width: 480px) {
    .btn-fab { right: 20px; }
  }

  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 10px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .form-input, .form-select {
    background: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
    padding: 12px 14px;
    border-radius: 6px;
    width: 100%;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    min-height: 44px;
  }
  .form-input:focus, .form-select:focus { outline: none; border-color: #f97316; }

  .modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
  }
  .modal-box {
    background: #0f172a;
    border: 1px solid #f97316;
    border-radius: 16px 16px 0 0;
    padding: 20px 20px 40px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-handle {
    width: 40px; height: 4px;
    background: #334155; border-radius: 2px;
    margin: 0 auto 16px;
  }

  .progress-wrap { background: #1e293b; border-radius: 3px; height: 8px; overflow: hidden; }
  .progress-bar  { height: 100%; border-radius: 3px; }

  .alert-item {
    background: #431407;
    border: 1px solid #f97316;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .cobro-item {
    background: #1c1208;
    border: 1px solid #d97706;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .select-inline {
    background: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
    padding: 6px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    min-height: 36px;
  }

  .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; }
  .empty { color: #475569; font-size: 13px; text-align: center; padding: 32px 0; }
  .loading {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #0a0f1a; color: #f97316; font-family: 'Courier New', monospace;
    font-size: 14px; letter-spacing: 3px;
  }
`;

const TABS = [
  { id: "Inicio",      icon: "🏠", label: "Inicio" },
  { id: "Órdenes",    icon: "🔧", label: "Órdenes" },
  { id: "Finanzas",   icon: "💰", label: "Finanzas" },
  { id: "Clientes",   icon: "👤", label: "Clientes" },
  { id: "Inventario", icon: "📦", label: "Stock" },
];

export default function TallerBlanco() {
  const [tab, setTab] = useState("Inicio");
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [o, g, c, i] = await Promise.all([
      supabase.from("ordenes").select("*").order("created_at", { ascending: false }),
      supabase.from("gastos").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("created_at", { ascending: false }),
      supabase.from("inventario").select("*").order("created_at", { ascending: false }),
    ]);
    setOrdenes(o.data || []);
    setGastos(g.data || []);
    setClientes(c.data || []);
    setInventario(i.data || []);
    setLoading(false);
  }

  const cobradas       = ordenes.filter(o => o.estado === "completado" && o.cobrado === true);
  const sinCobrar      = ordenes.filter(o => o.estado === "completado" && !o.cobrado);
  const totalIngresos  = cobradas.reduce((s, o) => s + Number(o.costo || 0), 0);
  const totalGanancia  = cobradas.reduce((s, o) => s + calcGananciaOrden(o), 0);
  const totalGastos    = gastos.reduce((s, g) => s + Number(g.monto || 0), 0);
  const utilidad       = totalGanancia - totalGastos;
  const ordenesActivas = ordenes.filter(o => o.estado !== "completado").length;
  const aCobrar        = sinCobrar.reduce((s, o) => s + Number(o.costo || 0), 0);
  const completadasCount = cobradas.length;
  const ticketPromedio = completadasCount ? Math.round(totalIngresos / completadasCount) : 0;
  const pctMonotributo = Math.min(100, Math.round((totalIngresos / TOPE_MONOTRIBUTO) * 100));
  const stockBajo      = inventario.filter(i => i.cantidad <= i.minimo).length;

  async function addOrden() {
    const folio = `OT-${String(ordenes.length + 1).padStart(3, "0")}`;
    const nuevo = {
      folio, cliente: form.cliente, vehiculo: form.vehiculo, placa: form.placa,
      servicio: form.servicio, mecanico: form.mecanico,
      costo: Number(form.costo) || 0, estado: form.estado || "pendiente",
      fecha: form.fecha, cobrado: false,
    };
    const { data, error } = await supabase.from("ordenes").insert([nuevo]).select();
    if (data && !error) setOrdenes(prev => [data[0], ...prev]);
    setModal(null); setForm({});
  }

  async function addGasto() {
    const nuevo = { concepto: form.concepto, monto: Number(form.monto) || 0, categoria: form.categoria, fecha: form.fecha };
    const { data, error } = await supabase.from("gastos").insert([nuevo]).select();
    if (data && !error) setGastos(prev => [data[0], ...prev]);
    setModal(null); setForm({});
  }

  async function addCliente() {
    const nuevo = { nombre: form.nombre, telefono: form.telefono, email: form.email, vehiculos: [], visitas: 0 };
    const { data, error } = await supabase.from("clientes").insert([nuevo]).select();
    if (data && !error) setClientes(prev => [data[0], ...prev]);
    setModal(null); setForm({});
  }

  async function cambiarEstado(id: number, estado: string) {
    await supabase.from("ordenes").update({ estado }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
  }

  async function marcarCobrado(id: number) {
    const { error } = await supabase.from("ordenes").update({ cobrado: true }).eq("id", id);
    if (!error) setOrdenes(prev => prev.map(o => o.id === id ? { ...o, cobrado: true } : o));
  }

  async function ajustarStock(id: number, delta: number) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    const nueva = Math.max(0, item.cantidad + delta);
    await supabase.from("inventario").update({ cantidad: nueva }).eq("id", id);
    setInventario(prev => prev.map(i => i.id === id ? { ...i, cantidad: nueva } : i));
  }

  if (loading) return <div className="loading">CARGANDO...</div>;

  const inp = (field: string, label: string, type = "text") => (
    <div className="form-group" key={field}>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} inputMode={type === "number" ? "numeric" : undefined}
        value={form[field] || ""} onChange={e => setForm((p: any) => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  const closeModal = () => { setModal(null); setForm({}); };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app">

        <div className="header">
          <div className="logo">🔩 TALLER BLANCO</div>
          <div className="fecha">{new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}</div>
        </div>

        <div className="main">

          {/* ══ INICIO ══ */}
          {tab === "Inicio" && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card" style={{ "--accent": "#22c55e" } as any}>
                  <div className="kpi-label">Cobrado</div>
                  <div className="kpi-val">{fmt(totalIngresos)}</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#fb923c" } as any}>
                  <div className="kpi-label">Ganancia real</div>
                  <div className="kpi-val">{fmt(totalGanancia)}</div>
                  <div className="kpi-sub">sin repuestos</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#ef4444" } as any}>
                  <div className="kpi-label">Gastos</div>
                  <div className="kpi-val">{fmt(totalGastos)}</div>
                </div>
                <div className="kpi-card" style={{ "--accent": utilidad >= 0 ? "#f97316" : "#ef4444" } as any}>
                  <div className="kpi-label">Utilidad neta</div>
                  <div className="kpi-val">{fmt(utilidad)}</div>
                  <div className="kpi-sub">ganancia − gastos</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#f59e0b" } as any}>
                  <div className="kpi-label">Activas</div>
                  <div className="kpi-val">{ordenesActivas}</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#3b82f6" } as any}>
                  <div className="kpi-label">A cobrar</div>
                  <div className="kpi-val">{fmt(aCobrar)}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Monotributo Cat. H</div>
                <div className="row" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{fmt(totalIngresos)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pctMonotributo > 80 ? "#ef4444" : "#64748b" }}>{pctMonotributo}%</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${pctMonotributo}%`, background: pctMonotributo > 80 ? "#ef4444" : "#f97316" }} />
                </div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 6 }}>Tope: {fmt(TOPE_MONOTRIBUTO)}</div>
              </div>

              {sinCobrar.length > 0 && (
                <div className="card" style={{ borderColor: "#d97706" }}>
                  <div className="card-title" style={{ color: "#f59e0b" }}>⏳ A cobrar ({sinCobrar.length})</div>
                  {sinCobrar.map((o: any) => (
                    <div key={o.id} className="cobro-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                        <div style={{ fontSize: 11, color: "#92400e" }}>{o.folio} · {o.servicio}</div>
                        <div style={{ fontSize: 16, color: "#f97316", fontWeight: 900, marginTop: 4 }}>{fmt(o.costo)}</div>
                      </div>
                      <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Cobrado</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="card">
                <div className="card-title">Órdenes activas</div>
                {ordenes.filter(o => o.estado !== "completado").length === 0
                  ? <div className="empty">Sin órdenes activas</div>
                  : ordenes.filter(o => o.estado !== "completado").slice(0, 5).map((o: any) => (
                    <div key={o.id} className="orden-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{o.vehiculo} · {o.servicio}</div>
                        <span className="badge" style={{ background: estadoBg[o.estado] || "#1e293b", color: estadoColor[o.estado] || "#94a3b8" }}>{o.estado}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{fmt(o.costo)}</div>
                    </div>
                  ))
                }
              </div>

              {stockBajo > 0 && (
                <div className="card" style={{ borderColor: "#f97316" }}>
                  <div className="card-title">⚠ Stock bajo</div>
                  {inventario.filter(i => i.cantidad <= i.minimo).map((i: any) => (
                    <div key={i.id} className="alert-item"><strong>{i.nombre}</strong> — {i.cantidad} {i.unidad} (mín. {i.minimo})</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ÓRDENES ══ */}
          {tab === "Órdenes" && (
            <div>
              <input className="form-input" placeholder="Buscar cliente, vehículo, folio..."
                value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
              {ordenes
                .filter(o =>
                  o.cliente?.toLowerCase().includes(search.toLowerCase()) ||
                  o.vehiculo?.toLowerCase().includes(search.toLowerCase()) ||
                  o.folio?.toLowerCase().includes(search.toLowerCase())
                )
                .map((o: any) => {
                  const ganancia = calcGananciaOrden(o);
                  return (
                    <div key={o.id} className="card" style={{ borderLeft: `3px solid ${estadoColor[o.estado] || "#334155"}` }}>
                      <div className="row" style={{ marginBottom: 8 }}>
                        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13 }}>{o.folio}</span>
                        <span className="badge" style={{ background: estadoBg[o.estado] || "#1e293b", color: estadoColor[o.estado] || "#94a3b8" }}>{o.estado}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{o.cliente}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{o.vehiculo}{o.placa ? ` · ${o.placa}` : ""}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{o.servicio}{o.mecanico ? ` · ${o.mecanico}` : ""}</div>
                      <div className="row" style={{ marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>COBRADO</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{fmt(o.costo)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>GANANCIA</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: ganancia >= 0 ? "#fb923c" : "#ef4444" }}>{fmt(ganancia)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select className="select-inline" style={{ flex: 1 }} value={o.estado} onChange={e => cambiarEstado(o.id, e.target.value)}>
                          <option value="pendiente">Pendiente</option>
                          <option value="en proceso">En proceso</option>
                          <option value="esperando repuesto">Esp. repuesto</option>
                          <option value="completado">Completado</option>
                        </select>
                        {o.estado === "completado" && !o.cobrado && (
                          <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Cobrar</button>
                        )}
                        {o.cobrado && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✓ Cobrado</span>}
                      </div>
                    </div>
                  );
                })}
              {ordenes.length === 0 && <div className="empty">No hay órdenes todavía</div>}
              <button className="btn-fab" onClick={() => { setForm({ fecha: new Date().toISOString().slice(0, 10) }); setModal("orden"); }}>+</button>
            </div>
          )}

          {/* ══ FINANZAS ══ */}
          {tab === "Finanzas" && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card" style={{ "--accent": "#22c55e" } as any}>
                  <div className="kpi-label">Total cobrado</div>
                  <div className="kpi-val">{fmt(totalIngresos)}</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#fb923c" } as any}>
                  <div className="kpi-label">Ganancia real</div>
                  <div className="kpi-val">{fmt(totalGanancia)}</div>
                  <div className="kpi-sub">− costo repuestos</div>
                </div>
                <div className="kpi-card" style={{ "--accent": "#ef4444" } as any}>
                  <div className="kpi-label">Total gastos</div>
                  <div className="kpi-val">{fmt(totalGastos)}</div>
                </div>
                <div className="kpi-card" style={{ "--accent": utilidad >= 0 ? "#f97316" : "#ef4444" } as any}>
                  <div className="kpi-label">Utilidad neta</div>
                  <div className="kpi-val">{fmt(utilidad)}</div>
                </div>
              </div>
              <div className="card">
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>Gastos registrados</div>
                  <button className="btn btn-primary btn-sm" onClick={() => { setForm({ fecha: new Date().toISOString().slice(0, 10) }); setModal("gasto"); }}>+ Gasto</button>
                </div>
                {gastos.length === 0
                  ? <div className="empty">Sin gastos registrados</div>
                  : gastos.map((g: any) => (
                    <div key={g.id} className="orden-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{g.concepto}</div>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{g.categoria} · {g.fecha}</div>
                      </div>
                      <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 15 }}>{fmt(g.monto)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ CLIENTES ══ */}
          {tab === "Clientes" && (
            <div>
              {clientes.map((c: any) => (
                <div key={c.id} className="card">
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316", marginBottom: 6 }}>{c.nombre}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>📞 {c.telefono}</div>
                  {c.email && <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>✉ {c.email}</div>}
                  {(c.vehiculos || []).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, marginBottom: 4 }}>VEHÍCULOS</div>
                      {(c.vehiculos || []).map((v: string, idx: number) => (
                        <div key={idx} style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 2 }}>• {v}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>VISITAS</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>{c.visitas || 0}</span>
                  </div>
                </div>
              ))}
              {clientes.length === 0 && <div className="empty">Sin clientes todavía</div>}
              <button className="btn-fab" onClick={() => setModal("cliente")}>+</button>
            </div>
          )}

          {/* ══ INVENTARIO ══ */}
          {tab === "Inventario" && (
            <div>
              {inventario.map((i: any) => {
                const bajo = i.cantidad <= i.minimo;
                return (
                  <div key={i.id} className="card" style={{ borderLeft: `3px solid ${bajo ? "#ef4444" : "#22c55e"}` }}>
                    <div className="row" style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{i.nombre}</div>
                      <span className="badge" style={{ background: bajo ? "#7f1d1d" : "#052e16", color: bajo ? "#f87171" : "#4ade80" }}>
                        {bajo ? "⚠ bajo" : "✓ ok"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, textTransform: "capitalize" }}>
                      {i.categoria} · mín. {i.minimo} {i.unidad} · ${i.precio}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button className="btn btn-danger" style={{ fontSize: 20, padding: "8px 20px" }} onClick={() => ajustarStock(i.id, -1)}>−</button>
                      <span style={{ fontSize: 26, fontWeight: 900, color: bajo ? "#ef4444" : "#22c55e", flex: 1, textAlign: "center" }}>
                        {i.cantidad} <span style={{ fontSize: 12, color: "#64748b" }}>{i.unidad}</span>
                      </span>
                      <button className="btn btn-primary" style={{ fontSize: 20, padding: "8px 20px" }} onClick={() => ajustarStock(i.id, +1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {inventario.length === 0 && <div className="empty">Sin artículos en inventario</div>}
            </div>
          )}

        </div>

        {/* ── Nav inferior ── */}
        <div className="bottom-nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══ MODAL ORDEN ══ */}
        {modal === "orden" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">Nueva Orden</div>
              {inp("cliente", "Cliente")}
              {inp("vehiculo", "Vehículo")}
              {inp("placa", "Placa")}
              {inp("servicio", "Servicio")}
              {inp("mecanico", "Mecánico")}
              {inp("costo", "Costo total ($)", "number")}
              {inp("fecha", "Fecha", "date")}
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.estado || "pendiente"} onChange={e => setForm((p: any) => ({ ...p, estado: e.target.value }))}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en proceso">En proceso</option>
                  <option value="esperando repuesto">Esperando repuesto</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={addOrden}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL GASTO ══ */}
        {modal === "gasto" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">Registrar Gasto</div>
              {inp("concepto", "Concepto")}
              {inp("monto", "Monto ($)", "number")}
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.categoria || ""} onChange={e => setForm((p: any) => ({ ...p, categoria: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {["insumos", "fijo", "servicios", "equipo", "otro"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {inp("fecha", "Fecha", "date")}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={addGasto}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL CLIENTE ══ */}
        {modal === "cliente" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">Nuevo Cliente</div>
              {inp("nombre", "Nombre")}
              {inp("telefono", "Teléfono")}
              {inp("email", "Email")}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={addCliente}>Guardar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
