/***** Constructor.js  *****
 * Cálculo inverso para dimensionar un conducto rectangular
 * según ΔP máx, velocidad máx y relación 3:1 (ancho/alto).
 ****************************/

class Constructor {
    constructor(modal, canvas, msgEl) {
        this.modal = modal;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.msgEl = msgEl;
        this.slider = document.getElementById('c_w_slider');
        this.wValEl = document.getElementById('c_w_val');
        this.calcBtn = document.getElementById('c_calc');
        this.resultEl = document.getElementById('c_resultado');
        this.inputs = [
            document.getElementById('c_pa'),
            document.getElementById('c_q'),
            document.getElementById('c_v'),
            document.getElementById('c_h')
        ];
        this._bindEvents();
    }

    _bindEvents() {
        this.calcBtn.onclick = () => this.calcular();
        this.slider.oninput = () => this._actualizarConSlider();

        /* habilita/deshabilita el botón según estén rellenos los campos */
        this.inputs.forEach(inp => inp.oninput = () => this._checkInputs());
        this._checkInputs();
    }

    _checkInputs() {
        const completos = this.inputs.every(inp => inp.value.trim() !== '');
        this.calcBtn.disabled = !completos;
    }

    abrir() { this.modal.style.display = 'block'; }
    cerrar() { this.modal.style.display = 'none'; }

    /* --- Fórmulas auxiliares ------------------------------------------ */

    _equivDiam(h, w) {
        /* Diámetro hidráulico equivalente ASHRAE p≈1.30 */
        return 1.30 * Math.pow(h * w, 0.625) / Math.pow(h + w, 0.25);
    }

    _rho() { return 1.2; }                  // kg/m³  (aire)
    _mu() { return 1.8e-5; }               // Pa·s
    _f(Re) { return 0.316 / Math.pow(Re, 0.25); } // Blasius para Re<1e5

    _pl(perdPaM, L) { return perdPaM * L; }   // pérdida total (Pa)

    /* --- Algoritmo inverso -------------------------------------------- */
    calcular() {
        // 1. Lee los datos de entrada
        const paLim = parseFloat(document.getElementById('c_pa').value); // Pa/m
        const q_h = parseFloat(document.getElementById('c_q').value); // m³/h
        const vLim = parseFloat(document.getElementById('c_v').value); // m/s
        const h_mm = parseFloat(document.getElementById('c_h').value); // mm

        if ([paLim, q_h, vLim, h_mm].some(isNaN) || paLim <= 0 || q_h <= 0 || vLim <= 0 || h_mm <= 0) {
            this._msg('❗ Introduce valores numéricos positivos.');
            return;
        }

        // 2. Conversión de unidades
        const h = h_mm / 1000;            // m
        const Q = q_h / 3600;             // m³/s

        // 3. Área mínima por velocidad
        const Amin = Q / vLim;            // m²
        let w = Amin / h;            // m

        // 4. Relación 3:1

        const wMax3 = 3 * h;           // antiguo 3:1
        const wMax4 = 4 * h;           // nuevo límite duro 4:1

        if (w > wMax4) {               // fuera de rango absoluto
            this._msg(`❗ Se necesitan ${(w * 1000).toFixed(0)} mm de ancho, `
                + `pero el máximo (4·h) es ${(wMax4 * 1000).toFixed(0)} mm.`);
            this._dibujarRect(h, wMax4);
            return;
        }


        // 5. Ajuste por límite de ΔP (bucle fino)
        const rho = this._rho();
        const mu = this._mu();
        const L = 1;                   // 1 m para Pa/m
        let step = 0.002;               // 2 mm en metros
        let iter = 0;

        while (iter < 500) {
            const De = this._equivDiam(h, w);
            const Re = (rho * vLim * De) / mu;
            const f = this._f(Re);
            const dP_m = f * (rho / 2) * vLim ** 2 / De;   // Darcy-Weisbach

            if (dP_m <= paLim) break;      // ¡OK!

            w += step;                      // ensancha
            if (w > wMax3) {                 // se salió del límite 3:1
                this._msg(`❗ No es posible cumplir ΔP ≤ ${paLim} Pa/m `
                    + `manteniendo la relación 3:1 (h=${h_mm} mm).`);
                this._dibujarRect(h, wMax3);
                return;
            }
            iter++;
        }

        // 6. Resultado válido
        this.resultEl.textContent =
            `Resultado del Cálculo: w = ${(w * 1000).toFixed(0)} mm  ;  `
            + `h = ${h_mm} mm  `;
        this.slider.min = 50;
        this.slider.max = (wMax4 * 1000).toFixed(0);
        this.slider.step = 50;
        this.slider.value = Math.round(w * 1000 / 50) * 50; // redondea a múltiplo de 50
        this.wValEl.textContent = this.slider.value;
        this._setSliderGradient(h_mm);
        this._actualizarConSlider();   // pinta y muestra datos iniciales
    }

