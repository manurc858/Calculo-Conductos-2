// js/UIManager.js

export class UIManager {
    constructor({ listaNudos, listaUnidades, listaTerminales, caminosList, velLimitInput }, { nodos, conductos, caminos }, modalHandlers) {
        this.listaNudos = listaNudos;
        this.listaUnidades = listaUnidades;
        this.listaTerminales = listaTerminales;
        this.caminosList = caminosList;
        this.velLimitInput = velLimitInput;

        this.nodos = nodos;
        this.conductos = conductos;
        this.caminos = caminos;

        this.modalHandlers = modalHandlers;
    }

    renderStartElement() {
        const startSec = document.getElementById('startSection');
        startSec.innerHTML = ''; // Limpia contenido anterior

        // Obtén el objeto START a través de modalHandlers
        const startData = this.modalHandlers.getStartElement();

        // Título
        const title = document.createElement('h3');
        title.textContent = 'START';
        startSec.appendChild(title);

        // Mostramos pLoss y flow de START
        const info = document.createElement('p');
        info.innerHTML = `
        <div>Pérdida límite: ${startData.pLoss} Pa</div>
        <div>Caudal límite: ${startData.flow} m3/h</div>`;
        startSec.appendChild(info);

        // Botón de edición en rojo
        const btnEdit = document.createElement('button');
        btnEdit.innerHTML = '<i class="fas fa-edit"></i> START'; // 🛠️
        btnEdit.style.backgroundColor = 'red';
        btnEdit.onclick = () => this.modalHandlers.abrirModalEditarStart();
        startSec.appendChild(btnEdit);
    }

    actualizarListas() {
        // Primero, renderizamos el elemento START
        this.renderStartElement();

        // Actualiza lista de nudos
        this.listaNudos.innerHTML = '';
        this.nodos.filter(n => n.type === 'nodo').forEach(n => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.margin = '4px 0';

            const label = document.createElement('span');
            label.textContent = `${n.id} (${n.tipo})`;
            label.style.flex = '1';
            div.appendChild(label);

            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = '<i class="fas fa-edit"></i> Editar'; // 🛠️
            btnEdit.style.fontSize = '10px';
            btnEdit.onclick = () => this.modalHandlers.abrirModalEditar(n);
            div.appendChild(btnEdit);
            const btnDel = document.createElement('button');
            btnDel.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDel.style.fontSize = '10px';
            btnDel.style.backgroundColor = '#c33';
            btnDel.title = 'Eliminar';
            btnDel.onclick = () => this.modalHandlers.deleteElement(n);
            div.appendChild(btnDel);
            this.listaNudos.appendChild(div);
        });

