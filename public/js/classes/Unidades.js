// js/classes/Unidades.js

export class Unidad {
    constructor(id, name, tipoUnidad, pLoss, x, y, color) {
      this.id         = id;
      this.name       = name;
      this.tipoUnidad = tipoUnidad;  // 'VAV','CAV','Fancoil'...
      this.pLoss      = pLoss;
      this.x          = x;
      this.y          = y;
      this.color      = color || '#cccccc';
      this.type       = 'unidad';
      this.flowError = false;
    }
  
    // Método estático de creación
    static crearUnidad({ id, name, tipoU, pLoss, x, y, color }) {
      return new Unidad(id, name, tipoU, pLoss, x, y, color);
    }
  }
  