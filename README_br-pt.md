# tatami-a11y

[CI](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)  
[npm version](https://www.npmjs.com/package/tatami-a11y)  
[License: MIT](https://opensource.org/licenses/MIT)  
[Tests: 746 passing](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)  
[Toolchain: Rust (oxlint/oxfmt)](https://oxc.rs)

Primitivas e componentes UI independentes de framework, focados em acessibilidade, para JavaScript puro.

**16 componentes, 6 primitivas compartilhadas, 746 testes unitários, 16 testes de integração no nível do navegador com Storybook e verificações de a11y, zero dependências em tempo de execução**, todos implementando as práticas de autoria WAI‑ARIA com conformidade WCAG 2.2 AA verificada.

## O Problema

Todo componente interativo acessível precisa da mesma infraestrutura complicada e propensa a erros:

-   **Regiões ao vivo:** anunciar para leitores de tela sem roubar o foco
-   **Restauração de foco:** devolver o foco quando a UI transitória fecha, mesmo que o elemento disparador tenha desaparecido
-   **Captura de foco:** manter a navegação por teclado dentro de modais e diálogos
-   **Movimento reduzido:** respeitar as preferências do sistema sem verificações manuais em todo o código
-   **Tabindex roving:** navegação por setas para listas, grades, árvores e tablists
-   **Singletons seguros para HMR:** sobreviver a recarregamentos a quente sem duplicar nós DOM ou vazar listeners

A maioria dos projetos reimplementa isso do zero para cada componente. A décima reimplementação de “restaurar foco ao fechar” costuma ser onde alguém esquece o caso de referência obsoleta e entrega um dropdown que deixa o foco do teclado preso silenciosamente no `<body>`.

`tatami-a11y` extrai essas primitivas compartilhadas para uma única base testada e, em seguida, constrói componentes totalmente acessíveis sobre elas. Cada componente da biblioteca depende das mesmas primitivas testadas, de modo que um bug corrigido em uma delas é corrigido em todas.

Diagrama comparando reimplementação de acessibilidade por componente vs. construção sobre primitivas testadas compartilhadas

## Por que “tatami”?

Um tatami é um tapete tradicional japonês, um módulo padronizado e intercambiável que serve de base para todo um cômodo. Você não percebe o tatami, mas tudo que é estável é construído sobre ele. Mesma ideia aqui: essas primitivas são a fundação, os componentes são a sala em que você realmente vive.

## Por que independente de framework

Radix UI e React Aria resolvem isso bem, para React. Headless UI cobre Vue e React. Se você não está em nenhum desses ecossistemas, ou mantém uma base de código vanilla‑JS, não há um equivalente sério e ativamente mantido. `tatami-a11y` foi criado para ser isso: sem virtual DOM, sem runtime de framework, funciona identicamente se for chamado a partir de um componente feito à mão, de um composable Vue, de um `use:action` Svelte ou de uma simples tag `<script>`.

### Interoperabilidade de Framework Verificada

A afirmação de independência de framework foi validada com testes automatizados Playwright em três scaffolds Vite diferentes, cada um instalando `tatami-a11y` a partir do pacote npm publicado exatamente como um consumidor real faria. Dois componentes foram testados em cada framework — Toast (anexa a `document.body`, fora de qualquer árvore gerenciada pelo framework) e Dropdown (anexa comportamento a um nó DOM que o framework renderizou). Tanto o padrão de uso ingênuo quanto o padrão de wrapper idiomático ao framework foram testados, e cada um foi submetido a estresse forçando o framework host a re‑renderizar a área circundante enquanto as adições DOM da biblioteca estavam presentes.

| Framework | Toast (ingênuo) | Toast (wrapper) | Dropdown (ingênuo) | Dropdown (wrapper feito à mão) |
| --- | --- | --- | --- | --- |
| **React** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Vue** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Svelte** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |

Todos os 12 testes passaram sem necessidade de código “cola”. Dropdown funciona de forma ingênua em todos os três frameworks e também passa com um wrapper idiomático ao framework (`useRef`+`useEffect` no React, `ref`+`onMounted`/`onUnmounted` no Vue, `use:action` no Svelte). Os achados completos e a saída bruta dos testes estão em [`framework-interop-check/`](./framework-interop-check/).

**Execute você mesmo:** cada um dos diretórios `framework-interop-check/react-app`, `framework-interop-check/vue-app` e `framework-interop-check/svelte-app` é um app Vite independente e instalável. `cd` para um deles, `pnpm install`, `pnpm dev` e abra a URL local impressa para clicar nos testes ingênuos e de wrapper diretamente, em vez de confiar apenas na tabela acima.

> **Nota sobre `tatami()`:** A tabela acima reflete a investigação original em três frameworks, que usou wrappers feitos à mão. O adaptador `tatami()` foi desenvolvido posteriormente e possui testes unitários dedicados cobrindo todos os 16 componentes (veja `__tests__/tatami.test.ts`), incluindo testes para encaminhamento de métodos, idempotência de destruição e avisos em modo de desenvolvimento. O adaptador `tatami()` foi verificado como funcionando corretamente com todos os 16 componentes por meio desses testes unitários. Um harness Playwright cross‑framework completo ainda está pendente, mas a correção do adaptador está estabelecida pela suíte de testes unitários.

### Demo Astro Islands — quatro frameworks, uma página

`framework-interop-check/` responde se o `tatami-a11y` funciona corretamente dentro de cada framework isoladamente. `astro-demo/` vai um passo além: monta uma ilha React, uma ilha Vue, uma ilha Svelte e uma seção plain‑JS **na mesma página** usando a arquitetura de islands do Astro, e então verifica se as primitivas compartilhadas — especificamente o anunciante de região ao vivo — realmente se coordenam entre cópias da biblioteca empacotadas independentemente, ao invés de se duplicarem silenciosamente em instâncias isoladas por ilha.

**Veja ao vivo:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)  
**Execute localmente:** `cd astro-demo && pnpm install && pnpm dev`

### `tatami()` — a utilidade de ciclo de vida

Os testes de wrapper expuseram um padrão recorrente: todo framework precisa das mesmas três coisas de qualquer biblioteca DOM imperativa — inicializar uma única vez quando o DOM está pronto, receber referências a elementos gerenciados pelo framework e limpar tudo quando esses elementos saem. O boilerplate para isso é idêntico entre frameworks, apenas com sintaxe diferente.

`tatami()` é uma única utilidade **independente de framework** que trata desse handshake para todos os 16 componentes. Não é uma versão React da biblioteca, nem Vue — uma única função, sem importações de framework, funciona em qualquer lugar.

Copy Code

```
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — dentro de useEffect
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — dentro de onMounted / onUnmounted
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use:action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// JavaScript puro, sem framework
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — Component de Cliente requerido ('use client' no topo do arquivo), depois o mesmo padrão useEffect de React puro
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — mesmo padrão onMounted/onUnmounted de Vue, protegido com import.meta.client para segurança extra em setups universal‑rendered
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()` devolve um controlador com `destroy()` e encaminha **todos** os métodos públicos que o componente instanciado realmente possui (descobertos em tempo de execução via reflexão — sem lista de métodos hard‑coded). Em modo de desenvolvimento, chamar um método encaminhado após `destroy()` ou chamar um método que o componente não tem produz um `console.warn` com o nome do componente e do método. O framework só precisa saber duas coisas: chamar `tatami()` quando o DOM estiver pronto e chamar `ctrl.destroy()` na limpeza. Todo o resto é tratado pelo próprio componente.

`Toast` é um caso especial: ele usa uma API **estática** (`Toast.show()`, `Toast.configure()`, etc.) ao invés de instâncias, e `tatami()` detecta isso automaticamente e encaminha os métodos estáticos diretamente.

> **Sobre os exemplos Next.js e Nuxt acima:** eles representam padrões de ciclo de vida padrão e atuais para cada framework, mas ao contrário de React, Vue e Svelte (tabela verificada), ainda não foram executados no mesmo harness automatizado cross‑framework (um app scaffold real, re‑renders forçados, Playwright). Considere‑os como orientação correta, ainda que não estejam ainda verificados independentemente como os três frameworks principais.

### Avisos em modo de desenvolvimento

Em modo de desenvolvimento, `tatami()` emite mensagens `console.warn` quando um método encaminhado é chamado após `destroy()` ou quando o nome do método não existe no componente. Esses avisos são controlados por uma flag de debug resolvida no momento da chamada, com a seguinte ordem de prioridade:

1.  **Sobrescrita manual** — `setTatamiDebug(true)` sempre vence. É a resposta correta para uso em tag `<script>` sem bundler, onde a detecção automática não é possível.
2.  **`import.meta.env?.DEV`** — funciona para consumidores baseados em Vite.
3.  **`process.env.NODE_ENV !== "production"`** — fallback para bundlers webpack/Node‑aware.
4.  **`false` padrão** — silencioso por padrão em ambientes não reconhecidos.

Copy Code

```
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// Habilita avisos durante desenvolvimento (necessário para uso via <script>)
setTatamiDebug(true);
```

## Começo Rápido

Copy Code

```
pnpm install tatami-a11y
```

Copy Code

```
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// Anúncios para leitores de tela: polido por padrão, assertivo quando urgente
announce("Alterações salvas");
announce("Erro: algo deu errado", { urgent: true });

// Restauração de foco para UI transitória (modais, dropdowns, diálogos)
pushFocusStack(triggerElement);
// ... abra seu modal/dropdown ...
popFocusStack(); // o foco volta para triggerElement ou para o fallback focável mais próximo
```

## Sites Deployados

-   **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh) – exemplos interativos de componentes com o addon a11y
-   **Documentação:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh) – API completa gerada pelo TypeDoc
-   **Demo:** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh) – demonstração ao vivo com todos os componentes
-   **Demo Astro Islands:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh) – quatro islands (React, Vue, Svelte, plain JS) numa única página, conectadas via `tatami()`, demonstrando coordenação de primitivas compartilhadas entre cópias da biblioteca empacotadas independentemente

