// js/classes/Conducto.js

export class Conducto {
  constructor(source, target, isCircular, length, diameter, width, height, flow) {
    this.source = source;
    this.target = target;
    this.isCircular = isCircular;
    this.length = length || 0;   // m
    this.diameter = diameter || 0; // mm
    this.width = width || 0;    // mm
    this.height = height || 0;   // mm
    this.flow = flow || 0;     // m3/h
    this.flow = Math.max(0, flow || 0);     // m3/h (no negativo)
    this.rugosidad = 0.09;          // Valor por defecto
  }

  setFlow(value) {
    this.flow = Math.max(0, value);
  }

  setRugosidad(r) {
    this.rugosidad = r;
  }

  getDiametroEquivalente() {
    if (this.isCircular) {
      return this.diameter;
    } else {
      const b = this.width;
      const h = this.height;
      const num = Math.pow(b * h, 5 / 8);
      const den = Math.pow(b + h, 1 / 4);
      return 1.3 * (num / den);
    }
  }

  getVelocidad(d_eq) {
    const area = Math.PI * Math.pow((d_eq / 2) / 1000, 2);
    const volPerSec = this.flow / 3600;
    return volPerSec / area;
  }

  getReynolds(v, d_eq) {
    const rho = 1.2;          // kg/m³
    const mu = 1.8e-5;       // Pa·s
    return (rho * v * (d_eq / 1000)) / mu;
  }

  getFPrima(rug, d_eq, Re) {
    const ratio = (rug / d_eq) + (68 / Re);
    return 0.11 * Math.pow(ratio, 0.25);
  }

  getFactorF(fPrima) {
    if (fPrima < 0.018) {
      return 0.85 * fPrima + 0.0028;
    }
    return fPrima;
  }

  calcularPerdidaCargaLineal() {
    const d_eq = this.getDiametroEquivalente();
    if (d_eq <= 0) return 0;
    const v = this.getVelocidad(d_eq);
    const Re = this.getReynolds(v, d_eq);
    const fPrima = this.getFPrima(this.rugosidad, d_eq, Re);
    const f = this.getFactorF(fPrima);
    const d_m = d_eq;
    return (f * 1000 * 1.2 * Math.pow(v, 2)) / (2 * d_m);
  }

  getDiamEq() { return this.getDiametroEquivalente(); }
  getVelocidadActual() { return this.getVelocidad(this.getDiametroEquivalente()); }
  getPerdidaLineal() { return this.calcularPerdidaCargaLineal(); }

  /* Métodos SET que usarán el modal */
  update({ flow, length, diameter, width, height }) {
    if (flow !== undefined) this.setFlow(flow);
    if (length !== undefined) this.length = length;
    if (this.isCircular) {
      if (diameter !== undefined) this.diameter = diameter;
    } else {
      if (width !== undefined) this.width = width;
      if (height !== undefined) this.height = height;
    }
  }

  /* ── Métodos ESTÁTICOS para cálculo rápido en el modal ── */
  static vel(obj) {
    const dEq = obj.isCircular
      ? obj.diameter
      : 1.3 * Math.pow(obj.width * obj.height, 5 / 8) / Math.pow(obj.width + obj.height, 1 / 4);
    const area = Math.PI * Math.pow((dEq / 2) / 1000, 2);
    return (obj.flow / 3600) / area;
  }
  static pl(obj) {
    const v = Conducto.vel(obj);
    const dEq = obj.isCircular
      ? obj.diameter
      : 1.3 * Math.pow(obj.width * obj.height, 5 / 8) / Math.pow(obj.width + obj.height, 1 / 4);
    const Re = (1.2 * v * (dEq / 1000)) / 1.8e-5;
    const fP = 0.11 * Math.pow(((obj.rugosidad || 0.09) / dEq) + (68 / Re), 0.25);
    const f = fP < 0.018 ? 0.85 * fP + 0.0028 : fP;
    return (f * 1000 * 1.2 * v * v ) / (2 * (dEq));   // Pa/m
  }
}
