# tatami-a11y

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 746 passing](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![Toolchain: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

أولويات وعناصر واجهة مستخدم (UI) بدائية ومكونات لا تعتمد على إطار عمل، تركز على إمكانية الوصول للغة JavaScript النقية.

**16 مكونًا، 6 عناصر بدائية مشتركة، 746 اختبار وحدة، 16 اختبار تكامل Storybook على مستوى المتصفح مع فحوصات إمكانية الوصول، صفر تبعيات وقت التشغيل**، جميعها تنفذ ممارسات تأليف WAI-ARIA مع امتثال مُتحقق لمعايير WCAG 2.2 AA.

## المشكلة

يحتاج كل مكون تفاعلي يمكن الوصول إليه إلى نفس البنية التحتية الصعبة التي يسهل الوقوع في أخطاء عند بنائها:

-   **مناطق البث المباشر (Live regions):** الإعلان لقارئات الشاشة دون سرقة التركيز.
-   **استعادة التركيز (Focus restoration):** إعادة التركيز عند إغلاق واجهة المستخدم المؤقتة، حتى لو اختفى العنصر المشغل.
-   **حبس التركيز (Focus trapping):** إبقاء التنقل بلوحة المفاتيح داخل النماذج المنبثقة (modals) ومربعات الحوار (dialogs).
-   **الحركة المخفضة (Reduced motion):** احترام تفضيلات النظام دون فحوصات يدوية في كل مكان.
-   **Roving tabindex:** التنقل باستخدام مفاتيح الأسهم للقوائم، والشبكات، والأشجار، وقوائم التبويبات (tablists).
-   **Singletons آمنة لـ HMR:** البقاء على قيد الحياة عند إعادة تحميل الوحدة الساخنة (hot module reloads) دون تكرار عقد DOM أو تسريب المستمعين.

معظم المشاريع تعيد بناء هذه البنى من الصفر لكل مكون. إن التنفيذ العاشر لـ "استعادة التركيز عند الإغلاق" هو بالضبط حيث ينسى أحدهم حالة المرجع القديم ويصدر قائمة منسدلة (dropdown) تترك تركيز لوحة المفاتيح صامتًا على `<body>`.

يستخلص tatami-a11y هذه البدائيات المشتركة في أساس واحد ومختبر، ثم يبني مكونات يمكن الوصول إليها بالكامل فوقها. يعتمد كل مكون في المكتبة على نفس البدائيات التي أثبتت فعاليتها، لذا فإن الخطأ الذي يتم إصلاحه في أحدهما يتم إصلاحه في جميعها.

![رسم بياني يقارن إعادة تنفيذ إمكانية الوصول لكل مكون مقابل البناء على بدائيات مشتركة ومُختبرة](./assets/shared_a11y_primitives_problem.png)

## لماذا "tatami"؟

التاتامي هو حصيرة أرضية يابانية تقليدية، وحدة قياسية قابلة للتبديل تعمل كأساس لغرفة بأكملها. لا تلاحظ التاتامي، لكن كل شيء مستقر مبني فوقها. نفس الفكرة هنا: هذه البدائيات هي الأساس، والمكونات هي الغرفة التي تعيش فيها فعليًا.

## لماذا لا يعتمد على إطار عمل (Framework-Agnostic)

تحل Radix UI وReact Aria هذه المشكلة جيدًا، بالنسبة لـ React. تغطي Headless UI كلاً من Vue وReact. إذا لم تكن في أحد هذه الأنظمة البيئية، أو كنت تحتفظ بقاعدة أكواد JavaScript نقية، فلا يوجد مكافئ جاد ومحافظ عليه بنشاط. تم بناء tatami-a11y ليكون كذلك: لا يوجد DOM افتراضي، لا وقت تشغيل لإطار العمل، يعمل بشكل متطابق سواء قمت باستدعائه من مكون يدوي الصنع، أو Vue composable، أو Svelte `use:action`، أو علامة `<script>` بسيطة.

### قابلية التشغيل البيني المُتحققة مع أطر العمل

تم التحقق من ادعاء عدم الاعتماد على إطار عمل باستخدام اختبارات Playwright الآلية عبر ثلاثة هياكل Vite منفصلة، كل منها يقوم بتثبيت `tatami-a11y` من حزمة npm المنشورة تمامًا كما يفعل المستهلك الحقيقي. تم اختبار مكونين في كل إطار عمل — Toast (يُلحق بـ `document.body`، خارج أي شجرة يديرها إطار العمل) وDropdown (يرفق سلوكًا بعقدة DOM قام إطار العمل بتقديمها). تم اختبار كل من نمط الاستخدام الساذج (naive) ونمط الغلاف اليدوي (wrapper) المتبع في إطار العمل، وتم اختبار كل منهما بشكل مكثف عن طريق إجبار إطار العمل المضيف على إعادة تقديم المنطقة المحيطة بينما كانت إضافات DOM للمكتبة موجودة.

| إطار العمل | Toast (ساذج) | Toast (غلاف) | Dropdown (ساذج) | Dropdown (غلاف يدوي الصنع) |
| --------- | ------------- | --------------- | ---------------- | ------------------------------ |
| **React** | ✅ نجاح        | ✅ نجاح          | ✅ نجاح           | ✅ نجاح                         |
| **Vue**   | ✅ نجاح        | ✅ نجاح          | ✅ نجاح           | ✅ نجاح                         |
| **Svelte**| ✅ نجاح        | ✅ نجاح          | ✅ نجاح           | ✅ نجاح                         |

اجتازت جميع الاختبارات الـ 12 دون الحاجة إلى أي كود ربط (glue code) لـ Toast. يعمل Dropdown بشكل ساذج في جميع أطر العمل الثلاثة ويمرر أيضًا مع غلاف يدوي الصنع يتوافق مع إطار العمل (`useRef`+`useEffect` في React، `ref`+`onMounted`/`onUnmounted` في Vue، `use:action` في Svelte). توجد النتائج الكاملة وإخراج الاختبار الخام في [`framework-interop-check/`](./framework-interop-check/).

**شغلها بنفسك:** كل من `framework-interop-check/react-app` و`framework-interop-check/vue-app` و`framework-interop-check/svelte-app` هو تطبيق Vite مستقل وقابل للتثبيت. `cd` إلى أي منها، ثم `pnpm install`، ثم `pnpm dev`، وافتح عنوان URL المحلي المطبوع للنقر عبر اختبارات النمط الساذج والغلاف مباشرة بدلاً من أخذ الجدول أعلاه على محمل الثقة.

> **ملاحظة حول `tatami()`:** يعكس الجدول أعلاه التحقيق الأصلي لأطر العمل الثلاثة، والذي استخدم أغلفة يدوية الصنع. تم تطوير محول `tatami()` لاحقًا ولديه اختبارات وحدة مخصصة تغطي جميع المكونات الـ 16 (انظر `__tests__/tatami.test.ts`)، بما في ذلك اختبارات توجيه الأساليب، واستقلالية التدمير، وتحذيرات وضع التطوير. تم التحقق من عمل محول `tatami()` بشكل صحيح مع جميع المكونات الـ 16 عبر اختبارات الوحدة هذه. اجتياز كامل لـ Playwright عبر أطر العمل معلق، ولكن صحة المحول تم إثباتها من خلال مجموعة اختبارات الوحدة.

### Astro Islands Demo — أربعة أطر عمل، صفحة واحدة

يجيب `framework-interop-check/` على ما إذا كان tatami-a11y يعمل بشكل صحيح داخل كل إطار عمل بمفرده. يذهب `astro-demo/` خطوة أبعد: يقوم بتركيب جزيرة React، وجزيرة Vue، وجزيرة Svelte، وقسم JavaScript عادي في *نفس الصفحة* باستخدام بنية جزر Astro، ثم يتحقق مما إذا كانت البدائيات المشتركة، وتحديداً مُعلن منطقة البث المباشر (live-region announcer)، تتناسق بالفعل عبر نسخ المكتبة المجمعة بشكل مستقل بدلاً من تكرارها بصمت في مثيلات معزولة لكل جزيرة.

**شاهدها مباشرة:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**شغلها محليًا:** `cd astro-demo`، `pnpm install`، `pnpm dev`.

### `tatami()` — الأداة المساعدة لدورة الحياة

كشفت اختبارات الغلاف عن نمط متكرر: يحتاج كل إطار عمل إلى نفس الأشياء الثلاثة من أي مكتبة DOM إلزامية — التهيئة بمجرد أن يصبح DOM جاهزًا، وتسليمه مراجع للعناصر التي يديرها إطار العمل، والتنظيف عندما تغادر تلك العناصر. الكود النمطي (boilerplate) لذلك متطابق عبر أطر العمل، ولكن بتنسيق مختلف.

`tatami()` هي أداة مساعدة واحدة، لا تعتمد على إطار عمل، تتولى هذا الاتصال لجميع المكونات الـ 16. إنها ليست نسخة React من المكتبة، وليست نسخة Vue — دالة واحدة، لا استيرادات لإطار العمل، تعمل في أي مكان.

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — داخل useEffect
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — داخل onMounted / onUnmounted
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// Plain JS, بدون أي إطار عمل على الإطلاق
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — مكون العميل مطلوب ('use client' في
// أعلى الملف)، ثم نفس نمط useEffect مثل React العادي
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — نفس نمط onMounted/onUnmounted مثل Vue، محمي بـ
// import.meta.client لمزيد من الأمان في إعدادات العرض الشامل
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

تُرجع `tatami()` وحدة تحكم (controller) مع `destroy()` وتقوم بتوجيه كل طريقة عامة يمتلكها المكون الفعلي المُنشأ (مُشتقة في وقت التشغيل عبر الانعكاس — لا توجد قائمة طرق مُكودة بشكل ثابت). في وضع التطوير، يؤدي استدعاء طريقة مُوجهة بعد `destroy()` أو استدعاء طريقة لا يمتلكها المكون إلى إصدار `console.warn` مع اسم المكون واسم الطريقة. يحتاج إطار العمل فقط إلى معرفة شيئين: استدعاء `tatami()` عندما يكون DOM جاهزًا، واستدعاء `ctrl.destroy()` عند التنظيف. يتم التعامل مع كل شيء آخر بواسطة المكون نفسه.

يتم التعامل مع `Toast` كحالة خاصة: يستخدم واجهة برمجة تطبيقات ثابتة فقط (`Toast.show()`، `Toast.configure()`، وما إلى ذلك) بدلاً من المثيلات، وتكتشف `tatami()` ذلك تلقائيًا وتقوم بتوجيه الطرق الثابتة مباشرة.

> **حول أمثلة Next.js وNuxt أعلاه:** هذه أنماط دورة حياة قياسية وحديثة وموثقة لكل إطار عمل، ولكن على عكس React وVue وSvelte في الجدول المُتحقق منه أعلاه، لم يتم تشغيلها عبر نفس آلية الاختبار الآلية عبر أطر العمل (تطبيق فعلي مُهيكل، إعادة تقديم قسرية، Playwright). تعامل معها كتوجيه صحيح، وليس بعد كشيء تم التحقق منه بشكل مستقل مقابل هذه المكتبة بالطريقة التي تم بها التحقق من أطر العمل الثلاثة المذكورة أعلاه.

### تحذيرات وضع التطوير

في وضع التطوير، تُصدر `tatami()` رسائل `console.warn` عند استدعاء طريقة مُوجهة بعد `destroy()` أو عندما لا يكون اسم الطريقة موجودًا في المكون. يتم التحكم في هذه التحذيرات بواسطة علامة وضع التطوير التي يتم حلها في وقت الاستدعاء بهذا الترتيب للأولوية:

1.  **التجاوز اليدوي (Manual override)** — `setTatamiDebug(true)` يفوز دائمًا. هذا هو الإجابة الصحيحة لاستخدام علامة `<script>` الخالية من المجمعات، حيث لا يمكن الكشف التلقائي.
2.  **`import.meta.env?.DEV`** — يعمل للمستهلكين الذين يعتمدون على Vite.
3.  **`process.env.NODE_ENV !== "production"`** — بديل للمجمعات المتوافقة مع webpack/Node.
4.  **الافتراضي `false`** — صمت افتراضي في بيئة غير معروفة.

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// تمكين التحذيرات أثناء التطوير (مطلوب لاستخدام علامة <script>)
setTatamiDebug(true);
```

## بدء سريع

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// إعلانات قارئ الشاشة: مهذبة افتراضيا، حاسمة عند الحاجة الملحة
announce("Changes saved");
announce("Error: something went wrong", { urgent: true });

// استعادة التركيز لواجهة المستخدم المؤقتة (modals, dropdowns, dialogs)
pushFocusStack(triggerElement);
// ... افتح modal/dropdown الخاص بك ...
popFocusStack(); // يعود التركيز إلى triggerElement، أو أقرب بديل صالح
```

## المواقع المنشورة

-   **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh)، أمثلة مكونات تفاعلية مع إضافة إمكانية الوصول (a11y addon)
-   **الوثائق:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh)، وثائق API كاملة تم إنشاؤها بواسطة TypeDoc
-   **العرض التوضيحي (Demo):** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh)، عرض توضيحي مباشر لجميع المكونات
-   **عرض Astro Islands التوضيحي:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)، أربع جزر إطار عمل (React، Vue، Svelte، JS عادي) في صفحة واحدة، متصلة عبر `tatami()`، توضح تنسيق البدائيات المشتركة عبر نسخ المكتبة المجمعة بشكل مستقل

