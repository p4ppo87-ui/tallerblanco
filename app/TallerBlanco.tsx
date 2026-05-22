import { useState, useEffect } from "react";
// ─── ESTILOS GLOBALES ──────────────────────────────────────────────────────────
const G = {
 bg: "#F4F6F9",
 surface: "#FFFFFF",
 surfaceAlt: "#F8FAFC",
 border: "#E2E8F0",
 borderStrong: "#CBD5E1",
 text: "#0F172A",
 textSub: "#64748B",
 textMuted: "#94A3B8",
 accent: "#2563EB",
 accentLight: "#EFF6FF",
 accentHover: "#1D4ED8",
 green: "#16A34A",
 greenLight: "#F0FDF4",
 red: "#DC2626",
 redLight: "#FEF2F2",
 yellow: "#D97706",
 yellowLight: "#FFFBEB",
 purple: "#7C3AED",
 purpleLight: "#F5F3FF",
 orange: "#EA580C",
 orangeLight: "#FFF7ED",
 radius: "10px",
 radiusLg: "14px",
 shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
 shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
 shadowLg: "0 8px 30px rgba(0,0,0,0.10)",
};
// ─── DATOS INICIALES ──────────────────────────────────────────────────────────
const ESTADOS = [
 { id: "ingresado", label: "Ingresado", color: G.textMuted, bg: "#F1F5F9" },
 { id: "diagnostico", label: "En diagnóstico", color: G.yellow, bg: G.yellowLight },
 { id: "presupuestado", label: Presupuestado, color: G.purple, bg: G.purpleLight },
 { id: "aprobado", label: "Aprobado", color: G.accent, bg: G.accentLight },
 { id: "en_reparacion", label: "En reparación", color: G.orange, bg: G.orangeLight },
 { id: "listo", label: "Listo ✓", color: G.green, bg: G.greenLight },
 { id: "entregado", label: "Entregado", color: "#1E293B", bg: "#F1F5F9" },
];
const MECANICOS = ["Pablo", "Papá", "Hermano"];
const INIT_VEHICULOS = [
 { id: 1, patente: "ABC123", marca: "Chevrolet", modelo: "S10", año: 2018, km: 85000, client { id: 2, patente: "XYZ789", marca: "Volkswagen", modelo: "Amarok", año: 2020, km: 62000, cl { id: 3, patente: "GHI456", marca: "Toyota", modelo: "Hilux", año: 2019, km: 110000, client];
const INIT_CLIENTES = [
 { id: 1, nombre: "Juan García", telefono: "2936-421567", email: "juan@gmail.com" },
 { id: 2, nombre: "María López", telefono: "2936-312890", email: "maria@outlook.com" },
 { id: 3, nombre: "Carlos Pérez", telefono: "2936-567123", email: "carlos@gmail.com" },
];
const INIT_ORDENES = [
 { id: 1001, vehiculoId: 1, clienteId: 1, mecanico: "Papá", estado: "en_reparacion", descrip { id: 1002, vehiculoId: 2, clienteId: 2, mecanico: "Pablo", estado: "diagnostico", descripc { id: 1003, vehiculoId: 3, clienteId: 3, mecanico: "Hermano", estado: "listo", descripcionC];
const MARCAS = ["Chevrolet", "Volkswagen", "Toyota", "Ford", "Fiat", "Renault", "Peugeot", "Cconst MARCAS_EMOJI = { Chevrolet: " ", Volkswagen: " ", Toyota: " ", Ford: " ", Fiat: " // ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;
const getEstado = (id) => ESTADOS.find(e => e.id === id) || ESTADOS[0];
function calcOrden(o) {
 const repTotal = (o.repuestos || []).reduce((s, r) => s + r.precio * r.cantidad, 0);
 const costoRep = (o.repuestos || []).reduce((s, r) => s + (r.costo || 0) * r.cantidad, 0);
 const total = repTotal + (o.manoDeObra || 0);
 const ganancia = total - costoRep;
 const markup = costoRep > 0 ? Math.round(((total - costoRep) / costoRep) * 100) : 0;
 return { repTotal, costoRep, total, ganancia, markup };
}
// ─── COMPONENTES UI ───────────────────────────────────────────────────────────
function Badge({ estado }) {
 const e = getEstado(estado);
 return (
 <span style={{ background: e.bg, color: e.color, padding: "3px 10px", borderRadius: 20, f {e.label}
 </span>
 );
}
function Card({ children, style = {} }) {
 return (
 <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.rad {children}
 </div>
 );
}
function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = fa const base = {
 border: "none", borderRadius: G.radius, cursor: disabled ? "not-allowed" : "pointer",
 fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit",
 opacity: disabled ? 0.5 : 1,
 fontSize: size === "sm" ? 12 : size === "lg" ? 15 : 13,
 padding: size === "sm" ? "5px 12px" : size === "lg" ? "12px 24px" : "8px 16px",
 };
 const variants = {
 primary: { background: G.accent, color: "#fff" },
 ghost: { background: "transparent", color: G.textSub, border: `1px solid ${G.border}` },
 danger: { background: G.redLight, color: G.red, border: `1px solid #FECACA` },
 success: { background: G.greenLight, color: G.green, border: `1px solid #BBF7D0` },
 };
 return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[varia}
function Input({ label, value, onChange, placeholder, type = "text", style = {} }) {
 return (
 <div style={{ marginBottom: 14 }}>
 {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.tex <input
 type={type}
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 style={{ width: "100%", padding: "9px 12px", border: `1px solid ${G.border}`, borderR />
 </div>
 );
}
function Select({ label, value, onChange, options }) {
 return (
 <div style={{ marginBottom: 14 }}>
 {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.tex <select
 value={value}
 onChange={e => onChange(e.target.value)}
 style={{ width: "100%", padding: "9px 12px", border: `1px solid ${G.border}`, borderR >
 {options.map(o => (
 <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
 ))}
 </select>
 </div>
 );
}
function Modal({ title, onClose, children, width = 560 }) {
 return (
 <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "fl <div style={{ background: G.surface, borderRadius: G.radiusLg, width: "100%", maxWidth: <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: G.text }}>{title}</h2 <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20 </div>
 <div style={{ padding: 24 }}>{children}</div>
 </div>
 </div>
 );
}
function KpiCard({ label, value, sub, color = G.accent, icon }) {
 return (
 <Card style={{ padding: "18px 20px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start <div>
 <div style={{ fontSize: 12, color: G.textSub, fontWeight: 600, textTransform: "uppe <div style={{ fontSize: 24, fontWeight: 800, color: G.text, letterSpacing: -0.5 }}> {sub && <div style={{ fontSize: 12, color: G.textMuted, marginTop: 4 }}>{sub}</div> </div>
 <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "15", disp </div>
 </Card>
 );
}
// ─── PIPELINE DE ESTADOS ─────────────────────────────────────────────────────
function Pipeline({ estado, onChange }) {
 return (
 <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
 {ESTADOS.map((e, i) => {
 const activo = e.id === estado;
 const pasado = ESTADOS.findIndex(x => x.id === estado) > i;
 return (
 <button
 key={e.id}
 onClick={() => onChange(e.id)}
 style={{
 padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: " cursor: "pointer", transition: "all 0.15s",
 background: activo ? e.color : pasado ? e.bg : G.border,
 color: activo ? "#fff" : pasado ? e.color : G.textMuted,
 }}
 >
 {e.label}
 </button>
 );
 })}
 </div>
 );
}
// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
 { id: "inicio", icon: "⊞", label: "Inicio" },
 { id: "ordenes", icon: " ", label: "Órdenes" },
 { id: "vehiculos", icon: " ", label: "Vehículos" },
 { id: "clientes", icon: " ", label: "Clientes" },
 { id: "finanzas", icon: " ", label: "Finanzas" },
 { id: "inventario", icon: " ", label: "Inventario" },
];
function Sidebar({ tab, setTab }) {
 return (
 <div style={{
 width: 220, background: "#0F172A", display: "flex", flexDirection: "column",
 height: "100vh", position: "sticky", top: 0, flexShrink: 0,
 }}>
 {/* Logo */}
 <div style={{ padding: "24px 20px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <div style={{ width: 34, height: 34, background: G.accent, borderRadius: 9, display <div>
 <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", letterSpacing: -0. <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500 }}>Sistema de gesti </div>
 </div>
 </div>
 {/* Nav */}
 <nav style={{ flex: 1, padding: "8px 12px" }}>
 {NAV.map(n => (
 <button
 key={n.id}
 onClick={() => setTab(n.id)}
 style={{
 display: "flex", alignItems: "center", gap: 10, width: "100%",
 padding: "9px 12px", borderRadius: G.radius, border: "none",
 background: tab === n.id ? "#1E293B" : "transparent",
 color: tab === n.id ? "#F8FAFC" : "#64748B",
 cursor: "pointer", fontSize: 13, fontWeight: tab === n.id ? 600 : 400,
 textAlign: "left", transition: "all 0.15s", marginBottom: 2,
 borderLeft: tab === n.id ? `3px solid ${G.accent}` : "3px solid transparent",
 }}
 >
 <span style={{ fontSize: 16 }}>{n.icon}</span>
 {n.label}
 </button>
 ))}
 </nav>
 {/* Footer */}
 <div style={{ padding: "16px 20px", borderTop: "1px solid #1E293B" }}>
 <div style={{ fontSize: 11, color: "#334155", fontWeight: 500 }}>TallerPro v2.0</div>
 <div style={{ fontSize: 10, color: "#1E293B", marginTop: 2 }}>Carhué, Bs As</div>
 </div>
 </div>
 );
}
// ─── TAB: INICIO ─────────────────────────────────────────────────────────────
function TabInicio({ ordenes, vehiculos, clientes, setTab }) {
 const activas = ordenes.filter(o => !["entregado"].includes(o.estado));
 const listas = ordenes.filter(o => o.estado === "listo");
 const hoyInicio = new Date();
 const mesActual = hoyInicio.getMonth();
 const añoActual = hoyInicio.getFullYear();
 const ordenesDelMes = ordenes.filter(o => {
 const d = new Date(o.fecha);
 return d.getMonth() === mesActual && d.getFullYear() === añoActual;
 });
 const ingresosMes = ordenesDelMes.reduce((s, o) => s + calcOrden(o).total, 0);
 const gananciasMes = ordenesDelMes.reduce((s, o) => s + calcOrden(o).ganancia, 0);
 return (
 <div>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: G.text }}>Bueno <p style={{ margin: 0, color: G.textSub, fontSize: 14 }}>Resumen del taller — {new Da </div>
 {/* KPIs */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBo <KpiCard label="Órdenes activas" value={activas.length} sub={`${listas.length} listas <KpiCard label="Ingresos del mes" value={fmt(ingresosMes)} sub={`${ordenesDelMes.leng <KpiCard label="Ganancia del mes" value={fmt(gananciasMes)} sub="Después de repuestos <KpiCard label="Clientes registrados" value={clientes.length} sub={`${vehiculos.lengt </div>
 {/* Listas para entregar */}
 {listas.length > 0 && (
 <Card style={{ marginBottom: 20, borderLeft: `4px solid ${G.green}` }}>
 <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.border}`, display: <div style={{ fontWeight: 700, color: G.text, fontSize: 14 }}> Listos para entr <Btn variant="ghost" size="sm" onClick={() => setTab("ordenes")}>Ver todas</Btn>
 </div>
 {listas.map(o => {
 const v = vehiculos.find(x => x.id === o.vehiculoId);
 const c = clientes.find(x => x.id === o.clienteId);
 return (
 <div key={o.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${G.bor <div>
 <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>#{o.id} — {v? <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>{c?.nombre} · </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 <div style={{ fontWeight: 700, color: G.green, fontSize: 15 }}>{fmt(calcOrd <a href={`https://wa.me/54${c?.telefono?.replace(/\D/g, "")}?text=Hola%20${ <Btn variant="success" size="sm"> WhatsApp</Btn>
 </a>
 </div>
 </div>
 );
 })}
 </Card>
 )}
 {/* Órdenes recientes */}
 <Card>
 <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.border}`, display: " <div style={{ fontWeight: 700, color: G.text, fontSize: 14 }}>Órdenes en curso</div <Btn variant="ghost" size="sm" onClick={() => setTab("ordenes")}>Ver todas →</Btn>
 </div>
 {activas.slice(0, 5).map(o => {
 const v = vehiculos.find(x => x.id === o.vehiculoId);
 const c = clientes.find(x => x.id === o.clienteId);
 return (
 <div key={o.id} style={{ padding: "13px 18px", borderBottom: `1px solid ${G.borde <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
 <div style={{ width: 36, height: 36, background: G.accentLight, borderRadius: {MARCAS_EMOJI[v?.marca] || " "}
 </div>
 <div>
 <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>#{o.id} {v?.m <div style={{ fontSize: 12, color: G.textSub }}>{c?.nombre} · {o.mecanico}< </div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
 <Badge estado={o.estado} />
 <div style={{ fontWeight: 700, fontSize: 14, color: G.text, minWidth: 80, tex </div>
 </div>
 );
 })}
 {activas.length === 0 && <div style={{ padding: 32, textAlign: "center", color: G.tex </Card>
 </div>
 );
}
// ─── TAB: ÓRDENES ────────────────────────────────────────────────────────────
function TabOrdenes({ ordenes, setOrdenes, vehiculos, clientes }) {
 const [filtroEstado, setFiltroEstado] = useState("todos");
 const [busqueda, setBusqueda] = useState("");
 const [modalNueva, setModalNueva] = useState(false);
 const [ordenDetalle, setOrdenDetalle] = useState(null);
 const ordenFiltradas = ordenes.filter(o => {
 const v = vehiculos.find(x => x.id === o.vehiculoId);
 const c = clientes.find(x => x.id === o.clienteId);
 const matchBusqueda = !busqueda || [v?.patente, v?.marca, v?.modelo, c?.nombre, String(o. const matchEstado = filtroEstado === "todos" || o.estado === filtroEstado;
 return matchBusqueda && matchEstado;
 });
 return (
 <div>
 {/* Header */}
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m <div>
 <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: G.text }}>Órd <p style={{ margin: 0, fontSize: 13, color: G.textSub }}>{ordenes.length} órdenes e </div>
 <Btn onClick={() => setModalNueva(true)} size="lg">+ Nueva orden</Btn>
 </div>
 {/* Filtros */}
 <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <input
 placeholder=" Buscar por patente, cliente, marca..."
 value={busqueda}
 onChange={e => setBusqueda(e.target.value)}
 style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: `1px solid ${G.bord />
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
 {[{ id: "todos", label: "Todos" }, ...ESTADOS].map(e => (
 <button
 key={e.id}
 onClick={() => setFiltroEstado(e.id)}
 style={{
 padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", f background: filtroEstado === e.id ? G.accent : G.border,
 color: filtroEstado === e.id ? "#fff" : G.textSub,
 }}
 >
 {e.label}
 </button>
 ))}
 </div>
 </div>
 </Card>
 {/* Lista */}
 <Card>
 {ordenFiltradas.map((o, idx) => {
 const v = vehiculos.find(x => x.id === o.vehiculoId);
 const c = clientes.find(x => x.id === o.clienteId);
 const { total, ganancia } = calcOrden(o);
 return (
 <div
 key={o.id}
 onClick={() => setOrdenDetalle(o)}
 style={{
 padding: "14px 20px", borderBottom: idx < ordenFiltradas.length - 1 ? `1px so display: "flex", justifyContent: "space-between", alignItems: "center",
 cursor: "pointer", transition: "background 0.1s",
 }}
 onMouseEnter={e => e.currentTarget.style.background = G.surfaceAlt}
 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
 >
 <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
 <div style={{ width: 42, height: 42, background: G.accentLight, borderRadius: {MARCAS_EMOJI[v?.marca] || " "}
 </div>
 <div>
 <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom:  <span style={{ fontWeight: 700, fontSize: 14, color: G.text }}>#{o.id}</s <span style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{v?.marca} <span style={{ fontSize: 12, color: G.textMuted, background: G.surfaceAlt </div>
 <div style={{ fontSize: 12, color: G.textSub }}>
 {c?.nombre} · <span style={{ color: G.textMuted }}>Mecánico: {o.mecanico} </div>
 {o.descripcionCliente && <div style={{ fontSize: 12, color: G.textMuted, ma </div>
 </div>
 <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
 <Badge estado={o.estado} />
 <div style={{ textAlign: "right" }}>
 <div style={{ fontWeight: 800, fontSize: 15, color: G.text }}>{fmt(total)}< <div style={{ fontSize: 11, color: G.green, fontWeight: 600 }}>+{fmt(gananc </div>
 </div>
 </div>
 );
 })}
 {ordenFiltradas.length === 0 && (
 <div style={{ padding: 48, textAlign: "center", color: G.textMuted }}>
 <div style={{ fontSize: 32, marginBottom: 8 }}> </div>
 <div style={{ fontWeight: 600 }}>No hay órdenes</div>
 </div>
 )}
 </Card>
 {modalNueva && <ModalNuevaOrden onClose={() => setModalNueva(false)} onGuardar={o => {  {ordenDetalle && <ModalDetalleOrden orden={ordenDetalle} onClose={() => setOrdenDetalle </div>
 );
}
// ─── MODAL: NUEVA ORDEN ──────────────────────────────────────────────────────
function ModalNuevaOrden({ onClose, onGuardar, vehiculos, clientes, ordenes }) {
 const [vehiculoId, setVehiculoId] = useState("");
 const [mecanico, setMecanico] = useState(MECANICOS[0]);
 const [descripcion, setDescripcion] = useState("");
 const [fechaEstimada, setFechaEstimada] = useState("");
 const vOpts = [{ value: "", label: "— Seleccionar vehículo —" }, ...vehiculos.map(v => {
 const c = clientes.find(x => x.id === v.clienteId);
 return { value: v.id, label: `${v.marca} ${v.modelo} (${v.patente}) — ${c?.nombre}` };
 })];
 const guardar = () => {
 if (!vehiculoId) return;
 const v = vehiculos.find(x => x.id === Number(vehiculoId));
 const nuevaOrden = {
 id: Math.max(...ordenes.map(o => o.id), 1000) + 1,
 vehiculoId: Number(vehiculoId),
 clienteId: v.clienteId,
 mecanico,
 estado: "ingresado",
 descripcionCliente: descripcion,
 diagnostico: "",
 repuestos: [],
 manoDeObra: 0,
 fecha: new Date().toISOString().split("T")[0],
 fechaEstimada,
 pagado: false,
 notas: "",
 };
 onGuardar(nuevaOrden);
 };
 return (
 <Modal title="Nueva orden de trabajo" onClose={onClose}>
 <Select label="Vehículo" value={vehiculoId} onChange={setVehiculoId} options={vOpts} />
 <Select label="Mecánico asignado" value={mecanico} onChange={setMecanico} options={MECA <Input label="Problema que reporta el cliente" value={descripcion} onChange={setDescrip <Input label="Fecha estimada de entrega" value={fechaEstimada} onChange={setFechaEstima <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
 <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
 <Btn onClick={guardar} disabled={!vehiculoId}>Crear orden</Btn>
 </div>
 </Modal>
 );
}
// ─── MODAL: DETALLE ORDEN ────────────────────────────────────────────────────
function ModalDetalleOrden({ orden, onClose, vehiculos, clientes, onActualizar }) {
 const [o, setO] = useState({ ...orden });
 const v = vehiculos.find(x => x.id === o.vehiculoId);
 const c = clientes.find(x => x.id === o.clienteId);
 const { repTotal, total, ganancia, markup } = calcOrden(o);
 const [nuevoRep, setNuevoRep] = useState({ nombre: "", precio: "", costo: "", cantidad: 1 } const agregarRep = () => {
 if (!nuevoRep.nombre || !nuevoRep.precio) return;
 setO(prev => ({ ...prev, repuestos: [...prev.repuestos, { ...nuevoRep, precio: Number(nue setNuevoRep({ nombre: "", precio: "", costo: "", cantidad: 1 });
 };
 const guardar = () => onActualizar(o);
 return (
 <Modal title={`Orden #${o.id}`} onClose={onClose} width={700}>
 {/* Vehículo y cliente */}
 <div style={{ background: G.accentLight, border: `1px solid ${G.accent}30`, borderRadiu <div style={{ fontSize: 32 }}>{MARCAS_EMOJI[v?.marca] || " "}</div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, fontSize: 16, color: G.text }}>{v?.marca} {v?.modelo <div style={{ fontSize: 13, color: G.textSub }}>Patente: <b>{v?.patente}</b> · {v?. <div style={{ fontSize: 13, color: G.textSub, marginTop: 2 }}>Cliente: <b>{c?.nombr </div>
 <a
 href={`https://wa.me/54${c?.telefono?.replace(/\D/g, "")}?text=Hola%20${c?.nombre?. target="_blank" rel="noreferrer"
 style={{ textDecoration: "none" }}
 >
 <Btn variant="success" size="sm"> Avisar por WhatsApp</Btn>
 </a>
 </div>
 {/* Pipeline de estado */}
 <div style={{ marginBottom: 18 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: G.textSub, textTransform: "upperc <Pipeline estado={o.estado} onChange={estado => setO(prev => ({ ...prev, estado }))}  </div>
 {/* Descripción y diagnóstico */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 1 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <textarea
 value={o.descripcionCliente}
 onChange={e => setO(prev => ({ ...prev, descripcionCliente: e.target.value }))}
 rows={3}
 style={{ width: "100%", padding: "8px 12px", border: `1px solid ${G.border}`, bor />
 </div>
 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,
 <textarea
 value={o.diagnostico}
 onChange={e => setO(prev => ({ ...prev, diagnostico: e.target.value }))}
 rows={3}
 placeholder="Lo que encontró el mecánico..."
 style={{ width: "100%", padding: "8px 12px", border: `1px solid ${G.border}`, bor />
 </div>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBotto <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <select value={o.mecanico} onChange={e => setO(prev => ({ ...prev, mecanico: e.targ {MECANICOS.map(m => <option key={m}>{m}</option>)}
 </select>
 </div>
 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <input type="date" value={o.fecha} onChange={e => setO(prev => ({ ...prev, fecha: e </div>
 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <input type="date" value={o.fechaEstimada} onChange={e => setO(prev => ({ ...prev,  </div>
 </div>
 {/* Repuestos */}
 <div style={{ marginBottom: 16 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: G.textSub, textTransform: "upperc {o.repuestos.map((r, i) => (
 <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom:  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{r.nombre}</div>
 <div style={{ fontSize: 12, color: G.textSub }}>x{r.cantidad}</div>
 <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(r.precio * r.cantidad)}</div>
 <button onClick={() => setO(prev => ({ ...prev, repuestos: prev.repuestos.filter( </div>
 ))}
 <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr auto", gap: 6, <input placeholder="Nombre del repuesto" value={nuevoRep.nombre} onChange={e => set <input placeholder="Precio venta" type="number" value={nuevoRep.precio} onChange={e <input placeholder="Costo compra" type="number" value={nuevoRep.costo} onChange={e  <input type="number" value={nuevoRep.cantidad} onChange={e => setNuevoRep(p => ({ . <Btn onClick={agregarRep} size="sm">+</Btn>
 </div>
 </div>
 {/* Mano de obra */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 1 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <input type="number" value={o.manoDeObra} onChange={e => setO(prev => ({ ...prev, m </div>
 <div>
 <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSub,  <input value={o.notas} onChange={e => setO(prev => ({ ...prev, notas: e.target.valu </div>
 </div>
 {/* Totales */}
 <div style={{ background: G.surfaceAlt, borderRadius: G.radius, padding: "14px 16px", m <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
 <div><div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform <div><div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform <div><div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform <div><div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform </div>
 </div>
 <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 <label style={{ fontSize: 13, fontWeight: 600, color: G.textSub, display: "flex", g <input type="checkbox" checked={o.pagado} onChange={e => setO(prev => ({ ...prev, Pagado
 </label>
 </div>
 <div style={{ display: "flex", gap: 10 }}>
 <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
 <Btn onClick={guardar}>Guardar cambios</Btn>
 </div>
 </div>
 </Modal>
 );
}
// ─── TAB: VEHÍCULOS ───────────────────────────────────────────────────────────
function TabVehiculos({ vehiculos, setVehiculos, clientes, ordenes }) {
 const [modal, setModal] = useState(false);
 const [detalle, setDetalle] = useState(null);
 const [busqueda, setBusqueda] = useState("");
 const filtrados = vehiculos.filter(v => {
 const c = clientes.find(x => x.id === v.clienteId);
 return !busqueda || [v.patente, v.marca, v.modelo, c?.nombre].some(s => s?.toLowerCase().
 });
 return (
 <div>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m <div>
 <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: G.text }}>Veh <p style={{ margin: 0, fontSize: 13, color: G.textSub }}>{vehiculos.length} registr </div>
 <Btn onClick={() => setModal(true)} size="lg">+ Nuevo vehículo</Btn>
 </div>
 <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
 <input placeholder=" Buscar por patente, marca, cliente..." value={busqueda} onCha </Card>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1f {filtrados.map(v => {
 const c = clientes.find(x => x.id === v.clienteId);
 const ordsV = ordenes.filter(o => o.vehiculoId === v.id);
 const ultimaOrden = ordsV.sort((a, b) => b.id - a.id)[0];
 return (
 <Card
 key={v.id}
 style={{ padding: 18, cursor: "pointer", transition: "box-shadow 0.15s" }}
 onClick={() => setDetalle(v)}
 >
 <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14  <div style={{ width: 48, height: 48, background: G.accentLight, borderRadius: {MARCAS_EMOJI[v.marca] || " "}
 </div>
 <div>
 <div style={{ fontWeight: 700, fontSize: 15, color: G.text }}>{v.marca} {v. <div style={{ fontSize: 13, color: G.textSub }}>{v.año} · {v.color}</div>
 </div>
 </div>
 <div style={{ background: G.surfaceAlt, borderRadius: 8, padding: "8px 12px", m <div style={{ fontSize: 18, fontWeight: 800, color: G.text, letterSpacing: 2  <div style={{ fontSize: 12, color: G.textMuted }}>{v.km?.toLocaleString("es-A </div>
 <div style={{ fontSize: 13, color: G.textSub, marginBottom: 8 }}> {c?.nombre} <div style={{ display: "flex", justifyContent: "space-between", alignItems: "ce <div style={{ fontSize: 12, color: G.textMuted }}>{ordsV.length} {ordsV.lengt {ultimaOrden && <Badge estado={ultimaOrden.estado} />}
 </div>
 </Card>
 );
 })}
 </div>
 {filtrados.length === 0 && (
 <Card style={{ padding: 48, textAlign: "center" }}>
 <div style={{ fontSize: 40, marginBottom: 12 }}> </div>
 <div style={{ fontWeight: 600, color: G.text, marginBottom: 6 }}>No hay vehículos</ <div style={{ color: G.textSub, fontSize: 13, marginBottom: 16 }}>Registrá el prime <Btn onClick={() => setModal(true)}>+ Nuevo vehículo</Btn>
 </Card>
 )}
 {modal && <ModalNuevoVehiculo onClose={() => setModal(false)} onGuardar={v => { setVehi {detalle && <ModalDetalleVehiculo vehiculo={detalle} onClose={() => setDetalle(null)} c </div>
 );
}
function ModalNuevoVehiculo({ onClose, onGuardar, clientes, vehiculos }) {
 const [form, setForm] = useState({ patente: "", marca: "Toyota", modelo: "", año: new Date( const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
 return (
 <Modal title="Nuevo vehículo" onClose={onClose}>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
 <Input label="Patente" value={form.patente} onChange={v => upd("patente", v.toUpperCa <Select label="Cliente" value={form.clienteId} onChange={v => upd("clienteId", Number <Select label="Marca" value={form.marca} onChange={v => upd("marca", v)} options={MAR <Input label="Modelo" value={form.modelo} onChange={v => upd("modelo", v)} placeholde <Input label="Año" type="number" value={form.año} onChange={v => upd("año", Number(v) <Input label="Kilometraje" type="number" value={form.km} onChange={v => upd("km", Num </div>
 <Input label="Color" value={form.color} onChange={v => upd("color", v)} placeholder="Bl <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
 <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
 <Btn onClick={() => { onGuardar({ ...form, id: Math.max(...vehiculos.map(v => v.id),  </div>
 </Modal>
 );
}
function ModalDetalleVehiculo({ vehiculo: v, onClose, clientes, ordenes }) {
 const c = clientes.find(x => x.id === v.clienteId);
 return (
 <Modal title={`${v.marca} ${v.modelo} — ${v.patente}`} onClose={onClose} width={620}>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 2 <div style={{ background: G.accentLight, borderRadius: G.radius, padding: "16px", dis
 <div style={{ fontSize: 42 }}>{MARCAS_EMOJI[v.marca] || " "}</div>
 <div>
 <div style={{ fontWeight: 800, fontSize: 17, color: G.text }}>{v.marca} {v.modelo <div style={{ fontSize: 13, color: G.textSub }}>{v.año} · {v.color}</div>
 <div style={{ fontWeight: 700, fontSize: 20, color: G.accent, letterSpacing: 2, m </div>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
 <div style={{ background: G.surfaceAlt, borderRadius: G.radius, padding: 12 }}>
 <div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform: " <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{v.km?.toLocaleStri </div>
 <div style={{ background: G.surfaceAlt, borderRadius: G.radius, padding: 12 }}>
 <div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform: " <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{ordenes.length}</d </div>
 <div style={{ background: G.surfaceAlt, borderRadius: G.radius, padding: 12, gridCo <div style={{ fontSize: 11, color: G.textMuted, fontWeight: 600, textTransform: " <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{c?.nombre}</div>
 <div style={{ fontSize: 12, color: G.textSub }}>{c?.telefono}</div>
 </div>
 </div>
 </div>
 <div style={{ fontWeight: 700, fontSize: 14, color: G.text, marginBottom: 10 }}>Histori {ordenes.length === 0 ? (
 <div style={{ textAlign: "center", padding: 24, color: G.textMuted, fontSize: 13 }}>S ) : ordenes.sort((a, b) => b.id - a.id).map(o => (
 <div key={o.id} style={{ background: G.surfaceAlt, borderRadius: G.radius, padding: " <div>
 <div style={{ fontWeight: 600, fontSize: 13 }}>#{o.id} — {new Date(o.fecha).toLoc <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>{o.descripcionClien </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
 <Badge estado={o.estado} />
 <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(calcOrden(o).total)}</div>
 </div>
 </div>
 ))}
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
 <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
 </div>
 </Modal>
 );
}
// ─── TAB: CLIENTES ────────────────────────────────────────────────────────────
function TabClientes({ clientes, setClientes, vehiculos, ordenes }) {
 const [modal, setModal] = useState(false);
 const [busqueda, setBusqueda] = useState("");
 const filtrados = clientes.filter(c => !busqueda || [c.nombre, c.telefono, c.email].some(s  return (
 <div>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m <div>
 <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: G.text }}>Cli <p style={{ margin: 0, fontSize: 13, color: G.textSub }}>{clientes.length} registra </div>
 <Btn onClick={() => setModal(true)} size="lg">+ Nuevo cliente</Btn>
 </div>
 <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
 <input placeholder=" Buscar por nombre, teléfono..." value={busqueda} onChange={e  </Card>
 <Card>
 {filtrados.map((c, idx) => {
 const vsC = vehiculos.filter(v => v.clienteId === c.id);
 const ordsC = ordenes.filter(o => o.clienteId === c.id);
 const totalFacturado = ordsC.reduce((s, o) => s + calcOrden(o).total, 0);
 return (
 <div key={c.id} style={{ padding: "14px 20px", borderBottom: idx < filtrados.leng <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
 <div style={{ width: 42, height: 42, background: G.purpleLight, borderRadius: {c.nombre.charAt(0)}
 </div>
 <div>
 <div style={{ fontWeight: 700, fontSize: 14, color: G.text }}>{c.nombre}</d <div style={{ fontSize: 12, color: G.textSub }}> {c.telefono} {c.email && <div style={{ fontSize: 12, color: G.textMuted, marginTop: 2 }}>{vsC.length </div>
 </div>
 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
 <div style={{ textAlign: "right" }}>
 <div style={{ fontSize: 12, color: G.textMuted }}>Total facturado</div>
 <div style={{ fontWeight: 700, fontSize: 15, color: G.text }}>{fmt(totalFac </div>
 <a href={`https://wa.me/54${c.telefono?.replace(/\D/g, "")}`} target="_blank" <Btn variant="ghost" size="sm"> </Btn>
 </a>
 </div>
 </div>
 );
 })}
 </Card>
 {modal && (
 <Modal title="Nuevo cliente" onClose={() => setModal(false)}>
 <NuevoClienteForm onGuardar={(c) => { setClientes(p => [...p, { ...c, id: Math.max( </Modal>
 )}
 </div>
 );
}
function NuevoClienteForm({ onGuardar, onClose }) {
 const [form, setForm] = useState({ nombre: "", telefono: "", email: "" });
 return (
 <div>
 <Input label="Nombre completo" value={form.nombre} onChange={v => setForm(p => ({ ...p, <Input label="Teléfono" value={form.telefono} onChange={v => setForm(p => ({ ...p, tele <Input label="Email (opcional)" value={form.email} onChange={v => setForm(p => ({ ...p, <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
 <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
 <Btn onClick={() => onGuardar(form)} disabled={!form.nombre || !form.telefono}>Guarda </div>
 </div>
 );
}
// ─── TAB: FINANZAS ────────────────────────────────────────────────────────────
function TabFinanzas({ ordenes }) {
 const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", const hoy = new Date();
 const dataMeses = Array.from({ length: 6 }, (_, i) => {
 const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i);
 const ords = ordenes.filter(o => {
 const d = new Date(o.fecha);
 return d.getMonth() === fecha.getMonth() && d.getFullYear() === fecha.getFullYear();
 });
 const ingresos = ords.reduce((s, o) => s + calcOrden(o).total, 0);
 const costos = ords.reduce((s, o) => s + calcOrden(o).costoRep, 0);
 const ganancias = ords.reduce((s, o) => s + calcOrden(o).ganancia, 0);
 return { mes: meses[fecha.getMonth()], ingresos, costos, ganancias, cantidad: ords.length });
 const maxVal = Math.max(...dataMeses.map(d => d.ingresos), 1);
 const mesActual = dataMeses[dataMeses.length - 1];
 return (
 <div>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: G.text }}>Finan
 <p style={{ margin: 0, fontSize: 13, color: G.textSub }}>Últimos 6 meses</p>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBo <KpiCard label={`Ingresos ${meses[hoy.getMonth()]}`} value={fmt(mesActual.ingresos)}  <KpiCard label={`Ganancia ${meses[hoy.getMonth()]}`} value={fmt(mesActual.ganancias)} <KpiCard label="Markup promedio" value={`${mesActual.ingresos > 0 ? Math.round((mesAc </div>
 {/* Gráfico de barras */}
 <Card style={{ padding: 24, marginBottom: 20 }}>
 <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>Ingres <div style={{ fontSize: 12, color: G.textSub, marginBottom: 20 }}>Comparativo mensual <div style={{ display: "flex", gap: 16, alignItems: "flex-end", height: 160 }}>
 {dataMeses.map((d, i) => (
 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4,  <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", h <div style={{ flex: 1, background: G.accentLight, borderRadius: "4px 4px 0 0" <div style={{ position: "absolute", bottom: 0, width: "100%", background: G </div>
 <div style={{ flex: 1, background: G.greenLight, borderRadius: "4px 4px 0 0", <div style={{ position: "absolute", bottom: 0, width: "100%", background: G </div>
 </div>
 <div style={{ fontSize: 12, fontWeight: 600, color: i === dataMeses.length - 1  </div>
 ))}
 </div>
 <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
 <div style={{ display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: <div style={{ display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: </div>
 </Card>
 {/* Tabla */}
 <Card>
 <div style={{ padding: "14px 20px", borderBottom: `1px solid ${G.border}`, fontWeight <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: " <div>Mes</div><div>Órdenes</div><div>Ingresos</div><div>Costo rep.</div><div>Gananc </div>
 {dataMeses.slice().reverse().map((d, i) => (
 <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",  <div style={{ fontWeight: 600, color: i === 0 ? G.accent : G.text }}>{d.mes} {i = <div style={{ color: G.textSub }}>{d.cantidad}</div>
 <div style={{ fontWeight: 600 }}>{fmt(d.ingresos)}</div>
 <div style={{ color: G.red }}>{fmt(d.costos)}</div>
 <div style={{ fontWeight: 700, color: G.green }}>{fmt(d.ganancias)}</div>
 </div>
 ))}
 </Card>
 </div>
 );
}
// ─── TAB: INVENTARIO ─────────────────────────────────────────────────────────
function TabInventario() {
 const [items, setItems] = useState([
 { id: 1, nombre: "Aceite 5W40 (1L)", stock: 12, stockMin: 5, precio: 1840, costo: 1200, p { id: 2, nombre: "Filtro de aceite", stock: 3, stockMin: 5, precio: 2800, costo: 1800, pr { id: 3, nombre: "Filtro de aire", stock: 2, stockMin: 3, precio: 3100, costo: 2000, prov { id: 4, nombre: "Pastillas de freno", stock: 6, stockMin: 2, precio: 8500, costo: 5500,  { id: 5, nombre: "Correa dentada", stock: 1, stockMin: 2, precio: 15200, costo: 9800, pro { id: 6, nombre: "Bujías NGK (x4)", stock: 8, stockMin: 4, precio: 7200, costo: 4500, pro ]);
 const bajosDeStock = items.filter(i => i.stock <= i.stockMin);
 return (
 <div>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m <div>
 <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: G.text }}>Inv <p style={{ margin: 0, fontSize: 13, color: G.textSub }}>{items.length} productos r </div>
 </div>
 {bajosDeStock.length > 0 && (
 <div style={{ background: G.yellowLight, border: `1px solid #FDE68A`, borderRadius: G <span style={{ fontSize: 18 }}> </span>
 <div>
 <div style={{ fontWeight: 700, fontSize: 13, color: G.yellow }}>Stock bajo en {ba <div style={{ fontSize: 12, color: "#92400E" }}>{bajosDeStock.map(i => i.nombre). </div>
 </div>
 )}
 <Card>
 <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", paddin <div>Producto</div><div>Stock</div><div>Mín.</div><div>P. venta</div><div>P. costo< </div>
 {items.map((item, i) => {
 const bajo = item.stock <= item.stockMin;
 const markup = item.costo > 0 ? Math.round(((item.precio - item.costo) / item.costo return (
 <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1f <div>
 <div style={{ fontWeight: 600, fontSize: 13, color: G.text }}>{item.nombre}</ <div style={{ fontSize: 11, color: G.textMuted }}>{item.proveedor}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
 <span style={{ fontWeight: 700, fontSize: 15, color: bajo ? G.red : G.text }} {bajo && <span style={{ fontSize: 10, background: G.redLight, color: G.red, p </div>
 <div style={{ color: G.textSub, fontSize: 13 }}>{item.stockMin}</div>
 <div style={{ fontWeight: 600, fontSize: 13 }}>{fmt(item.precio)}</div>
 <div style={{ color: G.textSub, fontSize: 13 }}>{fmt(item.costo)}</div>
 <div style={{ fontWeight: 700, color: G.green, fontSize: 13 }}>{markup}%</div>
 </div>
 );
 })}
 </Card>
 </div>
 );
}
// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function TallerPro() {
 const [tab, setTab] = useState("inicio");
 const [ordenes, setOrdenes] = useState(INIT_ORDENES);
 const [vehiculos, setVehiculos] = useState(INIT_VEHICULOS);
 const [clientes, setClientes] = useState(INIT_CLIENTES);
 return (
 <div style={{ display: "flex", minHeight: "100vh", background: G.bg, fontFamily: "'DM San <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&d <Sidebar tab={tab} setTab={setTab} />
 <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto", maxWidth: 1000 }}>
 {tab === "inicio" && <TabInicio ordenes={ordenes} vehiculos={vehiculos} clientes={cli {tab === "ordenes" && <TabOrdenes ordenes={ordenes} setOrdenes={setOrdenes} vehiculos {tab === "vehiculos" && <TabVehiculos vehiculos={vehiculos} setVehiculos={setVehiculo {tab === "clientes" && <TabClientes clientes={clientes} setClientes={setClientes} veh {tab === "finanzas" && <TabFinanzas ordenes={ordenes} />}
 {tab === "inventario" && <TabInventario />}
 </main>
 </div>
 );
}
