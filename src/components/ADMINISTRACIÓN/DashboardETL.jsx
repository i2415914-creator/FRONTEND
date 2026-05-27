import React, { useState, useEffect, useCallback } from 'react';

const ETL_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ETL_PREFIX = '/api/etl';
const CHART_TYPES = [
  { value: 'bar',  label: 'Gráfica de Barras' },
  { value: 'line', label: 'Gráfica Lineal'    },
  { value: 'pie',  label: 'Gráfica de Torta'  },
  { value: 'area', label: 'Gráfica de Área'   },
];
const COLORS = ['#3ab0e8','#1a7ab5','#4ecb8d','#f4a533','#e85c5c','#9b6cdc','#38b2ac','#e8623a','#f6c90e','#67c3b0'];

// ──────────────────── CSV/Excel Export ───────────────────────────
function downloadCSV(data, filename) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcelFromData(data, filename) {
  if (!data?.length) return;
  const cols = Object.keys(data[0]);
  let html = '<table><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  data.forEach(row => { html += '<tr>' + cols.map(c => `<td>${row[c] ?? ''}</td>`).join('') + '</tr>'; });
  html += '</table>';
  const blob = new Blob(
    [`<html><head><meta charset="utf-8"/></head><body>${html}</body></html>`],
    { type: 'application/vnd.ms-excel;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.xls'; a.click();
  URL.revokeObjectURL(url);
}

function exportAllExcel(charts, name) {
  charts.forEach(c => {
    downloadExcelFromData(c.data, `${name}_${c.id}`);
  });
}

async function exportExcel(body, name) {
  try {
    const res = await fetch(`${ETL_API}${ETL_PREFIX}/dashboard/export`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al generar Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(name||'dashboard').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { alert('No se pudo descargar el Excel: ' + e.message); }
}

// ──────────────────── SVG Charts ───────────────────────────────
function BarChart({ data, xKey, yKey, zoom = 1 }) {
  if (!data?.length) return <EmptyChart />;
  const maxVal = Math.max(...data.map(d => Number(d[yKey]) || 0), 1);
  const barW = Math.max(20, Math.min(60, Math.floor(500 / data.length) - 8));
  const pad = { top: 20, right: 16, bottom: 72, left: 64 };
  const w = Math.max(460, data.length * (barW + 10) + pad.left + pad.right);
  const h = Math.round(240 * zoom);
  const chartH = h - pad.top - pad.bottom;
  const ticks = 4;
  return (
    <div style={{overflowX:'auto', overflowY:'hidden'}}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width: Math.max(w, 400), height: h, display:'block', minWidth:'100%'}}>
        {Array.from({length: ticks + 1}, (_,i) => {
          const val = (maxVal / ticks) * i;
          const y = pad.top + chartH - (chartH * i / ticks);
          return <g key={i}>
            <line x1={pad.left-4} y1={y} x2={w-pad.right} y2={y} stroke="rgba(70,165,220,0.15)" strokeWidth={1}/>
            <text x={pad.left-8} y={y+4} textAnchor="end" fontSize={11} fill="#5a8aaa">
              {val>=1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0)}
            </text>
          </g>;
        })}
        {data.map((d,i) => {
          const barH = Math.max(2, (Number(d[yKey])||0) / maxVal * chartH);
          const x = pad.left + i*(barW+8);
          const y = pad.top + chartH - barH;
          const label = String(d[xKey]||'').slice(0,18);
          return <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={COLORS[i%COLORS.length]} opacity={0.85}/>
            <text transform={`translate(${x+barW/2},${pad.top+chartH+10}) rotate(38)`}
              fontSize={11} fill="#3a6a8a" textAnchor="start">{label}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

function LineChart({ data, xKey, yKey, zoom = 1 }) {
  if (!data?.length) return <EmptyChart />;
  const vals = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...vals, 1);
  const pad = { top: 20, right: 20, bottom: 72, left: 64 };
  const w = Math.max(460, data.length * 52 + pad.left + pad.right);
  const h = Math.round(240 * zoom);
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const stepX = chartW / Math.max(data.length-1, 1);
  const toX = i => pad.left + i * stepX;
  const toY = v => pad.top + chartH - (v / maxVal) * chartH;
  const points = data.map((d,i) => `${toX(i)},${toY(Number(d[yKey])||0)}`).join(' ');
  const area = `${pad.left},${pad.top+chartH} ${points} ${toX(data.length-1)},${pad.top+chartH}`;
  return (
    <div style={{overflowX:'auto'}}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:Math.max(w,400), height:h, display:'block', minWidth:'100%'}}>
        {[0,1,2,3,4].map(i => {
          const val = (maxVal/4)*i; const y = pad.top+chartH-(chartH*i/4);
          return <g key={i}>
            <line x1={pad.left} y1={y} x2={w-pad.right} y2={y} stroke="rgba(70,165,220,0.15)" strokeWidth={1}/>
            <text x={pad.left-8} y={y+4} textAnchor="end" fontSize={11} fill="#5a8aaa">
              {val>=1000?`${(val/1000).toFixed(1)}k`:val.toFixed(0)}
            </text>
          </g>;
        })}
        <polygon points={area} fill="rgba(58,176,232,0.13)"/>
        <polyline points={points} fill="none" stroke="#3ab0e8" strokeWidth={2.5} strokeLinejoin="round"/>
        {data.map((d,i) => <g key={i}>
          <circle cx={toX(i)} cy={toY(Number(d[yKey])||0)} r={4} fill="#1a7ab5"/>
          <text transform={`translate(${toX(i)},${pad.top+chartH+10}) rotate(38)`}
            fontSize={11} fill="#3a6a8a" textAnchor="start">{String(d[xKey]||'').slice(0,12)}</text>
        </g>)}
      </svg>
    </div>
  );
}

function AreaChart({ data, xKey, series=[], zoom=1 }) {
  if (!data?.length || !series.length) return <EmptyChart />;
  const allVals = data.flatMap(d => series.map(s => Number(d[s])||0));
  const maxVal = Math.max(...allVals, 1);
  const pad = { top: 20, right: 20, bottom: 72, left: 64 };
  const w = Math.max(460, data.length*52+pad.left+pad.right);
  const h = Math.round(240*zoom);
  const chartW = w-pad.left-pad.right; const chartH = h-pad.top-pad.bottom;
  const stepX = chartW/Math.max(data.length-1,1);
  const toX = i => pad.left+i*stepX;
  const toY = v => pad.top+chartH-(v/maxVal)*chartH;
  const SC = [['rgba(58,176,232,0.22)','#3ab0e8'],['rgba(232,92,92,0.22)','#e85c5c']];
  return (
    <div style={{overflowX:'auto'}}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:Math.max(w,400),height:h,display:'block',minWidth:'100%'}}>
        {[0,1,2,3,4].map(i => {
          const y=pad.top+chartH-(chartH*i/4);
          return <line key={i} x1={pad.left} y1={y} x2={w-pad.right} y2={y} stroke="rgba(70,165,220,0.15)" strokeWidth={1}/>;
        })}
        {series.map((s,si) => {
          const pts = data.map((d,i)=>`${toX(i)},${toY(Number(d[s])||0)}`).join(' ');
          const area=`${pad.left},${pad.top+chartH} ${pts} ${toX(data.length-1)},${pad.top+chartH}`;
          return <g key={s}>
            <polygon points={area} fill={SC[si%2][0]}/>
            <polyline points={pts} fill="none" stroke={SC[si%2][1]} strokeWidth={2.5}/>
          </g>;
        })}
        {data.map((d,i) => <text key={i}
          transform={`translate(${toX(i)},${pad.top+chartH+10}) rotate(38)`}
          fontSize={11} fill="#3a6a8a" textAnchor="start">{String(d[xKey]||'').slice(0,12)}</text>)}
        {series.map((s,si) => <g key={s} transform={`translate(${pad.left+si*120},${h-14})`}>
          <rect width={13} height={10} rx={2} fill={SC[si%2][1]} opacity={0.8}/>
          <text x={17} y={9} fontSize={11} fill="#3a6a8a">{s}</text>
        </g>)}
      </svg>
    </div>
  );
}

function PieChart({ data, labelKey, valueKey, zoom=1 }) {
  if (!data?.length) return <EmptyChart />;
  const total = data.reduce((s,d)=>s+(Number(d[valueKey])||0),0);
  if (!total) return <EmptyChart />;
  const r = Math.round(90*zoom); const cx = r+20; const cy = r+20;
  const h = (r+20)*2;
  let ang = -Math.PI/2;
  const slices = data.slice(0,10).map((d,i) => {
    const val = Number(d[valueKey])||0;
    const a = (val/total)*2*Math.PI;
    const end = ang+a;
    const x1=cx+r*Math.cos(ang), y1=cy+r*Math.sin(ang);
    const x2=cx+r*Math.cos(end), y2=cy+r*Math.sin(end);
    const mid=ang+a/2;
    ang=end;
    return {path:`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${a>Math.PI?1:0} 1 ${x2} ${y2}Z`,
            color:COLORS[i%COLORS.length], label:String(d[labelKey]||'').slice(0,20), val, pct:((val/total)*100).toFixed(1),
            lx:cx+(r+22)*Math.cos(mid), ly:cy+(r+22)*Math.sin(mid)};
  });
  const legW = 280; const w = cx*2+legW+16;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:h,display:'block'}}>
      {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.88} stroke="#fff" strokeWidth={2}/>)}
      {slices.map((s,i)=><g key={i} transform={`translate(${cx*2+12},${14+i*22})`}>
        <rect width={13} height={13} rx={3} fill={s.color} opacity={0.88}/>
        <text x={18} y={11} fontSize={11} fill="#1a4a6a">{s.label} ({s.pct}%)</text>
      </g>)}
    </svg>
  );
}