## ما هو المتضمن

### محول إطار العمل (Framework Adapter)

| المحول | الوصف |
| ------- | ----------- |
| `tatami()` | أداة مساعدة لدورة الحياة لا تعتمد على إطار عمل، تقوم بإنشاء أي مكون، وتوجيه الأساليب العامة، والتعامل مع التنظيف. تعمل من React `useEffect`، وVue/Nuxt `onMounted`/`onUnmounted`، وSvelte `use:action`، أو علامات `<script>` العادية. |

### البدائيات المشتركة (Shared Primitives)

| البدائية | الوصف |
| --------- | ----------- |
| `announce()` | إعلانات قارئ الشاشة عبر مناطق ARIA الحية. تدعم التوجيه المهذب/الحاسم، إزالة التكرار، ودلالات `aria-atomic` الصحيحة. |
| `checkReducedMotion()` / `onReducedMotionChange()` | الكشف عن الحركة المخفضة على مستوى النظام مع مستمعي التغيير. يحترم كل مكون هذا تلقائيًا. |
| `pushFocusStack()` / `popFocusStack()` | استعادة التركيز مع سلسلة احتياطية للمرجع القديم. إذا اختفى العنصر المشغل، فإنه ينتقل إلى أقرب سلف قابل للتركيز. |
| `activateFocusTrap()` / `deactivateFocusTrap()` | حبس تركيز النماذج المنبثقة مع اكتشاف حدود العنصر الأول/الأخير ودوران Tab/Shift+Tab الصحيح. |
| `createRovingTabindex()` | التنقل باستخدام مفاتيح الأسهم للقوائم، والشبكات، والأشجار، وقوائم التبويبات. يدعم التوجيه، وعدد الأعمدة، والالتفاف، ومعالجات المفاتيح المخصصة. |
| `createSingleton()` / `registerCleanup()` | مصنع Singleton آمن لـ HMR. تنجو المكونات من عمليات إعادة التحميل الساخنة دون تسريب المستمعين أو تكرار عقد DOM. |

