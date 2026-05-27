import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import { buildApiUrl } from '../../config';
import ImageEditorModal from '../ImageEditor/ImageEditorModal';

/* ─── Estilos ─────────────────────────────────────────────── */
const REG_STYLES = `
  @keyframes reg-pop {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes reg-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes reg-modal-in {
    from { opacity: 0; transform: scale(0.88) translateY(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-highlight {
    0% { background: rgba(148,25,24,0.35); }
    100% { background: transparent; }
  }
  .reg-card.new-highlight {
    animation: pulse-highlight 1.2s ease-in-out;
  }

  /* ── Modal de confirmación ── */
  .reg-confirm-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(10,20,40,0.55);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: reg-fade-in 0.18s ease;
  }
  .reg-confirm-box {
    background: #fff; border-radius: 20px; padding: 36px 36px 28px;
    max-width: 400px; width: 90%;
    box-shadow: 0 24px 64px rgba(148,25,24,0.22), 0 4px 16px rgba(0,0,0,0.12);
    animation: reg-modal-in 0.22s cubic-bezier(.34,1.56,.64,1) both;
    display: flex; flex-direction: column; align-items: center;
  }
  .reg-confirm-icon-wrap {
    width: 68px; height: 68px; border-radius: 50%;
    background: linear-gradient(135deg, #fff1f0 0%, #ffe0df 100%);
    border: 3px solid rgba(232,68,58,0.18);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    box-shadow: 0 4px 18px rgba(232,68,58,0.14);
  }
  .reg-confirm-title {
    font-size: 1.08rem; font-weight: 800; color: #1a1a2e;
    margin: 0 0 8px 0; text-align: center;
  }
  .reg-confirm-msg {
    font-size: 0.88rem; color: #5a6a7a; text-align: center;
    margin: 0 0 28px 0; line-height: 1.55;
  }
  .reg-confirm-msg strong { color: #941918; }
  .reg-confirm-actions { display: flex; gap: 12px; width: 100%; }
  .reg-confirm-cancel {
    flex: 1; padding: 11px 0; border-radius: 10px;
    border: 1.5px solid rgba(128,194,220,0.50);
    background: rgba(128,194,220,0.12); color: #1a4a6a;
    font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.18s;
  }
  .reg-confirm-cancel:hover { background: rgba(128,194,220,0.25); }
  .reg-confirm-ok {
    flex: 1; padding: 11px 0; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #e8443a 0%, #b52a22 100%);
    color: #fff; font-weight: 700; font-size: 0.88rem; cursor: pointer;
    box-shadow: 0 4px 14px rgba(232,68,58,0.30); transition: all 0.18s;
  }
  .reg-confirm-ok:hover { box-shadow: 0 6px 20px rgba(232,68,58,0.42); transform: translateY(-1px); }

  /* ── Filtro categorías ── */
  .reg-filter-bar {
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; margin-bottom: 28px;
  }
  .reg-filter-label {
    font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: #941918; margin-right: 4px;
  }
  .reg-cat-btn {
    padding: 6px 16px; border-radius: 999px;
    border: 1.5px solid rgba(148,25,24,0.30);
    background: rgba(255,255,255,0.55); color: #941918;
    font-weight: 700; font-size: 0.78rem; letter-spacing: 0.4px;
    cursor: pointer; backdrop-filter: blur(6px); transition: all 0.2s;
  }
  .reg-cat-btn:hover { background: rgba(148,25,24,0.10); border-color: #941918; }
  .reg-cat-btn.active {
    background: linear-gradient(135deg, #941918 0%, #6b100f 100%);
    color: #fff; border-color: transparent;
    box-shadow: 0 3px 10px rgba(148,25,24,0.30);
  }

  /* ── Layout ── */
  .reg-layout {
    display: grid; grid-template-columns: 1fr;
    gap: 16px; align-items: start;
  }
  @media (min-width: 640px) { 
    .reg-layout { gap: 20px; } 
  }
  @media (min-width: 900px) { 
    .reg-layout { grid-template-columns: 1fr 1.45fr; gap: 24px; } 
  }
  .reg-container { display: flex; flex-direction: column; gap: 16px; }
  @media (min-width: 900px) { 
    .reg-container { gap: 24px; } 
  }
  .reg-left-panel { display: flex; flex-direction: column; gap: 12px; }
  .reg-panel-title {
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: #941918; margin: 0;
  }
  @media (min-width: 640px) { 
    .reg-panel-title { font-size: 0.78rem; } 
  }
  .reg-search {
    width: 100%; box-sizing: border-box; padding: 8px 12px 8px 32px;
    border: 1.5px solid rgba(128,194,220,0.28); border-radius: 8px;
    background: rgba(255,255,255,0.70); font-size: 0.8rem; color: #1a4a6a;
    outline: none; backdrop-filter: blur(8px); transition: border-color 0.2s, box-shadow 0.2s;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2380C2DC' stroke-width='2'%3e%3ccircle cx='11' cy='11' r='8'/%3e%3cline x1='21' y1='21' x2='16.65' y2='16.65'/%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: 10px center; background-size: 14px;
  }
  @media (min-width: 640px) { 
    .reg-search { padding: 10px 14px 10px 38px; font-size: 0.88rem; background-size: 16px; background-position: 11px center; } 
  }
  .reg-search:focus { border-color: rgba(128,194,220,0.55); box-shadow: 0 0 0 3px rgba(128,194,220,0.12); }

  .reg-grid {
    display: grid; grid-template-columns: 1fr; gap: 10px;
    max-height: 50vh; overflow-y: auto; overflow-x: hidden; padding-right: 2px; flex-shrink: 0;
  }
  .reg-grid::-webkit-scrollbar { width: 5px; }
  .reg-grid::-webkit-scrollbar-track { background: rgba(128,194,220,0.06); border-radius: 999px; }
  .reg-grid::-webkit-scrollbar-thumb { background: rgba(128,194,220,0.35); border-radius: 999px; }
  .reg-grid::-webkit-scrollbar-thumb:hover { background: #941918; }
  @media (min-width: 640px) { 
    .reg-grid { grid-template-columns: 1fr 1fr; gap: 12px; padding-right: 4px; max-height: 60vh; } 
  }
  .reg-card {
    position: relative; min-height: 150px; border-radius: 10px; cursor: pointer;
    background-size: cover; background-position: center; border: 2px solid transparent;
    overflow: visible; display: flex; align-items: flex-end;
    transition: transform 0.22s, box-shadow 0.22s, border-color 0.18s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.13); animation: reg-pop 0.3s ease both;
  }
  @media (min-width: 640px) { 
    .reg-card { min-height: 190px; border-radius: 14px; } 
  }
  .reg-card:hover { transform: scale(1.025); box-shadow: 0 8px 22px rgba(0,0,0,0.22); }
  .reg-card.selected { border-color: #80C2DC; box-shadow: 0 0 0 3px rgba(128,194,220,0.35), 0 8px 22px rgba(0,0,0,0.18); }
  .reg-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 28%, rgba(0,20,40,0.82) 100%); z-index: 1;
  }
  .reg-card-info { position: relative; z-index: 2; width: 100%; padding: 8px 10px; color: #fff; }
  @media (min-width: 640px) { 
    .reg-card-info { padding: 10px 12px; } 
  }
  .reg-card-name { font-weight: 700; font-size: 0.75rem; margin: 0 0 2px 0; line-height: 1.2; }
  @media (min-width: 640px) { 
    .reg-card-name { font-size: 0.88rem; margin: 0 0 3px 0; } 
  }
  .reg-card-desc { font-size: 0.65rem; opacity: 0.82; margin: 0 0 3px 0; overflow: hidden; max-height: 1.6em; text-overflow: ellipsis; white-space: nowrap; }
  @media (min-width: 640px) { 
    .reg-card-desc { font-size: 0.72rem; margin: 0 0 4px 0; } 
  }
  .reg-card-meta { display: flex; gap: 8px; font-size: 0.65rem; align-items: center; }
  @media (min-width: 640px) { 
    .reg-card-meta { gap: 10px; font-size: 0.72rem; } 
  }
  .reg-card-qty { color: #7affd4; font-weight: 600; }

  .reg-card-alert {
    position: absolute; top: 8px; right: 8px; cursor: help;
    display: flex; align-items: center;
    background: rgba(0,0,0,0.55); padding: 4px 6px; border-radius: 6px;
    backdrop-filter: blur(4px); z-index: 10;
  }
  .reg-card-alert.alert-low  { color: #ff6b35; }
  .reg-card-alert.alert-zero { color: #ff3b3b; }

  .reg-card-tooltip {
    position: absolute; bottom: 100%; left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: rgba(0,0,0,0.95); color: #fff; padding: 8px 12px;
    border-radius: 6px; font-size: 0.75rem; white-space: nowrap;
    z-index: 100; pointer-events: none; animation: slideUp 0.2s ease-out;
  }
  .reg-card-tooltip::after {
    content: ''; position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%); border: 4px solid transparent;
    border-top-color: rgba(0,0,0,0.95);
  }
  .reg-empty { grid-column: 1 / -1; text-align: center; color: #7ab0cc; font-size: 0.85rem; padding: 32px 0; }

  /* ── Reporte ── */
  .reg-left-report { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .reg-left-report-header {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  }
  .reg-left-report-title {
    font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: #941918; margin: 0;
  }
  .reg-btn-pdf {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px; border: none;
    background: linear-gradient(135deg, #941918 0%, #6b100f 100%);
    color: #fff; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.3px;
    cursor: pointer; box-shadow: 0 3px 12px rgba(148,25,24,0.30);
    transition: box-shadow 0.2s, transform 0.15s;
  }
  @media (min-width: 640px) { 
    .reg-btn-pdf { padding: 9px 22px; font-size: 0.82rem; } 
  }
  .reg-btn-pdf:hover { box-shadow: 0 5px 18px rgba(148,25,24,0.42); transform: translateY(-1px); }
  .reg-btn-pdf:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; transform: none; }

  .reg-left-table-wrap {
    width: 100%; overflow-x: auto;
    border-radius: 10px; border: 1.5px solid rgba(128,194,220,0.18);
    background: rgba(255,255,255,0.70);
  }
  .reg-left-table {
    width: 100%; border-collapse: collapse; font-size: 0.7rem; 
    table-layout: fixed; min-width: 100%;
  }
  @media (min-width: 640px) { 
    .reg-left-table { font-size: 0.8rem; min-width: 600px; } 
  }
  @media (min-width: 900px) { 
    .reg-left-table { font-size: 0.8rem; min-width: 900px; } 
  }
  .reg-left-table thead tr { background: rgba(128,194,220,0.15); }
  .reg-left-table th {
    padding: 6px 8px; text-align: left; font-size: 0.65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.3px; color: #941918;
    border-bottom: 1.5px solid rgba(128,194,220,0.25);
    background: rgba(210,240,255,0.60);
    overflow: hidden; text-overflow: ellipsis;
  }
  @media (min-width: 640px) { 
    .reg-left-table th { padding: 9px 12px; font-size: 0.7rem; letter-spacing: 0.4px; } 
  }
  .reg-left-table td {
    padding: 6px 8px; color: #1a4a6a;
    border-bottom: 1px solid rgba(128,194,220,0.10);
    overflow: hidden; text-overflow: ellipsis;
    font-size: 0.65rem;
  }
  @media (min-width: 640px) { 
    .reg-left-table td { padding: 8px 12px; font-size: 0.75rem; } 
  }
  .reg-left-table tbody tr:last-child td { border-bottom: none; }
  .reg-left-table tbody tr:hover td { background: rgba(210,240,255,0.35); }
  .reg-left-table-empty { text-align: center !important; color: #7ab0cc; padding: 15px 0 !important; font-size: 0.7rem; white-space: normal !important; }
  @media (min-width: 640px) { 
    .reg-left-table-empty { padding: 20px 0 !important; font-size: 0.8rem; } 
  }
  .reg-left-table tfoot td { background: rgba(148,25,24,0.06); font-weight: 700; }

  /* ── Form ── */
  .reg-right-panel {
    background: rgba(255,255,255,0.60); border: 1.5px solid rgba(128,194,220,0.35);
    border-radius: 14px; padding: 16px 14px 14px; backdrop-filter: blur(14px);
    box-shadow: 0 6px 28px rgba(148,25,24,0.08), inset 0 1px 0 rgba(255,255,255,0.80);
    display: flex; flex-direction: column; gap: 0;
  }
  @media (min-width: 640px) { 
    .reg-right-panel { border-radius: 16px; padding: 20px 20px 18px; } 
  }
  @media (min-width: 900px) { 
    .reg-right-panel { border-radius: 18px; padding: 28px 28px 24px; } 
  }
  .reg-form-title {
    font-size: 1rem; font-weight: 800; color: #941918;
    margin: 0 0 16px 0; letter-spacing: 0.2px;
  }
  @media (min-width: 640px) { 
    .reg-form-title { font-size: 1.08rem; margin: 0 0 18px 0; } 
  }
  @media (min-width: 900px) { 
    .reg-form-title { font-size: 1.15rem; margin: 0 0 22px 0; } 
  }
  .reg-form-grid { 
    display: grid; grid-template-columns: 1fr; gap: 10px 10px; margin-bottom: 12px; 
  }
  @media (min-width: 640px) { 
    .reg-form-grid { grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-bottom: 14px; } 
  }
  @media (min-width: 900px) { 
    .reg-form-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px 14px; margin-bottom: 16px; } 
  }
  .reg-form-full { grid-column: 1 / -1; }
  .reg-field label {
    display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.4px; color: #941918; margin-bottom: 4px;
  }
  @media (min-width: 640px) { 
    .reg-field label { font-size: 0.72rem; letter-spacing: 0.5px; margin-bottom: 6px; } 
  }
  .reg-input, .reg-select, .reg-textarea {
    width: 100%; box-sizing: border-box; padding: 5px 8px;
    border: 1.5px solid rgba(128,194,220,0.28); border-radius: 6px;
    background: rgba(255,255,255,0.72); font-size: 0.75rem; color: #1a4a6a;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(4px); font-family: inherit; min-height: 28px;
  }
  @media (min-width: 640px) { 
    .reg-input, .reg-select, .reg-textarea { padding: 6px 10px; font-size: 0.82rem; border-radius: 8px; min-height: 32px; } 
  }
  .reg-input:focus, .reg-select:focus, .reg-textarea:focus {
    border-color: rgba(148,25,24,0.60); box-shadow: 0 0 0 3px rgba(148,25,24,0.12);
    background: rgba(255,255,255,0.90);
  }
  .reg-select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2380C2DC' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right 8px center;
    background-size: 16px; padding-right: 28px;
  }
  @media (min-width: 640px) { 
    .reg-select { background-position: right 10px center; background-size: 18px; padding-right: 34px; } 
  }
  .reg-textarea { min-height: 40px; resize: vertical; }
  @media (min-width: 640px) { 
    .reg-textarea { min-height: 50px; } 
  }

  .reg-img-row {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; padding: 12px;
    background: linear-gradient(135deg, rgba(148,25,24,0.04) 0%, rgba(128,194,220,0.08) 100%);
    border: 2px dashed #80C2DC; border-radius: 12px; margin-bottom: 4px;
    cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;
    animation: slideUp 0.5s ease-out;
  }
  @media (min-width: 640px) { 
    .reg-img-row { flex-direction: row; justify-content: space-between; gap: 16px; padding: 16px; border-radius: 16px; } 
  }
  .reg-img-row:hover {
    background: linear-gradient(135deg, rgba(148,25,24,0.08) 0%, rgba(128,194,220,0.12) 100%);
    border-color: #941918; box-shadow: 0 4px 12px rgba(148,25,24,0.15);
  }
  .reg-img-left { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
  @media (min-width: 640px) { 
    .reg-img-left { gap: 8px; } 
  }
  .reg-preview {
    width: 70px; height: 70px; object-fit: cover; border-radius: 10px;
    border: 2px solid #80C2DC; background: #f8fafb;
    box-shadow: 0 2px 8px rgba(128,194,220,0.20); transition: all 0.3s ease;
  }
  @media (min-width: 640px) { 
    .reg-preview { width: 90px; height: 90px; border-radius: 12px; } 
  }
  .reg-preview:hover { box-shadow: 0 4px 16px rgba(148,25,24,0.15); transform: scale(1.03); }
  .reg-img-label { font-size: 0.7rem; font-weight: 600; color: #941918; display: block; text-align: center; }
  @media (min-width: 640px) { 
    .reg-img-label { font-size: 0.8rem; } 
  }
  .reg-file-input { display: none; }
  .reg-img-buttons {
    display: flex; flex-direction: column; gap: 8px;
    align-items: center; justify-content: center; flex-shrink: 0;
    width: 100%;
  }
  @media (min-width: 640px) { 
    .reg-img-buttons { width: auto; gap: 10px; } 
  }
  .reg-img-buttons .reg-btn { min-width: 90px; padding: 8px 12px; font-size: 0.7rem; }
  @media (min-width: 640px) { 
    .reg-img-buttons .reg-btn { min-width: 100px; padding: 10px 16px; font-size: 0.85rem; } 
  }

  .reg-btn {
    display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px;
    border-radius: 8px; border: none; font-weight: 700; font-size: 0.7rem;
    letter-spacing: 0.3px; cursor: pointer; transition: all 0.2s;
  }
  @media (min-width: 640px) { 
    .reg-btn { gap: 6px; padding: 9px 20px; font-size: 0.82rem; } 
  }
  .reg-btn:hover { transform: translateY(-1px); }
  .reg-btn-danger  { background: #e8443a; color: #fff; box-shadow: 0 3px 10px rgba(232,68,58,0.25); }
  .reg-btn-danger:hover  { background: #cc3830; box-shadow: 0 5px 14px rgba(232,68,58,0.35); }
  .reg-btn-danger:disabled { background: #d4b8b8; box-shadow: none; cursor: not-allowed; transform: none; }
  .reg-btn-neutral { background: rgba(128,194,220,0.30); color: #941918; border: 1.5px solid rgba(128,194,220,0.50); }
  .reg-btn-neutral:hover { background: rgba(128,194,220,0.50); }
  .reg-btn-primary { background: linear-gradient(135deg, #941918 0%, #6b100f 100%); color: #fff; box-shadow: 0 3px 12px rgba(148,25,24,0.30); }
  .reg-btn-primary:hover { box-shadow: 0 5px 18px rgba(148,25,24,0.42); }
  .reg-divider { border: none; border-top: 1px solid rgba(128,194,220,0.25); margin: 16px 0; }
  @media (min-width: 640px) { 
    .reg-divider { margin: 20px 0; } 
  }
  @media (min-width: 900px) { 
    .reg-divider { margin: 24px 0; } 
  }
`;

