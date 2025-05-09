// js/classes/ProjectStorage.js
import { Nodo } from './Nodos.js';
import { Unidad } from './Unidades.js';
import { Terminal } from './Terminales.js';
import { Conducto } from './Conducto.js';

export class ProjectStorage {
  constructor({ nodos, conductos, render, uiManager }) {
    this.nodos = nodos;
    this.conductos = conductos;
    this.render = render;
    this.uiManager = uiManager;
    this.history = [];
    this.historyIdx = -1;
    this.localKey = 'ductProjectState';
  }

  /* ----------  EXPORTAR  ---------- */
  _serializar() {
    // 1) Nodos / Unidades / Terminales
    const elementos = this.nodos.map(n => {
      const { id, x, y, type, color } = n;
      if (type === 'nodo') return { ...n, clase: 'Nodo' };
      if (type === 'unidad') return { ...n, clase: 'Unidad' };
      if (type === 'terminal') return { ...n, clase: 'Terminal' };
      if (type === 'start') return { ...n, clase: 'Start' };
      return null;
    });

    // 2) Conductos → sustituimos referencias a objetos por ids
    const tramos = this.conductos.map(c => ({
      source: c.source.id,
      target: c.target.id,
      isCircular: c.isCircular,
      length: c.length,
      diameter: c.diameter,
      width: c.width,
      height: c.height,
      flow: c.flow
    }));

    return JSON.stringify({ elementos, tramos }, null, 2);
  }

  descargar(nombre = 'proyecto.json') {
    const data = this._serializar();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }

  /* ----------  IMPORTAR  ---------- */
  _deserializar(jsonStr) {
    const { elementos, tramos } = JSON.parse(jsonStr);

    // 1) reconstruir nodos
    this.nodos.length = 0;                              // vaciar
    const mapa = {};                                    // id -> objeto
    elementos.forEach(el => {
      let obj = null;
      switch (el.clase) {
        case 'Nodo': obj = new Nodo(el.id, el.x, el.y, el.tipo, el.subTipo, el.kFactor, el.pLoss, el.color); break;
        case 'Unidad': obj = new Unidad(el.id, el.name, el.tipoUnidad, el.pLoss, el.x, el.y, el.color); break;
        case 'Terminal': obj = new Terminal(el.id, el.terminalType, el.name, el.flow, el.pLoss, el.x, el.y, el.color); break;
        case 'Start': obj = { ...el, type: 'start' }; break;
      }
      if (obj) { this.nodos.push(obj); mapa[obj.id] = obj; }
    });

    // 2) reconstruir conductos
    this.conductos.length = 0;
    tramos.forEach(t => {
      const c = new Conducto(
        mapa[t.source],
        mapa[t.target],
        t.isCircular,
        t.length,
        t.diameter,
        t.width,
        t.height,
        t.flow
      );
      this.conductos.push(c);
    });
  }

  /* Guarda un snapshot en el historial y en localStorage */
  saveSnapshot() {
    const snap = this._serializar();

    // Si veníamos de un "undo", corta el ramal futuro
    if (this.historyIdx < this.history.length - 1) {
      this.history.splice(this.historyIdx + 1);
    }

    this.history.push(snap);
    this.historyIdx = this.history.length - 1;

    // Persistencia local
    localStorage.setItem(this.localKey, snap);
  }

  /* Deshacer (Ctrl+Z) */
  undo() {
    if (this.historyIdx <= 0) return false;
    this.historyIdx--;
    this._deserializar(this.history[this.historyIdx]);
    this.render();                 // ya existen en el constructor
    this.uiManager.actualizarListas();
    this.uiManager.actualizarCaminos();
    return true;
  }

  /* Rehacer (Ctrl+Y) */
  redo() {
    if (this.historyIdx >= this.history.length - 1) return false;
    this.historyIdx++;
    this._deserializar(this.history[this.historyIdx]);
    this.render();
    this.uiManager.actualizarListas();
    this.uiManager.actualizarCaminos();
    return true;
  }


  async cargarDesdeArchivo(archivo) {
    const txt = await archivo.text();
    this._deserializar(txt);
    this.render();
    this.uiManager.actualizarListas();
    this.uiManager.actualizarCaminos();
    this.saveSnapshot();
  }
}