### المكونات (Components)

| المكون | نمط ARIA | الميزات الرئيسية |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------- |
| Accordion | `aria-expanded` / `aria-controls` | التنقل بمفاتيح الأسهم، Home/End، إعلانات المنطقة الحية |
| Carousel | `region` / `group` / `aria-roledescription` | تشغيل تلقائي، احترام الحركة المخفضة، إعلانات الشرائح |
| Combobox | combobox + listbox | الكتابة للتصفية، التنقل بمفاتيح الأسهم، إدارة التابع النشط |
| CommandPalette | combobox + dialog-modal | اختصار عالمي Ctrl+K، تجميع، حبس التركيز، عد المنطقة الحية |
| DatePicker | dialog + grid | تنقل كامل بلوحة المفاتيح، حبس التركيز، تنقل الأشهر |
| Dialog | non-modal dialog | إدارة التركيز بدون حبس، يمكن للمستخدمين الخروج بالضغط على Tab |
| Disclosure | `aria-expanded` / `aria-controls` | إظهار/إخفاء بسيط مع دلالات صحيحة |
| Dropdown | menu + menuitem | حبس التركيز، التنقل بمفاتيح الأسهم، Escape للإغلاق |
| MenuButton | `aria-haspopup="menu"` | نمط زر القائمة، إدارة التركيز |
| Modal | dialog-modal | حبس التركيز، خلفية (backdrop)، Escape للإغلاق، استعادة التركيز |
| MultiselectListbox | listbox (multi-select) | تحديد النطاق Shift+Click، تبديل Ctrl+Click، الكتابة المسبقة (typeahead) |
| ReorderableList | list + `aria-grabbed` | إعادة ترتيب Ctrl+Arrow، سحب وإفلات، إعلانات حية |
| Tabs | tablist + tab + tabpanel | التنقل بمفاتيح الأسهم، Home/End، رؤية لوحة التبويب التلقائية |
| Toast | live region + `role="alert"` | إغلاق تلقائي، اختصار الانتقال Alt+T، إدارة المكدس |
| Tooltip | `aria-describedby` | تشغيل بالتحويم/التركيز، إخفاء Escape، احترام الحركة المخفضة |
| TreeView | tree + treeitem | توسيع/طي، التنقل بمفاتيح الأسهم، الكتابة المسبقة، تحديد فردي/متعدد |

