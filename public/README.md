
# 🌀 Cálculo de Conductos de Aire – Visualizador Interactivo

Este proyecto es una herramienta visual interactiva para diseñar, editar y calcular pérdidas de carga en sistemas de conductos de aire. Permite añadir nodos, unidades terminales y crear conexiones entre ellos mediante conductos circulares o rectangulares. Integra visualización SVG, edición en tiempo real, validaciones de caudal y generación de rutas con análisis detallado.

## 🚀 Funcionalidades Principales

- Añadir **Nudos**, **Unidades** y **Terminales**
- Crear **conductos** circulares o rectangulares entre elementos
- Calcular pérdidas de carga por tramo (línea + nodo/unidad)
- Visualizar rutas completas desde el punto `START`
- Validar caudales para evitar errores de continuidad
- Constructor inverso de conductos por límites de velocidad y pérdida
- Exportación de resultados en **CSV**
- Guardar/cargar proyectos en **JSON**
- Conversor de unidades: m³/h ⇄ L/s

## 📁 Estructura del Proyecto

```
📦 js/
├── classes/
│   ├── Nodos.js           # Clase Nodo: Codo, Accesorio, Puntual
│   ├── Unidades.js        # Clase Unidad: VAV, CAV, Fancoil...
│   ├── Terminales.js      # Clase Terminal: Difusores, Rejillas...
│   ├── Conducto.js        # Clase Conducto con cálculo de pérdidas
│   ├── Caminos.js         # Algoritmo para rutas y validación de caudal
│   ├── ProjectStorage.js  # Guardado y carga de proyectos
│   └── Constructor.js     # Herramienta para dimensionado inverso de conductos
├── main.js                # Lógica principal de interacción y renderizado
├── UIManager.js           # Gestión de la interfaz y actualización de listas
📄 index.html              # Interfaz principal y menús
🎨 style.css               # Hoja de estilos moderna (rev‑5)
```

## 🛠️ Tecnologías

- **JavaScript (ES6+)**
- **D3.js** (para renderizado SVG)
- **HTML5** + **CSS3**
- No requiere frameworks externos

## 📌 Cómo usar

1. Abre `index.html` en tu navegador.
2. Añade nodos, unidades o terminales desde el menú lateral.
3. Haz doble clic en dos elementos para conectarlos mediante un conducto.
4. Revisa los resultados en la parte inferior (`DOWNBAR`).
5. Edita elementos con los botones ✏️ o desde el SVG directamente.
6. Guarda el proyecto o expórtalo como CSV para análisis externo.

## ⚙️ Fórmulas y Criterios

- **Pérdida de carga** según Darcy-Weisbach con factor `f` basado en Altshul–Tsal
- **Velocidad límite configurable** (por defecto 5 m/s)
- **Relación ancho/alto ≤ 4:1** para conductos rectangulares (con aviso a usuario)

## 🧪 Estado del desarrollo

✅ Totalmente funcional  
✅ Interfaz moderna y clara  
🔧 Faltaría: importar desde CSV o exportar a formatos BIM  

## 📖 Licencia

Proyecto desarrollado para fines educativos y de simulación de sistemas de ventilación. Licencia libre para uso no comercial.
