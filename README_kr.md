# tatami-a11y

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm 버전](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![라이선스: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![테스트: 746개 통과](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![도구 체인: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

프레임워크 비종속적인, 접근성 우선 바닐라 JavaScript용 UI 프리미티브 및 컴포넌트.

16개의 컴포넌트, 6개의 공유 프리미티브, 746개의 단위 테스트, 접근성 검사를 포함한 16개의 브라우저 수준 Storybook 통합 테스트, **런타임 종속성 없음**. 이 모든 것은 WAI-ARIA 작성 방식과 검증된 WCAG 2.2 AA 준수를 구현합니다.

## 문제점

모든 접근 가능한 대화형 컴포넌트는 동일한 어렵고, 쉽게 오류가 발생할 수 있는 인프라를 필요로 합니다:

-   **라이브 영역:** 초점을 빼앗지 않고 스크린 리더에 알림
-   **초점 복원:** 일시적인 UI가 닫힐 때, 심지어 트리거 요소가 없어져도 초점 반환
-   **초점 트래핑:** 모달 및 대화 상자 내에서 키보드 탐색 유지
-   **모션 감소:** 모든 곳에서 수동 검사 없이 시스템 환경 설정 준수
-   **로빙 탭 인덱스:** 목록, 그리드, 트리 및 탭 목록을 위한 화살표 키 탐색
-   **HMR 안전한 싱글톤:** DOM 노드를 중복시키거나 리스너를 누수시키지 않고 핫 모듈 리로드에서 살아남기

대부분의 프로젝트는 각 컴포넌트에 대해 이것들을 처음부터 다시 만듭니다. '닫을 때 초점 복원'을 열 번째로 다시 구현하는 과정에서 누군가 오래된 참조 케이스를 잊어버리고, 키보드 초점을 `<body>`에 조용히 갇히게 만드는 드롭다운을 출시하게 됩니다.

tatami-a11y는 이러한 공유 프리미티브를 단일하고 테스트된 기반으로 추출한 다음, 그 위에 완전히 접근 가능한 컴포넌트를 구축합니다. 라이브러리의 모든 컴포넌트는 동일한 검증된 프리미티브에 의존하므로, 하나에서 수정된 버그는 모든 곳에서 수정됩니다.

![컴포넌트별 접근성 재구현과 공유된 테스트된 프리미티브 위에 구축하는 것을 비교하는 다이어그램](./assets/shared_a11y_primitives_problem.png)

## "tatami"는 왜?

다다미는 일본의 전통 바닥 매트로, 방 전체의 기초가 되는 표준화된 교체 가능한 모듈입니다. 다다미는 눈에 띄지 않지만, 모든 안정적인 것은 그 위에 지어집니다. 여기서도 같은 아이디어입니다: 이 프리미티브들은 기반이며, 컴포넌트들은 여러분이 실제로 생활하는 공간입니다.

## 프레임워크 비종속적인 이유

Radix UI와 React Aria는 React를 위해 이 문제를 잘 해결합니다. Headless UI는 Vue와 React를 다룹니다. 만약 여러분이 그러한 에코시스템 중 하나에 속해 있지 않거나, 바닐라 JS 코드베이스를 유지보수하고 있다면, 진지하고 활발하게 유지보수되는 대안은 없습니다. tatami-a11y는 바로 그러한 것을 목표로 만들어졌습니다: 가상 DOM 없음, 프레임워크 런타임 없음, 직접 만든 컴포넌트, Vue 컴포저블, Svelte `use:action` 또는 일반 `<script>` 태그에서 호출하든 동일하게 작동합니다.

### 검증된 프레임워크 상호 운용성

프레임워크 비종속성 주장은 세 개의 개별 Vite 스캐폴드를 통한 자동화된 Playwright 테스트로 검증되었으며, 각 스캐폴드는 실제 사용자가 하는 방식과 동일하게 게시된 npm 패키지에서 `tatami-a11y`를 설치했습니다. 각 프레임워크에서 두 가지 컴포넌트가 테스트되었습니다 — Toast (모든 프레임워크 관리 트리 외부에 `document.body`에 추가됨)와 Dropdown (프레임워크가 렌더링한 DOM 노드에 동작을 연결함). 순진한 사용 패턴과 프레임워크 관용적인 직접 만든 래퍼 패턴이 모두 테스트되었으며, 라이브러리의 DOM 추가가 존재하는 동안 호스트 프레임워크가 주변 영역을 강제로 다시 렌더링하도록 하여 각각 스트레스 테스트를 거쳤습니다.

| 프레임워크 | Toast (기본) | Toast (래퍼) | Dropdown (기본) | Dropdown (직접 만든 래퍼) |
| --------- | ------------- | --------------- | ---------------- | ------------------------------ |
| **React** | ✅ 통과        | ✅ 통과          | ✅ 통과           | ✅ 통과                         |
| **Vue**   | ✅ 통과        | ✅ 통과          | ✅ 통과           | ✅ 통과                         |
| **Svelte**| ✅ 통과        | ✅ 통과          | ✅ 통과           | ✅ 통과                         |

Toast에는 어떠한 글루 코드도 필요 없이 12개의 모든 테스트가 통과되었습니다. Dropdown은 세 가지 프레임워크 모두에서 기본적으로 작동하며, 직접 만든 프레임워크 관용적인 래퍼(React의 `useRef`+`useEffect`, Vue의 `ref`+`onMounted`/`onUnmounted`, Svelte의 `use:action`)로도 통과합니다. 전체 결과와 원본 테스트 출력은 [`framework-interop-check/`](./framework-interop-check/)에 있습니다.

**직접 실행해 보세요:** `framework-interop-check/react-app`, `framework-interop-check/vue-app`, `framework-interop-check/svelte-app` 각각은 독립적이고 설치 가능한 Vite 앱입니다. 이들 중 아무거나 `cd`로 이동하여 `pnpm install`, `pnpm dev`를 실행하고 출력된 로컬 URL을 열어 위 표를 맹목적으로 믿는 대신 기본 및 래퍼 패턴 테스트를 직접 클릭해 보세요.

> **tatami()에 대한 참고 사항:** 위 표는 직접 만든 래퍼를 사용한 초기 세 프레임워크 조사를 반영합니다. `tatami()` 어댑터는 이후 개발되었으며, 메서드 포워딩, destroy 멱등성 및 개발 모드 경고에 대한 테스트를 포함하여 모든 16개 컴포넌트를 다루는 전용 단위 테스트(`__tests__/tatami.test.ts` 참조)를 가지고 있습니다. `tatami()` 어댑터는 이러한 단위 테스트를 통해 모든 16개 컴포넌트에서 올바르게 작동하는 것으로 검증되었습니다. 전체 Playwright 크로스 프레임워크 하네스 통과는 보류 중이지만, 어댑터의 정확성은 단위 테스트 스위트를 통해 확립되었습니다.

### Astro Islands 데모 — 네 가지 프레임워크, 한 페이지

`framework-interop-check/`는 tatami-a11y가 각 프레임워크 내에서 자체적으로 올바르게 작동하는지 여부를 알려줍니다. `astro-demo/`는 한 단계 더 나아갑니다: Astro의 아일랜드 아키텍처를 사용하여 React 아일랜드, Vue 아일랜드, Svelte 아일랜드 및 일반 JS 섹션을 *같은 페이지*에 마운트한 다음, 공유 프리미티브, 특히 라이브 영역 알리미가 각 아일랜드별로 격리된 인스턴스로 조용히 중복되는 대신 라이브러리의 독립적으로 번들된 복사본들 간에 실제로 협력하는지 확인합니다.

**실시간으로 보기:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**로컬에서 실행하기:** `cd astro-demo`, `pnpm install`, `pnpm dev`.

### tatami() — 라이프사이클 유틸리티

래퍼 테스트는 반복되는 패턴을 드러냈습니다: 모든 프레임워크는 어떤 명령형 DOM 라이브러리로부터든 동일한 세 가지를 필요로 합니다 — DOM이 준비되면 한 번 초기화하고, 프레임워크가 관리하는 요소에 대한 참조를 전달하며, 해당 요소가 사라질 때 정리하는 것입니다. 이에 대한 상용구는 구문만 다를 뿐 프레임워크 전반에 걸쳐 동일합니다.

`tatami()`는 16개 모든 컴포넌트에 대한 이러한 핸드셰이크를 처리하는 단일의 프레임워크 비종속적인 유틸리티입니다. 이 라이브러리의 React 버전도, Vue 버전도 아닙니다 — 하나의 함수로, 프레임워크 임포트 없이 어디서든 작동합니다.

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — useEffect 내부
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — onMounted / onUnmounted 내부
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: 액션
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// 순수 JS, 프레임워크 전혀 없음
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — 클라이언트 컴포넌트 필요 (파일 상단에 'use client'), 그 다음 순수 React와 동일한 useEffect 패턴
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — Vue와 동일한 onMounted/onUnmounted 패턴, 유니버설 렌더링 설정에서 추가 안전을 위해 import.meta.client로 보호됨
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()`는 `destroy()`를 가진 컨트롤러를 반환하고, 인스턴스화된 컴포넌트가 실제로 가진 모든 공개 메서드를 전달합니다(런타임에 리플렉션을 통해 파생 — 하드코딩된 메서드 목록 없음). 개발 모드에서는 `destroy()` 호출 후 전달된 메서드를 호출하거나 컴포넌트에 없는 메서드를 호출하면 컴포넌트 이름과 메서드 이름을 포함하는 `console.warn`이 발생합니다. 프레임워크는 두 가지만 알면 됩니다: DOM이 준비되면 `tatami()`를 호출하고, 정리 시 `ctrl.destroy()`를 호출하는 것입니다. 나머지는 컴포넌트 자체에서 처리합니다.

`Toast`는 특수 사례로 처리됩니다: 인스턴스가 아닌 정적 전용 API(`Toast.show()`, `Toast.configure()` 등)를 사용하며, `tatami()`는 이를 자동으로 감지하여 정적 메서드를 직접 전달합니다.

> **위 Next.js 및 Nuxt 예시에 대하여:** 이들은 각 프레임워크의 표준적이고 현재 문서화된 라이프사이클 패턴이지만, 위 검증된 표의 React, Vue, Svelte와 달리 동일한 자동화된 크로스 프레임워크 하네스(실제 스캐폴드 앱, 강제 재렌더링, Playwright)를 거치지 않았습니다. 이들을 정확한 지침으로 간주하되, 위 세 프레임워크처럼 이 라이브러리에 대해 독립적으로 검증된 것으로는 아직 간주하지 마십시오.

### 개발 모드 경고

개발 모드에서 `tatami()`는 `destroy()` 호출 후 전달된 메서드가 호출되거나 컴포넌트에 메서드 이름이 존재하지 않을 때 `console.warn` 메시지를 발생시킵니다. 이러한 경고는 호출 시점에 다음 우선순위에 따라 해결되는 개발 모드 플래그에 의해 제어됩니다:

1.  **수동 재정의** — `setTatamiDebug(true)` 항상 우선합니다. 이는 자동 감지가 불가능한 번들러 없는 `<script>` 태그 사용에 대한 올바른 해결책입니다.
2.  **`import.meta.env?.DEV`** — Vite 기반 사용자에게 작동합니다.
3.  **`process.env.NODE_ENV !== "production"`** — webpack/Node 인식 번들러를 위한 대체 옵션입니다.
4.  **기본값 `false`** — 인식되지 않는 환경에서 기본적으로 경고를 표시하지 않습니다.

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// 개발 중 경고 활성화 (<script> 태그 사용 시 필수)
setTatamiDebug(true);
```

## 빠른 시작

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// 스크린 리더 알림: 기본적으로 공손하게, 긴급할 때는 단호하게
announce("Changes saved");
announce("Error: something went wrong", { urgent: true });

// 일시적인 UI (모달, 드롭다운, 대화 상자)를 위한 초점 복원
pushFocusStack(triggerElement);
// ... 모달/드롭다운 열기 ...
popFocusStack(); // 초점이 triggerElement로 돌아가거나, 가장 가까운 유효한 대체 요소로 돌아갑니다
```

## 배포된 사이트

-   **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh), a11y 애드온을 포함한 대화형 컴포넌트 예제
-   **문서:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh), TypeDoc으로 생성된 전체 API 문서
-   **데모:** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh), 모든 컴포넌트를 포함한 라이브 데모
-   **Astro Islands 데모:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh), 한 페이지에 네 가지 프레임워크 아일랜드(React, Vue, Svelte, 순수 JS)가 `tatami()`를 통해 연결되어, 라이브러리의 독립적으로 번들된 복사본들 간의 공유 프리미티브 조정을 시연합니다

## 포함된 내용

### 프레임워크 어댑터

| 어댑터 | 설명 |
| ------- | ----------- |
| `tatami()` | 어떤 컴포넌트든 인스턴스화하고 공개 메서드를 전달하며 정리 작업을 처리하는 프레임워크 비종속적인 라이프사이클 유틸리티입니다. React `useEffect`, Vue/Nuxt `onMounted`/`onUnmounted`, Svelte `use:action` 또는 일반 `<script>` 태그에서 작동합니다. |

### 공유 프리미티브

| 프리미티브 | 설명 |
| --------- | ----------- |
| `announce()` | ARIA 라이브 영역을 통한 스크린 리더 알림. 공손/단호 라우팅, 중복 제거 및 적절한 `aria-atomic` 의미론을 지원합니다. |
| `checkReducedMotion()` / `onReducedMotionChange()` | 변경 리스너를 통한 시스템 수준의 모션 감소 감지. 모든 컴포넌트가 이를 자동으로 준수합니다. |
| `pushFocusStack()` / `popFocusStack()` | 오래된 참조 대체 체인을 포함한 초점 복원. 트리거 요소가 사라지면 가장 가까운 초점 가능한 조상으로 올라갑니다. |
| `activateFocusTrap()` / `deactivateFocusTrap()` | 첫 번째/마지막 요소 경계 감지 및 적절한 Tab/Shift+Tab 순환을 포함한 모달 초점 트래핑. |
| `createRovingTabindex()` | 목록, 그리드, 트리 및 탭 목록을 위한 화살표 키 탐색. 방향, 열 개수, 줄 바꿈 및 사용자 정의 키 핸들러를 지원합니다. |
| `createSingleton()` / `registerCleanup()` | HMR 안전한 싱글톤 팩토리. 컴포넌트는 리스너를 누수시키거나 DOM 노드를 중복시키지 않고 핫 리로드에서 살아남습니다. |

### 컴포넌트

| 컴포넌트          | ARIA 패턴                                | 주요 기능                                                          |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------- |
| Accordion          | `aria-expanded` / `aria-controls`           | 화살표 키 탐색, Home/End, 라이브 영역 알림             |
| Carousel           | `region` / `group` / `aria-roledescription` | 자동 재생, 모션 감소 준수, 슬라이드 알림                |
| Combobox           | 콤보박스 + 리스트박스                          | 입력하여 필터링, 화살표 키 탐색, 활성 하위 요소 관리    |
| CommandPalette     | 콤보박스 + 다이얼로그 모달                     | Ctrl+K 전역 단축키, 그룹화, 초점 트랩, 라이브 영역 카운트         |
| DatePicker         | 다이얼로그 + 그리드                               | 완전한 키보드 탐색, 초점 트랩, 월 탐색                |
| Dialog             | 비모달 다이얼로그                            | 트래핑 없는 초점 관리, 사용자는 탭으로 나갈 수 있음                  |
| Disclosure         | `aria-expanded` / `aria-controls`           | 적절한 의미론을 가진 간단한 표시/숨기기                                |
| Dropdown           | 메뉴 + 메뉴 항목                             | 초점 트랩, 화살표 키 탐색, Escape로 닫기                     |
| MenuButton         | `aria-haspopup="menu"`                      | 메뉴 버튼 패턴, 초점 관리                                 |
| Modal              | 다이얼로그 모달                                | 초점 트랩, 배경, Escape로 닫기, 초점 복원              |
| MultiselectListbox | 리스트박스 (다중 선택)                      | Shift+클릭 범위 선택, Ctrl+클릭 토글, 미리 입력 검색                       |
| ReorderableList    | 목록 + `aria-grabbed`                       | Ctrl+화살표 재정렬, 드래그 앤 드롭, 라이브 알림                 |
| Tabs               | 탭 목록 + 탭 + 탭 패널                    | 화살표 키 탐색, Home/End, 자동 탭 패널 가시성         |
| Toast              | 라이브 영역 + `role="alert"`                | 자동 닫기, Alt+T 바로 가기, 스택 관리                   |
| Tooltip            | `aria-describedby`                          | 호버/초점 트리거, Escape로 닫기, 모션 감소 준수           |
| TreeView           | 트리 + 트리 항목                             | 확장/축소, 화살표 키 탐색, 미리 입력 검색, 단일/다중 선택 |

## 규정 준수

-   **742개 단위 테스트** (vitest를 통한 jsdom) 24개 테스트 파일에 걸쳐, 모두 통과
-   **16개 Storybook 통합 테스트**, 각 컴포넌트가 실제 Playwright 브라우저에서 렌더링되고 대화형 동작이 검증됨
-   **내장 접근성 검사:** 모든 Storybook 스토리는 `@storybook/addon-a11y`를 통해 axe-core로 자동 감사되며, 테스트 UI에 인라인으로 표시되고 CI에서 차단됨
-   **WCAG 2.2 AA:** 모든 Storybook 스토리에서 자동화된 axe-core 스캐닝으로 감지된 위반 및 미완료 없음 (자동화된 스캐닝은 WCAG 기준의 의미 있는 하위 집합을 다루며, 전체 사양은 아님. 수동 스크린 리더 테스트는 이 위에 있는 자연스러운 다음 단계임)
-   **WAI-ARIA:** 모든 컴포넌트는 관련 APG 작성 방식을 따름
-   **키보드 탐색:** 모든 대화형 요소는 키보드로 완전히 조작 가능함
-   **스크린 리더:** 모든 상태 변경은 라이브 영역을 통해 알림

## 개발

```bash
pnpm install
pnpm run build              # dist/ (ESM + CJS + 타입 선언)로 빌드
pnpm run dev                # 감시 모드
pnpm run test               # 742개 단위 테스트 실행 (vitest, jsdom)
pnpm run test-storybook:run # 16개 브라우저 수준 통합 테스트 실행 (vitest + Playwright)
pnpm run storybook          # 포트 6006에서 대화형 컴포넌트 탐색기
pnpm run lint               # Rust 기반 린터 (oxlint, ESLint보다 50–100배 빠름)
pnpm run format             # Rust 기반 포맷터 (oxfmt, Prettier보다 35배 빠름)
pnpm run doc                # API 문서 빌드
```

### 개발 도구 체인

| 도구 | 스택 | 속도 향상 |
| --- | --- | --- |
| **Oxlint** | Rust 기반 린터 (ESLint 호환) | 50–100배 빠름 |
| **Oxfmt** | Rust 기반 포맷터 | 35배 빠름 |
| **Vitest 4.1.10** | 단위 + Storybook 테스트 러너 | 네이티브 브라우저 모드 |
| **Storybook 10.5.5** | 컴포넌트 테스트 + a11y 애드온 | Vitest와 통합됨 |
| **Playwright** | 통합 테스트를 위한 브라우저 자동화 | 프로덕션 수준 |
| **Rolldown** _(선택 사항)_ | 미래 지향적인 번들러 (Vite 코어) | 네이티브 Rust 성능 |

총: **758개 자동화된 테스트** (742개 단위 + 16개 Storybook), CI는 표준 하드웨어에서 30초 미만으로 실행됩니다.

---

## 배포

```bash
pnpm run deploy:storybook   # Storybook을 빌드하고 Surge에 배포
pnpm run deploy:docs        # API 문서를 빌드하고 Surge에 배포
pnpm run deploy:astro       # astro-demo/ 다중 프레임워크 데모를 빌드하고 Surge에 배포
```

위 사이트 중 어느 것이든 배포하려면 자신만의 [Surge](https://surge.sh) 계정과 `.env` 파일이 필요합니다(`.env.example`을 복사하고 자신의 서브도메인을 채우세요). 배포 스크립트는 실제 서브도메인으로 조용히 대체되는 대신 의도적으로 명확한 오류를 발생시키므로, 이 저장소를 복제하고 배포 스크립트를 실행해도 실수로 다른 사람의 사이트에 배포할 위험이 없으며, 항상 자신의 사이트에 배포하게 됩니다.

## 브라우저 지원

최신 브라우저(ES2020)를 대상으로 합니다: Chrome 80+, Firefox 80+, Safari 14.1+, Edge 80+. DOM API가 필요합니다.

**서버 측 렌더링 컨텍스트에서 안전하게 임포트할 수 있습니다.** `src/components/` 및 `src/shared/`의 모든 DOM 접근은 함수 또는 메서드 본문 내에 있습니다 — 모듈 스코프에서 `document`, `window`, `navigator` 또는 다른 브라우저 전용 전역을 읽는 것이 없으므로, 선언 외에 임포트 시점에 실행되는 것은 없습니다. 패키지를 빌드하고 어떤 종류의 DOM 심도 없는 순수 Node 프로세스에서 모든 진입점을 임포트하여 검증되었습니다. CJS(`.js` 파일 — 이 패키지에는 `"type": "module"` 필드가 없으므로, `exports` 맵에 따라 `.js`는 `require` 빌드이고 `.mjs`는 `import` 빌드입니다):

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

둘 다 오류 없이 성공합니다. ESM 빌드도 마찬가지로:

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

둘 다 오류 없이 성공합니다. README의 코드 예제는 소비자가 패키지를 사용할 것으로 예상되는 방식이므로 `import` 구문을 사용합니다 — `exports` 맵은 이러한 `import`를 `.mjs` 빌드로 라우팅하고 모든 `require()`는 `.js` 빌드로 라우팅합니다.

임포트하는 것은 안전하지만, 컴포넌트를 *사용하려면* 여전히 실제 DOM이 필요합니다. 이미 검증된 클라이언트 전용 React, Vue, Svelte 통합과 동일하게 표준 라이프사이클 훅 패턴이 적용됩니다: React/Next.js의 `useEffect`, Vue/Nuxt의 `onMounted`.

## 라이선스

MIT, LICENSE를 참조하세요.