## الامتثال

-   **742 اختبار وحدة** عبر 24 ملف اختبار (jsdom عبر vitest)، جميعها ناجحة
-   **16 اختبار تكامل Storybook**، كل مكون يتم تقديمه في متصفح Playwright حقيقي والتحقق من سلوكه التفاعلي
-   **فحوصات إمكانية الوصول المضمنة:** يتم تدقيق كل قصة Storybook تلقائيًا باستخدام axe-core عبر `@storybook/addon-a11y`، ويتم عرضها مباشرة في واجهة مستخدم الاختبار وحظرها في CI
-   **WCAG 2.2 AA:** صفر انتهاكات وصفر حالات غير مكتملة تم اكتشافها بواسطة فحص axe-core الآلي عبر جميع قصص Storybook (يغطي الفحص الآلي مجموعة فرعية مهمة من معايير WCAG، وليس المواصفات الكاملة، واختبار قارئ الشاشة اليدوي هو الطبقة التالية الطبيعية فوق هذا)
-   **WAI-ARIA:** يتبع كل مكون ممارسة تأليف APG ذات الصلة
-   **الحركة المخفضة:** تحترم كل حركة `prefers-reduced-motion`
-   **التنقل بلوحة المفاتيح:** يمكن تشغيل كل عنصر تفاعلي بالكامل بواسطة لوحة المفاتيح
-   **قارئ الشاشة:** يتم الإعلان عن كل تغيير حالة عبر المناطق الحية (live regions)

