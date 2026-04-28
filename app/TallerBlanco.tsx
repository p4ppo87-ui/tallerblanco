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
  // ... tu código original de TabFinanzas (ya estaba bien)
}

// Resto de funciones (TabOrdenes, TabClientes, TabInventario, ModalOrden, etc.) 
// permanecen exactamente igual que en tu código original.