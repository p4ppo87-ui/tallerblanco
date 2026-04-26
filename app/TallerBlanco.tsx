"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://seygknzlruftfezcjpim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWdrbnpscnVmdGZlemNqcGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjY3MDQsImV4cCI6MjA5MTAwMjcwNH0.vODo6mIsy2QY2f1Mh5GstMJfQ3U5YmPBxDmmzozorWQ"
);

const fmt = (n: any) => "$" + Number(n || 0).toLocaleString("es-AR");
const today = () => new Date().toISOString().slice(0, 10);
const mesActual = () => new Date().toISOString().slice(0, 7);
const ESTADOS = ["pendiente", "en proceso", "esperando repuesto", "completado"];
const ESTADO_COLOR: Record<string, any> = {
  completado: { bg: "#052e16", text: "#4ade80", border: "#166534" },
  "en proceso": { bg: "#431407", text: "#fb923c", border: "#9a3412" },
  pendiente: { bg: "#1e1b4b", text: "#a5b4fc", border: "#3730a3" },
  "esperando repuesto": { bg: "#422006", text: "#fbbf24", border: "#92400e" },
};
const TOPE_H = 70113407;

const CSS = `...`; // ← Mantengo tu CSS igual (es muy largo, no lo modifico)

export default function TallerApp() {
  const [tab, setTab] = useState("Inicio");
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState("");
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [ordenesView, setOrdenesView] = useState("rapido");
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

    // ====================== CÁLCULOS CORREGIDOS DE FINANZAS ======================
  const mes = mesActual();
  const ordenesMes = ordenes.filter(o => (o.fecha || "").startsWith(mes));

  // Solo órdenes completadas Y cobradas este mes
  const ordenesCompletadasCobradas = ordenesMes.filter(o => 
    o.estado === "completado" && o.cobrado === true
  );

  const ingresosCobradonMes = ordenesCompletadasCobradas.reduce((sum, o) => {
    return sum + (+o.costo || 0);
  }, 0);

  const costoRepuestosMes = ordenesCompletadasCobradas.reduce((sum, o) => {
    const items = o.items || [];
    return sum + items.reduce((s: number, i: any) => 
      s + ((+i.costo_compra || +i.costoCompra || 0) * (+i.cantidad || 0)), 0
    );
  }, 0);

  const gastosMes = gastos
    .filter(g => (g.fecha || "").startsWith(mes))
    .reduce((s, g) => s + (+g.monto || 0), 0);

  // === UTILIDAD REAL (esto es lo que no te descontaba) ===
  const utilidadMes = ingresosCobradonMes - costoRepuestosMes - gastosMes;

  const ordenesActivas = ordenes.filter(o => o.estado !== "completado").length;
  const pendientesCobro = ordenes.filter(o => o.estado === "completado" && !o.cobrado);
  const totalPendienteCobro = pendientesCobro.reduce((s, o) => s + (+o.costo || 0), 0);
  const totalFacturado = ordenes.filter(o => o.cobrado).reduce((s, o) => s + (+o.costo || 0), 0);
  // =============================================================================
  async function addOrden() {
    if (!form.cliente || !form.servicio) return;
    const folio = "OT-" + String(ordenes.length + 1).padStart(3, "0");
    const nuevo = { 
      ...form, 
      folio, 
      fecha: form.fecha || today(), 
      estado: "pendiente", 
      cobrado: false, 
      costo: +form.costo || 0, 
      items: [], 
      costo_mano_obra: +form.costo || 0 
    };
    const { data, error } = await supabase.from("ordenes").insert([nuevo]).select();
    if (data && !error) {
      setOrdenes(prev => [data[0], ...prev]);
      const cliente = clientes.find(c => (c.nombre || "").toLowerCase().trim() === (form.cliente || "").toLowerCase().trim());
      if (cliente) {
        await supabase.from("clientes").update({ visitas: (cliente.visitas || 0) + 1 }).eq("id", cliente.id);
        setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, visitas: (c.visitas || 0) + 1 } : c));
      }
    }
    setModal(null); 
    setForm({});
  }

  // Resto de funciones (addGasto, deleteGasto, addCliente, etc.) se mantienen igual
  async function addGasto() {
    if (!form.concepto || !form.monto) return;
    if (form._editId) {
      await supabase.from("gastos").update({ concepto: form.concepto, monto: +form.monto, categoria: form.categoria, fecha: form.fecha }).eq("id", form._editId);
      setGastos(prev => prev.map(g => g.id === form._editId ? { ...g, ...form, monto: +form.monto } : g));
    } else {
      const { data, error } = await supabase.from("gastos").insert([{ ...form, monto: +form.monto, fecha: form.fecha || today() }]).select();
      if (data && !error) setGastos(prev => [data[0], ...prev]);
    }
    setModal(null); setForm({});
  }

  async function deleteGasto(id: number) {
    await supabase.from("gastos").delete().eq("id", id);
    setGastos(prev => prev.filter(g => g.id !== id));
  }

  async function addCliente() {
    if (!form.nombre) return;
    if (form._editId) {
      await supabase.from("clientes").update({ nombre: form.nombre, telefono: form.telefono, email: form.email, cuit: form.cuit, vehiculos: form.vehiculos || [] }).eq("id", form._editId);
      setClientes(prev => prev.map(c => c.id === form._editId ? { ...c, ...form } : c));
    } else {
      const { data, error } = await supabase.from("clientes").insert([{ nombre: form.nombre, telefono: form.telefono || "", email: form.email || "", cuit: form.cuit || "", vehiculos: form.vehiculos || [], visitas: 0 }]).select();
      if (data && !error) setClientes(prev => [data[0], ...prev]);
    }
    setModal(null); setForm({});
  }

  async function deleteCliente(id: number) {
    await supabase.from("clientes").delete().eq("id", id);
    setClientes(prev => prev.filter(c => c.id !== id));
  }

  async function cambiarEstado(id: number, estado: string) {
    await supabase.from("ordenes").update({ estado }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
    if (selectedOrden?.id === id) setSelectedOrden((prev: any) => ({ ...prev, estado }));
  }

  async function marcarCobrado(id: number) {
    const fecha = today();
    await supabase.from("ordenes").update({ cobrado: true, cobrado_fecha: fecha }).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, cobrado: true, cobrado_fecha: fecha } : o));
    if (selectedOrden?.id === id) setSelectedOrden((prev: any) => ({ ...prev, cobrado: true, cobrado_fecha: fecha }));
  }

  async function deleteOrden(id: number) {
    await supabase.from("ordenes").delete().eq("id", id);
    setOrdenes(prev => prev.filter(o => o.id !== id));
    setSelectedOrden(null);
  }

  async function updateOrden(updated: any) {
    const { id, created_at, ...rest } = updated;
    await supabase.from("ordenes").update(rest).eq("id", id);
    setOrdenes(prev => prev.map(o => o.id === id ? updated : o));
    setSelectedOrden(updated);
  }

  async function ajustarStock(id: number, delta: number) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    const nueva = Math.max(0, item.cantidad + delta);
    await supabase.from("inventario").update({ cantidad: nueva }).eq("id", id);
    setInventario(prev => prev.map(i => i.id === id ? { ...i, cantidad: nueva } : i));
  }

  async function descontarStock(invId: number, cantidad: number) {
    const item = inventario.find(i => i.id === invId);
    if (!item) return;
    const nueva = Math.max(0, item.cantidad - cantidad);
    await supabase.from("inventario").update({ cantidad: nueva }).eq("id", invId);
    setInventario(prev => prev.map(i => i.id === invId ? { ...i, cantidad: nueva } : i));
  }

  async function agregarItemInventario(nuevoItem: any) {
    const { data, error } = await supabase.from("inventario").insert([nuevoItem]).select();
    if (data && !error) setInventario(prev => [data[0], ...prev]);
  }

  async function eliminarItemInventario(id: number) {
    await supabase.from("inventario").delete().eq("id", id);
    setInventario(prev => prev.filter(i => i.id !== id));
  }

  const TABS = ["Inicio", "Órdenes", "Finanzas", "Clientes", "Inventario"];
  const filteredOrdenes = ordenes.filter(o =>
    !search ||
    (o.cliente || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.vehiculo || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.folio || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#e55a00", fontSize: 14, letterSpacing: 3 }}>CARGANDO...</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="logo">TALLER BLANCO</div>
              <div className="logo-sub">SISTEMA DE GESTIÓN</div>
            </div>
            <div className="header-date">
              {new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}
            </div>
          </div>
          <div className="header-kpis">
            <div className="header-kpi">
              <div className="header-kpi-label">Este mes</div>
              <div className="header-kpi-val" style={{ color: utilidadMes >= 0 ? "#4ade80" : "#f87171" }}>{fmt(utilidadMes)}</div>
            </div>
            <div className="header-kpi">
              <div className="header-kpi-label">Activas</div>
              <div className="header-kpi-val" style={{ color: "#fb923c" }}>{ordenesActivas}</div>
            </div>
            <div className="header-kpi" style={{ cursor: totalPendienteCobro > 0 ? "pointer" : "default" }} onClick={() => totalPendienteCobro > 0 && setModal("acobrar")}>
              <div className="header-kpi-label">A cobrar {totalPendienteCobro > 0 ? "▼" : ""}</div>
              <div className="header-kpi-val" style={{ color: totalPendienteCobro > 0 ? "#f87171" : "#64748b" }}>{fmt(totalPendienteCobro)}</div>
            </div>
          </div>
        </div>

        <div className="nav">
          {TABS.map(t => (
            <button key={t} className={`nav-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="main">
          {tab === "Inicio" && <TabInicio 
            ordenes={ordenes} 
            ordenesMes={ordenesMes} 
            ingresosCobradonMes={ingresosCobradonMes} 
            gastosMes={gastosMes} 
            utilidadMes={utilidadMes} 
            ordenesActivas={ordenesActivas} 
            pendientesCobro={pendientesCobro} 
            totalPendienteCobro={totalPendienteCobro} 
            totalFacturado={totalFacturado} 
            inventario={inventario} 
            setModal={setModal} 
            setSelectedOrden={setSelectedOrden} 
            marcarCobrado={marcarCobrado} 
          />}
          {tab === "Órdenes" && <TabOrdenes ordenes={filteredOrdenes} search={search} setSearch={setSearch} ordenesView={ordenesView} setOrdenesView={setOrdenesView} setSelectedOrden={setSelectedOrden} />}
          {tab === "Finanzas" && <TabFinanzas ordenes={ordenes} gastos={gastos} setModal={setModal} setForm={setForm} deleteGasto={deleteGasto} />}
          {tab === "Clientes" && <TabClientes clientes={clientes} ordenes={ordenes} setModal={setModal} setForm={setForm} deleteCliente={deleteCliente} />}
          {tab === "Inventario" && <TabInventario inventario={inventario} ajustarStock={ajustarStock} agregarItem={agregarItemInventario} eliminarItem={eliminarItemInventario} />}
        </div>

        {(tab === "Órdenes" || tab === "Inicio") && <button className="fab" onClick={() => { setForm({ fecha: today() }); setModal("orden"); }}>+</button>}
        {tab === "Finanzas" && <button className="fab" onClick={() => { setForm({ fecha: today() }); setModal("gasto"); }}>+</button>}
        {tab === "Clientes" && <button className="fab" onClick={() => { setForm({}); setModal("cliente"); }}>+</button>}

        {modal === "orden" && <ModalOrden form={form} setForm={setForm} onSave={addOrden} onClose={() => { setModal(null); setForm({}); }} clientes={clientes} />}
        {modal === "gasto" && <ModalGasto form={form} setForm={setForm} onSave={addGasto} onClose={() => { setModal(null); setForm({}); }} />}
        {modal === "cliente" && <ModalCliente form={form} setForm={setForm} onSave={addCliente} onClose={() => { setModal(null); setForm({}); }} />}
        {modal === "acobrar" && <ModalACobrar pendientes={pendientesCobro} total={totalPendienteCobro} onCobrar={marcarCobrado} onClose={() => setModal(null)} onVerOrden={(o: any) => { setModal(null); setSelectedOrden(o); }} />}

        {selectedOrden && (
          <OrdenDetail
            orden={selectedOrden}
            onClose={() => setSelectedOrden(null)}
            cambiarEstado={cambiarEstado}
            marcarCobrado={marcarCobrado}
            onDelete={deleteOrden}
            onUpdate={updateOrden}
            inventario={inventario}
            descontarStock={descontarStock}
          />
        )}
      </div>
    </>
  );
}

// ====================== EL RESTO DE COMPONENTES ======================
// (TabInicio, TabOrdenes, TabFinanzas, TabClientes, TabInventario, ModalOrden, etc.)

// Copia y pega el resto de tu código original desde aquí en adelante 
// (todo lo que viene después de la función TallerApp en tu archivo original).
// No modifiqué TabFinanzas ni OrdenDetail porque ya tenían la lógica correcta.

function TabInicio({ ...props }: any) {
  // ... tu código original de TabInicio
  // (puedes dejarlo igual, ya que ahora recibe los valores correctos)
}

function TabFinanzas({ ordenes, gastos, setModal, setForm, deleteGasto }: any) {
  // ... tu código original de TabFinanzas (ya estaba bien)
}

// Resto de funciones (TabOrdenes, TabClientes, TabInventario, ModalOrden, etc.) 
// permanecen exactamente igual que en tu código original.