## التطوير

```bash
pnpm install
pnpm run build              # بناء إلى dist/ (ESM + CJS + تعريفات النوع)
pnpm run dev                # وضع المراقبة
pnpm run test               # تشغيل 742 اختبار وحدة (vitest, jsdom)
pnpm run test-storybook:run # تشغيل 16 اختبار تكامل على مستوى المتصفح (vitest + Playwright)
pnpm run storybook          # مستكشف المكونات التفاعلي على المنفذ 6006
pnpm run lint               # مدقق Rust-based (oxlint, أسرع 50-100 مرة من ESLint)
pnpm run format             # منسق Rust-based (oxfmt, أسرع 35 مرة من Prettier)
pnpm run doc                # بناء وثائق API
```

### سلسلة أدوات التطوير

| الأداة | المكدس | مكسب السرعة |
| --- | --- | --- |
| **Oxlint** | مدقق Rust-based (متوافق مع ESLint) | أسرع 50–100 مرة |
| **Oxfmt** | منسق Rust-based | أسرع 35 مرة |
| **Vitest 4.1.10** | مشغل اختبارات الوحدة + Storybook | وضع المتصفح الأصلي |
| **Storybook 10.5.5** | اختبار المكونات + إضافة a11y | متكامل مع Vitest |
| **Playwright** | أتمتة المتصفح لاختبارات التكامل | بجودة إنتاجية |
| **Rolldown** _(اختياري)_ | مجمع جاهز للمستقبل (نواة Vite) | أداء Rust الأصلي |