/* ─── Helpers ──────────────────────────────────────────────── */
const injectStyles = () => {
  const id = 'reg-styles-v2';
  if (!document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = REG_STYLES;
    document.head.appendChild(tag);
  }
};

const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
  const s1 = document.createElement('script');
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    s2.onload  = () => resolve(window.jspdf.jsPDF);
    s2.onerror = reject;
    document.head.appendChild(s2);
  };
  s1.onerror = reject;
  document.head.appendChild(s1);
});

/* ─── Modal de confirmación ─────────────────────────────── */
const ConfirmModal = ({ nombreProducto, onAceptar, onCancelar }) => (
  <div className="reg-confirm-backdrop" onClick={onCancelar}>
    <div className="reg-confirm-box" onClick={e => e.stopPropagation()}>
      <div className="reg-confirm-icon-wrap">
        <IconAlertTriangle size={32} color="#e8443a" stroke={2} />
      </div>
      <p className="reg-confirm-title">¿Eliminar producto?</p>
      <p className="reg-confirm-msg">
        Esta acción no se puede deshacer. Se eliminará permanentemente{' '}
        <strong>"{nombreProducto}"</strong> del inventario.
      </p>
      <div className="reg-confirm-actions">
        <button className="reg-confirm-cancel" onClick={onCancelar}>Cancelar</button>
        <button className="reg-confirm-ok"     onClick={onAceptar}>Sí, eliminar</button>
      </div>
    </div>
  </div>
);

