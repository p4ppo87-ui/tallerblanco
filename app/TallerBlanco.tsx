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

  // ====================== CÁLCULOS GLOBALES CORREGIDOS ======================
  const mes = mesActual();
  const ordenesMes = ordenes.filter(o => (o.fecha || "").startsWith(mes));

  const ordenesCompletadasCobradas = ordenesMes.filter(o => 
    o.estado === "completado" && o.cobrado === true
  );

  const ingresosCobradonMes = ordenesCompletadasCobradas.reduce((sum, o) => sum + (+o.costo || 0), 0);

  const costoRepuestosMes = ordenesCompletadasCobradas.reduce((sum, o) => {
    const items = o.items || [];
    return sum + items.reduce((s: number, i: any) => 
      s + ((+i.costo_compra || +i.costoCompra || 0) * (+i.cantidad || 0)), 0
    );
  }, 0);

  const gastosMes = gastos
    .filter(g => (g.fecha || "").startsWith(mes))
    .reduce((s, g) => s + (+g.monto || 0), 0);

  const utilidadMes = ingresosCobradonMes - costoRepuestosMes - gastosMes;

  const ordenesActivas = ordenes.filter(o => o.estado !== "completado").length;
  const pendientesCobro = ordenes.filter(o => o.estado === "completado" && !o.cobrado);
  const totalPendienteCobro = pendientesCobro.reduce((s, o) => s + (+o.costo || 0), 0);
  const totalFacturado = ordenes.filter(o => o.cobrado).reduce((s, o) => s + (+o.costo || 0), 0);
  // =========================================================================

  // ... (todas tus funciones addOrden, addGasto, deleteGasto, addCliente, etc. se mantienen igual)

  // Solo cambiamos el llamado a TabInicio para que reciba los valores correctos
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* ... header igual ... */}
        <div className="header-kpis">
          <div className="header-kpi">
            <div className="header-kpi-label">Este mes</div>
            <div className="header-kpi-val" style={{ color: utilidadMes >= 0 ? "#4ade80" : "#f87171" }}>
              {fmt(utilidadMes)}
            </div>
          </div>
          {/* resto del header igual */}
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
          {tab === "Órdenes" && <TabOrdenes /* ... */ />}
          {tab === "Finanzas" && <TabFinanzas ordenes={ordenes} gastos={gastos} setModal={setModal} setForm={setForm} deleteGasto={deleteGasto} />}
          {/* resto igual */}
        </div>

        {/* resto de modales y OrdenDetail igual */}
      </div>
    </>
  );
}
function TabInicio({ ...props }: any) {
  // ... tu código original de TabInicio
  // (puedes dejarlo igual, ya que ahora recibe los valores correctos)
}