## O que está incluído

### Adaptador de Framework

| Adaptador | Descrição |
| --- | --- |
| `tatami()` | Utilidade de ciclo de vida independente de framework que instancia qualquer componente, encaminha métodos públicos e cuida da limpeza. Funciona a partir de `useEffect` (React/Next.js), `onMounted`/`onUnmounted` (Vue/Nuxt), `use:action` (Svelte) ou tags `<script>` simples. |

### Primitivas Compartilhadas

| Primitiva | Descrição |
| --- | --- |
| `announce()` | Anúncios para leitores de tela via regiões ARIA live. Suporta rotas polida/assertiva, deduplicação e semântica correta de `aria-atomic`. |
| `checkReducedMotion()` / `onReducedMotionChange()` | Detecção de preferência de movimento reduzido a nível de sistema, com listeners de mudança. Cada componente respeita isso automaticamente. |
| `pushFocusStack()` / `popFocusStack()` | Restauração de foco com cadeia de fallback para referência obsoleta. Se o elemento disparador desapareceu, caminha até o ancestral focável mais próximo. |
| `activateFocusTrap()` / `deactivateFocusTrap()` | Captura de foco em modais com detecção de limites do primeiro/último elemento e ciclo correto de Tab/Shift+Tab. |
| `createRovingTabindex()` | Navegação por setas para listas, grades, árvores e tablists. Suporta orientação, contagem de colunas, wrapping e manipuladores de tecla customizados. |
| `createSingleton()` / `registerCleanup()` | Factory de singleton seguro para HMR. Componentes sobrevivem a recarregamentos a quente sem vazar listeners ou duplicar nós DOM. |