/* ─── Campos técnicos por categoría ────────────────────── */
const CamposTecnicos = ({ esVidrio, esAluminio, det, setDet }) => {
  if (!esVidrio && !esAluminio) return null;
  const upd = (k, v) => setDet(prev => ({ ...prev, [k]: v }));
  const num = (k) => (
    <input className="reg-input" type="number" step="0.01" min="0"
      value={det[k] ?? ''} onChange={e => upd(k, e.target.value)} />
  );
  return (
    <div className="reg-field reg-form-full" style={{ marginTop: 4 }}>
      <label style={{ marginBottom: 8, display: 'block' }}>
        Especificaciones técnicas {esVidrio ? '(Vidrio)' : '(Aluminio)'}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '8px 12px',
        background: 'rgba(128,194,220,0.08)', borderRadius: 10, padding: '12px', border: '1.5px dashed rgba(128,194,220,0.35)' }}>
        {esVidrio && <>
          <div className="reg-field"><label>Plancha ancho (cm)</label>{num('plancha_ancho_cm')}</div>
          <div className="reg-field"><label>Plancha alto (cm)</label>{num('plancha_alto_cm')}</div>
          <div className="reg-field"><label>Espesor (mm)</label>{num('espesor_mm')}</div>
          <div className="reg-field"><label>Tolerancia (mm)</label>{num('tolerancia_mm')}</div>
        </>}
        {esAluminio && <>
          <div className="reg-field"><label>Rebaje (mm)</label>{num('rebaje_mm')}</div>
          <div className="reg-field"><label>Cara visible (mm)</label>{num('cara_visible_mm')}</div>
          <div className="reg-field"><label>Largo barra (cm)</label>{num('barra_largo_cm')}</div>
          <div className="reg-field"><label>Tolerancia (mm)</label>{num('tolerancia_mm')}</div>
          <div className="reg-field">
            <label>Serie</label>
            <input className="reg-input" value={det.serie ?? ''} onChange={e => upd('serie', e.target.value)} placeholder='ej: Serie 20' />
          </div>
          <div className="reg-field">
            <label>Forma</label>
            <select className="reg-select" value={det.forma ?? ''} onChange={e => upd('forma', e.target.value)}>
              <option value="">--</option>
              <option value="L">L (Ángulo)</option>
              <option value="U">U (Canal)</option>
              <option value="H">H (Cruceta)</option>
              <option value="riel">Riel</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </>}
      </div>
    </div>
  );
};

