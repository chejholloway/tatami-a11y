# tatami-a11y

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 746 passing](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![Toolchain: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

Primitivas y componentes de UI agnósticos al framework, con la accesibilidad como prioridad, para JavaScript puro.

**16 componentes, 6 primitivas compartidas, 746 pruebas unitarias, 16 pruebas de integración de Storybook a nivel de navegador con verificaciones de a11y, cero dependencias en tiempo de ejecución**, todo implementando las prácticas de autoría WAI-ARIA con cumplimiento WCAG 2.2 AA verificado.

## El Problema

Cada componente interactivo accesible necesita la misma infraestructura difícil y fácil de implementar incorrectamente:

-   **Regiones dinámicas (Live regions):** anunciando a los lectores de pantalla sin robar el foco.
-   **Restauración de foco:** devolviendo el foco cuando una UI transitoria se cierra, incluso cuando el elemento disparador ya no existe.
-   **Trampa de foco (Focus trapping):** manteniendo la navegación por teclado dentro de modales y diálogos.
-   **Movimiento reducido:** respetando las preferencias del sistema sin verificaciones manuales en todas partes.
-   **Tabindex itinerante (Roving tabindex):** navegación con teclas de flecha para listas, cuadrículas, árboles y listas de pestañas.
-   **Singletons seguros para HMR:** sobreviviendo a recargas de módulo en caliente sin duplicar nodos DOM ni filtrar escuchadores.

La mayoría de los proyectos reconstruyen esto desde cero para cada componente. La décima reimplementación de "restaurar foco al cerrar" es exactamente donde alguien olvida el caso de referencia obsoleta y envía un menú desplegable que silencia y deja el foco del teclado en `<body>`.

tatami-a11y extrae estas primitivas compartidas en una base única y probada, y luego construye componentes totalmente accesibles sobre ellas. Cada componente de la biblioteca se basa en las mismas primitivas probadas en batalla, por lo que un error corregido en una se corrige en todas.

![Diagrama que compara la reimplementación de la accesibilidad por componente versus la construcción sobre primitivas probadas compartidas](./assets/shared_a11y_primitives_problem.png)

## ¿Por qué "tatami"?

Un tatami es una estera tradicional japonesa, un módulo estandarizado e intercambiable que sirve como base para toda una habitación. No te das cuenta del tatami, pero todo lo estable está construido sobre él. La misma idea aquí: estas primitivas son la base, los componentes son la habitación en la que realmente vives.

## ¿Por qué agnóstico del Framework?

Radix UI y React Aria resuelven esto bien, para React. Headless UI cubre Vue y React. Si no estás en uno de esos ecosistemas, o estás manteniendo una base de código de JavaScript puro, no existe un equivalente serio y mantenido activamente. tatami-a11y está construido para ser eso: sin DOM virtual, sin tiempo de ejecución de framework, funciona idénticamente tanto si lo llamas desde un componente hecho a mano, un composable de Vue, una acción `use:` de Svelte o una etiqueta `<script>` simple.

### Interoperabilidad Verificada entre Frameworks

La afirmación de ser agnóstico del framework ha sido validada con pruebas automatizadas de Playwright en tres entornos Vite separados, cada uno instalando `tatami-a11y` desde el paquete npm publicado exactamente como lo haría un usuario real. Se probaron dos componentes en cada framework: Toast (se agrega a `document.body`, fuera de cualquier árbol administrado por el framework) y Dropdown (adjunta comportamiento a un nodo DOM que el framework renderizó). Se probaron tanto el patrón de uso ingenuo como un patrón de envoltorio hecho a mano idiomático del framework, y cada uno fue sometido a pruebas de estrés forzando al framework anfitrión a volver a renderizar el área circundante mientras las adiciones de DOM de la biblioteca estaban presentes.

| Framework | Toast (ingenuo) | Toast (envoltorio) | Dropdown (ingenuo) | Dropdown (envoltorio hecho a mano) |
| --------- | --------------- | ------------------ | ------------------ | ---------------------------------- |
| **React** | ✅ Pasa          | ✅ Pasa             | ✅ Pasa             | ✅ Pasa                             |
| **Vue**   | ✅ Pasa          | ✅ Pasa             | ✅ Pasa             | ✅ Pasa                             |
| **Svelte**| ✅ Pasa          | ✅ Pasa             | ✅ Pasa             | ✅ Pasa                             |

Las 12 pruebas pasaron sin necesidad de código "pegamento" para Toast. Dropdown funciona de forma ingenua en los tres frameworks y también pasa con un envoltorio hecho a mano idiomático del framework (`useRef`+`useEffect` en React, `ref`+`onMounted`/`onUnmounted` en Vue, `use:action` en Svelte). Los hallazgos completos y la salida de prueba bruta se encuentran en [`framework-interop-check/`](./framework-interop-check/).

**Ejecútalas tú mismo:** cada una de `framework-interop-check/react-app`, `framework-interop-check/vue-app` y `framework-interop-check/svelte-app` es una aplicación Vite independiente e instalable. `cd` en cualquiera de ellas, `pnpm install`, `pnpm dev`, y abre la URL local impresa para hacer clic en las pruebas del patrón ingenuo y de envoltorio directamente en lugar de creer ciegamente en la tabla anterior.

> **Nota sobre `tatami()`:** La tabla anterior refleja la investigación original de tres frameworks, que usó envoltorios hechos a mano. El adaptador `tatami()` se desarrolló posteriormente y tiene pruebas unitarias dedicadas que cubren los 16 componentes (ver `__tests__/tatami.test.ts`), incluidas pruebas para el reenvío de métodos, la idempotencia de la destrucción y las advertencias en modo de desarrollo. Se ha verificado que el adaptador `tatami()` funciona correctamente con los 16 componentes a través de estas pruebas unitarias. Un paso completo de arnés de Playwright entre frameworks está pendiente, pero la corrección del adaptador se establece a través del conjunto de pruebas unitarias.

### Demostración de Astro Islands — cuatro frameworks, una página

`framework-interop-check/` responde si tatami-a11y funciona correctamente dentro de cada framework por sí solo. `astro-demo/` va un paso más allá: monta una isla de React, una isla de Vue, una isla de Svelte y una sección de JS puro en la *misma página* usando la arquitectura de islas de Astro, y luego verifica si las primitivas compartidas, específicamente el anunciador de región dinámica, realmente se coordinan entre copias de la biblioteca empaquetadas de forma independiente en lugar de duplicarse silenciosamente en instancias aisladas por isla.

**Verlo en vivo:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**Ejecutarlo localmente:** `cd astro-demo`, `pnpm install`, `pnpm dev`.

### `tatami()` — la utilidad de ciclo de vida

Las pruebas de envoltorio expusieron un patrón que se repite: cada framework necesita las mismas tres cosas de cualquier librería DOM imperativa: inicializar una vez que el DOM esté listo, pasarle referencias a elementos gestionados por el framework, y limpiar cuando esos elementos desaparezcan. El código repetitivo para eso es idéntico entre frameworks, solo con diferente sintaxis.

`tatami()` es una utilidad única, agnóstica al framework, que maneja ese "apretón de manos" para los 16 componentes. No es una versión de React de la librería, ni una versión de Vue — una función, sin importaciones de framework, funciona en cualquier lugar.

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — dentro de useEffect
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — dentro de onMounted / onUnmounted
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// JS puro, sin framework en absoluto
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — Componente Cliente requerido ('use client' al
// inicio del archivo), luego el mismo patrón useEffect que React puro
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — mismo patrón onMounted/onUnmounted que Vue, protegido con
// import.meta.client para seguridad extra en configuraciones de renderizado universal
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()` devuelve un controlador con `destroy()` y reenvía cada método público que el componente instanciado realmente tiene (derivado en tiempo de ejecución a través de reflexión — sin lista de métodos codificada). En modo de desarrollo, llamar a un método reenviado después de `destroy()` o llamar a un método que el componente no tiene produce una `console.warn` con el nombre del componente y el nombre del método. El framework solo necesita saber dos cosas: llamar a `tatami()` cuando el DOM esté listo, llamar a `ctrl.destroy()` en la limpieza. Todo lo demás lo maneja el propio componente.

`Toast` se maneja como un caso especial: utiliza una API solo estática (`Toast.show()`, `Toast.configure()`, etc.) en lugar de instancias, y `tatami()` lo detecta automáticamente y reenvía los métodos estáticos directamente.

> **Sobre los ejemplos de Next.js y Nuxt anteriores:** estos son patrones de ciclo de vida estándar, actuales y documentados para cada framework, pero a diferencia de React, Vue y Svelte en la tabla verificada anterior, no se han ejecutado a través del mismo arnés automatizado entre frameworks (una aplicación con scaffold real, re-renderizados forzados, Playwright). Trátelos como una guía correcta, aún no como verificados independientemente contra esta librería como lo fueron los tres frameworks anteriores.

### Advertencias en modo de desarrollo

En modo de desarrollo, `tatami()` emite mensajes `console.warn` cuando se llama a un método reenviado después de `destroy()` o cuando un nombre de método no existe en el componente. Estas advertencias están controladas por un indicador de modo de desarrollo resuelto en el momento de la llamada con este orden de prioridad:

1.  **Anulación manual** — `setTatamiDebug(true)` siempre gana. Esta es la respuesta correcta para el uso de la etiqueta `<script>` sin bundler, donde no es posible la detección automática.
2.  **`import.meta.env?.DEV`** — funciona para consumidores basados en Vite.
3.  **`process.env.NODE_ENV !== "production"`** — reserva para bundlers conscientes de webpack/Node.
4.  **Predeterminado `false`** — silencio por defecto en un entorno no reconocido.

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// Habilitar advertencias durante el desarrollo (requerido para el uso de la etiqueta <script>)
setTatamiDebug(true);
```

## Inicio Rápido

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// Anuncios para lectores de pantalla: educado por defecto, asertivo cuando es urgente
announce("Cambios guardados");
announce("Error: algo salió mal", { urgent: true });

// Restauración de foco para UI transitoria (modales, desplegables, diálogos)
pushFocusStack(triggerElement);
// ... abrir tu modal/desplegable ...
popFocusStack(); // el foco regresa a triggerElement, o al fallback válido más cercano
```

## Sitios Desplegados

-   **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh), ejemplos de componentes interactivos con el complemento a11y
-   **Documentación:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh), documentación completa de la API generada por TypeDoc
-   **Demo:** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh), demo en vivo con todos los componentes
-   **Demo de Astro Islands:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh), cuatro islas de framework (React, Vue, Svelte, JS puro) en una página, conectadas a través de `tatami()`, demostrando la coordinación de primitivas compartidas entre copias de la librería empaquetadas de forma independiente

## Qué se Incluye

### Adaptador de Framework

| Adaptador | Descripción |
| --------- | ----------- |
| `tatami()` | Utilidad de ciclo de vida agnóstica al framework que instancia cualquier componente, reenvía métodos públicos y maneja la limpieza. Funciona desde `useEffect` de React, `onMounted`/`onUnmounted` de Vue/Nuxt, `use:action` de Svelte, o etiquetas `<script>` simples. |

### Primitivas Compartidas

| Primitiva | Descripción |
| --------- | ----------- |
| `announce()` | Anuncios para lectores de pantalla a través de regiones dinámicas ARIA. Soporta enrutamiento educado/asertivo, deduplicación y semántica `aria-atomic` adecuada. |
| `checkReducedMotion()` / `onReducedMotionChange()` | Detección de movimiento reducido a nivel de sistema con oyentes de cambio. Cada componente respeta esto automáticamente. |
| `pushFocusStack()` / `popFocusStack()` | Restauración de foco con cadena de respaldo para referencias obsoletas. Si el elemento disparador ha desaparecido, busca el ancestro enfocable más cercano. |
| `activateFocusTrap()` / `deactivateFocusTrap()` | Trampa de foco modal con detección de límites del primer/último elemento y ciclo adecuado de Tab/Shift+Tab. |
| `createRovingTabindex()` | Navegación con teclas de flecha para listas, cuadrículas, árboles y listas de pestañas. Soporta orientación, número de columnas, envoltura y manejadores de teclas personalizados. |
| `createSingleton()` / `registerCleanup()` | Fábrica de singleton segura para HMR. Los componentes sobreviven a recargas en caliente sin filtrar oyentes ni duplicar nodos DOM. |

### Componentes

| Componente          | Patrón ARIA                                 | Características clave                                                         |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Accordion           | `aria-expanded` / `aria-controls`           | Navegación con teclas de flecha, Inicio/Fin, anuncios de región dinámica        |
| Carousel            | `region` / `group` / `aria-roledescription` | Reproducción automática, respeto al movimiento reducido, anuncios de diapositivas |
| Combobox            | combobox + listbox                          | Filtrado al escribir, navegación con teclas de flecha, gestión de descendientes activos |
| CommandPalette      | combobox + dialog-modal                     | Atajo global Ctrl+K, agrupación, trampa de foco, recuento de región dinámica    |
| DatePicker          | dialog + grid                               | Navegación completa por teclado, trampa de foco, navegación por meses         |
| Dialog              | diálogo no modal                            | Gestión de foco sin trampa, los usuarios pueden salir con Tab                  |
| Disclosure          | `aria-expanded` / `aria-controls`           | Mostrar/ocultar simple con semántica adecuada                                 |
| Dropdown            | menu + menuitem                             | Trampa de foco, navegación con teclas de flecha, Escape para cerrar           |
| MenuButton          | `aria-haspopup="menu"`                      | Patrón de botón de menú, gestión de foco                                      |
| Modal               | dialog-modal                                | Trampa de foco, telón de fondo, Escape para cerrar, restauración de foco        |
| MultiselectListbox  | listbox (selección múltiple)                | Rango Shift+Click, alternar Ctrl+Click, búsqueda anticipada                    |
| ReorderableList     | list + `aria-grabbed`                       | Reordenar Ctrl+Flecha, arrastrar y soltar, anuncios dinámicos                  |
| Tabs                | tablist + tab + tabpanel                    | Navegación con teclas de flecha, Inicio/Fin, visibilidad automática del panel de pestañas |
| Toast               | live region + `role="alert"`                | Auto-descarte, atajo Alt+T para saltar, gestión de la pila                     |
| Tooltip             | `aria-describedby`                          | Disparador al pasar el ratón/foco, Escape para cerrar, respeto al movimiento reducido |
| TreeView            | tree + treeitem                             | Expandir/colapsar, navegación con teclas de flecha, búsqueda anticipada, selección simple/múltiple |

## Conformidad

-   **742 pruebas unitarias** en 24 archivos de prueba (jsdom a través de vitest), todas pasaron
-   **16 pruebas de integración de Storybook**, cada componente renderizado en un navegador Playwright real y verificado por comportamiento interactivo
-   **Verificaciones de a11y integradas:** cada historia de Storybook es auditada automáticamente con axe-core a través de `@storybook/addon-a11y`, mostrada en línea en la UI de prueba y bloqueada en CI
-   **WCAG 2.2 AA:** cero violaciones y cero incompletos detectados por el escaneo automático de axe-core en todas las historias de Storybook (el escaneo automático cubre un subconjunto significativo de los criterios WCAG, no la especificación completa; las pruebas manuales con lector de pantalla son la siguiente capa natural sobre esto)
-   **WAI-ARIA:** cada componente sigue la práctica de autoría APG relevante
-   **Navegación por teclado:** cada elemento interactivo es totalmente operable por teclado
-   **Lector de pantalla:** cada cambio de estado se anuncia a través de regiones dinámicas

## Desarrollo

```bash
pnpm install
pnpm run build              # Construir a dist/ (ESM + CJS + declaraciones de tipos)
pnpm run dev                # Modo de vigilancia
pnpm run test               # Ejecutar 742 pruebas unitarias (vitest, jsdom)
pnpm run test-storybook:run # Ejecutar 16 pruebas de integración a nivel de navegador (vitest + Playwright)
pnpm run storybook          # Explorador de componentes interactivo en el puerto 6006
pnpm run lint               # Linter basado en Rust (oxlint, 50–100 veces más rápido que ESLint)
pnpm run format             # Formateador basado en Rust (oxfmt, 35 veces más rápido que Prettier)
pnpm run doc                # Construir documentación de la API
```

### Conjunto de Herramientas de Desarrollo

| Herramienta | Stack | Ganancia de Velocidad |
| --- | --- | --- |
| **Oxlint** | Linter basado en Rust (compatible con ESLint) | 50–100 veces más rápido |
| **Oxfmt** | Formateador basado en Rust | 35 veces más rápido |
| **Vitest 4.1.10** | Ejecutor de pruebas unitarias + Storybook | Modo de navegador nativo |
| **Storybook 10.5.5** | Pruebas de componentes + complemento a11y | Integrado con Vitest |
| **Playwright** | Automatización del navegador para pruebas de integración | Calidad de producción |
| **Rolldown** _(opcional)_ | Empaquetador preparado para el futuro (núcleo de Vite) | Rendimiento nativo de Rust |

Total: **758 pruebas automatizadas** (742 unitarias + 16 de Storybook), CI se ejecuta en <30s en hardware estándar.

---

## Despliegue

```bash
pnpm run deploy:storybook   # Construir y desplegar Storybook a Surge
pnpm run deploy:docs        # Construir y desplegar documentos de la API a Surge
pnpm run deploy:astro       # Construir y desplegar la demo multi-framework astro-demo/ a Surge
```

El despliegue de cualquiera de los sitios anteriores requiere tu propia cuenta de [Surge](https://surge.sh) y un archivo `.env` (copia `.env.example` y rellena tus propios subdominios). Los scripts de despliegue lanzan intencionadamente un error claro en lugar de recurrir silenciosamente a un subdominio real, por lo que clonar este repositorio y ejecutar un script de despliegue nunca corre el riesgo de desplegar accidentalmente en el sitio de otra persona; siempre desplegarás en el tuyo propio.

## Soporte para Navegadores

Dirigido a navegadores modernos (ES2020): Chrome 80+, Firefox 80+, Safari 14.1+, Edge 80+. Requiere APIs DOM.

**Seguro de importar en un contexto de renderizado del lado del servidor.** Cada acceso al DOM en `src/components/` y `src/shared/` reside dentro de un cuerpo de función o método — nada lee `document`, `window`, `navigator`, o cualquier otro global exclusivo del navegador en el ámbito del módulo, por lo que nada se ejecuta en el momento de la importación más allá de las declaraciones. Verificado construyendo el paquete e importando cada punto de entrada en un proceso Node desnudo sin ningún tipo de shims DOM. CJS (los archivos `.js` — este paquete no tiene un campo `"type": "module"`, por lo que `.js` es la compilación `require` y `.mjs` es la compilación `import`, según el mapa `exports`):

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

Ambos tienen éxito sin errores. Las compilaciones ESM, de la misma manera:

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

Ambos tienen éxito sin errores. Los ejemplos de código del README usan la sintaxis `import` porque así se espera que los consumidores usen el paquete — el mapa `exports` enruta esas `import`aciones a la compilación `.mjs` y cualquier `require()` a la compilación `.js`.

La importación es segura, pero *usar* los componentes aún requiere un DOM real. Se aplica el patrón estándar de hooks de ciclo de vida, exactamente como lo hace en las integraciones ya verificadas de React, Vue y Svelte solo del lado del cliente: `useEffect` para React/Next.js, `onMounted` para Vue/Nuxt.

## Licencia

MIT, ver LICENSE.