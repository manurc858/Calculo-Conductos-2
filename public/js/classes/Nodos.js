// js/classes/Nodos.js

import { Conducto } from './Conducto.js';

export class Nodo {
  constructor(id, x, y, tipo, subTipo, kFactor, pLoss, color) {
    this.id       = id;
    this.x        = x;
    this.y        = y;
    this.tipo     = tipo;      // "Codo", "Accesorio", "Puntual"
    this.subTipo  = subTipo;   // p.e. "codo 90°"
    this.kFactor  = kFactor || 0;
    this.pLoss    = pLoss   || 0;
    this.color    = color  || '#cccccc';
    this.type     = 'nodo';
    this.flowError = false;
  }

  // Ejemplo de método estático para crear un nuevo nodo
  // a partir de los datos que decidas (por ejemplo, un modal).
  static crearNodo({ id, posX, posY, tipoNudo, subT, kF, pL, colorSel }) {
    return new Nodo(
      id,
      posX,
      posY,
      tipoNudo,
      subT,
      kF,
      pL,
      colorSel
    );
  }

  // Lógica de manejo de "click simple" (selección) y "doble clic" (unir con conducto)
  // Podrías mantenerlo aquí o en main, dependiendo del diseño.
  static onNodeClick(evt, d, {selectedElements, render, clickTimeout, clickDelay}) {
    // Hacemos un setTimeout para diferenciar click de doble clic
    clickTimeout.value = setTimeout(() => {
      if (!selectedElements.includes(d)) {
        selectedElements.push(d);
      } else {
        const idx = selectedElements.indexOf(d);
        selectedElements.splice(idx,1);
      }
      render();
      clickTimeout.value = null;
    }, clickDelay);
  }

  static onNodeDblClick(evt, d, { linkingNodes, clickTimeout, render, actualizarCaminos }) {
    // Cancelar el click simple si existiera
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value);
      clickTimeout.value = null;
    }
    evt.stopPropagation();

    // Ejemplo para unir dos nodos con un Conducto
    if (linkingNodes.length === 0) {
      linkingNodes.push(d);
      alert(`Primer nodo seleccionado: ${d.id}\nSelecciona otro con doble clic.`);
    } else if (linkingNodes.length === 1) {
      const n1 = linkingNodes[0];
      const n2 = d;
      if (n1 === n2) {
        alert('¡No puedes unir un nodo consigo mismo!');
        linkingNodes.length = 0;
        return;
      }
      const isCirc  = confirm('¿Conducto Circular?');
      const length  = parseFloat(prompt('Longitud (m):','10')   || '0');
      const flow    = parseFloat(prompt('Caudal (m3/h):','100') || '0');
      let diam=0, w=0, h=0;

      if (isCirc) {
        diam = parseFloat(prompt('Diámetro (mm):','250') || '0');
      } else {
        w = parseFloat(prompt('Base (mm):','300')   || '0');
        h = parseFloat(prompt('Altura (mm):','200') || '0');
      }
      const c = new Conducto(n1, n2, isCirc, length, diam, w, h, flow);
      // Añadirlo al array de conductos => se hace normalmente en main
      // Pero aquí no tenemos el array de conductos, podríamos retornarlo:
      linkingNodes.length = 0; // reset
      return c; // devolvemos el conducto que se acaba de crear
    }
    return null;
  }
}