### Componentes

| Componente | Padrão ARIA | Principais recursos |
| --- | --- | --- |
| Accordion | `aria-expanded` / `aria-controls` | Navegação por setas, Home/End, anúncios via região ao vivo |
| Carousel | `region` / `group` / `aria-roledescription` | Autoplay, respeito a movimento reduzido, anúncios de slide |
| Combobox | combobox + listbox | Filtragem por digitação, navegação por setas, gerenciamento de active‑descendant |
| CommandPalette | combobox + dialog‑modal | Atalho global Ctrl+K, agrupamento, captura de foco, contagem via região ao vivo |
| DatePicker | dialog + grid | Navegação completa por teclado, captura de foco, navegação de meses |
| Dialog | dialog não‑modal | Gerenciamento de foco sem captura, usuário pode tabular para fora |
| Disclosure | `aria-expanded` / `aria-controls` | Show/hide simples com semântica correta |
| Dropdown | menu + menuitem | Captura de foco, navegação por setas, fechar com Escape |
| MenuButton | `aria-haspopup="menu"` | Padrão menu‑button, gerenciamento de foco |
| Modal | dialog‑modal | Captura de foco, backdrop, fechar com Escape, restauração de foco |
| MultiselectListbox | listbox (multi‑select) | Range com Shift+Click, toggle com Ctrl+Click, typeahead |
| ReorderableList | list + `aria-grabbed` | Reordenação com Ctrl+Setas, drag‑and‑drop, anúncios ao vivo |
| Tabs | tablist + tab + tabpanel | Navegação por setas, Home/End, visibilidade automática de tabpanel |
| Toast | região ao vivo + `role="alert"` | Auto‑dismiss, atalho Alt+T, gerenciamento de pilha |
| Tooltip | `aria-describedby` | Gatilho hover/focus, fechar com Escape, respeito a movimento reduzido |
| TreeView | tree + treeitem | Expandir/colapsar, navegação por setas, typeahead, seleção única/múltipla |

