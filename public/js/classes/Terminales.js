// js/classes/Terminales.js

export class Terminal {
    constructor(id, terminalType, name, flow, pLoss, x, y, color) {
      this.id           = id;
      this.terminalType = terminalType; // 'Difusor', 'Rejilla', etc.
      this.name         = name;
      this.flow         = flow || 0;
      this.pLoss        = pLoss  || 0; 
      this.x            = x;
      this.y            = y;
      this.color        = color || '#cccccc';
      this.type         = 'terminal';
      this.flowError = false;
    }
  
    static crearTerminal({ id, termType, tname, flow, pLoss, x, y, color }) {
      return new Terminal(id, termType, tname, flow, pLoss, x, y, color);
    }
  }
  