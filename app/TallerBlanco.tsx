"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://seygknzlruftfezcjpim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWdrbnpscnVmdGZlemNqcGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjY3MDQsImV4cCI6MjA5MTAwMjcwNH0.vODo6mIsy2QY2f1Mh5GstMJfQ3U5YmPBxDmmzozorWQ"
);

const estadoColor: Record<string, string> = {
  completado: "#22c55e", "en proceso": "#f59e0b",
  pendiente: "#94a3b8", "esperando repuesto": "#f97316",
};
const estadoBg: Record<string, string> = {
  completado: "#052e16", "en proceso": "#431407",
  pendiente: "#1e293b", "esperando repuesto": "#431407",
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

function cobradoTotal(o: any): number {
  if (o.cobrado === true) return Number(o.costo || 0);
  const pagos: any[] = o.pagos || [];
  return pagos.reduce((s: number, p: any) => s + Number(p.monto || 0), 0);
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
    min-height: 100vh; min-height: 100dvh;
    background: #0a0f1a; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 32px 24px;
    font-family: 'Courier New', monospace;
  }
  .pin-logo { font-size: 22px; font-weight: 900; color: #f97316; letter-spacing: 3px; margin-bottom: 8px; }
  .pin-sub { font-size: 11px; color: #64748b; letter-spacing: 2px; margin-bottom: 40px; }
  .pin-dots { display: flex; gap: 16px; margin-bottom: 32px; }
  .pin-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #334155; background: transparent; transition: background 0.15s; }
  .pin-dot.filled { background: #f97316; border-color: #f97316; }
  .pin-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 280px; }
  .pin-key {
    background: #0f172a; border: 1px solid #1e293b; border-radius: 10px;
    color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 22px;
    font-weight: 700; padding: 18px; cursor: pointer; text-align: center;
    min-height: 64px; display: flex; align-items: center; justify-content: center;
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

  /* Nav inferior */
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
  .nav-icon { font-size: 20px; line-height: 1; }
  .nav-label { font-size: 9px; letter-spacing: 1px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .nav-btn.active .nav-label { color: #f97316; }

  /* KPIs */
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .kpi-card { background: #0f172a; border-radius: 8px; padding: 14px 12px; border-left: 3px solid var(--accent); }
  .kpi-label { font-size: 9px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
  .kpi-val { font-size: 22px; font-weight: 900; color: var(--accent); line-height: 1; }
  .kpi-sub { font-size: 9px; color: #475569; margin-top: 4px; }

  /* Cards */
  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .card-title { font-size: 10px; letter-spacing: 3px; color: #f97316; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; }

  /* Orden item */
  .orden-item { padding: 12px 0; border-bottom: 1px solid #1e293b; }
  .orden-item:last-child { border-bottom: none; padding-bottom: 0; }

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
  .btn-sm { padding: 8px 14px; font-size: 11px; min-height: 36px; border-radius: 4px; }
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

  /* Formularios */
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 10px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px; }
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

  /* Progreso */
  .progress-wrap { background: #1e293b; border-radius: 3px; height: 8px; overflow: hidden; }
  .progress-bar  { height: 100%; border-radius: 3px; }

  /* Alerts */
  .alert-item { background: #431407; border: 1px solid #f97316; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; }
  .cobro-item { background: #1c1208; border: 1px solid #d97706; border-radius: 8px; padding: 12px; margin-bottom: 8px; }

  .select-inline {
    background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
    padding: 6px 8px; border-radius: 4px; font-family: 'Courier New', monospace;
    font-size: 11px; min-height: 36px;
  }

  .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; }
  .empty { color: #475569; font-size: 13px; text-align: center; padding: 32px 0; }
  .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0f1a; color: #f97316; font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 3px; }

  /* Pago parcial */
  .pago-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 12px; }
  .pago-row:last-child { border-bottom: none; }

  /* Cliente vehiculo tag */
  .vehiculo-tag { display: inline-block; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 10px; font-size: 12px; margin: 3px; color: #e2e8f0; }

  /* Separador */
  .sep { border: none; border-top: 1px solid #1e293b; margin: 12px 0; }
`;

const TABS = [
  { id: "Inicio",      icon: "🏠", label: "Inicio" },
  { id: "Órdenes",    icon: "🔧", label: "Órdenes" },
  { id: "Finanzas",   icon: "💰", label: "Finanzas" },
  { id: "Clientes",   icon: "👤", label: "Clientes" },
  { id: "Inventario", icon: "📦", label: "Stock" },
];

const PIN_LENGTH = 4;

export default function TallerBlanco() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [autenticado, setAutenticado] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinGuardado, setPinGuardado] = useState<string | null>(null);

  // ── App state ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("Inicio");
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoOrdenId, setPagoOrdenId] = useState<number | null>(null);

  useEffect(() => {
    cargarPin();
    fetchAll();
  }, []);

  async function cargarPin() {
    const { data } = await supabase.from("config").select("valor").eq("clave", "pin").single();
    if (data?.valor) setPinGuardado(data.valor);
    else setPinGuardado(""); // sin pin → acceso libre
  }

  // ── PIN logic ─────────────────────────────────────────────────────────────
  function presionarTecla(k: string) {
    if (pinInput.length >= PIN_LENGTH) return;
    const nuevo = pinInput + k;
    setPinInput(nuevo);
    setPinError("");
    if (nuevo.length === PIN_LENGTH) verificarPin(nuevo);
  }

  function borrarTecla() {
    setPinInput(prev => prev.slice(0, -1));
    setPinError("");
  }

  async function verificarPin(intento: string) {
    // Si no hay pin configurado, entrar directo
    if (pinGuardado === "") { setAutenticado(true); return; }
    if (intento === pinGuardado) {
      setAutenticado(true);
    } else {
      setTimeout(() => { setPinInput(""); setPinError("PIN incorrecto"); }, 300);
    }
  }

  async function guardarNuevoPin(nuevoPin: string) {
    await supabase.from("config").upsert({ clave: "pin", valor: nuevoPin });
    setPinGuardado(nuevoPin);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
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

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const cobradas       = ordenes.filter(o => saldoPendiente(o) === 0 && (o.cobrado || (o.pagos || []).length > 0));
  const sinCobrar      = ordenes.filter(o => o.estado === "completado" && saldoPendiente(o) > 0);
  const totalIngresos  = ordenes.reduce((s, o) => s + cobradoTotal(o), 0);
  const totalGanancia  = cobradas.reduce((s, o) => s + calcGananciaOrden(o), 0);
  const totalGastos    = gastos.reduce((s, g) => s + Number(g.monto || 0), 0);
  const utilidad       = totalGanancia - totalGastos;
  const ordenesActivas = ordenes.filter(o => o.estado !== "completado").length;
  const aCobrar        = sinCobrar.reduce((s, o) => s + saldoPendiente(o), 0);
  const ticketPromedio = cobradas.length ? Math.round(totalIngresos / cobradas.length) : 0;
  const stockBajo      = inventario.filter(i => i.cantidad <= i.minimo).length;

  // ── CRUD Órdenes ──────────────────────────────────────────────────────────
  async function guardarOrden() {
    const datos = {
      cliente:  form.cliente,
      vehiculo: form.vehiculo,
      placa:    form.placa,
      servicio: form.servicio,
      mecanico: form.mecanico,
      costo:    Number(form.costo) || 0,
      estado:   form.estado || "pendiente",
      fecha:    form.fecha,
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

  function abrirEditarOrden(o: any) {
    setEditId(o.id);
    setForm({
      cliente: o.cliente, vehiculo: o.vehiculo, placa: o.placa,
      servicio: o.servicio, mecanico: o.mecanico,
      costo: o.costo, estado: o.estado, fecha: o.fecha,
    });
    setModal("orden");
  }

  async function cambiarEstado(id: number, estado: string) {
    await supabase.from("ordenes").update({ estado }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
  }

  async function marcarCobrado(id: number) {
    const { error } = await supabase.from("ordenes").update({ cobrado: true }).eq("id", id);
    if (!error) setOrdenes(prev => prev.map(o => o.id === id ? { ...o, cobrado: true } : o));
  }

  async function registrarPago(id: number) {
    const monto = Number(pagoMonto);
    if (!monto || monto <= 0) return;
    const orden = ordenes.find(o => o.id === id);
    if (!orden) return;
    const pagosActuales: any[] = orden.pagos || [];
    const nuevosPagos = [...pagosActuales, { monto, fecha: new Date().toISOString().slice(0, 10) }];
    const totalPagado = nuevosPagos.reduce((s: number, p: any) => s + Number(p.monto), 0);
    const cobrado = totalPagado >= Number(orden.costo);
    const { error } = await supabase.from("ordenes").update({ pagos: nuevosPagos, cobrado }).eq("id", id);
    if (!error) setOrdenes(prev => prev.map(o => o.id === id ? { ...o, pagos: nuevosPagos, cobrado } : o));
    setPagoMonto("");
    setPagoOrdenId(null);
    setModal(null);
  }

  // ── CRUD Gastos ───────────────────────────────────────────────────────────
  async function addGasto() {
    const nuevo = { concepto: form.concepto, monto: Number(form.monto) || 0, categoria: form.categoria, fecha: form.fecha };
    const { data, error } = await supabase.from("gastos").insert([nuevo]).select();
    if (data && !error) setGastos(prev => [data[0], ...prev]);
    closeModal();
  }

  // ── CRUD Clientes ─────────────────────────────────────────────────────────
  async function guardarCliente() {
    const vehiculosArr = (form.vehiculos_txt || "")
      .split(",").map((v: string) => v.trim()).filter(Boolean);
    const datos = {
      nombre: form.nombre, telefono: form.telefono,
      email: form.email, cuit: form.cuit,
      vehiculos: vehiculosArr,
    };
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
    setForm({
      nombre: c.nombre, telefono: c.telefono, email: c.email,
      cuit: c.cuit || "",
      vehiculos_txt: (c.vehiculos || []).join(", "),
    });
    setModal("cliente");
  }

  // ── Stock ─────────────────────────────────────────────────────────────────
  async function ajustarStock(id: number, delta: number) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    const nueva = Math.max(0, item.cantidad + delta);
    await supabase.from("inventario").update({ cantidad: nueva }).eq("id", id);
    setInventario(prev => prev.map(i => i.id === id ? { ...i, cantidad: nueva } : i));
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

  // ── PIN screen ────────────────────────────────────────────────────────────
  if (loading) return <div className="loading">CARGANDO...</div>;

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
                onClick={() => k === "⌫" ? borrarTecla() : k !== "" ? presionarTecla(k) : null}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="logo">🔩 TALLER BLANCO</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>
              {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase()}
            </span>
            <button className="lock-btn" onClick={() => setAutenticado(false)} title="Bloquear">🔒</button>
          </div>
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

              {/* Pendientes de cobro */}
              {sinCobrar.length > 0 && (
                <div className="card" style={{ borderColor: "#d97706" }}>
                  <div className="card-title" style={{ color: "#f59e0b" }}>⏳ A cobrar ({sinCobrar.length})</div>
                  {sinCobrar.map((o: any) => {
                    const saldo = saldoPendiente(o);
                    const parcial = cobradoTotal(o) > 0 && saldo > 0;
                    return (
                      <div key={o.id} className="cobro-item">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                          <div style={{ fontSize: 11, color: "#92400e" }}>{o.folio} · {o.servicio}</div>
                          {parcial && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Pagado: {fmt(cobradoTotal(o))}</div>}
                          <div style={{ fontSize: 16, color: "#f97316", fontWeight: 900, marginTop: 4 }}>Saldo: {fmt(saldo)}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Todo</button>
                          <button className="btn btn-warning btn-sm" onClick={() => { setPagoOrdenId(o.id); setModal("pago"); }}>$ Parcial</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Órdenes activas */}
              <div className="card">
                <div className="card-title">Órdenes activas</div>
                {ordenes.filter(o => o.estado !== "completado").length === 0
                  ? <div className="empty">Sin órdenes activas</div>
                  : ordenes.filter(o => o.estado !== "completado").slice(0, 5).map((o: any) => (
                    <div key={o.id} className="orden-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{o.vehiculo} · {o.servicio}</div>
                          <span className="badge" style={{ background: estadoBg[o.estado] || "#1e293b", color: estadoColor[o.estado] || "#94a3b8" }}>{o.estado}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{fmt(o.costo)}</div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Stock bajo */}
              {stockBajo > 0 && (
                <div className="card" style={{ borderColor: "#f97316" }}>
                  <div className="card-title">⚠ Stock bajo</div>
                  {inventario.filter(i => i.cantidad <= i.minimo).map((i: any) => (
                    <div key={i.id} className="alert-item"><strong>{i.nombre}</strong> — {i.cantidad} {i.unidad} (mín. {i.minimo})</div>
                  ))}
                </div>
              )}

              {/* Cambiar PIN */}
              <div className="card" style={{ borderColor: "#1e293b" }}>
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
                  const saldo = saldoPendiente(o);
                  const pagadoParcial = cobradoTotal(o) > 0 && saldo > 0;
                  return (
                    <div key={o.id} className="card" style={{ borderLeft: `3px solid ${estadoColor[o.estado] || "#334155"}` }}>
                      <div className="row" style={{ marginBottom: 8 }}>
                        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13 }}>{o.folio}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="badge" style={{ background: estadoBg[o.estado] || "#1e293b", color: estadoColor[o.estado] || "#94a3b8" }}>{o.estado}</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }} onClick={() => abrirEditarOrden(o)}>✏</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{o.cliente}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{o.vehiculo}{o.placa ? ` · ${o.placa}` : ""}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{o.servicio}{o.mecanico ? ` · ${o.mecanico}` : ""}</div>

                      <div className="row" style={{ marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>TOTAL</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{fmt(o.costo)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>GANANCIA</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: ganancia >= 0 ? "#fb923c" : "#ef4444" }}>{fmt(ganancia)}</div>
                        </div>
                      </div>

                      {/* Pagos parciales */}
                      {(o.pagos || []).length > 0 && (
                        <div style={{ marginBottom: 10, background: "#0a0f1a", borderRadius: 6, padding: "8px 10px" }}>
                          {(o.pagos || []).map((p: any, idx: number) => (
                            <div key={idx} className="pago-row">
                              <span style={{ color: "#94a3b8" }}>Pago {idx + 1} · {p.fecha}</span>
                              <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(p.monto)}</span>
                            </div>
                          ))}
                          {pagadoParcial && (
                            <div className="pago-row" style={{ marginTop: 4 }}>
                              <span style={{ color: "#f59e0b", fontWeight: 700 }}>Saldo pendiente</span>
                              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(saldo)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select className="select-inline" style={{ flex: 1, minWidth: 120 }} value={o.estado} onChange={e => cambiarEstado(o.id, e.target.value)}>
                          <option value="pendiente">Pendiente</option>
                          <option value="en proceso">En proceso</option>
                          <option value="esperando repuesto">Esp. repuesto</option>
                          <option value="completado">Completado</option>
                        </select>
                        {o.estado === "completado" && saldo > 0 && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => marcarCobrado(o.id)}>✓ Todo</button>
                            <button className="btn btn-warning btn-sm" onClick={() => { setPagoOrdenId(o.id); setModal("pago"); }}>$ Parcial</button>
                          </>
                        )}
                        {saldo === 0 && (o.cobrado || (o.pagos || []).length > 0) && (
                          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✓ Cobrado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {ordenes.length === 0 && <div className="empty">No hay órdenes todavía</div>}
              <button className="btn-fab" onClick={() => { setEditId(null); setForm({ fecha: new Date().toISOString().slice(0, 10) }); setModal("orden"); }}>+</button>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
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
                  {c.cuit && <div style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>🪪 {c.cuit}</div>}

                  {(c.vehiculos || []).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Vehículos</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(c.vehiculos || []).map((v: string, idx: number) => (
                          <span key={idx} className="vehiculo-tag">{v}</span>
                        ))}
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

        {/* Nav inferior */}
        <div className="bottom-nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══ MODAL ORDEN (nueva / editar) ══ */}
        {modal === "orden" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">{editId ? "Editar Orden" : "Nueva Orden"}</div>
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
                <button className="btn btn-primary btn-full" onClick={guardarOrden}>{editId ? "Guardar cambios" : "Crear orden"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL PAGO PARCIAL ══ */}
        {modal === "pago" && pagoOrdenId && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">Registrar Pago Parcial</div>
              {(() => {
                const o = ordenes.find(x => x.id === pagoOrdenId);
                if (!o) return null;
                const saldo = saldoPendiente(o);
                return (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{o.cliente} · {o.folio}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Total orden:</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{fmt(o.costo)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Ya pagado:</span>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(cobradoTotal(o))}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginTop: 4 }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>Saldo:</span>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(saldo)}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monto del pago ($)</label>
                      <input className="form-input" type="number" inputMode="numeric"
                        placeholder={`Máx. ${fmt(saldo)}`}
                        value={pagoMonto}
                        onChange={e => setPagoMonto(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                      <button className="btn btn-success btn-full" onClick={() => registrarPago(pagoOrdenId)}>Registrar pago</button>
                    </div>
                  </>
                );
              })()}
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

        {/* ══ MODAL CLIENTE (nuevo / editar) ══ */}
        {modal === "cliente" && (
          <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal-box">
              <div className="modal-handle" />
              <div className="card-title">{editId ? "Editar Cliente" : "Nuevo Cliente"}</div>
              {inp("nombre", "Nombre")}
              {inp("telefono", "Teléfono")}
              {inp("email", "Email")}
              {inp("cuit", "CUIT / DNI")}
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
              <div className="form-group">
                <label className="form-label">Nuevo PIN (4 dígitos)</label>
                <input className="form-input" type="number" inputMode="numeric"
                  maxLength={4} placeholder="Ej: 1234"
                  value={form.nuevo_pin || ""}
                  onChange={e => setForm((p: any) => ({ ...p, nuevo_pin: e.target.value.slice(0, 4) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar PIN</label>
                <input className="form-input" type="number" inputMode="numeric"
                  maxLength={4} placeholder="Repetí el PIN"
                  value={form.confirm_pin || ""}
                  onChange={e => setForm((p: any) => ({ ...p, confirm_pin: e.target.value.slice(0, 4) }))} />
              </div>
              {form.nuevo_pin && form.confirm_pin && form.nuevo_pin !== form.confirm_pin && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Los PINs no coinciden</div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn-ghost btn-full" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary btn-full"
                  disabled={!form.nuevo_pin || form.nuevo_pin.length !== 4 || form.nuevo_pin !== form.confirm_pin}
                  onClick={async () => { await guardarNuevoPin(form.nuevo_pin); closeModal(); }}>
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