    /* --- utilidades de UI --------------------------------------------- */
    _msg(txt, error = true) {
        this.msgEl.textContent = txt;
        this.msgEl.style.color = error ? '#c33' : '#090';
    }

    _dibujarRect(h, w) {
        const ctx = this.ctx;
        const Cw = this.canvas.width,
            Ch = this.canvas.height;

        ctx.clearRect(0, 0, Cw, Ch);

        // Escala para que quepa
        const scale = Math.min(Cw / (w * 1000), Ch / (h * 1000)) * 0.9;

        const rectW = w * 1000 * scale,
            rectH = h * 1000 * scale;

        const x = (Cw - rectW) / 2,
            y = (Ch - rectH) / 2;

        ctx.fillStyle = '#e5f1ff';
        ctx.strokeStyle = '#036';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, rectW, rectH);
        ctx.strokeRect(x, y, rectW, rectH);

        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${(w * 1000).toFixed(0)} mm`, Cw / 2, y - 6);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${(h * 1000).toFixed(0)} mm`, -Ch / 2, x - 8);
        ctx.rotate(Math.PI / 2);
    }
    /* pinta la barra de naranja→rojo entre 3·h y 4·h */
    _setSliderGradient(h_mm) {
        const w3 = 3 * h_mm;
        const w4 = 4 * h_mm;
        const pct3 = (w3 / w4) * 100;

        this.slider.style.background =
            `linear-gradient(90deg,
            #eee 0%, 
            #eee ${pct3 - 0.5}%,
            #ffa500 ${pct3}%, 
            #ff4500 100%)`;
    }


    _actualizarConSlider() {
        const paLim = parseFloat(document.getElementById('c_pa').value);
        const vLim = parseFloat(document.getElementById('c_v').value);
        const q_h = parseFloat(document.getElementById('c_q').value);
        const h_mm = parseFloat(document.getElementById('c_h').value);
        this._setSliderGradient(h_mm);

        if ([paLim, vLim, q_h, h_mm].some(isNaN)) return;  // no hay datos aún

        const h = h_mm / 1000;
        const w_mm = parseInt(this.slider.value, 10);
        const w = w_mm / 1000;
        this.wValEl.textContent = w_mm;

        const Q = q_h / 3600;              // m³/s
        const v = Q / (h * w);

        const De = this._equivDiam(h, w);
        const Re = (this._rho() * v * De) / this._mu();
        const f = this._f(Re);
        const dP = f * (this._rho() / 2) * v ** 2 / De;     // Pa/m

        /* Colores según límites */
        const vCol = v > vLim ? '#c33' : '#000';
        const dpCol = dP > paLim ? '#c33' : '#000';

        this.msgEl.innerHTML =
            `v = <span style="color:${vCol}">${v.toFixed(2)}</span> m/s &nbsp;|&nbsp; `
            + `ΔP = <span style="color:${dpCol}">${dP.toFixed(2)}</span> Pa/m`;

        this._dibujarRect(h, w);
    }

}

// ----- make available globally -----
window.Constructor = Constructor;