الإجمالي: **758 اختبارًا آليًا** (742 وحدة + 16 Storybook)، يتم تشغيل CI في أقل من 30 ثانية على الأجهزة القياسية.

---

## النشر

```bash
pnpm run deploy:storybook   # بناء ونشر Storybook إلى Surge
pnpm run deploy:docs        # بناء ونشر وثائق API إلى Surge
pnpm run deploy:astro       # بناء ونشر عرض astro-demo/ متعدد أطر العمل إلى Surge
```

يتطلب نشر أي من المواقع المذكورة أعلاه حساب [Surge](https://surge.sh) الخاص بك وملف `.env` (انسخ `.env.example` واملأ النطاقات الفرعية الخاصة بك). تقوم نصوص النشر عمدًا بإظهار خطأ واضح بدلاً من الرجوع بصمت إلى نطاق فرعي حقيقي، لذا فإن استنساخ هذا المستودع وتشغيل نص نشر لا يخاطر أبدًا بنشر عرضي نحو موقع شخص آخر، ستنشر دائمًا إلى موقعك الخاص.

## دعم المتصفحات

يستهدف المتصفحات الحديثة (ES2020): Chrome 80+، Firefox 80+، Safari 14.1+، Edge 80+. يتطلب واجهات برمجة تطبيقات DOM.

**آمن للاستيراد في سياق عرض من جانب الخادم (server-side rendering).** كل وصول إلى DOM في `src/components/` و`src/shared/` موجود داخل جسم دالة أو طريقة — لا شيء يقرأ `document`، `window`، `navigator`، أو أي كائن عام آخر متاح للمتصفح فقط في نطاق الوحدة، لذلك لا شيء ينفذ في وقت الاستيراد بخلاف التصريحات. تم التحقق من ذلك عن طريق بناء الحزمة واستيراد كل نقطة دخول في عملية Node خام بدون أي محاكيات DOM من أي نوع. CJS (ملفات `.js` — هذه الحزمة لا تحتوي على حقل `"type": "module"`، لذا فإن `.js` هو بناء `require` و`.mjs` هو بناء `import`، وفقًا لخريطة `exports`):

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

كلاهما ينجح بدون أخطاء. بناءات ESM، بنفس الطريقة:

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

كلاهما ينجح بدون أخطاء. تستخدم أمثلة الكود في README صيغة `import` لأن هذا هو كيف يتوقع من المستهلكين استخدام الحزمة — خريطة `exports` توجه تلك `import`s إلى بناء `.mjs` وأي `require()` إلى بناء `.js`.

الاستيراد آمن، لكن *استخدام* المكونات لا يزال يتطلب DOM حقيقيًا. ينطبق نمط خطاف دورة الحياة القياسي، تمامًا كما هو الحال في عمليات تكامل React وVue وSvelte المعتمدة بالفعل والتي تعمل على جانب العميل فقط: `useEffect` لـ React/Next.js، `onMounted` لـ Vue/Nuxt.

## الترخيص

MIT، انظر LICENSE.