"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://seygknzlruftfezcjpim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWdrbnpscnVmdGZlemNqcGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjY3MDQsImV4cCI6MjA5MTAwMjcwNH0.vODo6mIsy2QY2f1Mh5GstMJfQ3U5YmPBxDmmzozorWQ"
);

const MARGEN = 1.30; // precio de venta = costo * 1.30  →  costo = venta / 1.30

const estadoColor: Record<string, string> = {
  completado: "#22c55e", "en proceso": "#f59e0b",
  pendiente: "#94a3b8", "esperando repuesto": "#f97316",
};
const estadoBg: Record<string, string> = {
  completado: "#052e16", "en proceso": "#431407",
  pendiente: "#1e293b", "esperando repuesto": "#431407",
};

// ── Repuesto: { nombre, precioVenta, cantidad }
// costo = precioVenta / MARGEN
function costoRepuesto(r: any) { return Number(r.precioVenta || 0) / MARGEN; }
function gananciaRepuesto(r: any) { return Number(r.precioVenta || 0) - costoRepuesto(r); }

function calcGananciaOrden(o: any): number {
  const repuestos: any[] = o.repuestos || [];
  const gananciaRep = repuestos.reduce((s: number, r: any) =>
    s + gananciaRepuesto(r) * Number(r.cantidad || 1), 0);
  const totalRep = repuestos.reduce((s: number, r: any) =>
    s + Number(r.precioVenta || 0) * Number(r.cantidad || 1), 0);
  const manoObra = Math.max(0, Number(o.costo || 0) - totalRep);
  return manoObra + gananciaRep;
}

function costoTotalRepuestos(o: any): number {
  return (o.repuestos || []).reduce((s: number, r: any) =>
    s + costoRepuesto(r) * Number(r.cantidad || 1), 0);
}

