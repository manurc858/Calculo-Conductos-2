// js/classes/Caminos.js

export class Caminos {
    constructor() {
        this.rutas = [];
    }

    generarCaminos(nodos, conductos) {
        this.rutas = [];
        const start = nodos.find(n => n.id === 'START');
        if (!start) return;

        const path = [];
        const dfs = (current) => {
            path.push(current);
            let childrenFound = false;

            for (const c of conductos) {
                let next = null;
                if (c.source === current && !path.includes(c.target)) {
                    next = c.target;
                } else if (c.target === current && !path.includes(c.source)) {
                    next = c.source;
                }
                if (next) {
                    childrenFound = true;
                    dfs(next);            // seguimos la ruta aunque el nodo actual sea terminal
                }
            }

            /* Solo guardamos la ruta cuando llegamos a un terminal
               que ya no tiene “hijos” sin visitar */
            if (current.type === 'terminal' && !childrenFound) {
                this.rutas.push([...path]);
            }
            path.pop();
        };
        dfs(start);
    }

    getRutas() {
        return this.rutas;
    }

    validarContinuidadCaudal(nodos, conductos) {
        // 1) Reiniciar flags
        nodos.forEach(n => {
            if (n.type === 'nodo' || n.type === 'unidad' || n.type === 'start') {
                n.flowError = false;
            }
        });

        // 2) Acumular flujos por nodo
        const balance = {};
        const start = nodos.find(n => n.id === 'START');
        const rutas = this.getRutas();
        rutas.forEach(ruta => {
            let available = start ? start.flow : Infinity;
            for (let i = 0; i < ruta.length - 1; i++) {
                const A = ruta[i];
                const B = ruta[i + 1];
                const cond = conductos.find(c =>
                    (c.source === A && c.target === B) ||
                    (c.source === B && c.target === A)
                );
                if (!cond) continue;
                // Si el flujo asignado en este conducto es menor que el disponible,
                // interpretamos que A bifurca parte de available
                if (cond.flow < available) {
                    const id = A.id;
                    if (!balance[id]) balance[id] = { incoming: available, outgoingSum: 0 };
                    balance[id].outgoingSum += cond.flow;
                }
                available = Math.min(available, cond.flow);
            }
        });

        // 3) Marcar errores
        Object.entries(balance).forEach(([id, { incoming, outgoingSum }]) => {
            if (outgoingSum > incoming) {
                const n = nodos.find(x => x.id === id);
                if (n) n.flowError = true;
            }
        });
    }


    calcularPerdidaCamino(ruta, conductos) {
        let total = 0;
        for (let i = 0; i < ruta.length - 1; i++) {
            const A = ruta[i];
            const B = ruta[i + 1];
            const cond = conductos.find(c =>
                (c.source === A && c.target === B) || (c.source === B && c.target === A)
            );
            if (cond) {
                const pLin = cond.calcularPerdidaCargaLineal();
                const pLinTot = pLin * cond.length;
                total += pLinTot;
            }
            // Lógica de pérdidas en nodos/unidades
            if (A.type === 'nodo') {
                if (A.tipo === 'Codo' || A.tipo === 'Accesorio') {
                    let v = 0;
                    if (cond) {
                        const d_eq = cond.getDiametroEquivalente();
                        v = cond.getVelocidad(d_eq);
                    }
                    total += 0.6 * Math.pow(v, 2) * (A.kFactor || 0);
                } else if (A.tipo === 'Puntual') {
                    total += (A.pLoss || 0);
                }
            }
            if (A.type === 'unidad') {
                total += (A.pLoss || 0);
            }
        }
        return total;
    }

    // Calcula las pérdidas de todas las rutas y devuelve un array con {ruta, pTotal}
    calcularTodas(conductos) {
        return this.rutas.map(r => {
            const p = this.calcularPerdidaCamino(r, conductos);
            return { ruta: r, pTotal: p };
        });
    }
}