/* ─── Campos reutilizables ──────────────────────────────── */
const CamposFormulario = ({ conGrosor, nombre, setNombre, codigo, setCodigo,
  cantidad, setCantidad, precio, setPrecio, grosor, setGrosor,
  fila, setFila, columna, setColumna, descripcion, setDesc }) => (
  <>
    <div className="reg-field">
      <label>Nombre</label>
      <input className="reg-input" value={nombre}
        onChange={e => setNombre(e.target.value.replace(/[0-9]/g, ''))} />
    </div>
    <div className="reg-field">
      <label>Código</label>
      <input className="reg-input" value={codigo}
        onChange={e => setCodigo(e.target.value)} />
    </div>
    <div className="reg-field">
      <label>Cantidad</label>
      <input className="reg-input" value={cantidad}
        onChange={e => setCantidad(e.target.value.replace(/[^0-9]/g, ''))} />
    </div>
    <div className="reg-field">
      <label>Precio Unitario</label>
      <input className="reg-input" value={precio}
        onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); if((v.match(/\./g)||[]).length<=1) setPrecio(v); }} />
    </div>
    {conGrosor && (
      <div className="reg-field">
        <label>Grosor</label>
        <input className="reg-input" value={grosor}
          onChange={e => setGrosor(e.target.value.replace(/[^0-9.-]/g, ''))} />
      </div>
    )}
    <div className="reg-field reg-form-full"><label>Lugar</label></div>
    <div className="reg-field">
      <label>Fila</label>
      <input className="reg-input" value={fila}
        onChange={e => setFila(e.target.value)} />
    </div>
    <div className="reg-field">
      <label>Columna</label>
      <input className="reg-input" value={columna}
        onChange={e => setColumna(e.target.value)} />
    </div>
    <div className="reg-field reg-form-full">
      <label>Descripción</label>
      <textarea className="reg-textarea" value={descripcion}
        onChange={e => setDesc(e.target.value)} />
    </div>
  </>
);