function cobradoTotal(o: any): number {
  if (o.cobrado === true) return Number(o.costo || 0);
  return (o.pagos || []).reduce((s: number, p: any) => s + Number(p.monto || 0), 0);
}
function saldoPendiente(o: any): number {
  return Math.max(0, Number(o.costo || 0) - cobradoTotal(o));
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { background: #0a0f1a; }
  body { overscroll-behavior: none; }
  .app {
    min-height: 100vh; min-height: 100dvh;
    background: #0a0f1a; color: #e2e8f0;
    font-family: 'Courier New', monospace;
    display: flex; flex-direction: column;
    max-width: 480px; margin: 0 auto;
  }
  /* PIN */
  .pin-screen {
    min-height: 100vh; min-height: 100dvh; background: #0a0f1a;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 32px 24px; font-family: 'Courier New', monospace;
  }
  .pin-logo { font-size: 22px; font-weight: 900; color: #f97316; letter-spacing: 3px; margin-bottom: 8px; }
  .pin-sub  { font-size: 11px; color: #64748b; letter-spacing: 2px; margin-bottom: 40px; }
  .pin-dots { display: flex; gap: 16px; margin-bottom: 32px; }
  .pin-dot  { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #334155; background: transparent; transition: background 0.15s; }
  .pin-dot.filled { background: #f97316; border-color: #f97316; }
  .pin-pad  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 280px; }
  .pin-key  {
    background: #0f172a; border: 1px solid #1e293b; border-radius: 10px;
    color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 22px;
    font-weight: 700; padding: 18px; cursor: pointer; min-height: 64px;
    display: flex; align-items: center; justify-content: center;
  }
  .pin-key:active { background: #1e293b; }
  .pin-key.delete { color: #f97316; }
  .pin-error { color: #ef4444; font-size: 13px; margin-bottom: 16px; letter-spacing: 1px; }
  /* Header */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-bottom: 2px solid #f97316; padding: 12px 16px;
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 0; z-index: 50;
  }
  .logo { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #f97316; }
  .lock-btn { background: transparent; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 4px; }
  /* Main */
  .main { flex: 1; overflow-y: auto; padding: 16px; padding-bottom: 90px; }
  /* Nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px; background: #0f172a;
    border-top: 2px solid #f97316; display: flex; z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .nav-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 10px 4px 8px;
    background: transparent; border: none; cursor: pointer;
    font-family: 'Courier New', monospace; gap: 3px;
  }
  .nav-btn.active { background: #1e293b; }
  .nav-icon  { font-size: 20px; line-height: 1; }
  .nav-label { font-size: 9px; letter-spacing: 1px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .nav-btn.active .nav-label { color: #f97316; }
  /* KPIs */
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .kpi-card { background: #0f172a; border-radius: 8px; padding: 14px 12px; border-left: 3px solid var(--accent); }
  .kpi-label { font-size: 9px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .kpi-val   { font-size: 22px; font-weight: 900; color: var(--accent); line-height: 1; }
  .kpi-sub   { font-size: 9px; color: #475569; margin-top: 4px; }
  /* Cards */
  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .card-title { font-size: 10px; letter-spacing: 3px; color: #f97316; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; }
  /* Listas */
  .item-row { padding: 12px 0; border-bottom: 1px solid #1e293b; }
  .item-row:last-child { border-bottom: none; padding-bottom: 0; }
  /* Badge */
  .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
  /* Botones */
  .btn {
    border: none; border-radius: 6px; padding: 12px 20px;
    font-family: 'Courier New', monospace; font-weight: 700; font-size: 13px;
    letter-spacing: 1px; cursor: pointer; min-height: 44px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-primary { background: #f97316; color: #0a0f1a; }
  .btn-success { background: #166534; color: #4ade80; }
  .btn-warning { background: #92400e; color: #fbbf24; }
  .btn-danger  { background: #7f1d1d; color: #f87171; }
  .btn-ghost   { background: #1e293b; color: #94a3b8; }
  .btn-sm   { padding: 8px 14px; font-size: 11px; min-height: 36px; border-radius: 4px; }
  .btn-full { width: 100%; }
  .btn-fab {
    position: fixed; bottom: 80px; right: 20px;
    width: 56px; height: 56px; border-radius: 50%;
    background: #f97316; color: #0a0f1a; border: none;
    font-size: 28px; font-weight: 900; cursor: pointer;
    box-shadow: 0 4px 20px rgba(249,115,22,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 90;
  }
  @media (min-width: 480px) { .btn-fab { right: calc(50% - 220px); } }
  /* Forms */
  .form-group  { margin-bottom: 14px; }
  .form-label  { font-size: 10px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .form-input, .form-select {
    background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
    padding: 12px 14px; border-radius: 6px; width: 100%;
    font-family: 'Courier New', monospace; font-size: 14px; min-height: 44px;
  }
  .form-input:focus, .form-select:focus { outline: none; border-color: #f97316; }
  /* Modal */
  .modal-bg {
    position: fixed; inset: 0; background: rgba(0,0,0,0.9);
    display: flex; align-items: flex-end; justify-content: center; z-index: 200;
  }
  .modal-box {
    background: #0f172a; border: 1px solid #f97316;
    border-radius: 16px 16px 0 0; padding: 20px 20px 40px;
    width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto;
  }
  .modal-handle { width: 40px; height: 4px; background: #334155; border-radius: 2px; margin: 0 auto 16px; }
  /* Repuestos */
  .rep-card {
    background: #0a0f1a; border: 1px solid #334155; border-radius: 6px;
    padding: 10px 12px; margin-bottom: 8px;
  }
  .rep-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
  .rep-calc { font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
  /* Pagos */
  .pago-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #1e293b; font-size: 12px; }
  .pago-row:last-child { border-bottom: none; }
  /* Cliente vehiculo */
  .vtag { display: inline-block; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 10px; font-size: 12px; margin: 3px; color: #e2e8f0; }
  /* Misc */
  .cobro-item { background: #1c1208; border: 1px solid #d97706; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .alert-item { background: #431407; border: 1px solid #f97316; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; }
  .select-inline { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; padding: 6px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; min-height: 36px; }
  .row   { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; }
  .empty { color: #475569; font-size: 13px; text-align: center; padding: 32px 0; }
  .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0f1a; color: #f97316; font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 3px; }
  .progress-wrap { background: #1e293b; border-radius: 3px; height: 8px; overflow: hidden; }
  .progress-bar  { height: 100%; border-radius: 3px; }
`;

const TABS = [
  { id: "Inicio",    icon: "🏠", label: "Inicio" },
  { id: "Órdenes",  icon: "🔧", label: "Órdenes" },
  { id: "Finanzas", icon: "💰", label: "Finanzas" },
  { id: "Clientes", icon: "👤", label: "Clientes" },
];

const PIN_LENGTH = 4;
const ESTADOS = ["pendiente", "en proceso", "esperando repuesto", "completado"];

export default function TallerBlanco() {
  // Auth
  const [autenticado, setAutenticado] = useState(false);
  const [pinInput, setPinInput]       = useState("");
  const [pinError, setPinError]       = useState("");
  const [pinGuardado, setPinGuardado] = useState<string | null>(null);

  // Data
  const [tab, setTab]           = useState("Inicio");
  const [ordenes, setOrdenes]   = useState<any[]>([]);
  const [gastos, setGastos]     = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  // UI
  const [modal, setModal]       = useState<string | null>(null);
  const [form, setForm]         = useState<any>({});
  const [editId, setEditId]     = useState<number | null>(null);
  const [search, setSearch]     = useState("");

  // Repuestos dentro del form de orden
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [repForm, setRepForm]     = useState({ nombre: "", precioVenta: "", cantidad: "1" });

  // Pago parcial
  const [pagoOrdenId, setPagoOrdenId] = useState<number | null>(null);
  const [pagoMonto, setPagoMonto]     = useState("");

  useEffect(() => { cargarPin(); fetchAll(); }, []);

  // ── PIN ───────────────────────────────────────────────────────────────────
  async function cargarPin() {
    const { data } = await supabase.from("config").select("valor").eq("clave", "pin").single();
    setPinGuardado(data?.valor ?? "");
  }

  function presionarTecla(k: string) {
    if (pinInput.length >= PIN_LENGTH) return;
    const nuevo = pinInput + k;
    setPinInput(nuevo);
    setPinError("");
    if (nuevo.length === PIN_LENGTH) verificarPin(nuevo);
  }

  function borrarTecla() { setPinInput(p => p.slice(0, -1)); setPinError(""); }

  function verificarPin(intento: string) {
    if (pinGuardado === "" || intento === pinGuardado) { setAutenticado(true); }
    else { setTimeout(() => { setPinInput(""); setPinError("PIN incorrecto"); }, 300); }
  }

  async function guardarNuevoPin(pin: string) {
    await supabase.from("config").upsert({ clave: "pin", valor: pin });
    setPinGuardado(pin);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    const [o, g, c] = await Promise.all([
      supabase.from("ordenes").select("*").order("created_at", { ascending: false }),
      supabase.from("gastos").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("created_at", { ascending: false }),
    ]);
    setOrdenes(o.data || []);
    setGastos(g.data || []);
    setClientes(c.data || []);
    setLoading(false);
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const todasCobradas  = ordenes.filter(o => saldoPendiente(o) === 0 && (o.cobrado || (o.pagos||[]).length > 0));
  const sinCobrar      = ordenes.filter(o => o.estado === "completado" && saldoPendiente(o) > 0);
  const totalIngresos  = ordenes.reduce((s, o) => s + cobradoTotal(o), 0);
  const totalGanancia  = todasCobradas.reduce((s, o) => s + calcGananciaOrden(o), 0);
  const totalGastos    = gastos.reduce((s, g) => s + Number(g.monto || 0), 0);
  const utilidad       = totalGanancia - totalGastos;
  const ordenesActivas = ordenes.filter(o => o.estado !== "completado").length;
  const aCobrar        = sinCobrar.reduce((s, o) => s + saldoPendiente(o), 0);

  // ── Orden ─────────────────────────────────────────────────────────────────
  function abrirNuevaOrden() {
    setEditId(null);
    setForm({ fecha: new Date().toISOString().slice(0, 10), estado: "pendiente" });
    setRepuestos([]);
    setRepForm({ nombre: "", precioVenta: "", cantidad: "1" });
    setModal("orden");
  }

  function abrirEditarOrden(o: any) {
    setEditId(o.id);
    setForm({ cliente: o.cliente, vehiculo: o.vehiculo, placa: o.placa,
      servicio: o.servicio, mecanico: o.mecanico,
      costo: o.costo, estado: o.estado, fecha: o.fecha });
    setRepuestos(o.repuestos || []);
    setRepForm({ nombre: "", precioVenta: "", cantidad: "1" });
    setModal("orden");
  }

  function agregarRepuesto() {
    if (!repForm.nombre || !repForm.precioVenta) return;
    setRepuestos(prev => [...prev, {
      nombre: repForm.nombre,
      precioVenta: Number(repForm.precioVenta),
      cantidad: Number(repForm.cantidad) || 1,
    }]);
    setRepForm({ nombre: "", precioVenta: "", cantidad: "1" });
  }

  function quitarRepuesto(idx: number) {
    setRepuestos(prev => prev.filter((_, i) => i !== idx));
  }

  // Calcula el costo total automáticamente sumando mano de obra + repuestos a precio de venta
  function calcCostoOrden() {
    const totalRep = repuestos.reduce((s, r) =>
      s + Number(r.precioVenta) * Number(r.cantidad || 1), 0);
    const manoObra = Number(form.mano_obra || 0);
    return totalRep + manoObra;
  }

  async function guardarOrden() {
    const costoFinal = calcCostoOrden();
    const datos: any = {
      cliente: form.cliente, vehiculo: form.vehiculo, placa: form.placa,
      servicio: form.servicio, mecanico: form.mecanico,
      costo: costoFinal,
      mano_obra: Number(form.mano_obra || 0),
      estado: form.estado || "pendiente",
      fecha: form.fecha,
      repuestos,
    };
    if (editId) {
      const { data, error } = await supabase.from("ordenes").update(datos).eq("id", editId).select();
      if (data && !error) setOrdenes(prev => prev.map(o => o.id === editId ? { ...o, ...data[0] } : o));
    } else {
      const folio = `OT-${String(ordenes.length + 1).padStart(3, "0")}`;
      const { data, error } = await supabase.from("ordenes").insert([{ ...datos, folio, cobrado: false, pagos: [] }]).select();
      if (data && !error) setOrdenes(prev => [data[0], ...prev]);
    }
    closeModal();
  }

  async function cambiarEstado(id: number, estado: string) {
    await supabase.from("ordenes").update({ estado }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
  }

  async function marcarCobrado(id: number) {
    await supabase.from("ordenes").update({ cobrado: true }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, cobrado: true } : o));
  }

  async function registrarPago(id: number) {
    const monto = Number(pagoMonto);
    if (!monto || monto <= 0) return;
    const orden = ordenes.find(o => o.id === id);
    if (!orden) return;
    const nuevosPagos = [...(orden.pagos || []), { monto, fecha: new Date().toISOString().slice(0, 10) }];
    const totalPagado = nuevosPagos.reduce((s: number, p: any) => s + Number(p.monto), 0);
    const cobrado = totalPagado >= Number(orden.costo);
    await supabase.from("ordenes").update({ pagos: nuevosPagos, cobrado }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, pagos: nuevosPagos, cobrado } : o));
    setPagoMonto(""); setPagoOrdenId(null); setModal(null);
  }

  // ── Gasto ─────────────────────────────────────────────────────────────────
  async function addGasto() {
    const nuevo = { concepto: form.concepto, monto: Number(form.monto) || 0, categoria: form.categoria, fecha: form.fecha };
    const { data, error } = await supabase.from("gastos").insert([nuevo]).select();
    if (data && !error) setGastos(prev => [data[0], ...prev]);
    closeModal();
  }

  // ── Cliente ───────────────────────────────────────────────────────────────
  async function guardarCliente() {
    const vehiculosArr = (form.vehiculos_txt || "").split(",").map((v: string) => v.trim()).filter(Boolean);
    const datos = { nombre: form.nombre, telefono: form.telefono, email: form.email, cuit: form.cuit, vehiculos: vehiculosArr };
    if (editId) {
      const { data, error } = await supabase.from("clientes").update(datos).eq("id", editId).select();
      if (data && !error) setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...data[0] } : c));
    } else {
      const { data, error } = await supabase.from("clientes").insert([{ ...datos, visitas: 0 }]).select();
      if (data && !error) setClientes(prev => [data[0], ...prev]);
    }
    closeModal();
  }

  function abrirEditarCliente(c: any) {
    setEditId(c.id);
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email, cuit: c.cuit || "", vehiculos_txt: (c.vehiculos || []).join(", ") });
    setModal("cliente");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function closeModal() { setModal(null); setForm({}); setEditId(null); setPagoMonto(""); setPagoOrdenId(null); }

  const inp = (field: string, label: string, type = "text", placeholder = "") => (
    <div className="form-group" key={field}>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        placeholder={placeholder}
        value={form[field] || ""}
        onChange={e => setForm((p: any) => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  if (loading) return <div className="loading">CARGANDO...</div>;

  // ── Pantalla PIN ──────────────────────────────────────────────────────────
  if (!autenticado && pinGuardado !== "") {
    return (
      <>
        <style>{CSS}</style>
        <div className="pin-screen">
          <div className="pin-logo">🔩 TALLER BLANCO</div>
          <div className="pin-sub">INGRESÁ TU PIN</div>
          <div className="pin-dots">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div key={i} className={`pin-dot ${i < pinInput.length ? "filled" : ""}`} />
            ))}
          </div>
          {pinError && <div className="pin-error">{pinError}</div>}
          <div className="pin-pad">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, idx) => (
              <button key={idx} className={`pin-key ${k === "⌫" ? "delete" : ""}`}
                style={{ visibility: k === "" ? "hidden" : "visible" }}
                onClick={() => k === "⌫" ? borrarTecla() : k && presionarTecla(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        <div className="header">
          <div className="logo">🔩 TALLER BLANCO</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>
              {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase()}
            </span>
            <button className="lock-btn" onClick={() => setAutenticado(false)}>🔒</button>
          </div>
        </div>

        <div className="main">

          {/* ══ INICIO ══ */}
          {tab === "Inicio" && (
            <div>
              <div className="kpi-grid">
                {[
                  { label: "Cobrado",      val: fmt(totalIngresos), accent: "#22c55e" },
                  { label: "Ganancia real",val: fmt(totalGanancia), accent: "#fb923c", sub: "sin costo repuestos" },
                  { label: "Gastos",       val: fmt(totalGastos),  accent: "#ef4444" },
                  { label: "Utilidad neta",val: fmt(utilidad),     accent: utilidad >= 0 ? "#f97316" : "#ef4444", sub: "ganancia − gastos" },
                  { label: "Activas",      val: String(ordenesActivas), accent: "#f59e0b" },
                  { label: "A cobrar",     val: fmt(aCobrar),      accent: "#3b82f6" },
                ].map(k => (
                  <div key={k.label} className="kpi-card" style={{ "--accent": k.accent } as any}>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-val">{k.val}</div>
                    {k.sub && <div className="kpi-sub">{k.sub}</div>}
                  </div>
                ))}
              </div>

              {sinCobrar.length > 0 && (
                <div className="card" style={{ borderColor: "#d97706" }}>
                  <div className="card-title" style={{ color: "#f59e0b" }}>⏳ A cobrar ({sinCobrar.length})</div>
                  {sinCobrar.map((o: any) => {
                    const saldo = saldoPendiente(o);
                    const parcial = cobradoTotal(o) > 0;
                    return (
                      <div key={o.id} className="cobro-item">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                          <div style={{ fontSize: 11, color: "#92400e" }}>{o.folio} · {o.servicio}</div>
                          {parcial && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Pagado: {fmt(cobradoTotal(o))}</div>}
                          <div style={{ fontSize: 16, color: "#f97316", fontWeight: 900, marginTop: 4 }}>Saldo: {fmt(saldo)}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                          <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Todo</button>
                          <button className="btn btn-warning btn-sm" onClick={() => { setPagoOrdenId(o.id); setModal("pago"); }}>$ Parcial</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="card">
                <div className="card-title">Órdenes activas</div>
                {ordenes.filter(o => o.estado !== "completado").length === 0
                  ? <div className="empty">Sin órdenes activas</div>
                  : ordenes.filter(o => o.estado !== "completado").slice(0, 5).map((o: any) => (
                    <div key={o.id} className="item-row">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{o.vehiculo} · {o.servicio}</div>
                          <span className="badge" style={{ background: estadoBg[o.estado]||"#1e293b", color: estadoColor[o.estado]||"#94a3b8" }}>{o.estado}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{fmt(o.costo)}</div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Configuración */}
              <div className="card">
                <div className="card-title">⚙ Configuración</div>
                <button className="btn btn-ghost btn-full" onClick={() => setModal("pin")}>🔑 Cambiar PIN</button>
              </div>
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
                  const saldo    = saldoPendiente(o);
                  const parcial  = cobradoTotal(o) > 0 && saldo > 0;
                  const costoRep = costoTotalRepuestos(o);
                  return (
                    <div key={o.id} className="card" style={{ borderLeft: `3px solid ${estadoColor[o.estado]||"#334155"}` }}>
                      <div className="row" style={{ marginBottom: 8 }}>
                        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13 }}>{o.folio}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="badge" style={{ background: estadoBg[o.estado]||"#1e293b", color: estadoColor[o.estado]||"#94a3b8" }}>{o.estado}</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => abrirEditarOrden(o)}>✏</button>
                        </div>
                      </div>

                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{o.cliente}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{o.vehiculo}{o.placa ? ` · ${o.placa}` : ""}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{o.servicio}{o.mecanico ? ` · ${o.mecanico}` : ""}</div>

                      {/* Repuestos */}
                      {(o.repuestos || []).length > 0 && (
                        <div style={{ background: "#0a0f1a", borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Repuestos</div>
                          {(o.repuestos || []).map((r: any, idx: number) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #1e293b" }}>
                              <span style={{ color: "#94a3b8" }}>{r.nombre} ×{r.cantidad || 1}</span>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ color: "#e2e8f0" }}>{fmt(r.precioVenta * (r.cantidad || 1))}</span>
                                <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>costo {fmt(costoRepuesto(r) * (r.cantidad || 1))}</span>
                              </div>
                            </div>
                          ))}
                          {o.mano_obra > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: 4 }}>
                              <span style={{ color: "#94a3b8" }}>Mano de obra</span>
                              <span style={{ color: "#e2e8f0" }}>{fmt(o.mano_obra)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="row" style={{ marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>TOTAL</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{fmt(o.costo)}</div>
                          {costoRep > 0 && <div style={{ fontSize: 10, color: "#64748b" }}>costo rep: {fmt(costoRep)}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>GANANCIA</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: ganancia >= 0 ? "#fb923c" : "#ef4444" }}>{fmt(ganancia)}</div>
                        </div>
                      </div>

                      {/* Historial de pagos */}
                      {(o.pagos || []).length > 0 && (
                        <div style={{ background: "#0a0f1a", borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
                          {(o.pagos || []).map((p: any, idx: number) => (
                            <div key={idx} className="pago-row">
                              <span style={{ color: "#94a3b8" }}>Pago {idx + 1} · {p.fecha}</span>
                              <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(p.monto)}</span>
                            </div>
                          ))}
                          {parcial && (
                            <div className="pago-row">
                              <span style={{ color: "#f59e0b", fontWeight: 700 }}>Saldo pendiente</span>
                              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(saldo)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select className="select-inline" style={{ flex: 1, minWidth: 120 }}
                          value={o.estado} onChange={e => cambiarEstado(o.id, e.target.value)}>
                          {ESTADOS.map(e => <option key={e} value={e}>{e === "esperando repuesto" ? "Esp. repuesto" : e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                        </select>
                        {o.estado === "completado" && saldo > 0 && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Todo</button>
                            <button className="btn btn-warning btn-sm" onClick={() => { setPagoOrdenId(o.id); setModal("pago"); }}>$ Parcial</button>
                          </>
                        )}
                        {saldo === 0 && (o.cobrado || (o.pagos||[]).length > 0) && (
                          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✓ Cobrado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {ordenes.length === 0 && <div className="empty">No hay órdenes todavía</div>}
              <button className="btn-fab" onClick={abrirNuevaOrden}>+</button>
            </div>
          )}

          {/* ══ FINANZAS ══ */}
          {tab === "Finanzas" && (
            <div>
              <div className="kpi-grid">
                {[
                  { label: "Total cobrado", val: fmt(totalIngresos), accent: "#22c55e" },
                  { label: "Ganancia real",  val: fmt(totalGanancia), accent: "#fb923c", sub: "− costo repuestos" },
                  { label: "Total gastos",   val: fmt(totalGastos),   accent: "#ef4444" },
                  { label: "Utilidad neta",  val: fmt(utilidad),      accent: utilidad >= 0 ? "#f97316" : "#ef4444" },
                ].map(k => (
                  <div key={k.label} className="kpi-card" style={{ "--accent": k.accent } as any}>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-val">{k.val}</div>
                    {k.sub && <div className="kpi-sub">{k.sub}</div>}
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>Gastos registrados</div>
                  <button className="btn btn-primary btn-sm" onClick={() => { setForm({ fecha: new Date().toISOString().slice(0, 10) }); setModal("gasto"); }}>+ Gasto</button>
                </div>
                {gastos.length === 0
                  ? <div className="empty">Sin gastos registrados</div>
                  : gastos.map((g: any) => (
                    <div key={g.id} className="item-row">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{g.concepto}</div>
                          <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{g.categoria} · {g.fecha}</div>
                        </div>
                        <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 15 }}>{fmt(g.monto)}</span>
                      </div>
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
                  <div className="row" style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{c.nombre}</div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => abrirEditarCliente(c)}>✏ Editar</button>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>📞 {c.telefono}</div>
                  {c.email && <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>✉ {c.email}</div>}
                  {c.cuit  && <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>🪪 {c.cuit}</div>}
                  {(c.vehiculos || []).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Vehículos</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {(c.vehiculos || []).map((v: string, idx: number) => <span key={idx} className="vtag">{v}</span>)}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>VISITAS</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>{c.visitas || 0}</span>
                  </div>
                </div>
              ))}
              {clientes.length === 0 && <div className="empty">Sin clientes todavía</div>}
              <button className="btn-fab" onClick={() => { setEditId(null); setForm({}); setModal("cliente"); }}>+</button>
            </div>
          )}

        </div>

        {/* Nav */}
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
              <div className="card-title">{editId ? "Editar Orden" : "Nueva Orden"}</div>

              {inp("cliente",  "Cliente")}
              {inp("vehiculo", "Vehículo")}
              {inp("placa",    "Placa")}
              {inp("servicio", "Servicio / Trabajo")}
              {inp("mecanico", "Mecánico")}
              {inp("fecha",    "Fecha", "date")}
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.estado || "pendiente"}
                  onChange={e => setForm((p: any) => ({ ...p, estado: e.target.value }))}>
                  {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>
              </div>

              {/* Mano de obra */}
              <div className="form-group">
                <label className="form-label">Mano de obra ($)</label>
                <input className="form-input" type="number" inputMode="numeric"
                  placeholder="0"
                  value={form.mano_obra || ""}
                  onChange={e => setForm((p: any) => ({ ...p, mano_obra: e.target.value }))} />
              </div>

              {/* Repuestos */}
              <div style={{ marginBottom: 14 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Repuestos</div>

                {repuestos.map((r, idx) => (
                  <div key={idx} className="rep-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.nombre} ×{r.cantidad}</span>
                      <button className="btn btn-danger btn-sm" style={{ padding: "3px 8px" }} onClick={() => quitarRepuesto(idx)}>✕</button>
                    </div>
                    <div className="rep-calc" style={{ marginTop: 4 }}>
                      <span>Venta: {fmt(r.precioVenta * r.cantidad)}</span>
                      <span>Costo (÷1.30): {fmt(costoRepuesto(r) * r.cantidad)}</span>
                      <span style={{ color: "#fb923c" }}>Gan: {fmt(gananciaRepuesto(r) * r.cantidad)}</span>
                    </div>
                  </div>
                ))}

                {/* Agregar repuesto */}
                <div style={{ background: "#0a0f1a", border: "1px dashed #334155", borderRadius: 6, padding: 10 }}>
                  <div className="rep-row">
                    <input className="form-input" placeholder="Nombre del repuesto"
                      style={{ flex: 2, fontSize: 13, padding: "8px 10px", minHeight: 36 }}
                      value={repForm.nombre}
                      onChange={e => setRepForm(p => ({ ...p, nombre: e.target.value }))} />
                    <input className="form-input" placeholder="$ Venta" type="number" inputMode="numeric"
                      style={{ flex: 1, fontSize: 13, padding: "8px 10px", minHeight: 36 }}
                      value={repForm.precioVenta}
                      onChange={e => setRepForm(p => ({ ...p, precioVenta: e.target.value }))} />
                    <input className="form-input" placeholder="Cant" type="number" inputMode="numeric"
                      style={{ width: 56, fontSize: 13, padding: "8px 10px", minHeight: 36 }}
                      value={repForm.cantidad}
                      onChange={e => setRepForm(p => ({ ...p, cantidad: e.target.value }))} />
                  </div>
                  {repForm.precioVenta && (
                    <div className="rep-calc" style={{ marginBottom: 8 }}>
                      <span>Costo: {fmt(Number(repForm.precioVenta) / MARGEN * (Number(repForm.cantidad)||1))}</span>
                      <span style={{ color: "#fb923c" }}>Ganancia: {fmt((Number(repForm.precioVenta) - Number(repForm.precioVenta)/MARGEN) * (Number(repForm.cantidad)||1))}</span>
                    </div>
                  )}
                  <button className="btn btn-ghost btn-full btn-sm" onClick={agregarRepuesto}>+ Agregar repuesto</button>
                </div>
              </div>

              {/* Resumen total */}
              <div style={{ background: "#0a0f1a", borderRadius: 6, padding: "10px 12px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>Mano de obra</span>
                  <span>{fmt(Number(form.mano_obra || 0))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>Repuestos (venta)</span>
                  <span>{fmt(repuestos.reduce((s,r) => s + r.precioVenta*(r.cantidad||1), 0))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, borderTop: "1px solid #1e293b", paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: "#64748b" }}>Total orden</span>
                  <span style={{ color: "#22c55e" }}>{fmt(calcCostoOrden())}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={guardarOrden}>{editId ? "Guardar cambios" : "Crear orden"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL PAGO PARCIAL ══ */}
        {modal === "pago" && pagoOrdenId && (() => {
          const o = ordenes.find(x => x.id === pagoOrdenId);
          if (!o) return null;
          const saldo = saldoPendiente(o);
          return (
            <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
              <div className="modal-box">
                <div className="modal-handle" />
                <div className="card-title">Pago Parcial</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{o.cliente} · {o.folio}</div>
                  {[["Total orden", fmt(o.costo), "#e2e8f0"], ["Ya pagado", fmt(cobradoTotal(o)), "#4ade80"], ["Saldo", fmt(saldo), "#f59e0b"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#64748b" }}>{l}</span>
                      <span style={{ color: c as string, fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Monto del pago ($)</label>
                  <input className="form-input" type="number" inputMode="numeric"
                    placeholder={`Máx ${fmt(saldo)}`}
                    value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                  <button className="btn btn-success btn-full" onClick={() => registrarPago(pagoOrdenId)}>Registrar</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ MODAL GASTO ══ */}
        {modal === "gasto" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">Registrar Gasto</div>
              {inp("concepto", "Concepto")}
              {inp("monto",    "Monto ($)", "number")}
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.categoria || ""} onChange={e => setForm((p: any) => ({ ...p, categoria: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {["insumos","fijo","servicios","equipo","otro"].map(c => <option key={c} value={c}>{c}</option>)}
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
              <div className="card-title">{editId ? "Editar Cliente" : "Nuevo Cliente"}</div>
              {inp("nombre",   "Nombre")}
              {inp("telefono", "Teléfono")}
              {inp("email",    "Email")}
              {inp("cuit",     "CUIT / DNI")}
              <div className="form-group">
                <label className="form-label">Vehículos (separados por coma)</label>
                <input className="form-input" placeholder="Toyota Hilux, Ford Ranger"
                  value={form.vehiculos_txt || ""}
                  onChange={e => setForm((p: any) => ({ ...p, vehiculos_txt: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full" onClick={guardarCliente}>{editId ? "Guardar cambios" : "Crear cliente"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL PIN ══ */}
        {modal === "pin" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">🔑 Cambiar PIN</div>
              {inp("nuevo_pin",   "Nuevo PIN (4 dígitos)", "number")}
              {inp("confirm_pin", "Confirmar PIN",         "number")}
              {form.nuevo_pin && form.confirm_pin && form.nuevo_pin !== form.confirm_pin && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Los PINs no coinciden</div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full"
                  onClick={async () => { await guardarNuevoPin(form.nuevo_pin); closeModal(); }}
                  disabled={!form.nuevo_pin || form.nuevo_pin.length !== 4 || form.nuevo_pin !== form.confirm_pin}>
                  Guardar PIN
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
