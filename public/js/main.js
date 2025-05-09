// js/main.js

import { Nodo } from './classes/Nodos.js';
import { Unidad } from './classes/Unidades.js';
import { Terminal } from './classes/Terminales.js';
import { Conducto } from './classes/Conducto.js';
import { Caminos } from './classes/Caminos.js';
import { UIManager } from './UIManager.js';
import { ProjectStorage } from './classes/ProjectStorage.js';

/* ==== Ids para copias ==== */
let idCounter = 1;
function generateId() { return `C_${idCounter++}`; }

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM listo.');

  // ========================================================================
  // REFERENCIAS HTML
  // ========================================================================
  const menu = document.getElementById('menu');
  const materialSelect = document.getElementById('materialSelect');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const resizeHandleSide = document.getElementById('resizeHandle');
  const toggleDownbarBtn = document.getElementById('toggleDownbarBtn');
  const downbar = document.getElementById('downbar');
  const caminosList = document.getElementById('caminosList');
  const resizeHandleDown = document.getElementById('resizeHandleDown');

  const listaNudos = document.getElementById('listaNudos');
  const listaUnidades = document.getElementById('listaUnidades');
  const listaTerminales = document.getElementById('listaTerminales');
  const inputLps = document.getElementById('inputLps');
  const inputM3h = document.getElementById('inputM3h');

  // Modal Nodos
  const nodoModal = document.getElementById('nodoModal');
  const closeNodoModal = document.getElementById('closeNodoModal');
  const confirmAddNodo = document.getElementById('confirmAddNodo');
  const inputKFactor = document.getElementById('inputKFactor');
  const inputSubTipo = document.getElementById('inputSubTipo');
  const inputPLoss = document.getElementById('inputPLoss');

  // Modal Unidades
  const unidadModal = document.getElementById('unidadModal');
  const closeUnidadModal = document.getElementById('closeUnidadModal');
  const confirmAddUnidad = document.getElementById('confirmAddUnidad');
  const unidadNameField = document.getElementById('unidadName');
  const unidadTipoField = document.getElementById('unidadTipo');
  const unidadPLossField = document.getElementById('unidadPLoss');

  // Modal Terminales
  const terminalModal = document.getElementById('terminalModal');
  const closeTerminalModal = document.getElementById('closeTerminalModal');
  const confirmAddTerminal = document.getElementById('confirmAddTerminal');
  const terminalTipoField = document.getElementById('terminalTipo');
  const terminalNameField = document.getElementById('terminalName');
  const terminalFlowField = document.getElementById('terminalFlow');
  const terminalPLossField = document.getElementById('terminalPLoss');

  // Modal Conducto (2 pasos)
  const conductoModal = document.getElementById('conductoModal');
  const closeConductoModal = document.getElementById('closeConductoModal');
  const conductoStep1 = document.getElementById('conductoStep1');
  const conductoStep2 = document.getElementById('conductoStep2');
  const btnNextConducto = document.getElementById('btnNextConducto');
  const btnBackConducto = document.getElementById('btnBackConducto');
  const confirmAddConducto = document.getElementById('confirmAddConducto');
  const circFields = document.getElementById('circFields');
  const rectFields = document.getElementById('rectFields');
  const inputDiamConducto = document.getElementById('inputDiamConducto');
  const inputRectWidth = document.getElementById('inputRectWidth');
  const inputRectHeight = document.getElementById('inputRectHeight');
  const inputLongConducto = document.getElementById('inputLongConducto');
  const inputFlowConducto = document.getElementById('inputFlowConducto');
  const conductoEditModal = document.getElementById('conductoEditModal');
  const closeConductoEdit = document.getElementById('closeConductoEdit');
  const confirmConductoEdit = document.getElementById('confirmConductoEdit');

  // Modal Editar Elementos
  const editModal = document.getElementById('editModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const editFormContainer = document.getElementById('editFormContainer');
  const confirmEdit = document.getElementById('confirmEdit');

  const constructorBtn = document.getElementById('btnConstructor');
  const constructorModal = document.getElementById('constructorModal');
  const closeConstructorModal = document.getElementById('closeConstructorModal');

  // SVG
  const svg = d3.select('#canvas');
  const width = +svg.attr('width');
  const height = +svg.attr('height');

  // Control velocidad.
  const velLimitInput = document.getElementById('velLimitInput');
  velLimitInput.addEventListener('change', () => {
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
  });

  // Conversor de M3h a Ls
  inputLps.addEventListener('input', () => {
    const lps = parseFloat(inputLps.value) || 0;
    inputM3h.value = (lps * 3.6).toFixed(4);  // 1 L/s = 3.6 m³/h
  });
  inputM3h.addEventListener('input', () => {
    const m3h = parseFloat(inputM3h.value) || 0;
    inputLps.value = (m3h / 3.6).toFixed(4);  // 1 m³/h = 0.2777... L/s
  });

  const constructorTool = new Constructor(
    constructorModal,
    document.getElementById('constructorCanvas'),
    document.getElementById('c_msg')
  );
  constructorBtn.onclick = () => {
    constructorTool.abrir();
    constructorBtn.classList.add('active');
  };

  closeConstructorModal.onclick = () => {
    constructorTool.cerrar();
    constructorBtn.classList.remove('active');
  };

  const btnDeleteSelected = document.querySelector('[data-action="deleteSelected"]');
  const btnSaveProject = document.querySelector('[data-action="saveProject"]');

  const volverMenuBtn = document.getElementById('btnVolverMenu');
  const confirmModal = document.getElementById('confirmReturnModal');
  const confirmReturnBtn = document.getElementById('confirmReturnBtn');
  const cancelReturnBtn = document.getElementById('cancelReturnBtn');

  volverMenuBtn.onclick = () => {
    confirmModal.style.display = 'block';
  };

  cancelReturnBtn.onclick = () => {
    confirmModal.style.display = 'none';
  };

  confirmReturnBtn.onclick = () => {
    confirmModal.style.display = 'none';
    // Aquí colocas la redirección real
    window.location.href = '../menu.html';
  };



  // ========================================================================
  // DATOS PRINCIPALES
  // ========================================================================
  let nodos = [];
  let conductos = [];
  let caminos = new Caminos();

  let selectedElements = [];
  let selectedConducto = null;
  let linkingNodes = [];
  let currentRugosidad = 0.09;

  // Para distinguir clic simple vs doble clic
  const clickDelay = 250;
  const clickTimeout = { value: null };

  // Elemento en edición
  let elementoEnEdicion = null;

  // Guardamos temporalmente los dos nodos a unir con un nuevo conducto
  let pendingConductoN1 = null;
  let pendingConductoN2 = null;

  // Creamos la Unidad START como ejemplo inicial
  const startElement = {
    id: 'START',
    type: 'start',
    pLoss: 0,
    flow: 500,
    color: '#FF0000',
    x: 10,
    y: 10
  };

  nodos.push(startElement);

  const modalHandlers = {
    abrirModalEditar: abrirModalEditar,
    abrirModalEditarStart: abrirModalEditarStart,
    getStartElement: getStartElement,
    deleteElement: eliminarElemento
  };

  function getStartElement() {
    return startElement;
  }

  /* =========  ELIMINAR UN SOLO ELEMENTO  ========== */
  function eliminarElemento(el) {

    if (!el) return;
    if (el.id === 'START') {            // seguridad
      alert('No se puede eliminar START');
      return;
    }

    if (!confirm(`¿Eliminar definitivamente “${el.id}”?`)) return;

    conductos.splice(0, conductos.length,
      ...conductos.filter(c => c.source !== el && c.target !== el));

    nodos.splice(0, nodos.length,
      ...nodos.filter(n => n !== el));

    /* 3) Limpia selección, redibuja y refresca */
    selectedElements = selectedElements.filter(sel => sel !== el);
    render();
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
    captureState();
  }


  const uiElements = {
    listaNudos: document.getElementById('listaNudos'),
    listaUnidades: document.getElementById('listaUnidades'),
    listaTerminales: document.getElementById('listaTerminales'),
    caminosList: document.getElementById('caminosList'),
    velLimitInput: document.getElementById('velLimitInput')
  };

  // Crear la instancia de UIManager
  const uiManager = new UIManager(uiElements, { nodos, conductos, caminos }, modalHandlers);

  let modoEditarConducto = false;

  const projectStorage = new ProjectStorage({ nodos, conductos, render, uiManager });

  const saved = localStorage.getItem(projectStorage.localKey);
  if (saved) {
    projectStorage._deserializar(saved);
  }
  projectStorage.saveSnapshot();

  function captureState() { projectStorage.saveSnapshot(); }

  /* =========  Valores recordados de la última creación  ========== */
  let lastNodoDefaults = { tipo: 'Codo', kFactor: 0.5, subTipo: 'codo 90°', pLoss: 15 };
  let lastUnidadDefaults = { tipo: 'VAV', pLoss: 10 };
  let lastTerminalDefaults = { tipo: 'Difusor', name: '1.1.', pLoss: 0 };
  let lastCondDefaults = { shape: 'circular', diameter: 250, width: 300, height: 200, length: 10 };
  /* =============================================================== */

  /* ==== Portapapeles interno ==== */
  let clipboard = [];          // elementos copiados
  let idCounter = 1;              // para copias
  function generateId() { return `C_${idCounter++}`; }

  /* Toast de avisos */
  function showToast(msg, isError = false, ms = 2000) {
    const t = document.createElement('div');
    t.className = 'toast' + (isError ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.style.opacity = 0, ms - 300);
    setTimeout(() => t.remove(), ms);
  }


  // ========================================================================
  // EVENTOS DEL MENÚ
  // ========================================================================
  menu.addEventListener('click', (evt) => {
    if (evt.target.tagName !== 'BUTTON') return;
    const action = evt.target.dataset.action;
    switch (action) {
      case 'addNodo':
        abrirModalNodo();
        break;
      case 'addUnidad':
        abrirModalUnidad();
        break;
      case 'addTerminal':
        abrirModalTerminal();
        break;
      case 'deleteSelected':
        onDeleteSelected();
        break;
      case 'exportCsv':
        onExportCsv();
        break;
      case 'editConductos':
        modoEditarConducto = !modoEditarConducto;
        // 1) Cambiar estilo del botón
        const btn = evt.target;
        btn.classList.toggle('active', modoEditarConducto);
        btn.innerHTML = modoEditarConducto
          ? '<i class="fas fa-toggle-on"></i> Editor de Conductos'
          : '<i class="fas fa-toggle-off"></i> Editor de Conductos';

        // 2) Añadir/quitar la clase al SVG para gris
        const svgEl = document.getElementById('canvas');
        svgEl.classList.toggle('edit-mode', modoEditarConducto);

        break;
      case 'saveProject':
        projectStorage.descargar();
        break;

      case 'loadProject':
        document.getElementById('projectFile').click();
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  });

  document.getElementById('projectFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    projectStorage.cargarDesdeArchivo(file);
    e.target.value = '';   // resetea input para futuras cargas
  });

  // ========================================================================
  // FUNCIONES PARA ABRIR LOS MODALES DE CREACIÓN
  // ========================================================================
  function abrirModalNodo() {
    document.querySelector(`input[name="nodoTipo"][value="${lastNodoDefaults.tipo}"]`).checked = true;
    inputKFactor.value = lastNodoDefaults.kFactor;
    inputSubTipo.value = lastNodoDefaults.subTipo;
    inputPLoss.value = lastNodoDefaults.pLoss;

    const esCodoOAcs = (lastNodoDefaults.tipo === 'Codo' || lastNodoDefaults.tipo === 'Accesorio');
    document.getElementById('kFactorFields').style.display = esCodoOAcs ? 'block' : 'none';
    document.getElementById('pLossField').style.display = esCodoOAcs ? 'none' : 'block';

    nodoModal.style.display = 'block';
  }

  function abrirModalUnidad() {
    unidadNameField.value = 'U-X';
    unidadTipoField.value = lastUnidadDefaults.tipo;
    unidadPLossField.value = lastUnidadDefaults.pLoss;
    unidadModal.style.display = 'block';
  }

  function abrirModalTerminal() {
    terminalTipoField.value = lastTerminalDefaults.tipo;
    terminalNameField.value = lastTerminalDefaults.name;
    if (selectedElements.length === 1) {
      const sel = selectedElements[0];
      const { disponible } = getNodeFlowInfo(sel, conductos);
      terminalFlowField.value = disponible.toFixed(1);
      terminalPLossField.value = sel.pLoss.toFixed(1);
    } else {
      terminalFlowField.value = '50';
      terminalPLossField.value = '0';
    }
    terminalModal.style.display = 'block';
  }

  // ========================================================================
  // MODAL DE CONDUCTO (dos pasos)
  // ========================================================================
  closeConductoModal.onclick = () => {
    conductoModal.style.display = 'none';
    resetConductoWizard();
  };

  function resetConductoWizard() {
    conductoStep1.style.display = 'block';
    conductoStep2.style.display = 'none';
    document.querySelector(`input[name="conductoShape"][value="${lastCondDefaults.shape}"]`).checked = true;

    circFields.style.display = lastCondDefaults.shape === 'circular' ? 'block' : 'none';
    rectFields.style.display = lastCondDefaults.shape === 'rectangular' ? 'block' : 'none';

    inputDiamConducto.value = lastCondDefaults.diameter;
    inputRectWidth.value = lastCondDefaults.width;
    inputRectHeight.value = lastCondDefaults.height;
    inputLongConducto.value = lastCondDefaults.length;

    /* NO toques inputFlowConducto – la lógica de caudales sigue intacta */

    inputFlowConducto.value = '100';

    pendingConductoN1 = null;
    pendingConductoN2 = null;
  }

  btnNextConducto.addEventListener('click', () => {

    /* Paso visual: mostrar la segunda pantalla del wizard */
    conductoStep1.style.display = 'none';
    conductoStep2.style.display = 'block';

    /* Mostrar los campos geométricos correctos */
    const shape = document.querySelector('input[name="conductoShape"]:checked').value;
    circFields.style.display = shape === 'circular' ? 'block' : 'none';
    rectFields.style.display = shape === 'rectangular' ? 'block' : 'none';

    /* Siempre editable                                        */
    inputFlowConducto.disabled = false;

    /* ─────────────────  IDENTIFICAR TERMINALES  ───────────────── */
    const tA = pendingConductoN1.type === 'terminal' ? pendingConductoN1 : null;
    const tB = pendingConductoN2.type === 'terminal' ? pendingConductoN2 : null;
    const termStart = tA || tB;                  // terminal que inicia la acción
    const connsA = conductos.filter(c => c.source === pendingConductoN1 || c.target === pendingConductoN1);
    const connsB = conductos.filter(c => c.source === pendingConductoN2 || c.target === pendingConductoN2);

    /****************************************************************
     * 1) PRIMER TRAMO DE UN TERMINAL
     ****************************************************************/
    if (termStart && ((termStart === tA && connsA.length === 0) ||
      (termStart === tB && connsB.length === 0))) {

      inputFlowConducto.value = termStart.flow.toFixed(1);   // = caudal del terminal
      return;                                                // ✅
    }
    /****************************************************************
     * 2) UNIÓN DIRECTA T1 ── T2
     *    Caudal propuesto = flow del terminal que empezó la unión
     ****************************************************************/
    if (tA && tB) {
      const ambosSinConex = (connsA.length === 0 && connsB.length === 0);
      if (ambosSinConex) {
        const minFlow = Math.min(tA.flow || 0, tB.flow || 0);
        inputFlowConducto.value = minFlow.toFixed(1);
        return;
      }
    }

    /****************************************************************
     * 3) TRONCAL QUE SALE DE UN TERMINAL CON HIJOS EXISTENTES
     *    Caudal = flow terminal  +  Σ(flows hijos ya conectados)
     ****************************************************************/
    if (termStart) {
      const conexiones = conductos.filter(c => c.source === termStart || c.target === termStart);
      const sumaHijos = conexiones.reduce((s, c) => s + c.flow, 0);
      inputFlowConducto.value = (termStart.flow + sumaHijos).toFixed(1);
      return;
    }

    /****************************************************************
     * 4)  NODO CON HIJAS TERMINALES (sin troncal aún)  ó
     *     NODO INTERMEDIO (ya tiene troncal upstream)
     ****************************************************************/
    let branchNode = connsA.length ? pendingConductoN1 :
      connsB.length ? pendingConductoN2 : null;

    if (branchNode) {
      const conns = conductos.filter(c => c.source === branchNode || c.target === branchNode);

      const hasUpstream = conns.some(c =>
        (c.source === branchNode && c.target.type !== 'terminal') ||
        (c.target === branchNode && c.source.type !== 'terminal'));

      if (!hasUpstream) {
        const sumHijos = conns.reduce((s, c) => s + c.flow, 0);
        const totalTerm = sumHijos +
          (branchNode.type === 'terminal' ? branchNode.flow : 0);
        inputFlowConducto.value = totalTerm.toFixed(1);
      } else {
        // nodo intermedio con upstream → caudal disponible restante
        const { disponible } = getNodeFlowInfo(branchNode, conductos);
        inputFlowConducto.value = disponible.toFixed(1);
      }
      return;                                                // ✅
    }

    /****************************************************************
     * 5) PRIMERA UNIÓN DESDE START  (o nodo sin conexiones previas)
     ****************************************************************/
    const { disponible } = getNodeFlowInfo(pendingConductoN1, conductos);
    inputFlowConducto.value = disponible.toFixed(1);
  });

  btnBackConducto.addEventListener('click', () => {
    conductoStep2.style.display = 'none';
    conductoStep1.style.display = 'block';
  });

  confirmAddConducto.addEventListener('click', () => {
    if (!pendingConductoN1 || !pendingConductoN2) {
      alert('Error: nodos no definidos.');
      linkingNodes = [];
      resetConductoWizard();
      return;
    }
    const shape = document.querySelector('input[name="conductoShape"]:checked').value;
    let isCirc = (shape === 'circular');

    let diameter = 0, w = 0, h = 0;
    if (isCirc) {
      diameter = parseFloat(inputDiamConducto.value || '0');
    } else {
      w = parseFloat(inputRectWidth.value || '0');
      h = parseFloat(inputRectHeight.value || '0');
    }
    const length = parseFloat(inputLongConducto.value || '0');
    const flow = parseFloat(inputFlowConducto.value || '0');

    const c = new Conducto(pendingConductoN1, pendingConductoN2, isCirc, length, diameter, w, h, flow);
    lastCondDefaults = {
      shape: shape,
      diameter: diameter,
      width: w,
      height: h,
      length: length
    };
    conductos.push(c);

    conductoModal.style.display = 'none';
    resetConductoWizard();
    render();
    uiManager.actualizarCaminos();
    captureState();
    linkingNodes = [];
  });

  // ========================================================================
  // CIERRE DE MODALES (NODOS, UNIDADES, TERMINALES) AL CLICAR X o FUERA
  // ========================================================================
  closeNodoModal.onclick = () => { nodoModal.style.display = 'none'; };
  closeUnidadModal.onclick = () => { unidadModal.style.display = 'none'; };
  closeTerminalModal.onclick = () => { terminalModal.style.display = 'none'; };

  closeConductoEdit.onclick = () => {
    conductoEditModal.style.display = 'none';
    conductoEnEdicion = null;
    document.getElementById('btnEditConductos')
      .classList.remove('active', modoEditarConducto);
  };

  /*window.onclick = (event) => {
    if (event.target === nodoModal) {
      nodoModal.style.display = 'none';
    } else if (event.target === unidadModal) {
      unidadModal.style.display = 'none';
    } else if (event.target === terminalModal) {
      terminalModal.style.display = 'none';
    } else if (event.target === conductoModal) {
      conductoModal.style.display = 'none';
      resetConductoWizard();
    } else if (event.target === editModal) {
      editModal.style.display = 'none';
      elementoEnEdicion = null;
    } else if (event.target === conductoEditModal) {
      conductoEditModal.style.display = 'none';
      conductoEnEdicion = null;

      document.getElementById('btnEditConductos')
        .classList.remove('active', modoEditarConducto);
    }
  };*/

  // ========================================================================
  // CONFIRMAR CREACIÓN DE NODO
  // ========================================================================
  nodoModal.addEventListener('change', (e) => {
    if (e.target.name === 'nodoTipo') {
      if (e.target.value === 'Codo' || e.target.value === 'Accesorio') {
        document.getElementById('kFactorFields').style.display = 'block';
        document.getElementById('pLossField').style.display = 'none';
      } else {
        document.getElementById('kFactorFields').style.display = 'none';
        document.getElementById('pLossField').style.display = 'block';
      }
    }
  });

  confirmAddNodo.onclick = () => {
    const tipoNudo = document.querySelector('input[name="nodoTipo"]:checked').value;
    let kF = 0, pL = 0, subT = '';
    if (tipoNudo === 'Codo' || tipoNudo === 'Accesorio') {
      kF = parseFloat(inputKFactor.value || '0');
      subT = inputSubTipo.value || 'codo 90°';
    } else {
      pL = parseFloat(inputPLoss.value || '0');
    }
    let colorSel = '#cccccc';
    if (tipoNudo === 'Codo') colorSel = '#FFAA00';
    else if (tipoNudo === 'Accesorio') colorSel = '#FF66FF';
    else colorSel = '#AAFF66';

    const idx = nodos.filter(n => n.type === 'nodo').length + 1;
    const newN = new Nodo(`N${idx}`, width / 2, height / 2, tipoNudo, subT, kF, pL, colorSel);
    lastNodoDefaults = { tipo: tipoNudo, kFactor: kF, subTipo: subT, pLoss: pL };
    nodos.push(newN);

    nodoModal.style.display = 'none';
    render();
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
    captureState();
  };

  // ========================================================================
  // CONFIRMAR CREACIÓN DE UNIDAD
  // ========================================================================
  confirmAddUnidad.onclick = () => {
    const idx = nodos.filter(n => n.type === 'unidad' && n.id !== 'START').length + 1;
    const id = 'U' + idx;
    const name = unidadNameField.value.trim() || 'U-X';
    if (name.length > 6) {
      alert('Máx 6 caracteres. Cancelado.');
      return;
    }
    const tipoU = unidadTipoField.value.trim() || 'VAV';
    const pLoss = parseFloat(unidadPLossField.value || '0');
    let col = '#cccccc';
    if (tipoU === 'VAV') col = '#66DD66';
    else if (tipoU === 'CAV') col = '#66AAFF';
    else if (tipoU === 'Fancoil') col = '#AA66FF';

    // De forma opcional, podrías pedir 'flow' aquí igual que con Terminal.
    // Para simplificar, lo dejamos en 0:
    const un = new Unidad(id, name, tipoU, pLoss, width / 2, height / 2, col, 0);
    nodos.push(un);
    lastUnidadDefaults = { tipo: tipoU, pLoss: pLoss };

    unidadModal.style.display = 'none';
    render();
    uiManager.actualizarListas();
    captureState();
  };

  // ========================================================================
  // CONFIRMAR CREACIÓN DE TERMINAL
  // ========================================================================
  confirmAddTerminal.onclick = () => {
    const idx = nodos.filter(n => n.type === 'terminal').length + 1;
    const id = 'T' + idx;
    const ttype = terminalTipoField.value.trim() || 'Difusor';
    const tname = terminalNameField.value.trim() || '1.1.';
    const flow = parseFloat(terminalFlowField.value || '0');
    const pLoss = parseFloat(terminalPLossField.value || '0');
    const col = (ttype === 'Difusor') ? '#ffff66' : '#ffaaaa';
    const term = new Terminal(id, ttype, tname, flow, pLoss, width / 2, height / 2, col);
    nodos.push(term);
    lastTerminalDefaults = { tipo: ttype, name: tname, pLoss: pLoss };
    terminalModal.style.display = 'none';
    render();
    uiManager.actualizarListas();
    captureState();
  };

  function outgoingSum(node, conductos) {
    const salientes = conductos.filter(c => c.source === node);
    return salientes.reduce((sum, c) => sum + c.flow, 0);
  }

  // ========================================================================
  // ELIMINAR ELEMENTOS SELECCIONADOS
  // ========================================================================

  function selectConducto(conducto) {
    if (!selectedElements.includes(conducto)) {
      selectedElements.push(conducto);
    } else {
      selectedElements = selectedElements.filter(el => el !== conducto);
    }
    render();
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
  }

  function onDeleteSelected() {

    if (!selectedElements.length) {
      alert('No hay elementos seleccionados.');
      return;
    }

    /* ───────── Generar listado legible ───────── */
    const listado = selectedElements.map(el => {
      if (el instanceof Conducto) {
        return `Conducto ${el.source.id} → ${el.target.id}`;
      }
      return el.id;            // nodos, unidades, terminales, START …
    }).join('\n');

    const msg = `Se van a eliminar los siguientes elementos:\n\n${listado}\n\n¿Confirmar?`;

    if (!confirm(msg)) {
      // Usuario canceló: no se borra nada
      return;
    }

    /* ───────── Eliminar definitivamente ───────── */
    conductos.splice(0, conductos.length,
      ...conductos.filter(c =>
        !selectedElements.includes(c) &&
        !selectedElements.includes(c.source) &&
        !selectedElements.includes(c.target)
      )
    );

    nodos.splice(0, nodos.length,
      ...nodos.filter(n => !selectedElements.includes(n))
    );

    selectedElements.length = 0;
    selectedConducto = null;

    render();
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
    captureState();
  }

  // ========================================================================
  // EXPORTAR CSV
  // ========================================================================
  
  function onExportCsv() {
    if (!confirm('¿Exportar CSV con detalles de cada tramo?')) return;

    const allRutas = caminos.getRutas();

    const lines = [];
    // Cabecera
    lines.push(
      'Ruta,Tramo,Caudal(m3/h),DiamEq(mm),Vel(m/s),PerdidaLin(Pa/m),PerdidaTramo(Pa)'
    );

    allRutas.forEach((ruta) => {
      const pathStr = ruta.map((x) => x.id).join('-');

      let perdidaTotalRuta = 0; // incluye conductos + elementos
      let perdidaConductos = 0; // solo conductos (para el subtotal)

      for (let i = 0; i < ruta.length - 1; i++) {
        const A = ruta[i];
        const B = ruta[i + 1];

        const cond = conductos.find(
          (c) =>
            (c.source === A && c.target === B) ||
            (c.source === B && c.target === A)
        );
        if (!cond) continue; // enlace roto: salta

        const d_eq = cond.getDiametroEquivalente();
        const v = cond.getVelocidad(d_eq);
        const pLin = cond.calcularPerdidaCargaLineal();
        const pCond = pLin * cond.length;

        perdidaConductos += pCond; // subtotal de conductos

        let nodoLoss = 0;
        if (A.type === 'nodo') {
          if (A.tipo === 'Codo' || A.tipo === 'Accesorio') {
            nodoLoss = 0.6 * Math.pow(v, 2) * (A.kFactor || 0);
          } else if (A.tipo === 'Puntual') {
            nodoLoss = A.pLoss || 0;
          }
        } else if (A.type === 'unidad') {
          nodoLoss = A.pLoss || 0;
        }

        const pTramoTotal = pCond + nodoLoss;
        perdidaTotalRuta += pTramoTotal;

        lines.push(
          [
            pathStr,
            `${A.id}-${B.id}`,
            cond.flow.toFixed(2),
            d_eq.toFixed(2),
            v.toFixed(2),
            pLin.toFixed(2),
            pTramoTotal.toFixed(2),
          ].join(',')
        );
      }

      const lastNode = ruta[ruta.length - 1];
      if (lastNode && lastNode.type === 'terminal') {
        const termLoss = lastNode.pLoss || 0;
        perdidaTotalRuta += termLoss;

        lines.push(
          [
            pathStr,
            `Pérdida ${lastNode.id}`,
            '',
            '',
            '',
            '',
            termLoss.toFixed(2),
          ].join(',')
        );
      }

      lines.push(
        [pathStr, 'TOTAL CONDUCTOS', '', '', '', '', perdidaConductos.toFixed(2)].join(
          ','
        )
      );
      lines.push(
        [
          pathStr,
          'TOTAL CON ELEMENTOS',
          '',
          '',
          '',
          '',
          perdidaTotalRuta.toFixed(2),
        ].join(',')
      );
    });

    // Genera y descarga el archivo
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'caminos_detallados.csv');
    link.click();
  }


  // ========================================================================
  // MATERIAL SELECT (Rugosidad)
  // ========================================================================
  materialSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'otro') {
      const custom = parseFloat(prompt('Rugosidad (mm)?', '0.5') || '0.5');
      currentRugosidad = custom;
    } else {
      currentRugosidad = parseFloat(val) || 0.09;
    }
    conductos.forEach(c => c.setRugosidad(currentRugosidad));
    render();
    uiManager.actualizarCaminos();
    captureState();
  });

  // ========================================================================
  // RENDER (D3)
  // ========================================================================
  function render() {
    // Ajusta rugosidad
    conductos.forEach(c => c.setRugosidad(currentRugosidad));

    // 1) Dibujar conductos
    svg.selectAll('.link')
      .data(conductos, d => d.source.id + '_' + d.target.id)
      .join('line')
      .attr('class', d => (d === selectedConducto ? 'link selected' : 'link'))
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .on('click', (evt, d) => {
        evt.stopPropagation();
        if (modoEditarConducto) {
          abrirModalEditarConducto(d);   // ← nueva función
        } else {
          selectedConducto = (selectedConducto === d ? null : d);
          selectConducto(d);
          render();
        }
      });

    /* ──────────────────────────────────────────────────────────────
* LABELS DE CAUDAL EN CADA CONDUCTO
* ────────────────────────────────────────────────────────────── */
    svg.selectAll('.link-label').remove(); // limpia primero

    // Limpia grupos antiguos
    svg.selectAll('.link-label-group').remove();

    // Crea nuevos grupos para cada conducto
    const labels = svg.selectAll('.link-label-group')
      .data(conductos, d => d.source.id + '_' + d.target.id)
      .join('g')
      .attr('class', 'link-label-group')
      .attr('transform', d => {
        const x = (d.source.x + d.target.x) / 2;
        const y = (d.source.y + d.target.y) / 2 - 4;
        return `translate(${x}, ${y})`;
      });

    // Cálculos para cada grupo
    labels.each(function (d) {
      const group = d3.select(this);

      const dEq = d.getDiametroEquivalente();
      const v = d.getVelocidad(dEq);
      const pLin = d.calcularPerdidaCargaLineal();

      const isAlerta = (v > velLimitInput.value || pLin > 1);

      // Etiqueta de caudal
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill',
          isAlerta ? 'red' : 'white')
        .attr('filter', 'url(#text-shadow)')
        .text(d.flow.toFixed(1));

      // Icono de alerta ⚠️
      if (isAlerta) {
        group.append('text')
          .attr('x', 20)
          .attr('text-anchor', 'start')
          .attr('font-size', '12px')
          .attr('fill', 'red')
          .text('⚠️');
      }
    });


    // 2) Dibujar nodos
    const nodeSel = svg.selectAll('.node')
      .data(nodos, d => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .call(
        d3.drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      )
      .on('click', (evt, d) => {
        if (d.id === 'START') return;
        clickTimeout.value = setTimeout(() => {
          if (!selectedElements.includes(d)) {
            selectedElements.push(d);
          } else {
            selectedElements = selectedElements.filter(x => x !== d);
          }
          render();
          clickTimeout.value = null;
        }, clickDelay);
      })
      .on('dblclick', (evt, d) => {
        if (clickTimeout.value) {
          clearTimeout(clickTimeout.value);
          clickTimeout.value = null;
        }
        evt.stopPropagation();

        if (linkingNodes.length === 0) {
          linkingNodes.push(d);
          alert(`Primer nodo seleccionado: ${d.id}\nSelecciona otro con doble clic.`);
        } else if (linkingNodes.length === 1) {
          const n1 = linkingNodes[0];
          const n2 = d;
          if (n1 === n2) {
            alert('No puedes enlazar un nodo consigo mismo.');
            linkingNodes = [];
            return;
          }
          pendingConductoN1 = n1;
          pendingConductoN2 = n2;
          linkingNodes = [];
          conductoModal.style.display = 'block';
        }
      });

    nodeSel.selectAll('circle, rect, text').remove();

    nodeSel.append(d => {
      if (d.type === 'nodo') {
        return document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      } else if (d.type === 'unidad' || d.type === 'terminal') {
        return document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      } else if (d.type === 'start') {
        return document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      }
      return document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    })
      .attr('width', d => {
        if (d.type === 'unidad') return 60;
        else if (d.type === 'terminal') return 30;
        else if (d.type === 'start') return 40;
        return null;
      })
      .attr('height', d => {
        if (d.type === 'unidad') return 60;
        else if (d.type === 'terminal') return 30;
        else if (d.type === 'start') return 40;
        return null;
      })
      .attr('x', d => {
        if (d.type === 'unidad') return -30;
        else if (d.type === 'terminal') return -15;
        else if (d.type === 'start') return 0;
        return null;
      })
      .attr('y', d => {
        if (d.type === 'unidad') return -30;
        else if (d.type === 'terminal') return -15;
        else if (d.type === 'start') return 0;
        return null;
      })
      .attr('r', d => (d.type === 'nodo' ? 15 : null))
      .attr('fill', d => {
        if (d.type === 'start') return '#FFCCCC';
        return d.color || '#ccc';
      })
      .attr('stroke', d => (d.type === 'start' ? 'red' : '#000'))
      .attr('stroke-width', d => (d.type === 'start' ? 3 : 2));

    nodeSel.append('text')
      .text(d => {
        if (d.type === 'nodo') return d.id;
        if (d.type === 'unidad') return d.id + '\n' + (d.name || 'U?');
        if (d.type === 'terminal') return d.id + '\n' + (d.name || 'T?');
        return d.id;
      })
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', d => {
        if (d.type === 'start') return 20;  // Mitad del ancho (40/2)
        return 0;
      })
      .attr('y', d => {
        if (d.type === 'start') return 20;  // Mitad del alto (40/2)
        return 0;
      })
      .text(d => {
        if (d.type === 'nodo') return d.id;
        if (d.type === 'unidad') return d.id + '\n' + (d.name || 'U?');
        if (d.type === 'terminal') return d.id + '\n' + (d.name || 'T?');
        if (d.type === 'start') return d.id; // En este caso, solo "START"
        return d.id;
      })
      .attr('fill', d => (d.type === 'start' ? 'red' : '#000'));

    nodeSel.classed('selected', d => selectedElements.includes(d));
  }

  // ========================================================================
  // DRAG
  // ========================================================================
  function dragStarted(evt, d) {
    d3.select(this).raise().select('circle, rect').attr('stroke', 'red');
  }
  function dragged(evt, d) {
    d.x = evt.x;
    d.y = evt.y;
    d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
    render();
  }
  function dragEnded(evt, d) {
    d3.select(this).select('circle, rect').attr('stroke', '#000');
    uiManager.actualizarCaminos();
  }

  // ========================================================================
  // SIDEBAR (Abrir/Cerrar, Redimensionar)
  // ========================================================================
  // Evento de click para abrir/cerrar la sidebar
  toggleSidebarBtn.addEventListener('click', toggleSidebar);

  // Lógica de redimensionar la sidebar (sin cambios)
  // resizeHandleSide.addEventListener('mousedown', (e) => {
  //  document.addEventListener('mousemove', doResizeSide);
  //  document.addEventListener('mouseup', stopResizeSide);
  // });
  // function doResizeSide(e) {
  //  const newW = window.innerWidth - e.clientX;
  //  if (newW < 120) return;
  //  sidebar.style.width = newW + 'px';
  //}
  //function stopResizeSide() {
  //  document.removeEventListener('mousemove', doResizeSide);
  //  document.removeEventListener('mouseup', stopResizeSide);
  //}

  // Función toggle que alterna la clase "open" en la sidebar
  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      // Si está abierta, la cerramos
      sidebar.classList.remove('open');
      toggleSidebarBtn.textContent = '☰';
      sidebar.style.width = '0';   // Icono para mostrar que se puede abrir
    } else {
      // Si está cerrada, la abrimos
      sidebar.classList.add('open');
      toggleSidebarBtn.textContent = '×';
      sidebar.style.width = '300px';
      uiManager.actualizarListas();
      uiManager.actualizarCaminos();
    }
  }

  // ========================================================================
  // DOWNBAR (Abrir/Cerrar, Redimensionar)
  // ========================================================================
  toggleDownbarBtn.addEventListener('click', toggleDownbar);
  function toggleDownbar() {
    downbar.classList.toggle('open');
    if (downbar.classList.contains('open')) {
      toggleDownbarBtn.textContent = 'v';
      uiManager.actualizarCaminos();
    } else {
      toggleDownbarBtn.textContent = '^';
    }
  }

  resizeHandleDown.addEventListener('mousedown', (e) => {
    document.addEventListener('mousemove', doResizeDown);
    document.addEventListener('mouseup', stopResizeDown);
  });
  function doResizeDown(e) {
    const newH = window.innerHeight - e.clientY;
    if (newH < 50) return;
    downbar.style.height = newH + 'px';
  }
  function stopResizeDown() {
    document.removeEventListener('mousemove', doResizeDown);
    document.removeEventListener('mouseup', stopResizeDown);
  }

  // ========================================================================
  // EDITAR ELEMENTOS (modal 'editModal')
  // ========================================================================
  closeEditModal.onclick = () => {
    editModal.style.display = 'none';
    elementoEnEdicion = null;
  };

  function abrirModalEditarStart() {
    // Limpias el contenido del editFormContainer
    editFormContainer.innerHTML = `
      <label>Pérdida límite (Pa):</label>
      <input type="number" step="0.1" id="editStartPLoss" value="${startElement.pLoss}"/><br><br>
      <label>Caudal límite (m3/h):</label>
      <input type="number" step="1" id="editStartFlow" value="${startElement.flow}"/><br><br>
    `;

    // Muestras el modal
    editModal.style.display = 'block';

    // Cambiamos el comportamiento del botón "Guardar"
    confirmEdit.onclick = () => {
      const newPL = parseFloat(document.getElementById('editStartPLoss').value || '0');
      const newFlow = parseFloat(document.getElementById('editStartFlow').value || '0');
      startElement.pLoss = newPL;
      startElement.flow = newFlow;

      editModal.style.display = 'none';
      render(); // Redibuja el lienzo si hace falta
      uiManager.actualizarListas();
      uiManager.actualizarCaminos();
      captureState();
    };
  }

  function abrirModalEditar(el) {
    elementoEnEdicion = el;
    editFormContainer.innerHTML = '';

    if (el.type === 'nodo') {
      if (el.tipo === 'Codo' || el.tipo === 'Accesorio') {
        const html = `
          <label>kFactor:</label>
          <input type="number" step="0.01" id="editKFactor" value="${el.kFactor}"/><br><br>
        `;
        editFormContainer.innerHTML = html;

      } else if (el.tipo === 'Puntual') {
        const html = `
          <label>Pérdida (Pa):</label>
          <input type="number" step="0.1" id="editPLoss" value="${el.pLoss}"/><br><br>
        `;
        editFormContainer.innerHTML = html;
      }
    }
    else if (el.type === 'unidad') {
      const html = `
      <label>Pérdida (Pa):</label>
      <input type="number" step="0.1" id="editPLoss" value="${el.pLoss}"/><br><br>
    `;
      editFormContainer.innerHTML = html;
    }
    else if (el.type === 'terminal') {
      const html = `
      <label>Caudal (m³/h):</label>
      <input type="number" id="editFlow"  step="0.1" value="${el.flow}"/><br><br>
      <label>Pérdida (Pa):</label>
      <input type="number" id="editPLoss" step="0.1" value="${el.pLoss}"/><br><br>
    `;
      editFormContainer.innerHTML = html;
    }

    editModal.style.display = 'block';
    confirmEdit.onclick = () => {
      if (!elementoEnEdicion) return;

      if (elementoEnEdicion.type === 'nodo') {
        if (elementoEnEdicion.tipo === 'Codo' || elementoEnEdicion.tipo === 'Accesorio') {
          const newK = parseFloat(document.getElementById('editKFactor').value || '0');
          elementoEnEdicion.kFactor = newK;

        } else if (elementoEnEdicion.tipo === 'Puntual') {
          const newPL = parseFloat(document.getElementById('editPLoss').value || '0');
          elementoEnEdicion.pLoss = newPL;
        }
      }
      else if (elementoEnEdicion.type === 'unidad') {
        const newPL = parseFloat(document.getElementById('editPLoss').value || '0');
        elementoEnEdicion.pLoss = newPL;
      }
      else if (elementoEnEdicion.type === 'terminal') {
        elementoEnEdicion.flow = parseFloat(document.getElementById('editFlow').value || '0');
        elementoEnEdicion.pLoss = parseFloat(document.getElementById('editPLoss').value || '0');
      }

      editModal.style.display = 'none';
      elementoEnEdicion = null;
      render();
      uiManager.actualizarListas();
      uiManager.actualizarCaminos();
    };
  }

  function getNodeFlowInfo(node, conductos) {
    if (node.type === 'start') {
      return { incoming: node.flow, disponible: node.flow };
    }
    // 1. Todos los conductos conectados
    const conns = conductos.filter(c => c.source === node || c.target === node);
    if (conns.length === 0) return { incoming: 0, disponible: 0 };

    // 2. Consideramos entrantes los que TERMINAN en este nodo
    const entrantes = conns.filter(c => c.target === node);
    const salientes = conns.filter(c => c.source === node);

    const incoming = entrantes.reduce((sum, c) => sum + c.flow, 0);
    const outgoing = salientes.reduce((sum, c) => sum + c.flow, 0);

    const disponible = Math.max(incoming - outgoing, 0);

    return { incoming, disponible };
  }

  // ========================================================================
  // EDITAR CONDUCTOS
  // ========================================================================

  let conductoEnEdicion = null;

  function abrirModalEditarConducto(cond) {
    conductoEnEdicion = cond;
    const form = document.getElementById('conductoEditForm');
    const dEq = cond.getDiametroEquivalente();
    const v = cond.getVelocidadActual();
    const pLin = cond.getPerdidaLineal();

    const rojo = (val, limite) => val > limite ? 'style="color:red;"' : '';

    form.innerHTML = `
    <label>Caudal (m³/h):</label>
    <input type="number" id="editFlowCond" value="${cond.flow}"><br><br>

    ${cond.isCircular ? `
      <label>Diámetro (mm):</label>
      <input type="number" id="editDiamCond" value="${cond.diameter}">
    ` : `
      <label>Ancho (mm):</label>
      <input type="number" id="editWCond" value="${cond.width}"><br>
      <label>Alto (mm):</label>
      <input type="number" id="editHCond" value="${cond.height}">
    `}
    <label>Longitud (m):</label>
    <input type="number" id="editLongCond" value="${cond.length}"><br>
    <hr>
    <div id="resultadoCond">
      <div>Velocidad: <span id="vCond" ${rojo(v, velLimitInput.value)}>${v.toFixed(2)}</span> m/s</div>
      <div>P. carga lin.: <span id="pCond" ${rojo(pLin, 1)}>${pLin.toFixed(3)}</span> Pa/m</div>
    </div>
  `;

    // listeners que recalculan cada vez que se escribe
    ['editFlowCond', 'editDiamCond', 'editWCond', 'editHCond', 'editLongCond']
      .forEach(id => {
        const inp = document.getElementById(id);
        if (inp) inp.oninput = recalcularPreviewConducto;
      });

    document.getElementById('conductoEditModal').style.display = 'block';
  }

  function recalcularPreviewConducto() {
    if (!conductoEnEdicion) return;
    const tmp = { ...conductoEnEdicion };           // clon rápido
    tmp.flow = parseFloat(document.getElementById('editFlowCond').value || tmp.flow);
    tmp.length = parseFloat(document.getElementById('editLongCond').value || tmp.length);
    if (tmp.isCircular) {
      tmp.diameter = parseFloat(document.getElementById('editDiamCond').value || tmp.diameter);
    } else {
      tmp.width = parseFloat(document.getElementById('editWCond').value || tmp.width);
      tmp.height = parseFloat(document.getElementById('editHCond').value || tmp.height);
    }
    const v = Conducto.vel(tmp);   // métodos estáticos nuevos
    const pLin = Conducto.pl(tmp);

    const vSpan = document.getElementById('vCond');
    const pSpan = document.getElementById('pCond');
    vSpan.textContent = v.toFixed(2);
    pSpan.textContent = pLin.toFixed(3);
    vSpan.style.color = (v > velLimitInput.value) ? 'red' : 'black';
    pSpan.style.color = (pLin > 1) ? 'red' : 'black';
  }

  document.getElementById('confirmConductoEdit').onclick = () => {
    if (!conductoEnEdicion) return;
    conductoEnEdicion.update({
      flow: parseFloat(document.getElementById('editFlowCond').value),
      length: parseFloat(document.getElementById('editLongCond').value),
      diameter: conductoEnEdicion.isCircular ? parseFloat(document.getElementById('editDiamCond').value) : undefined,
      width: !conductoEnEdicion.isCircular ? parseFloat(document.getElementById('editWCond').value) : undefined,
      height: !conductoEnEdicion.isCircular ? parseFloat(document.getElementById('editHCond').value) : undefined

    });
    document.getElementById('conductoEditModal').style.display = 'none';
    conductoEnEdicion = null;
    render();
    uiManager.actualizarCaminos();
    captureState();
  };

  closeConductoEdit.onclick = () => {
    conductoEditModal.style.display = 'none';
    conductoEnEdicion = null;
  };

  // ========================================================================
  // COPIAR Y PEGAR
  // ========================================================================

  /* ====== Atajos de teclado ================================================= */
  window.addEventListener('keydown', e => {
    /* Supr = Eliminar Seleccionados */
    if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      btnDeleteSelected.click();          // re-utiliza el botón
    }

    /* Ctrl+S = Guardar Proyecto */
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      btnSaveProject.click();
    }

    /* Ctrl+C = Copiar */
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      copySelected();
    }

    /* Ctrl+V = Pegar */
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      pasteClipboard();
    }

    if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      projectStorage.undo();
    } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
      e.preventDefault();
      projectStorage.redo();
    }
  });


  /* ----- COPIAR ---- */
  function copySelected() {
    if (!selectedElements.length) {
      showToast('Nada seleccionado'); return;
    }

    /* No se permite copiar elementos conectados a conductos */
    if (selectedElements.some(el =>
      conductos.some(c => c.source === el || c.target === el))) {
      showToast('❗ No se puede copiar un elemento ligado a un conducto', true);
      return;
    }

    /* Clonado profundo (mantiene .type y resto de propiedades) */
    clipboard = selectedElements.map(el => JSON.parse(JSON.stringify(el)));
    showToast(`${clipboard.length} elemento(s) copiado(s)`);
  }

  /* ----- PEGAR ---- */
  function pasteClipboard() {
    if (!clipboard.length) { showToast('Portapapeles vacío'); return; }

    const dx = 20, dy = 20;               // desplazamiento visual

    clipboard.forEach(data => {
      let nuevo;
      const nuevoId = generateId();

      switch (data.type) {
        case 'nodo':
          nuevo = new Nodo(
            nuevoId,
            data.x + dx,
            data.y + dy,
            data.tipo,
            data.subTipo,
            data.kFactor,
            data.pLoss,
            data.color
          );
          break;

        case 'unidad':
          nuevo = new Unidad(
            nuevoId,
            `${data.name} (cop)`,
            data.tipoUnidad,
            data.pLoss,
            data.x + dx,
            data.y + dy,
            data.color
          );
          break;

        case 'terminal':
          nuevo = new Terminal(
            nuevoId,
            `${data.name} (cop)`,
            data.terminalType,
            data.flow,
            data.pLoss,
            data.x + dx,
            data.y + dy,
            data.color
          );
          break;

        default:
          return;   // tipo desconocido
      }

      nuevo.copiado = true;    // marca opcional
      nodos.push(nuevo);       // ↩️  se guardan junto a los originales
    });

    render();                 // redibuja SVG
    uiManager.actualizarListas();
    uiManager.actualizarCaminos();
    showToast('Pegado correctamente');
  }

  document.getElementById('undoBtn').onclick = () => projectStorage.undo();
  document.getElementById('redoBtn').onclick = () => projectStorage.redo();



  // ========================================================================
  // RENDER INICIAL
  // ========================================================================
  render();
  uiManager.actualizarCaminos();
  uiManager.actualizarListas();
});