function EmptyChart() {
  return <div style={{height:60,display:'flex',alignItems:'center',justifyContent:'center',color:'#9bb',fontSize:'0.8rem'}}>Sin datos disponibles</div>;
}

// ──────────────────── ChartCard ────────────────────────────────
function ChartCard({ chart, zoom }) {
  const [expanded, setExpanded] = useState(false);
  const cardZoom = expanded ? zoom * 1.6 : zoom;
  return (
    <div style={{background:'#fff', border:'1px solid rgba(70,165,220,0.15)', borderRadius:14, overflow:'hidden',
      boxShadow:'0 2px 8px rgba(70,155,210,0.08)', gridColumn: expanded ? '1 / -1' : undefined, transition:'all 0.2s'}}>
      <div style={{background:'linear-gradient(135deg,rgba(26,122,181,0.06),rgba(58,176,232,0.04))',
        borderBottom:'1px solid rgba(70,165,220,0.15)', padding:'10px 14px',
        display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontWeight:700,fontSize:'0.82rem',color:'#1a4a6a'}}>{chart.title}</div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={() => downloadExcelFromData(chart.data, chart.id)} title="Descargar Excel"
            style={btnStyle('#3ab0e8')}>↓ Excel</button>
          <button onClick={() => setExpanded(e=>!e)} title={expanded?'Reducir':'Ampliar'}
            style={btnStyle('#6b9ab8')}>{expanded ? '⊟' : '⊞'}</button>
        </div>
      </div>
      <div style={{padding:'12px 14px'}}>
        {chart.type==='bar'  && <BarChart  data={chart.data} xKey={chart.x_key}   yKey={chart.y_key}   zoom={cardZoom}/>}
        {chart.type==='line' && <LineChart data={chart.data} xKey={chart.x_key}   yKey={chart.y_key}   zoom={cardZoom}/>}
        {chart.type==='area' && <AreaChart data={chart.data} xKey={chart.x_key}   series={chart.series} zoom={cardZoom}/>}
        {chart.type==='pie'  && <PieChart  data={chart.data} labelKey={chart.label_key} valueKey={chart.value_key} zoom={cardZoom}/>}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {padding:'3px 9px', borderRadius:8, fontSize:'0.7rem', fontWeight:700,
    border:`1.5px solid ${color}`, background:'transparent', color, cursor:'pointer'};
}

// ──────────────────── Summary Cards ────────────────────────────
function SummaryCards({ summary }) {
  if (!summary || !Object.keys(summary).length) return null;
  const labels = {
    total_ingresos:'Total Ingresos', total_gastos:'Total Gastos', total_clientes:'Clientes',
    total_productos:'Productos', total_personal:'Personal', total_pedidos:'Pedidos',
    total_pagos:'Pagos', total_categorias:'Categorías', precio_promedio:'Precio Promedio',
    stock_total:'Stock Total', salario_promedio:'Salario Promedio', salario_max:'Salario Máximo',
    cargos:'Cargos', margen:'Margen Neto', gasto_promedio:'Gasto Promedio', total_areas:'Áreas/Roles',
  };
  const ICONS = {
    total_ingresos:'💰', total_gastos:'💸', total_clientes:'👥', total_productos:'📦',
    total_personal:'👷', total_pedidos:'🛒', total_pagos:'💳', total_categorias:'🏷️',
    precio_promedio:'🏷️', stock_total:'📋', margen:'📈', gasto_promedio:'💸', total_areas:'🏢',
  };
  const getColor = (k) => {
    if (k.includes('ingreso') || k.includes('margen')) return { accent:'#4ecb8d', bg:'rgba(78,203,141,0.07)', val:'#1a6a3a' };
    if (k.includes('gasto')) return { accent:'#f4a533', bg:'rgba(244,165,51,0.07)', val:'#8a5010' };
    return { accent:'#3ab0e8', bg:'rgba(58,176,232,0.07)', val:'#0c4f7a' };
  };
  const fmt = (k,v) => {
    if (typeof v!=='number') return v;
    const lk=k.toLowerCase();
    if (lk.includes('ingreso')||lk.includes('gasto')||lk.includes('salario')||
        lk.includes('monto')||lk.includes('promedio')||lk.includes('max')||lk.includes('margen'))
      return `S/ ${Number(v).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    return Number(v).toLocaleString('es-PE');
  };
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
      {Object.entries(summary).map(([k,v])=>{
        const c = getColor(k);
        return (
          <div key={k} style={{background:c.bg, border:`1.5px solid ${c.accent}30`,
            borderLeft:`4px solid ${c.accent}`, borderRadius:12, padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
              <span style={{fontSize:'1rem'}}>{ICONS[k]||'📊'}</span>
              <span style={{fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',
                letterSpacing:'0.4px',color:c.accent}}>{labels[k]||k}</span>
            </div>
            <div style={{fontSize:'1.35rem',fontWeight:800,color:c.val,lineHeight:1}}>{fmt(k,v)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────── Custom Dashboard Builder ─────────────────
function CustomBuilder({ tables, customCharts, setCustomCharts, dashboardName, setDashboardName }) {
  const addChart = () => setCustomCharts(prev => [...prev, {
    id: Date.now(), title:'', table:'', chart_type:'bar', x_col:'', y_col:'',
  }]);
  const removeChart = id => setCustomCharts(prev => prev.filter(c => c.id !== id));
  const updateChart = (id, field, val) => setCustomCharts(prev =>
    prev.map(c => c.id===id ? {...c, [field]:val, ...(field==='table'?{x_col:'',y_col:''}:{})} : c)
  );
  const getColumns = tableName => {
    const t = tables.find(t => t.name === tableName);
    return t ? Object.entries(t.columns).map(([k,v]) => ({key:k, label:v.label, type:v.type})) : [];
  };
  return (
    <div style={{marginTop:16}}>
      <div style={{marginBottom:14}}>
        <label style={labelStyle}>Nombre del Dashboard</label>
        <input value={dashboardName} onChange={e=>setDashboardName(e.target.value)}
          placeholder="Ej: Análisis de Ventas Mensual"
          style={{width:'100%',padding:'8px 12px',borderRadius:10,border:'1px solid rgba(70,165,220,0.2)',
            background:'#fff',color:'#1a4a6a',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
      </div>
      {customCharts.map((ch, idx) => {
        const cols = getColumns(ch.table);
        const numCols = cols.filter(c => c.type==='number');
        const allCols = cols;
        return (
          <div key={ch.id} style={{background:'rgba(240,250,255,0.7)', border:'1px solid rgba(70,165,220,0.15)',
            borderRadius:12, padding:'14px 16px', marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:'0.78rem',color:'#1a4a6a'}}>Gráfico {idx+1}</div>
              <button onClick={()=>removeChart(ch.id)} style={{...btnStyle('#e85c5c'), padding:'2px 8px'}}>✕ Eliminar</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Título</label>
                <input value={ch.title} onChange={e=>updateChart(ch.id,'title',e.target.value)}
                  placeholder="Ej: Ventas por mes" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Tipo de Gráfico</label>
                <select value={ch.chart_type} onChange={e=>updateChart(ch.id,'chart_type',e.target.value)} style={inputStyle}>
                  {CHART_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tabla</label>
                <select value={ch.table} onChange={e=>updateChart(ch.id,'table',e.target.value)} style={inputStyle}>
                  <option value="">— Seleccionar —</option>
                  {tables.map(t=><option key={t.name} value={t.name}>{t.icon} {t.display_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Columna Eje X / Etiqueta</label>
                <select value={ch.x_col} onChange={e=>updateChart(ch.id,'x_col',e.target.value)} style={inputStyle} disabled={!ch.table}>
                  <option value="">— Seleccionar —</option>
                  {allCols.map(c=><option key={c.key} value={c.key}>{c.label} ({c.key})</option>)}
                </select>
              </div>
              {ch.chart_type !== 'pie' && (
                <div>
                  <label style={labelStyle}>Columna Valor (numérica)</label>
                  <select value={ch.y_col} onChange={e=>updateChart(ch.id,'y_col',e.target.value)} style={inputStyle} disabled={!ch.table}>
                    <option value="">— Conteo automático —</option>
                    {numCols.map(c=><option key={c.key} value={c.key}>{c.label} ({c.key})</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={addChart} style={{
        padding:'8px 18px', borderRadius:10, fontSize:'0.8rem', fontWeight:700,
        background:'rgba(58,176,232,0.12)', border:'1.5px dashed rgba(58,176,232,0.5)',
        color:'#3ab0e8', cursor:'pointer', width:'100%', marginTop:4}}>+ Agregar Gráfico</button>
    </div>
  );
}

const labelStyle = {display:'block',fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',
  letterSpacing:'0.4px',color:'#4a90b8',marginBottom:5};
const inputStyle = {width:'100%',padding:'7px 10px',borderRadius:9,border:'1px solid rgba(70,165,220,0.2)',
  background:'#fff',color:'#1a4a6a',fontSize:'0.8rem',outline:'none',boxSizing:'border-box'};

// ──────────────────── Main Component ───────────────────────────
const TEMPLATE_ICONS  = {resumen_general:'📊',inventario:'📦',ventas_finanzas:'💰',clientes:'👥',personal:'👷',custom:'🎨'};
const TEMPLATE_COLORS = {resumen_general:'#3ab0e8',inventario:'#4ecb8d',ventas_finanzas:'#f4a533',clientes:'#9b6cdc',personal:'#38b2ac',custom:'#e8623a'};

export default function DashboardETL() {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [templates, setTemplates]         = useState([]);
  const [tables, setTables]               = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [zoom, setZoom]                   = useState(1);
  const [customCharts, setCustomCharts]   = useState([]);
  const [dashboardName, setDashboardName] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${ETL_API}${ETL_PREFIX}/dashboard/templates`).then(r=>r.json()).catch(()=>({templates:[]})),
      fetch(`${ETL_API}${ETL_PREFIX}/tables`).then(r=>r.json()).catch(()=>({tables:[]})),
    ]).then(([tpl,tbl]) => {
      setTemplates(tpl.templates||[]);
      setTables(tbl.tables||[]);
      if (tpl.templates?.length) setSelectedTemplate(tpl.templates[0].id);
    }).finally(() => setTemplatesLoading(false));
  }, []);

  const isCustom = selectedTemplate === 'custom';

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const body = { template_id: selectedTemplate };
      if (isCustom) {
        body.dashboard_name = dashboardName;
        body.chart_configs = customCharts
          .filter(c => c.table && c.x_col)
          .map(c => ({ table:c.table, x_col:c.x_col, y_col:c.y_col||null, chart_type:c.chart_type, title:c.title }));
        if (!body.chart_configs.length) {
          setError('Agrega al menos un gráfico con tabla y columna X configurados.');
          setLoading(false); return;
        }
      }
      const res = await fetch(`${ETL_API}${ETL_PREFIX}/dashboard/generate`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.detail||`Error ${res.status}`); }
      setResult(await res.json());
    } catch(e) { setError(e.message||'Error al conectar con el servidor ETL'); }
    finally { setLoading(false); }
  }, [selectedTemplate, isCustom, customCharts, dashboardName]);

  const canGenerate = selectedTemplate && !loading && (!isCustom || customCharts.some(c=>c.table&&c.x_col));

  if (templatesLoading) return <div style={{padding:40,textAlign:'center',color:'#6b9ab8',background:'#f5f7fa',minHeight:'400px',display:'flex',alignItems:'center',justifyContent:'center'}}>Cargando…</div>;

  return (
    <div style={{background:'#f5f7fa',minHeight:'100vh',padding:'20px',fontFamily:'inherit'}}>
      <div style={{maxWidth:'1400px',margin:'0 auto'}}>
        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:'1.2rem',fontWeight:800,color:'#0c4f7a',marginBottom:4}}>📊 Dashboard ETL — Análisis de Datos</div>
          <div style={{fontSize:'0.85rem',color:'#6b9ab8'}}>Genera dashboards personalizados, análisis ML y exporta datos en tiempo real.</div>
        </div>

        {/* Tab Bar */}
        <div style={{display:'flex',gap:0,marginBottom:24,background:'#fff',borderRadius:12,padding:'4px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:20}}>
          {[
            {id:'dashboard', label:'📊 Dashboard', icon:'📊'},
            {id:'mining', label:'🔬 Minería de Datos', icon:'🔬'},
            {id:'descarga', label:'📥 Descargas', icon:'📥'},
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex:1, padding:'11px 16px', borderRadius:10, fontSize:'0.85rem', fontWeight:700,
                background: activeTab===tab.id ? 'linear-gradient(135deg,#3ab0e8,#1a7ab5)' : 'transparent',
                color: activeTab===tab.id ? '#fff' : '#6b9ab8',
                border:'none', cursor:'pointer', transition:'all 0.2s',
                boxShadow: activeTab===tab.id ? '0 2px 8px rgba(58,176,232,0.25)' : 'none',
              }}>{tab.label}</button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{background:'#fff',borderRadius:14,padding:'20px',marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
              <div style={{fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',
                color:'#4a90b8',marginBottom:12}}>Selecciona un tipo de dashboard</div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:16}}>
                {templates.map(t => {
                  const color = TEMPLATE_COLORS[t.id] || '#3ab0e8';
                  const active = selectedTemplate === t.id;
                  return (
                    <button key={t.id}
                      onClick={()=>{setSelectedTemplate(t.id);setResult(null);setCustomCharts([]);setDashboardName('');}}
                      style={{
                        padding:'14px 12px', borderRadius:12, textAlign:'left', cursor:'pointer',
                        border:`2px solid ${active ? color : 'rgba(70,165,220,0.2)'}`,
                        background: active ? `${color}18` : '#fff',
                        boxShadow: active ? `0 2px 10px ${color}30` : 'none',
                        transition:'all 0.15s'}}>
                      <div style={{fontSize:'1.6rem',marginBottom:6}}>{TEMPLATE_ICONS[t.id]||'📊'}</div>
                      <div style={{fontSize:'0.77rem',fontWeight:700,color: active ? color : '#1a4a6a',marginBottom:4,lineHeight:1.2}}>{t.name}</div>
                      <div style={{fontSize:'0.62rem',color:'#6b9ab8',lineHeight:1.3}}>{t.description}</div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handleGenerate} disabled={!canGenerate}
                style={{width:'100%',padding:'12px',borderRadius:10,fontSize:'0.85rem',fontWeight:700,
                  background:canGenerate?'linear-gradient(135deg,#3ab0e8,#1a7ab5)':'rgba(58,176,232,0.35)',
                  color:'#fff',border:'none',cursor:canGenerate?'pointer':'not-allowed',
                  boxShadow:canGenerate?'0 4px 14px rgba(58,176,232,0.35)':'none',transition:'all 0.15s'}}>
                {loading?'⏳ Generando…':'⚡ Generar Dashboard'}
              </button>

              {isCustom && (
                <CustomBuilder tables={tables} customCharts={customCharts} setCustomCharts={setCustomCharts}
                  dashboardName={dashboardName} setDashboardName={setDashboardName}/>
              )}
            </div>

            {error && <div style={{background:'rgba(232,92,92,0.12)',border:'1.5px solid rgba(232,92,92,0.3)',
              borderRadius:10,padding:'12px 16px',color:'#c0392b',fontSize:'0.8rem',marginBottom:16}}>⚠️ {error}</div>}

            {loading && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
              {[1,2,3,4].map(i=><div key={i} style={{height:260,borderRadius:14,background:'#fff',
                animation:'pulse 1.4s ease-in-out infinite',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}/>)}
            </div>}

            {result && !loading && (
              <>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10,background:'#fff',padding:'14px 16px',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                  <div style={{fontWeight:800,fontSize:'0.9rem',color:'#0c4f7a'}}>
                    {TEMPLATE_ICONS[result.template_id]||'📊'} {result.template_name}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(220,242,255,0.6)',
                      border:'1px solid rgba(70,165,220,0.2)',borderRadius:10,padding:'4px 10px'}}>
                      <span style={{fontSize:'0.7rem',color:'#4a90b8',fontWeight:700}}>Zoom</span>
                      <button onClick={()=>setZoom(z=>Math.max(0.6,z-0.2))} style={zoomBtn}>−</button>
                      <span style={{fontSize:'0.75rem',fontWeight:700,color:'#1a4a6a',minWidth:36,textAlign:'center'}}>
                        {Math.round(zoom*100)}%
                      </span>
                      <button onClick={()=>setZoom(z=>Math.min(2.5,z+0.2))} style={zoomBtn}>+</button>
                      <button onClick={()=>setZoom(1)} style={{...zoomBtn,fontSize:'0.65rem',padding:'2px 6px'}}>↺</button>
                    </div>
                    <button onClick={()=>exportAllExcel(result.charts, result.template_name)}
                      style={{...btnStyle('#4ecb8d'), padding:'6px 14px'}}>↓ Excel (gráficos)</button>
                    <button onClick={()=>exportExcel({template_id: result.template_id, dashboard_name: result.template_name}, result.template_name)}
                      style={{...btnStyle('#1a7ab5'), padding:'6px 14px', background:'rgba(26,122,181,0.10)'}}>↓ Excel (.xlsx)</button>
                    <span style={{fontSize:'0.7rem',color:'#9bb'}}>{new Date(result.generated_at).toLocaleString('es-PE')}</span>
                  </div>
                </div>

                <SummaryCards summary={result.summary}/>

                {result.charts?.length > 0
                  ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
                      {result.charts.map(chart=><ChartCard key={chart.id} chart={chart} zoom={zoom}/>)}
                    </div>
                  : <div style={{padding:40,textAlign:'center',color:'#9bb',fontSize:'0.85rem',background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                      No se encontraron datos para los gráficos seleccionados.
                    </div>
                }
              </>
            )}
          </div>
        )}

        {/* Mining Tab */}
        {activeTab === 'mining' && <MiningSection ETL_API={ETL_API} ETL_PREFIX={ETL_PREFIX} />}

        {/* Descarga Tab */}
        {activeTab === 'descarga' && <TableExportSection tables={tables} ETL_API={ETL_API} ETL_PREFIX={ETL_PREFIX} />}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

const zoomBtn = {
  width:24, height:24, borderRadius:6, border:'1px solid rgba(70,165,220,0.3)',
  background:'#fff', color:'#1a7ab5', fontWeight:700, fontSize:'0.85rem',
  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1};

// ──────────────────── Mining Section ───────────────────────────
const MINING_OPTIONS = [
  { id:'rfm',          label:'Segmentación RFM',      icon:'🎯', desc:'Clasifica clientes: Campeones, Leales, En Riesgo, Perdidos' },
  { id:'forecast',     label:'Predicción de Ventas',   icon:'📈', desc:'Regresión lineal para proyectar ventas futuras' },
  { id:'clustering',   label:'Clustering de Clientes', icon:'🔵', desc:'K-Means: agrupa clientes por comportamiento de compra' },
  { id:'correlaciones',label:'Correlaciones',          icon:'🔗', desc:'Relación entre ingresos, gastos y pedidos por mes' },
  { id:'anomalias',    label:'Detección de Anomalías', icon:'⚠️', desc:'Detecta gastos e ingresos inusuales (Z-score > 2σ)' },
];

function MiningSection({ ETL_API, ETL_PREFIX }) {
  const [selected, setSelected]   = useState('');
  const [loading,  setLoading]    = useState(false);
  const [result,   setResult]     = useState(null);
  const [error,    setError]      = useState('');
  const [kClusters, setKClusters] = useState(3);
  const [mesesFC,   setMesesFC]   = useState(3);

  const run = async () => {
    if (!selected) return;
    setLoading(true); setError(''); setResult(null);
    try {
      let url = `${ETL_API}${ETL_PREFIX}/mining/${selected}`;
      if (selected === 'clustering') url += `?k=${kClusters}`;
      if (selected === 'forecast')   url += `?meses=${mesesFC}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Sin datos');
      setResult(data);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const downloadMiningExcel = () => {
    if (!result) return;
    const data = result.detalle || result.anomalias || result.resumen || result.historico || [];
    downloadExcelFromData(data, `mineria_${selected}`);
  };

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:20}}>
        {MINING_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => { setSelected(opt.id); setResult(null); setError(''); }}
            style={{
              padding:'14px 14px', borderRadius:12, textAlign:'left', cursor:'pointer',
              border:`2px solid ${selected===opt.id ? '#3ab0e8' : 'rgba(70,165,220,0.15)'}`,
              background: selected===opt.id ? 'linear-gradient(135deg,rgba(58,176,232,0.2),rgba(26,122,181,0.1))' : '#fff',
              boxShadow: selected===opt.id ? '0 2px 8px rgba(58,176,232,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition:'all 0.15s'}}>
            <div style={{fontSize:'1.4rem',marginBottom:6}}>{opt.icon}</div>
            <div style={{fontSize:'0.77rem',fontWeight:700,color:'#1a4a6a',marginBottom:3}}>{opt.label}</div>
            <div style={{fontSize:'0.65rem',color:'#6b9ab8',lineHeight:1.3}}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {selected === 'clustering' && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,background:'#fff',padding:'12px 14px',borderRadius:10,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <label style={{...labelStyle,marginBottom:0}}>Número de grupos (K):</label>
          {[2,3,4,5].map(k => (
            <button key={k} onClick={()=>setKClusters(k)}
              style={{...btnStyle(kClusters===k?'#3ab0e8':'#aaa'), padding:'4px 12px',
                background:kClusters===k?'rgba(58,176,232,0.15)':'transparent'}}>{k}</button>
          ))}
        </div>
      )}
      {selected === 'forecast' && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,background:'#fff',padding:'12px 14px',borderRadius:10,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <label style={{...labelStyle,marginBottom:0}}>Meses a predecir:</label>
          {[1,2,3,6].map(m => (
            <button key={m} onClick={()=>setMesesFC(m)}
              style={{...btnStyle(mesesFC===m?'#3ab0e8':'#aaa'), padding:'4px 12px',
                background:mesesFC===m?'rgba(58,176,232,0.15)':'transparent'}}>{m}</button>
          ))}
        </div>
      )}

      {selected && (
        <button onClick={run} disabled={loading} style={{
          padding:'12px 24px',borderRadius:10,fontSize:'0.85rem',fontWeight:700,marginBottom:20,
          background:loading?'rgba(58,176,232,0.4)':'linear-gradient(135deg,#3ab0e8,#1a7ab5)',
          color:'#fff',border:'none',cursor:loading?'not-allowed':'pointer',
          boxShadow:'0 3px 12px rgba(58,176,232,0.28)',transition:'all 0.15s',width:'100%'}}>
          {loading?'⏳ Analizando…':'🔬 Ejecutar Análisis'}
        </button>
      )}

      {error && <div style={{background:'rgba(232,92,92,0.12)',border:'1.5px solid rgba(232,92,92,0.3)',
        borderRadius:10,padding:'12px 16px',color:'#c0392b',fontSize:'0.8rem',marginBottom:16}}>⚠️ {error}</div>}

      {result && !loading && (
        <div style={{background:'#fff',border:'1px solid rgba(70,165,220,0.15)',borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:'0.9rem',color:'#0c4f7a'}}>{result.titulo}</div>
            <button onClick={downloadMiningExcel} style={{...btnStyle('#4ecb8d'),padding:'5px 12px'}}>↓ Excel</button>
          </div>
          {result.insight && (
            <div style={{background:'rgba(58,176,232,0.1)',borderRadius:10,padding:'10px 14px',
              fontSize:'0.78rem',color:'#1a4a6a',marginBottom:16,lineHeight:1.5}}>
              💡 {result.insight}
            </div>
          )}
          <MiningTable data={
            result.resumen || result.anomalias || result.pares ||
            (result.historico ? [...result.historico,...(result.prediccion||[])] : null) || []
          }/>
          {result.detalle?.length > 0 && (
            <>
              <div style={{fontSize:'0.72rem',fontWeight:700,color:'#4a90b8',marginTop:16,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.4px'}}>
                Detalle por cliente (Top 50)
              </div>
              <MiningTable data={result.detalle}/>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MiningTable({ data }) {
  if (!data?.length) return null;
  const cols = Object.keys(data[0]);
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.76rem'}}>
        <thead>
          <tr>{cols.map(c=>(
            <th key={c} style={{padding:'8px 12px',background:'rgba(26,122,181,0.06)',
              color:'#1a4a6a',fontWeight:700,textAlign:'left',whiteSpace:'nowrap',
              borderBottom:'1px solid rgba(70,165,220,0.15)'}}>
              {c}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {data.slice(0,30).map((row,i)=>(
            <tr key={i} style={{background:i%2===0?'rgba(240,250,255,0.3)':'transparent'}}>
              {cols.map(c=>(
                <td key={c} style={{padding:'7px 12px',color:'#1a4a6a',
                  borderBottom:'1px solid rgba(70,165,220,0.08)',whiteSpace:'nowrap'}}>
                  {row[c] === null ? <span style={{color:'#aaa',fontStyle:'italic'}}>—</span>
                    : typeof row[c]==='number' ? Number(row[c]).toLocaleString('es-PE')
                    : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 30 && (
        <div style={{fontSize:'0.7rem',color:'#9bb',padding:'8px 12px'}}>
          Mostrando 30 de {data.length} registros. Descarga el Excel para ver todos.
        </div>
      )}
    </div>
  );
}

// ──────────────────── Table Export Section ─────────────────────
const CATEGORY_LABELS = {
  finanzas:   '💰 Finanzas',
  inventario: '📦 Inventario',
  ventas:     '🛒 Ventas',
  clientes:   '👥 Clientes',
  personal:   '👷 Personal',
  servicios:  '🔧 Servicios',
};

function TableExportSection({ tables, ETL_API, ETL_PREFIX }) {
  const [downloading, setDownloading] = useState({});
  const [rowCounts, setRowCounts]     = useState({});

  useEffect(() => {
    fetch(`${ETL_API}${ETL_PREFIX}/tables/stats`)
      .then(r => r.json())
      .catch(() => ({ counts: {} }))
      .then(d => setRowCounts(d.counts || {}));
  }, [ETL_API, ETL_PREFIX]);

  const handleDownload = async (table) => {
    setDownloading(prev => ({ ...prev, [table.name]: true }));
    try {
      const res = await fetch(`${ETL_API}${ETL_PREFIX}/tables/${table.name}/export`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table.name}_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert(`No se pudo descargar ${table.display_name}: ${e.message}`);
    } finally {
      setDownloading(prev => ({ ...prev, [table.name]: false }));
    }
  };

  if (!tables?.length) return null;

  const byCategory = tables.reduce((acc, t) => {
    const cat = t.category || 'otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(byCategory).map(([cat, tbls]) => (
        <div key={cat} style={{marginBottom:28}}>
          <div style={{fontSize:'0.8rem',fontWeight:700,textTransform:'uppercase',
            letterSpacing:'0.5px',color:'#3ab0e8',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:'1.2rem'}}>{CATEGORY_LABELS[cat]?.split(' ')[0]}</span>
            {CATEGORY_LABELS[cat] || cat}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
            {tbls.map(table => {
              const count = rowCounts[table.name];
              const isLoading = downloading[table.name];
              return (
                <div key={table.name} style={{
                  background:'#fff', border:'1px solid rgba(70,165,220,0.12)',
                  borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
                  display:'flex', flexDirection:'column', justifyContent:'space-between',
                }}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:10}}>
                      <span style={{fontSize:'1.4rem',flexShrink:0}}>{table.icon}</span>
                      <div style={{minWidth:0,flex:1}}>
                        <div style={{fontWeight:700,fontSize:'0.82rem',color:'#1a4a6a',marginBottom:2}}>
                          {table.display_name}
                        </div>
                        <div style={{fontSize:'0.68rem',color:'#6b9ab8',lineHeight:1.3}}>
                          {table.description}
                        </div>
                      </div>
                    </div>
                    {count != null && (
                      <div style={{fontSize:'0.7rem',fontWeight:700,color:'#3ab0e8',marginBottom:8}}>
                        {count.toLocaleString('es-PE')} registros
                      </div>
                    )}
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {Object.entries(table.columns).slice(0,3).map(([k,v]) => (
                        <span key={k} style={{
                          fontSize:'0.58rem',padding:'2px 6px',borderRadius:4,
                          background:'rgba(58,176,232,0.1)',color:'#3a7ab5',fontWeight:600}}>
                          {v.label}
                        </span>
                      ))}
                      {Object.keys(table.columns).length > 3 && (
                        <span style={{fontSize:'0.58rem',color:'#9bb',padding:'2px 0'}}>
                          +{Object.keys(table.columns).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(table)}
                    disabled={isLoading}
                    style={{
                      marginTop:12, padding:'8px 12px', borderRadius:9, fontSize:'0.75rem', fontWeight:700,
                      border:'1.5px solid #1a7ab5',
                      background: isLoading ? 'rgba(26,122,181,0.15)' : 'linear-gradient(135deg,rgba(26,122,181,0.15),rgba(58,176,232,0.08))',
                      color:'#1a7ab5', cursor: isLoading ? 'not-allowed' : 'pointer',
                      whiteSpace:'nowrap',transition:'all 0.15s'}}>
                    {isLoading ? '⏳' : '↓ Descargar Excel'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