function TabFinanzas({ ordenes, gastos, setModal, setForm, deleteGasto }: any) {
  const [mesFiltro, setMesFiltro] = useState(mesActual());
  const [vistaComparativa, setVistaComparativa] = useState(false);

  // Función para calcular ganancia real de una orden (ya estaba bien)
  function gananciaOrden(o: any) {
    const items = o.items || [];
    const costoRepuestos = items.reduce((s: number, i: any) => 
      s + ((+i.costo_compra || +i.costoCompra || 0) * +i.cantidad), 0);
    const ventaRepuestos = items.reduce((s: number, i: any) => 
      s + (+i.precio * +i.cantidad), 0);
    const manoObra = +o.costo_mano_obra || Math.max(0, (+o.costo || 0) - ventaRepuestos);
    return manoObra + (ventaRepuestos - costoRepuestos);
  }

  // Meses disponibles
  const mesesConDatos = (() => {
    const set = new Set<string>();
    ordenes.forEach((o: any) => { if (o.fecha) set.add(o.fecha.slice(0, 7)); });
    gastos.forEach((g: any) => { if (g.fecha) set.add(g.fecha.slice(0, 7)); });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  })();

  // ====================== CÁLCULOS DEL MES SELECCIONADO ======================
  const ordenesMesCobradas = ordenes.filter((o: any) =>
    (o.cobrado === true || o.estado === "completado") && 
    (o.fecha || "").startsWith(mesFiltro)
  );

  const ingresosDelMes = ordenesMesCobradas.reduce((s: number, o: any) => s + (+o.costo || 0), 0);

  const costoRepuestosMes = ordenesMesCobradas.reduce((s: number, o: any) => {
    const items = o.items || [];
    return s + items.reduce((ss: number, i: any) => 
      ss + ((+i.costo_compra || +i.costoCompra || 0) * (+i.cantidad || 0)), 0);
  }, 0);

  const gananciaRealMes = ordenesMesCobradas.reduce((s: number, o: any) => s + gananciaOrden(o), 0);

  const gastosDelMes = gastos
    .filter((g: any) => (g.fecha || "").startsWith(mesFiltro))
    .reduce((s: number, g: any) => s + (+g.monto || 0), 0);

  const utilidadRealMes = gananciaRealMes - gastosDelMes;

  // Gastos por categoría
  const gastosMesArr = gastos.filter((g: any) => (g.fecha || "").startsWith(mesFiltro));
  const gastosCat: Record<string, number> = {};
  gastosMesArr.forEach((g: any) => {
    const cat = g.categoria || "otro";
    gastosCat[cat] = (gastosCat[cat] || 0) + (+g.monto || 0);
  });

  // Últimos 6 meses para vista comparativa
  const ultimos6 = mesesConDatos.slice(0, 6).map(m => {
    const ords = ordenes.filter((o: any) => 
      (o.cobrado === true || o.estado === "completado") && (o.fecha || "").startsWith(m)
    );
    const ing = ords.reduce((s: number, o: any) => s + (+o.costo || 0), 0);
    const gan = ords.reduce((s: number, o: any) => s + gananciaOrden(o), 0);
    const gas = gastos.filter((g: any) => (g.fecha || "").startsWith(m))
                     .reduce((s: number, g: any) => s + (+g.monto || 0), 0);
    return { mes: m, ingresos: ing, gastos: gas, gananciaReal: gan - gas };
  });

  const labelMes = (m: string) => {
    const [y, mo] = m.split("-");
    const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${nombres[+mo - 1]} ${y}`;
  };

  return (
    <div>
      <div className="view-toggle">
        <button className={`view-btn ${!vistaComparativa ? "active" : ""}`} onClick={() => setVistaComparativa(false)}>Por mes</button>
        <button className={`view-btn ${vistaComparativa ? "active" : ""}`} onClick={() => setVistaComparativa(true)}>Comparar</button>
      </div>

      {vistaComparativa && (
        <div className="card">
          <div className="section-title">Últimos {ultimos6.length} meses</div>
          {ultimos6.map(({ mes, ingresos, gastos: gas, gananciaReal }) => {
            const positivo = gananciaReal >= 0;
            return (
              <div key={mes} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: mes === mesActual() ? "#e55a00" : "#f1f5f9" }}>{labelMes(mes)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: positivo ? "#4ade80" : "#f87171" }}>{fmt(gananciaReal)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  <span>↑ {fmt(ingresos)}</span><span>↓ {fmt(gas)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!vistaComparativa && (
        <div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Mes a ver</label>
            <select className="form-select" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
              {mesesConDatos.length === 0 ? (
                <option value={mesActual()}>{labelMes(mesActual())}</option>
              ) : (
                mesesConDatos.map(m => (
                  <option key={m} value={m}>
                    {labelMes(m)}{m === mesActual() ? " (actual)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card" style={{ borderLeft: "3px solid #4ade80" }}>
              <div className="kpi-label">Facturado</div>
              <div className="kpi-val" style={{ color: "#4ade80", fontSize: 18 }}>{fmt(ingresosDelMes)}</div>
            </div>
            <div className="kpi-card" style={{ borderLeft: "3px solid #f87171" }}>
              <div className="kpi-label">Gastos</div>
              <div className="kpi-val" style={{ color: "#f87171", fontSize: 18 }}>{fmt(gastosDelMes)}</div>
            </div>
            {costoRepuestosMes > 0 && (
              <div className="kpi-card" style={{ borderLeft: "3px solid #f87171" }}>
                <div className="kpi-label">Costo repuestos</div>
                <div className="kpi-val" style={{ color: "#f87171", fontSize: 18 }}>− {fmt(costoRepuestosMes)}</div>
              </div>
            )}
            <div className="kpi-card" style={{ borderLeft: `3px solid ${utilidadRealMes >= 0 ? "#fb923c" : "#f87171"}` }}>
              <div className="kpi-label">Ganancia real</div>
              <div className="kpi-val" style={{ color: utilidadRealMes >= 0 ? "#fb923c" : "#f87171", fontSize: 18 }}>{fmt(utilidadRealMes)}</div>
            </div>
          </div>

          {/* Sección de Gastos */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Gastos del mes</div>
              <button className="btn-sm btn-primary" onClick={() => { setForm({ fecha: today() }); setModal("gasto"); }}>
                + Gasto
              </button>
            </div>

            {gastosMesArr.length === 0 ? (
              <div className="empty" style={{ padding: "40px 20px" }}>
                No hay gastos registrados en este mes.<br />
                Usa el botón "+" para agregar uno.
              </div>
            ) : (
              <>
                {/* Gastos por categoría */}
                {Object.keys(gastosCat).length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="section-title" style={{ fontSize: 10, marginBottom: 10 }}>Por categoría</div>
                    {Object.entries(gastosCat).map(([cat, total]: any) => {
                      const pct = gastosDelMes > 0 ? Math.round((total / gastosDelMes) * 100) : 0;
                      return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ textTransform: "capitalize", color: "#94a3b8" }}>{cat}</span>
                            <span style={{ color: "#e55a00" }}>{fmt(total)} ({pct}%)</span>
                          </div>
                          <div className="progress-wrap">
                            <div className="progress-bar" style={{ width: `${pct}%`, background: "#e55a00" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Detalle de gastos */}
                <div>
                  <div className="section-title" style={{ fontSize: 10, marginBottom: 8 }}>Detalle</div>
                  {gastosMesArr.map((g: any) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #1f2937" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{g.concepto}</div>
                        <div style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize" }}>
                          {g.categoria || "otro"} · {g.fecha}
                        </div>
                      </div>
                      <span style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>{fmt(g.monto)}</span>
                      <button className="btn-sm" style={{ background: "#1e293b", color: "#94a3b8" }} 
                        onClick={() => { 
                          setForm({ _editId: g.id, concepto: g.concepto, monto: g.monto, categoria: g.categoria, fecha: g.fecha }); 
                          setModal("gasto"); 
                        }}>
                        ✏
                      </button>
                      <button className="btn-sm" style={{ background: "#7f1d1d", color: "#f87171" }} onClick={() => deleteGasto(g.id)}>
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// Resto de funciones (TabOrdenes, TabClientes, TabInventario, ModalOrden, etc.) 
// permanecen exactamente igual que en tu código original.