        // Actualiza lista de unidades
        this.listaUnidades.innerHTML = '';
        this.nodos.filter(u => u.type === 'unidad').forEach(u => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.margin = '4px 0';

            const label = document.createElement('span');
            label.textContent = `${u.id} (${u.tipoUnidad})`;
            label.style.flex = '1';
            div.appendChild(label);

            const btnEdit = document.createElement('button');
            btnEdit.innerHTML = '<i class="fas fa-edit"></i> Editar';
            btnEdit.style.fontSize = '10px';
            btnEdit.onclick = () => this.modalHandlers.abrirModalEditar(u);
            div.appendChild(btnEdit);
            const btnDel = document.createElement('button');
            btnDel.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDel.style.fontSize = '10px';
            btnDel.style.backgroundColor = '#c33';
            btnDel.title = 'Eliminar';
            btnDel.onclick = () => this.modalHandlers.deleteElement(u);
            div.appendChild(btnDel);
            this.listaUnidades.appendChild(div);
        });

        // Actualiza lista de terminales
        this.listaTerminales.innerHTML = '';
        this.nodos.filter(t => t.type === 'terminal').forEach(t => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.margin = '4px 0';

            const label = document.createElement('span');
            label.textContent = `${t.id} (${t.terminalType})`;
            label.style.flex = '1';
            div.appendChild(label);

            const btnEdit = document.createElement('button');

            btnEdit.innerHTML = '<i class="fas fa-edit"></i> Editar';
            btnEdit.style.fontSize = '10px';
            btnEdit.onclick = () => this.modalHandlers.abrirModalEditar(t);
            div.appendChild(btnEdit);
            const btnDel = document.createElement('button');
            btnDel.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDel.style.fontSize = '10px';
            btnDel.style.backgroundColor = '#c33';
            btnDel.title = 'Eliminar';
            btnDel.onclick = () => this.modalHandlers.deleteElement(t);
            div.appendChild(btnDel);
            this.listaTerminales.appendChild(div);
        });
    }

    /* ---------------------------------------
  *  UIManager.actualizarCaminos  (versión revisada)
  *  Ordena las rutas por la ΔP TOTAL real
  * -------------------------------------*/
    actualizarCaminos() {

        /* ─── 1. Generar rutas y mapa de profundidades ─── */
        this.caminos.generarCaminos(this.nodos, this.conductos);
        const start = this.modalHandlers.getStartElement();

        const depth = { [start.id]: 0 };
        const queue = [start];
        while (queue.length) {
            const node = queue.shift();
            const d = depth[node.id];
            this.conductos.forEach(c => {
                const next = c.source === node ? c.target :
                    c.target === node ? c.source : null;
                if (next && depth[next.id] === undefined) {
                    depth[next.id] = d + 1;
                    queue.push(next);
                }
            });
        }

        /* ─── 2. Balance de caudal por nodo ─── */
        const balance = {};
        this.conductos.forEach(c => {
            const parent = depth[c.source.id] < depth[c.target.id] ? c.source : c.target;
            const child = parent === c.source ? c.target : c.source;

            balance[parent.id] = balance[parent.id] || { incoming: 0, outgoing: 0 };
            balance[child.id] = balance[child.id] || { incoming: 0, outgoing: 0 };

            balance[parent.id].outgoing += c.flow;
            balance[child.id].incoming += c.flow;
        });

        /* ─── 3. Obtener rutas (todavía SIN ordenar) ─── */
        const rutasBase = this.caminos.calcularTodas(this.conductos);

        /* ─── 4. Preparativos de UI ─── */
        this.caminosList.innerHTML = '';
        const velLimit = parseFloat(this.velLimitInput.value || '9999');
        const detallesRutas = [];            // {total, h4, table}

        /* ─── 5. Construir ficha de cada ruta ─── */
        rutasBase.forEach(({ ruta }) => {

            /* ----------  Título ---------- */
            const h4 = document.createElement('h4');
            h4.textContent = 'Ruta: ' + ruta.map(n => n.id).join(' ➜ ');

            /* ----------  Tabla ---------- */
            const table = document.createElement('table');
            table.style.marginBottom = '15px';

            const thead = document.createElement('thead');
            const hdr = document.createElement('tr');
            [
                'Tramo', 'Caudal (m³/h)', 'Diam. eq. (mm)',
                'Vel. (m/s)', 'ΔP Conducto (Pa)', 'ΔP Elementos (Pa)',
                'ΔP Total (Pa)'
            ].forEach(txt => {
                const th = document.createElement('th');
                th.textContent = txt;
                hdr.appendChild(th);
            });
            thead.appendChild(hdr);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            let sumCond = 0, sumElem = 0;

            /* ----------  Recorrido tramo a tramo ---------- */
            ruta.forEach((A, i) => {
                const B = ruta[i + 1];
                if (!B) return;

                const cond = this.conductos.find(c =>
                    (c.source === A && c.target === B) ||
                    (c.source === B && c.target === A)
                );
                if (!cond) return;

                const dEq = cond.getDiametroEquivalente();
                const v = cond.getVelocidad(dEq);
                const pLin = cond.calcularPerdidaCargaLineal();
                const pCond = pLin * cond.length;
                sumCond += pCond;

                /* ---- Pérdida en el elemento A ---- */
                let pElem = 0;
                if (A.id !== 'START') {
                    if (A.type === 'nodo') {
                        if (A.tipo === 'Codo' || A.tipo === 'Accesorio') {
                            pElem = 0.6 * v * v * (A.kFactor || 0);
                        } else if (A.tipo === 'Puntual') {
                            pElem = A.pLoss || 0;
                        }
                    } else if (A.type === 'unidad' || A.type === 'terminal') {
                        pElem = A.pLoss || 0;
                    }
                }
                sumElem += pElem;

                /* ---- Fila de resultados ---- */
                const row = document.createElement('tr');
                [
                    `${A.id} → ${B.id}`,
                    cond.flow.toFixed(1),
                    dEq.toFixed(1),
                    v.toFixed(2),
                    pCond.toFixed(2),
                    pElem.toFixed(2),
                    (pCond + pElem).toFixed(2)
                ].forEach((txt, j) => {
                    const td = document.createElement('td');
                    td.textContent = txt;
                    if (j === 3 && v > velLimit) td.style.color = 'red';
                    row.appendChild(td);
                });
                tbody.appendChild(row);

                /* ---- Desbalance de caudal en nodo A ---- */
                if (balance[A.id] && A.id !== 'START' && !row._shown) {
                    const diff = balance[A.id].incoming - balance[A.id].outgoing;
                    if (Math.abs(diff) > 0.01) {
                        const warn = document.createElement('tr');
                        const td = document.createElement('td');
                        td.colSpan = 7;
                        td.style.color = diff < 0 ? 'red' : 'blue';
                        td.innerHTML = `<i class="fas fa-info-circle"></i> Nodo ${A.id}: ${diff < 0 ? 'Déficit' : 'Exceso'} ${Math.abs(diff).toFixed(1)} m³/h`;
                        warn.appendChild(td);
                        tbody.appendChild(warn);
                    }
                    row._shown = true;
                }
            });

            /* ----------  Pérdida de la terminal (si la hay) ---------- */
            const lastNode = ruta[ruta.length - 1];
            if (lastNode && lastNode.type === 'terminal') {
                const termLoss = lastNode.pLoss || 0;
                sumElem += termLoss;

                const termRow = document.createElement('tr');
                termRow.innerHTML = `
                <td colspan="6" style="text-align:right">
                    <i class="fas fa-tint"></i> Pérdida Terminal ${lastNode.id}
                </td>
                <td>${termLoss.toFixed(2)}</td>`;
                tbody.appendChild(termRow);
            }

            /* ----------  Totales ---------- */
            const totalCondRow = document.createElement('tr');
            totalCondRow.innerHTML = `
            <td colspan="6" style="text-align:right"><b>Total solo conductos:</b></td>
            <td><b>${sumCond.toFixed(2)} Pa</b></td>`;
            tbody.appendChild(totalCondRow);

            const totalAll = sumCond + sumElem;
            const totalAllRow = document.createElement('tr');
            totalAllRow.innerHTML = `
            <td colspan="6" style="text-align:right"><b>Total con elementos:</b></td>
            <td><b>${totalAll.toFixed(2)} Pa</b></td>`;
            tbody.appendChild(totalAllRow);

            table.appendChild(tbody);

            /* ----------  Límite START ---------- */
            if (start && totalAll > start.pLoss) {
                const warnRow = document.createElement('tr');
                warnRow.innerHTML = `
                <td colspan="7" style="color:red; text-align:center;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pérdida total <b>${totalAll.toFixed(2)} Pa</b> excede la pérdida límite de START (<b>${start.pLoss} Pa</b>).
                </td>`;
                tbody.appendChild(warnRow);
            }

            /* ----------  Guardar para ordenación ---------- */
            detallesRutas.push({ total: totalAll, h4, table });
        });

        /* ─── 6. Ordenar por ΔP total y pintar ─── */
        detallesRutas
            .sort((a, b) => b.total - a.total)
            .forEach(d => {
                this.caminosList.appendChild(d.h4);
                this.caminosList.appendChild(d.table);
            });

        /* ─── 7. Aviso global START vs terminales ─── */
        const totalTerm = this.nodos
            .filter(n => n.type === 'terminal')
            .reduce((s, t) => s + (t.flow || 0), 0);

        if (start && Math.abs(start.flow - totalTerm) > 0.1) {
            const msg = document.createElement('div');
            msg.style.color = 'blue';
            msg.style.margin = '10px 0';
            msg.innerHTML = `<i class="fas fa-info-circle"></i> El caudal START (${start.flow} m³/h) no coincide con la suma de terminales (${totalTerm.toFixed(1)} m³/h).`;
            this.caminosList.prepend(msg);
        }
    }


}