/* ─── Componente principal ──────────────────────────────── */
const RegistroProductos = ({ categoriasCache, productosCache, cargarProductos, showToast }) => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [filtroCatId, setFiltroCatId]   = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const [nombre, setNombre]     = useState('');
  const [codigo, setCodigo]     = useState('');
  const [categoriaId, setCatId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio]     = useState('');
  const [descripcion, setDesc]  = useState('');
  const [grosor, setGrosor]     = useState('');
  const [lugar, setLugar]       = useState('');
  const [fila, setFila]         = useState('');
  const [columna, setColumna]   = useState('');

  const [newImageFile, setImgFile]   = useState(null);
  const [previewSrc, setPreview]     = useState('');
  const [originalImgUrl, setOrigImg] = useState('');
  const [productosAnotados, setAnotados] = useState([]);
  const [hoverAlert, setHoverAlert]  = useState(null);
  const [fileKey, setFileKey]        = useState(0);
  const [confirmData, setConfirmData] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [newProductIds, setNewProductIds] = useState(new Set());
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [catDetalle, setCatDetalle]  = useState({});

  // Cargar specs técnicas al cambiar categoría
  useEffect(() => {
    if (!categoriaId) { setCatDetalle({}); return; }
    fetch(`/api/categorias/${categoriaId}/detalle`)
      .then(r => r.json())
      .then(d => setCatDetalle(d?.data || {}))
      .catch(() => setCatDetalle({}));
  }, [categoriaId]);

  const catObj  = categoriasCache.find(c => String(c.id_categoria) === String(categoriaId));
  const rawName = (catObj?.nombre || catObj?.nombre_categoria || catObj?.descripcion || '');
  const catName = rawName.toLowerCase().trim().replace(/\s+/g, '');
  const esVidrio    = catName.includes('vidrio');
  const esAluminio  = catName.includes('aluminio');
  const esAccesorio = catName.includes('accesorio');

  useEffect(() => { injectStyles(); }, []);

  // Conectar al stream de tiempo real de productos del backend
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/productos'));

    const onProductosChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        if (payload?.initial) return; // Ignorar snapshot inicial

        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        if (!changes.length) return;

        const inserts = changes.filter(c => c?.op === 'insert' && c?.record);
        const updates = changes.filter(c => c?.op === 'update' && c?.record);
        const deletes = changes.filter(c => c?.op === 'delete');
        
        // Actualizar estado con cambios
        setProductos(prev => {
          const map = new Map((prev || []).map(p => [String(p.id_producto || p.id), p]));
          
          // Procesar eliminaciones
          deletes.forEach(del => {
            const id = String(del?.id || '');
            if (id) map.delete(id);
          });
          
          // Procesar inserciones y actualizaciones
          [...inserts, ...updates].forEach(change => {
            const id = String(change?.id || change?.record?.id_producto || '');
            if (id && change?.record) {
              map.set(id, change.record);
            }
          });

          return Array.from(map.values());
        });
        
        // Marcar nuevos productos para animación
        if (inserts.length > 0) {
          inserts.forEach(insert => {
            const id = insert?.id || insert?.record?.id_producto;
            if (id) {
              setNewProductIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
              });
              // Limpiar animación después de 2 segundos
              setTimeout(() => {
                setNewProductIds(prev => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, 2000);
            }
          });
        }
        
        // Limpiar selección si el producto seleccionado fue eliminado
        if (deletes.length > 0 && seleccionado) {
          const deleteIds = new Set(deletes.map(d => String(d?.id || '')));
          const selectedId = String(seleccionado.id_producto || seleccionado.id || '');
          if (deleteIds.has(selectedId)) {
            setSeleccionado(null);
          }
        }
      } catch {
        // Ignorar payloads malformados
      }
    };

    es.addEventListener('productos_changed', onProductosChanged);

    return () => {
      es.removeEventListener('productos_changed', onProductosChanged);
      es.close();
    };
  }, [seleccionado]);

  const limpiar = useCallback(() => {
    setNombre(''); setCodigo(''); setCatId(''); setCantidad('');
    setPrecio(''); setDesc(''); setGrosor(''); setLugar(''); setFila(''); setColumna('');
    setImgFile(null); setPreview(''); setOrigImg(''); setSeleccionado(null);
    setFileKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!seleccionado) return;
    setNombre(seleccionado.nombre || '');
    setCodigo(seleccionado.codigo || '');
    setCatId(String(seleccionado.categoria_id || seleccionado.id_categoria || ''));
    setCantidad(String(seleccionado.cantidad ?? ''));
    setPrecio(String((seleccionado.precio ?? seleccionado.precio_unitario) ?? ''));
    setDesc(seleccionado.descripcion || '');
    setGrosor(seleccionado.grosor ?? '');
    setLugar(seleccionado.lugar || '');
    setFila(seleccionado.fila ?? '');
    setColumna(seleccionado.columna ?? '');
    setImgFile(null);
    const img = seleccionado.IMG_P && seleccionado.IMG_P !== '' ? seleccionado.IMG_P : '';
    setPreview(img); setOrigImg(img);
  }, [seleccionado]);

  useEffect(() => { if (esAccesorio) setGrosor(''); }, [esAccesorio]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    setImgFile(file);
    if (file) {
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target.result);
      r.readAsDataURL(file);
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim())                    return showToast('El nombre es obligatorio.', 'error');
    if (!codigo.trim())                    return showToast('El código es obligatorio.', 'error');
    if (!categoriaId)                      return showToast('Selecciona una categoría.', 'error');
    if (!cantidad || Number(cantidad) < 1) return showToast('La cantidad debe ser ≥ 1.', 'error');
    if (!precio   || Number(precio)  <= 0) return showToast('El precio debe ser > 0.', 'error');

    const existe = productosCache.find(p => p.codigo === codigo);
    const datos  = { nombre, codigo, categoria_id: categoriaId, cantidad, precio_unitario: precio,
                     descripcion, grosor: esVidrio ? grosor : '', fila, columna };

    // Guardar specs técnicas de la categoría si hay datos
    const specFields = ['plancha_ancho_cm','plancha_alto_cm','espesor_mm','rebaje_mm',
                        'cara_visible_mm','barra_largo_cm','tolerancia_mm','serie','forma'];
    const specPayload = {};
    specFields.forEach(k => { if (catDetalle[k] !== undefined && catDetalle[k] !== '') specPayload[k] = catDetalle[k]; });
    if (Object.keys(specPayload).length > 0) {
      fetch(`/api/categorias/${categoriaId}/detalle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specPayload),
      }).catch(() => {});
    }

    let imgUrl = originalImgUrl;
    let processingMetadata = null;
    if (newImageFile) {
      const fd = new FormData();
      fd.append('file', newImageFile);
      fd.append('categoria', catName || 'otro');
      fd.append('incluir_segmentacion', 'true');
      fd.append('incluir_clasificacion', 'true');

      try {
        // Mostrar toast de procesamiento
        showToast('⏳ Procesando imagen (eliminar fondo, segmentar, clasificar)...', 'info');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos timeout

        const r = await fetch('/api/productos/procesar-imagen', {
          method: 'POST',
          body: fd,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const d = await r.json();
        if (r.ok && d.url) {
          imgUrl = d.url;
          processingMetadata = d.metadata;

          // Mostrar info de procesamiento
          const tiempo = (d.metadata?.processing_time || 0).toFixed(2);
          showToast(`✓ Imagen procesada en ${tiempo}s (fondo eliminado)`, 'success');
        } else {
          return showToast(`Error: ${d.error || 'Error desconocido'}`, 'error');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return showToast('Timeout: procesamiento tomó demasiado tiempo', 'error');
        }
        return showToast('Error procesando imagen', 'error');
      }
    }
    datos.IMG_P = imgUrl || '';
    // Guardar metadata de clasificación si está disponible
    if (processingMetadata?.classification) {
      datos.clasificacion_automatica = processingMetadata.classification;
    }

    try {
      const url    = existe ? `/api/productos/${existe.id_producto}` : '/api/productos';
      const method = existe ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      if (!res.ok) throw new Error();
      showToast(`Producto ${existe ? 'actualizado' : 'registrado'} correctamente`);
      setAnotados(prev => [...prev, { ...datos }]);
      limpiar();
      await cargarProductos();
      localStorage.setItem('productos-updated-at', Date.now().toString());
    } catch { showToast('Error al guardar producto', 'error'); }
  };

  const handleEliminar = () => {
    if (!seleccionado) return showToast('Selecciona un producto para eliminar.', 'error');
    setConfirmData({
      nombre: seleccionado.nombre,
      onAceptar: async () => {
        setConfirmData(null);
        try {
          const res = await fetch(`/api/productos/${seleccionado.id_producto}`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          showToast('Producto eliminado correctamente');
          await cargarProductos();
          limpiar();
        } catch { showToast('Error al eliminar producto', 'error'); }
      },
    });
  };

  /* ── PDF profesional ── */
  const handleGenerarPDF = async () => {
    if (productosAnotados.length === 0)
      return showToast('No hay productos anotados para exportar.', 'error');
    setGenerandoPDF(true);
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr  = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      // Banda roja superior
      doc.setFillColor(148, 25, 24);
      doc.rect(0, 0, W, 28, 'F');
      // Línea dorada
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 28, W, 2.5, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19); doc.setTextColor(255, 255, 255);
      doc.text('REPORTE DE PRODUCTOS REGISTRADOS', W / 2, 13, { align: 'center' });
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 210, 170);
      doc.text('VIDRIOBRAS  —  Sistema de Almacén', W / 2, 21, { align: 'center' });
      doc.setFontSize(7.5); doc.setTextColor(255, 235, 200);
      doc.text(`${fechaStr}   ${horaStr}`, W - 10, 10, { align: 'right' });

      // Recuadro de resumen
      const totalQty = productosAnotados.reduce((s, p) => s + Number(p.cantidad || 0), 0);
      const totalVal = productosAnotados.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 0), 0);

      doc.setFillColor(252, 249, 246);
      doc.roundedRect(12, 34, W - 24, 16, 3, 3, 'F');
      doc.setDrawColor(220, 180, 140); doc.setLineWidth(0.4);
      doc.roundedRect(12, 34, W - 24, 16, 3, 3, 'S');

      const kv = (label, value, x) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(148, 25, 24);
        doc.text(label, x, 41);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(26, 74, 106);
        doc.text(String(value), x, 47);
      };
      kv('TOTAL PRODUCTOS', productosAnotados.length, 20);
      kv('TOTAL UNIDADES', totalQty, 70);
      kv('VALOR TOTAL', `S/ ${totalVal.toFixed(2)}`, 130);
      kv('FECHA DE REPORTE', fechaStr, 195);

      // Tabla
      const head = [['#','Código','Nombre','Categoría','Cant.','Precio','Valor Total','Grosor','Fila','Col.','Descripción']];
      const body = productosAnotados.map((p, i) => {
        const cat = categoriasCache.find(c => String(c.id_categoria) === String(p.categoria_id));
        const catN = cat ? (cat.nombre_categoria || cat.nombre || cat.descripcion || '') : (p.categoria_id || '');
        const val  = (Number(p.precio || 0) * Number(p.cantidad || 0)).toFixed(2);
        return [
          i + 1, p.codigo || '', p.nombre || '', catN,
          p.cantidad || '0',
          `S/ ${Number(p.precio || 0).toFixed(2)}`,
          `S/ ${val}`,
          p.grosor || '—', p.fila || '—', p.columna || '—',
          p.descripcion || '—',
        ];
      });

      // Fila de totales
      body.push([
        '', '', '', 'TOTALES',
        String(totalQty), '',
        `S/ ${totalVal.toFixed(2)}`,
        '', '', '', '',
      ]);

      doc.autoTable({
        startY: 54, head, body,
        styles: {
          font: 'helvetica', fontSize: 7.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          textColor: [26, 74, 106], lineColor: [200, 230, 245], lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [148, 25, 24], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7, halign: 'center', cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [242, 250, 255] },
        // Fila de totales con estilo especial
        didParseCell: (data) => {
          if (data.row.index === body.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = [245, 235, 230];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [148, 25, 24];
          }
        },
        columnStyles: {
          0:  { halign: 'center', cellWidth: 8 },
          1:  { cellWidth: 22 },
          2:  { cellWidth: 34 },
          3:  { cellWidth: 28 },
          4:  { halign: 'center', cellWidth: 14 },
          5:  { halign: 'right',  cellWidth: 20 },
          6:  { halign: 'right',  cellWidth: 20 },
          7:  { halign: 'center', cellWidth: 14 },
          8:  { halign: 'center', cellWidth: 12 },
          9:  { halign: 'center', cellWidth: 12 },
          10: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
          const pg  = doc.internal.getCurrentPageInfo().pageNumber;
          const tot = doc.internal.getNumberOfPages();
          doc.setFillColor(148, 25, 24);
          doc.rect(0, H - 10, W, 10, 'F');
          doc.setFillColor(212, 175, 55);
          doc.rect(0, H - 12, W, 2, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(255, 210, 170);
          doc.text('VIDRIOBRAS — Documento Confidencial de Inventario', 14, H - 3.5);
          doc.text(`Pág. ${pg} / ${tot}`, W - 14, H - 3.5, { align: 'right' });
        },
        margin: { left: 12, right: 12 },
      });

      doc.save(`reporte-productos-${now.toISOString().slice(0, 10)}.pdf`);
      showToast('PDF generado correctamente ✓');
    } catch (err) {
      console.error(err);
      showToast('Error al generar PDF', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  /* ── Lógica de alerta ── */
  const getAlertInfo = (p) => {
    const qty = (p.cantidad === undefined || p.cantidad === null || p.cantidad === '')
      ? null : Number(p.cantidad);
    if (qty === null || qty === 0) return { cls: 'alert-zero', msg: 'Sin stock disponible' };
    if (qty <= 5)                  return { cls: 'alert-low',  msg: `Stock bajo: ${qty} unidad${qty !== 1 ? 'es' : ''}` };
    return null;
  };

  const filtrados = productosCache.filter(p => {
    const q = searchTerm.toLowerCase();
    const bySearch = !q || (p.nombre||'').toLowerCase().includes(q) || (p.codigo||'').toLowerCase().includes(q);
    const byCat    = !filtroCatId || String(p.categoria_id || p.id_categoria) === filtroCatId;
    return bySearch && byCat;
  });

  const camposProps = { nombre, setNombre, codigo, setCodigo, cantidad, setCantidad,
    precio, setPrecio, grosor, setGrosor, fila, setFila, columna, setColumna,
    descripcion, setDesc };

  return (
    <>
      {confirmData && (
        <ConfirmModal
          nombreProducto={confirmData.nombre}
          onAceptar={confirmData.onAceptar}
          onCancelar={() => setConfirmData(null)}
        />
      )}

      {/* Filtro */}
      <div className="reg-filter-bar">
        <span className="reg-filter-label">Categoría:</span>
        <button className={`reg-cat-btn${!filtroCatId ? ' active' : ''}`} onClick={() => setFiltroCatId('')}>TODOS</button>
        {categoriasCache.map(c => {
          const cid = String(c.id_categoria);
          const label = (c.nombre_categoria || c.nombre || c.descripcion || `ID:${cid}`).toUpperCase();
          return (
            <button key={cid} className={`reg-cat-btn${filtroCatId === cid ? ' active' : ''}`}
              onClick={() => setFiltroCatId(filtroCatId === cid ? '' : cid)}>{label}</button>
          );
        })}
      </div>

      {/* Layout */}
      <div className="reg-container">
        <div className="reg-layout">

          {/* Tarjetas */}
          <div className="reg-left-panel">
            <p className="reg-panel-title">Productos existentes</p>
            <input className="reg-search" type="text" placeholder="Buscar por nombre o código…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="reg-grid">
              {filtrados.length === 0
                ? <div className="reg-empty">No se encontraron productos.</div>
                : filtrados.map(p => {
                    const alert = getAlertInfo(p);
                    return (
                      <div key={p.id_producto}
                        className={`reg-card${seleccionado?.id_producto === p.id_producto ? ' selected' : ''}${newProductIds.has(p.id_producto) ? ' new-highlight' : ''}`}
                        style={{ backgroundImage: `url('${p.IMG_P || 'https://via.placeholder.com/300'}')` }}
                        onClick={() => setSeleccionado(p)}>
                        <div className="reg-card-overlay" />
                        {alert && (
                          <div className={`reg-card-alert ${alert.cls}`}
                            onMouseEnter={() => setHoverAlert(p.id_producto)}
                            onMouseLeave={() => setHoverAlert(null)}>
                            <IconAlertTriangle stroke={1.5} size={18} />
                            {hoverAlert === p.id_producto && (
                              <div className="reg-card-tooltip">{alert.msg}</div>
                            )}
                          </div>
                        )}
                        <div className="reg-card-info">
                          <p className="reg-card-name">{p.nombre || 'Sin nombre'}</p>
                          {p.descripcion && <p className="reg-card-desc">{p.descripcion}</p>}
                          <div className="reg-card-meta">
                            {p.grosor && <span>{p.grosor}</span>}
                            <span className="reg-card-qty">{p.cantidad ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* Formulario */}
          <div className="reg-right-panel">
            <p className="reg-form-title">Formulario de Producto</p>
            <div className="reg-form-grid">
              <div className="reg-field reg-form-full">
                <label>Categoría</label>
                <select className="reg-select" value={categoriaId} onChange={e => setCatId(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {categoriasCache.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre_categoria || c.nombre || c.descripcion || `ID: ${c.id_categoria}`}
                    </option>
                  ))}
                </select>
              </div>

              {esVidrio    && <CamposFormulario conGrosor {...camposProps} />}
              {esAluminio  && <CamposFormulario conGrosor={false} {...camposProps} />}
              {esAccesorio && <CamposFormulario conGrosor={false} {...camposProps} />}
              {!esVidrio && !esAluminio && !esAccesorio && <CamposFormulario conGrosor {...camposProps} />}

              <CamposTecnicos
                esVidrio={esVidrio}
                esAluminio={esAluminio}
                det={catDetalle}
                setDet={setCatDetalle}
              />

              {/* Imagen + botones */}
              <div className="reg-form-full">
                <div className="reg-img-row" onClick={() => document.getElementById('reg-file-input-hidden').click()}>
                  <div className="reg-img-left">
                    {previewSrc
                      ? <img className="reg-preview" src={previewSrc} alt="Vista previa" />
                      : (
                        <div style={{
                          width: 90, height: 90, borderRadius: 12,
                          border: '2px dashed #80C2DC', background: 'rgba(128,194,220,0.08)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', color: '#80C2DC', fontSize: '0.7rem', fontWeight: 700, gap: 4,
                        }}>
                          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📷</span>
                          Sin imagen
                        </div>
                      )
                    }
                    <span className="reg-img-label">Imagen del producto</span>
                    <input key={fileKey} id="reg-file-input-hidden" type="file" accept="image/*"
                      onChange={handleFile} className="reg-file-input" />
                  </div>
                  <div className="reg-img-buttons" onClick={e => e.stopPropagation()}>
                    {previewSrc && (
                      <button
                        className="reg-btn"
                        style={{
                          background: 'rgba(90,139,168,.14)',
                          color: '#5a8ba8',
                          border: '1.5px solid rgba(128,194,220,.45)',
                          fontWeight: 700,
                        }}
                        onClick={() => setShowImageEditor(true)}
                      >
                        ✂️ Editar imagen
                      </button>
                    )}
                    <button className="reg-btn reg-btn-neutral" onClick={limpiar}>Limpiar</button>
                    <button className="reg-btn reg-btn-danger"  onClick={handleEliminar} disabled={!seleccionado}>Eliminar</button>
                    <button className="reg-btn reg-btn-primary" onClick={handleGuardar}>Guardar</button>
                  </div>
                </div>
              </div>
            </div>
            <hr className="reg-divider" />
          </div>

        </div>
      </div>

      {/* Tabla de anotados */}
      <div className="reg-left-report">        <div className="reg-left-report-header">
          <p className="reg-left-report-title">
            Productos anotados{productosAnotados.length > 0 && ` (${productosAnotados.length})`}
          </p>
          <button className="reg-btn-pdf" onClick={handleGenerarPDF}
            disabled={generandoPDF || productosAnotados.length === 0}>
            {generandoPDF ? '⏳ Generando…' : '📄 Generar PDF'}
          </button>
        </div>

        <div className="reg-left-table-wrap">
          <table className="reg-left-table">
            <thead>
              <tr>
                <th>#</th><th>Código</th><th>Nombre</th><th>Categoría</th>
                <th>Cant.</th><th>Precio Unit.</th><th>Valor Total</th>
                <th>Grosor</th><th>Fila</th><th>Col.</th><th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {productosAnotados.length === 0
                ? <tr><td colSpan={11} className="reg-left-table-empty">Sin productos anotados aún.</td></tr>
                : productosAnotados.map((p, i) => {
                    const cat  = categoriasCache.find(c => String(c.id_categoria) === String(p.categoria_id));
                    const catN = cat ? (cat.nombre_categoria || cat.nombre || cat.descripcion) : (p.categoria_id || '—');
                    const val  = (Number(p.precio || 0) * Number(p.cantidad || 0)).toFixed(2);
                    return (
                      <tr key={p.codigo + '-' + i}>
                        <td style={{ color: '#941918', fontWeight: 700, textAlign: 'center' }}>{i + 1}</td>
                        <td><strong>{p.codigo}</strong></td>
                        <td>{p.nombre}</td>
                        <td>{catN}</td>
                        <td style={{ textAlign: 'center' }}>{p.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>S/ {Number(p.precio || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: '#1a8a4a', fontWeight: 600 }}>S/ {val}</td>
                        <td style={{ textAlign: 'center' }}>{p.grosor || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{p.fila    || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{p.columna || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descripcion || '—'}</td>
                      </tr>
                    );
                  })
              }
            </tbody>
            {productosAnotados.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ color: '#941918', fontWeight: 800, paddingLeft: 12 }}>TOTALES</td>
                  <td></td>
                  <td style={{ textAlign: 'center', color: '#941918', fontWeight: 800 }}>
                    {productosAnotados.reduce((s, p) => s + Number(p.cantidad || 0), 0)}
                  </td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#1a8a4a', fontWeight: 800 }}>
                    S/ {productosAnotados.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 0), 0).toFixed(2)}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal editor de imagen */}
      {showImageEditor && previewSrc && (
        <ImageEditorModal
          imageSrc={previewSrc}
          categoria={rawName || 'Producto'}
          nombreBase={nombre || codigo || 'img'}
          onSave={(newUrl, meta) => {
            setPreview(newUrl);
            setOrigImg(newUrl);
            setImgFile(null);
            setShowImageEditor(false);
            showToast('✓ Imagen editada guardada correctamente', 'success');
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
    </>
  );
};

export default RegistroProductos;