## Conformidade

-   **742 testes unitários** em 24 arquivos de teste (jsdom via vitest), todos passando
-   **16 testes de integração no Storybook**, cada componente renderizado em um navegador real via Playwright e verificado quanto ao comportamento interativo
-   **Checagens de a11y integradas:** cada história do Storybook é auditada automaticamente com axe‑core via `@storybook/addon-a11y`, exibida inline no UI de teste e bloqueada no CI
-   **WCAG 2.2 AA:** zero violações e zero incompletos detectados por varredura automática axe‑core em todas as histórias (a varredura cobre um subconjunto significativo dos critérios WCAG; testes manuais com leitores de tela são a camada natural adicional)
-   **WAI‑ARIA:** todos os componentes seguem as práticas de autoria (APG) relevantes
-   **Movimento reduzido:** toda animação respeita `prefers-reduced-motion`
-   **Navegação por teclado:** todos os elementos interativos são totalmente operáveis via teclado
-   **Leitor de tela:** toda mudança de estado é anunciada via regiões ao vivo

## Desenvolvimento

Copy Code

```
pnpm install
pnpm run build              # Compila para dist/ (ESM + CJS + declarações de tipos)
pnpm run dev                # Modo watch
pnpm run test               # Executa 742 testes unitários (vitest, jsdom)
pnpm run test-storybook:run # Executa 16 testes de integração no navegador (vitest + Playwright)
pnpm run storybook          # Explorer interativo de componentes na porta 6006
pnpm run lint               # Linter baseado em Rust (oxlint)
pnpm run format             # Formatter baseado em Rust (oxfmt)
pnpm run doc                # Gera documentação da API
```

### Ferramentas de Desenvolvimento

| Ferramenta | Stack | Ganho de velocidade |
| --- | --- | --- |
| **Oxlint** | Linter baseado em Rust (compatível com ESLint) | 50–100× mais rápido |
| **Oxfmt** | Formatter baseado em Rust | 35× mais rápido |
| **Vitest 4.1.10** | Runner de testes unitários + Storybook | Modo navegador nativo |
| **Storybook 10.5.5** | Testes de componentes + addon a11y | Integrado ao Vitest |
| **Playwright** | Automação de navegador para testes de integração | Grau de produção |
| **Rolldown** _(opcional)_ | Bundler futuro‑pronto (núcleo Vite) | Performance nativa em Rust |

Total: **758 testes automatizados** (742 unit + 16 Storybook) — CI roda em <30 s em hardware padrão.

---

## Deploy

Copy Code

```
pnpm run deploy:storybook   # Build e deploy do Storybook para Surge
pnpm run deploy:docs        # Build e deploy da docs da API para Surge
pnpm run deploy:astro       # Build e deploy do astro-demo/ demo multi‑framework para Surge
```

Para deployar qualquer um dos sites acima é necessário ter uma conta no [Surge](https://surge.sh) e um arquivo `.env` (copie `.env.example` e preencha seus subdomínios). Os scripts de deploy lançam um erro claro ao invés de falhar silenciosamente para um subdomínio alheio, de modo que clonar este repo e rodar um script de deploy nunca corre o risco de publicar no site de outra pessoa — você sempre publicará no seu próprio subdomínio.

## Suporte a Navegadores

Alvo: navegadores modernos (ES2020) — Chrome 80+, Firefox 80+, Safari 14.1+, Edge 80+. Necessita APIs do DOM.

**Seguro para importação em contexto de renderização no servidor.** Todo acesso ao DOM em `src/components/` e `src/shared/` está dentro de funções ou métodos — nada lê `document`, `window`, `navigator` ou outro global exclusivo do navegador no escopo do módulo, portanto nada executa no momento da importação além de declarações. Verificado ao construir o pacote e importar todos os pontos de entrada em um processo Node puro sem shims DOM:

Copy Code

```
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

Ambos concluem sem erros. As builds ESM funcionam da mesma forma:

Copy Code

```
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

Ambos também finalizam sem erros. O README usa sintaxe `import` porque é assim que os consumidores devem usar o pacote — o mapa `exports` roteia esses `import`s para a build `.mjs` e qualquer `require()` para a build `.js`.

Importar é seguro, mas **usar** os componentes ainda requer um DOM real. O padrão de hook de ciclo de vida se aplica, exatamente como nas integrações client‑only já verificadas de React, Vue e Svelte: `useEffect` para React/Next.js, `onMounted` para Vue/Nuxt.

## Licença

MIT, veja o arquivo LICENSE.