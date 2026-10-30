---
title: 前端与综合随笔聚合快照：Vue、MyBatis、UniApp、缓存注解与环境排障
capturedAt: 2026-08-21 00:00:00+08:00
sourceType: personal-notes-and-fuwari
sourceUrl: "https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9"
immutable: true
tags: [Vue, MyBatis, UniApp, Cache, Essay]
description: 聚合 10 篇零散原文（personal 1 篇 uni-app + fuwari 9 篇 vue/mybatis/cache/essays/basic），固定 personal bbb2126 / fuwari 07cee2b，均为随笔性质，未作强一致性验证。
---

# 前端与综合随笔聚合快照：Vue、MyBatis、UniApp、缓存注解与环境排障

本文件为聚合证据快照（immutable raw），按 LLM-Wiki 规范原样收录多篇来源原文，不改动正文，仅增加 provenance 头部与分隔。后续 wiki 页通过 `sources: ["{slug}"]` 引用本快照。

- raw slug: `ingest-frontend-essays`
- 对应 wiki: `frontend-mybatis-essays`
- Personal-markdown-notes 固定提交: `bbb2126`（`https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9`）
- Fuwari 固定提交: `07cee2b`（`https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52`）
- 捕获方式: `gh repo clone --depth 1` 后按路径分组，原样拼接，空文件与完全重复文件已标注但未删改内容

## 来源清单

| 序号 | 仓库 | 相对路径 | 大小 | 去重标注 |
| --- | --- | --- | --- | --- |
| 1 | Personal-markdown-notes | `uni-app/Uniapp融合VantWeapp开发.md` | 1836 |  |
| 2 | Fuwari | `vue.md` | 22653 |  |
| 3 | Fuwari | `mybatis.md` | 14909 |  |
| 4 | Fuwari | `cache/CacheableAndCacheEvict.md` | 13228 |  |
| 5 | Fuwari | `cache/springbootcache.md` | 1788 |  |
| 6 | Fuwari | `essays/sogou.md` | 1835 |  |
| 7 | Fuwari | `essays/ubunturesolvesversionconflicts.md` | 2179 |  |
| 8 | Fuwari | `essays/visualstudio.md` | 5717 |  |
| 9 | Fuwari | `basic/FRPSecurityAlertAnalysis.md` | 14216 |  |
| 10 | Fuwari | `basic/PremiumContent.md` | 14612 |  |

## 免责与边界

- 黑马课程、实战 156KB、Feed 流等笔记含课程截图、本地路径、未验证配置，未作可复现实验复核，仅作证据保存。
- Fuwari 部分文章含零宽度字符（如 `OptimisticvsPessimisticLocking​.md` 路径含 `\u200b`），已按原样保留文件名。
- 个人笔记中的 `redis/业务/事务的作用域.md` 为空文件（仅 1 字节换行），已保留记录。
- 本快照不改写任何原文；冲突或过时结论由 wiki 层显式标注。

---

## 来源 1: Personal-markdown-notes / `uni-app/Uniapp融合VantWeapp开发.md`

- 原始 URL: <https://github.com/DavidHLP/Personal-markdown-notes/blob/bbb21260029584d41d1c667f88c5c8e2b761aad9/uni-app/Uniapp融合VantWeapp开发.md>
- 本地路径: `uni-app/Uniapp融合VantWeapp开发.md`

```markdown
# UniApp 融合 Vant Weapp 开发指南

## 一、基础环境

| 工具              | 版本                         |
| ----------------- | ---------------------------- |
| npm               | 10.9.2                       |
| node              | 22.14.0                      |
| yarn              | 1.22.22                      |
| npx               | 10.9.2                       |
| @dcloudio/uni-app | @3.0.0-4030620241128001      |
| @vant/weapp       | @1.11.7                      |

## 二、融合 Vant Weapp

### 1. 将 `@vant/weapp` 包移动到 `src/wxcomponents` 目录

> [!NOTE]
> weapp 目录中只保留 `dist` 目录

[image: wxcomponents 目录结构](./Uniapp-VantWeapp-image/wxcomponents.png)

### 2. 在 `App.vue` 中引入样式

```scss
<style lang="scss">
@import url("wxcomponents/@vant/weapp/dist/common/index.wxss");
</style>
```

### 3. 局部引入 @vant/weapp

- 修改 `pages.json`

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {}
  },
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "usingComponents": {
          "van-button": "wxcomponents/@vant/weapp/dist/button/index"
        }
      }
    }
  ]
}
```

### 4. 全局引入 @vant/weapp

- 修改 `pages.json`

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {}
  },
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    }
  ],
  "globalStyle": {
    "usingComponents": {
      "van-button": "wxcomponents/@vant/weapp/dist/button/index"
    }
  }
}
```

## 三、使用示例

```vue
<template>
  <view>
    <van-button type="primary">主要按钮</van-button>
    <van-button type="info">信息按钮</van-button>
    <van-rate v-model="rateValue" />
  </view>
</template>
```
```

## 来源 2: Fuwari / `vue.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/vue.md>
- 本地路径: `vue.md`

```markdown
---
title: Vue重要概念以及内容
published: 2025-07-10
description: 详细讲解Vue重要概念以及内容，其中包含了简洁的面试以及笔试回答
tags: [Vue3, Vue2, 面试]
category: Vue
draft: false
---

## 1. 请简述 Vue.js 的生命周期函数及其执行顺序。

Vue 实例从创建到销毁的整个过程，会伴随着一系列的事件，这些事件的钩子函数就是 Vue 的生命周期函数。它们让开发者在特定阶段有机会添加自己的代码。

### 生命周期流程图

`创建阶段` -\> `挂载阶段` -\> `更新阶段` -\> `销毁阶段`

### 执行顺序和作用

**Vue 2.x 和 Vue 3.x 的生命周期钩子（名称略有不同）**

| Vue 2.x         | Vue 3.x           | 作用                                                                                                  |
| --------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `beforeCreate`  | `setup()`         | **创建前**：实例刚初始化，数据（data）和事件（methods）都未初始化，无法访问。                         |
| `created`       | `setup()`         | **创建后**：实例已创建，数据和事件已配置好，可以访问`data`和`methods`，但 DOM 还未生成。              |
| `beforeMount`   | `onBeforeMount`   | **挂载前**：模板编译完成，`render`函数首次被调用，即将把虚拟 DOM 渲染为真实 DOM，但尚未挂载到页面上。 |
| `mounted`       | `onMounted`       | **挂载后**：实例被挂载到 DOM 上，可以进行 DOM 操作。通常在此阶段进行 Ajax 请求、启动定时器等。        |
| `beforeUpdate`  | `onBeforeUpdate`  | **更新前**：当响应式数据发生变化时，虚拟 DOM 重新渲染和打补丁（patch）之前调用。                      |
| `updated`       | `onUpdated`       | **更新后**：虚拟 DOM 重新渲染和打补丁之后调用，DOM 已更新。应避免在此处修改数据，否则可能导致死循环。 |
| `beforeDestroy` | `onBeforeUnmount` | **销毁前**：实例即将被销毁。此时实例仍然可用，可以进行资源清理，如清除定时器、解绑自定义事件。        |
| `destroyed`     | `onUnmounted`     | **销毁后**：实例已被完全销毁，所有指令解绑，所有事件监听器被移除。                                    |

**特殊钩子**

- `activated`：被 `<keep-alive>` 缓存的组件激活时调用。
- `deactivated`：被 `<keep-alive>` 缓存的组件失活时调用。
- `errorCaptured`：当捕获一个来自子孙组件的错误时被调用。

**总结**：`setup()` 是 Vue 3 组合式 API 的核心，它在 `beforeCreate` 和 `created` 之前执行，是组件初始化的新入口。

---

## 2. Vue.js 中的 v-bind 指令和 v-model 指令有什么区别？

这是理解 Vue 单向数据流和双向绑定的关键。

- **`v-bind` (简写为 `:`)**

  - **作用**：**单向数据绑定**。用于将数据从父组件（或组件自身`data`）传递到 HTML 元素的属性或子组件的`prop`。
  - **数据流**：数据只能从数据源（`data`）流向模板（视图）。视图的改变不会反向影响数据。
  - **示例**：

    ```html
    <img :src="imageUrl" />

    <MyComponent :prop-name="parentData"></MyComponent>
    ```

- **`v-model`**

  - **作用**：**双向数据绑定**。它是一个语法糖，通常用在表单元素（如`<input>`, `<select>`, `<textarea>`）和自定义组件上。
  - **数据流**：数据源的变化会更新视图，同时视图（如用户输入）的变化也会反向更新数据源。
  - **原理**：`v-model` 本质上是 `v-bind:value` 和 `v-on:input` 的结合。
    - 它通过 `v-bind` 绑定了元素的 `value` 属性。
    - 它通过 `v-on` 监听了元素的 `input` (或 `change` 等) 事件，并在事件回调中更新绑定的数据。
  - **示例**：
    ```html
    <input v-model="message" />
    ```
    这行代码等同于：
    ```html
    <input :value="message" @input="message = $event.target.value" />
    ```

**核心区别**

| 特性     | `v-bind`              | `v-model`                   |
| -------- | --------------------- | --------------------------- |
| **方向** | 单向（数据 -\> 视图） | 双向（数据 \<-\> 视图）     |
| **用途** | 绑定属性、传递 Props  | 表单输入、组件数据双向同步  |
| **本质** | 属性绑定              | 属性绑定 + 事件监听的语法糖 |

---

## 3. 请简述 Vue.js 的组件通信方式及其优缺点。

| 通信方式                                                                      | 适用场景               | 优点                                                               | 缺点                                                                                     |
| ----------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **1. Props / $emit**                                                          | 父子组件               | **标准、清晰**：数据流向明确，易于理解和维护。                     | **繁琐**：对于深层嵌套的组件，需要逐层传递（Prop Drilling）。                            |
| **2. Event Bus / Mitt**                                                       | 任意组件（兄弟、跨级） | **解耦**：组件间无需直接引用，非常灵活。                           | **难以追踪**：在大型项目中，事件流向会变得混乱，难以调试和维护。                         |
| **3. Vuex / Pinia (状态管理)**                                                | 复杂、大型应用         | **集中式管理**：状态可预测，逻辑清晰，强大的 Devtools 支持。       | **有学习成本**：引入了额外的概念（state, mutation, action），增加了代码量。              |
| **4. `provide` / `inject`**                                                   | 祖先后代组件           | **解决 Prop Drilling**：祖先组件可以直接为所有后代组件提供数据。   | **非响应式（Vue 2）**：Vue 2 中默认不具响应性，Vue 3 中已解决。数据来源不如 Props 明确。 |
| **5. `$attrs` / `$listeners`** \<br/\> (Vue 3 中`$listeners`已合并到`$attrs`) | 隔代组件通信、封装组件 | **透明传递**：简化了高阶或包装组件的编写，无需显式声明所有 props。 | **不够直观**：不容易看出哪些属性和事件被传递了。                                         |
| **6. `$parent` / `$children` / `ref`**                                        | 父子组件               | **简单直接**：可以实现强制性的、直接的组件交互。                   | **强耦合**：破坏了组件的封装性，使组件依赖于其父子结构，难以重构。**应极力避免**。       |

---

## 4. Vue.js 如何实现父子组件之间的数据传递？

这是最常用也是最基础的通信方式。

### 父组件向子组件传递数据（Props）

父组件通过 `v-bind`（或简写 `:`）将数据绑定到子组件的 `prop` 上。子组件需要在使用 `props` 选项中声明它期望接收的数据。

- **父组件 (`Parent.vue`)**

  ```html
  <template>
    <ChildComponent :message="greeting" :user-data="user" />
  </template>

  <script>
    import ChildComponent from "./ChildComponent.vue";
    export default {
      components: { ChildComponent },
      data() {
        return {
          greeting: "Hello from Parent!",
          user: { name: "Alice", age: 30 },
        };
      },
    };
  </script>
  ```

- **子组件 (`ChildComponent.vue`)**

  ```html
  <template>
    <div>
      <p>{{ message }}</p>
      <p>User: {{ userData.name }}</p>
    </div>
  </template>

  <script>
    export default {
      props: {
        message: {
          type: String,
          required: true,
        },
        userData: Object,
      },
    };
  </script>
  ```

### 子组件向父组件传递数据（$emit）

子组件通过调用内置的 `$emit` 方法来触发一个自定义事件，并可以附带数据。父组件使用 `v-on`（或简写 `@`）来监听这个自定义事件。

- **子组件 (`ChildComponent.vue`)**

  ```html
  <template>
    <button @click="sendMessageToParent">Send Data</button>
  </template>

  <script>
    export default {
      methods: {
        sendMessageToParent() {
          // 触发名为'child-event'的事件，并传递一个字符串作为数据
          this.$emit("child-event", "This is a message from the child.");
        },
      },
    };
  </script>
  ```

- **父组件 (`Parent.vue`)**

  ```html
  <template>
    <div>
      <ChildComponent @child-event="handleChildEvent" />
      <p>Message from child: {{ childMessage }}</p>
    </div>
  </template>

  <script>
    import ChildComponent from "./ChildComponent.vue";
    export default {
      components: { ChildComponent },
      data() {
        return {
          childMessage: "",
        };
      },
      methods: {
        handleChildEvent(payload) {
          this.childMessage = payload;
        },
      },
    };
  </script>
  ```

---

## 5. 请简述 Vue.js 中的响应式原理。

Vue 的响应式系统是其核心特性，它使得数据变化能够自动反映到视图上。Vue 2 和 Vue 3 的实现原理不同。

### Vue 2.x: `Object.defineProperty`

- **核心**：利用 `Object.defineProperty()` 来劫持对象属性的 `getter` 和 `setter`。

- **流程**：

  1.  **初始化**：Vue 在初始化组件时，会遍历 `data` 对象的所有属性。
  2.  **劫持**：对每个属性，使用 `Object.defineProperty()` 将其转换为 `getter/setter`。
  3.  **依赖收集（Getter）**：当组件的 `render` 函数被执行时，会读取模板中用到的数据属性。这会触发对应属性的 `getter`。在 `getter` 中，一个名为 `Dep` 的依赖收集器会记录下是哪个 "Watcher"（观察者，通常代表一个组件）正在读取这个数据。
  4.  **派发更新（Setter）**：当数据属性被修改时，会触发 `setter`。在 `setter` 中，会通知 `Dep`，然后 `Dep` 会通知所有收集到的 "Watcher" 去更新自己，从而触发组件的重新渲染。

- **缺点**：

  - 无法检测到对象属性的动态添加或删除。必须使用 `Vue.set` (`this.$set`)。
  - 无法检测到通过数组索引直接修改数组或修改数组长度。必须使用特定的数组方法（如 `push`, `splice`）或 `Vue.set`。

### Vue 3.x: `Proxy`

- **核心**：利用 ES6 的 `Proxy` 对象来代理整个数据对象。

- **流程**：

  1.  **代理**：Vue 3 使用 `reactive()` 函数，它接收一个普通对象并返回一个 `Proxy` 代理对象。
  2.  **拦截**：`Proxy` 可以拦截对对象几乎所有的操作（如 `get`, `set`, `deleteProperty`, `has` 等），而不仅仅是属性读写。
  3.  **依赖收集与派发更新**：原理与 Vue 2 类似，当通过代理对象读取属性时，在 `get` 处理器中收集依赖；当修改属性时，在 `set` 处理器中派发更新。

- **优点**：

  - **全面拦截**：原生支持对象属性的添加、删除，以及数组索引修改和长度修改的侦测，不再需要 `Vue.set`。
  - **性能更好**：`Proxy` 是惰性创建的，只在访问深层属性时才会递归代理，而 `Object.defineProperty` 在初始化时需要遍历所有属性。

---

## 6. 如何在 Vue.js 中实现路由跳转？

路由跳转由 `vue-router` 库实现，主要有两种方式：

### 1. 声明式导航：`<router-link>`

这是最常用的方式，通过一个组件来生成 `<a>` 标签实现导航。

- **作用**：在模板中创建链接。
- **常用属性**：
  - `to`: 目标路由的路径或一个命名的路由对象。
  - `tag`: 指定 `<router-link>` 渲染成的 HTML 标签，默认为 `<a>`。
  - `active-class`: 链接激活时应用的 CSS 类名。
- **示例**：

  ```html
  <router-link to="/about">About</router-link>

  <router-link :to="{ name: 'user', params: { userId: 123 }}">User</router-link>

  <router-link to="/contact" tag="li">Contact</router-link>
  ```

### 2. 编程式导航：`router`实例方法

在组件的`<script>`部分，通过 JavaScript 代码来控制路由跳转。

- **获取`router`实例**：
  - 选项式 API: `this.$router`
  - 组合式 API: `const router = useRouter()`
- **常用方法**：
  - `router.push(location)`: 跳转到新路由，会在历史记录中添加一条新记录。
  - `router.replace(location)`: 跳转到新路由，但不会添加历史记录，而是替换当前记录。
  - `router.go(n)`: 在历史记录中前进或后退 `n` 步。`router.go(1)`是前进，`router.go(-1)`是后退。
- **示例**：
  ```javascript
  export default {
    methods: {
      goToProfile() {
        // 字符串路径
        this.$router.push("/profile");
      },
      updateUser(userId) {
        // 命名路由带参数
        this.$router.push({ name: "user-edit", params: { id: userId } });
      },
      loginAndRedirect() {
        // 登录成功后替换当前路由
        this.$router.replace("/dashboard");
      },
    },
  };
  ```

---

## 7. Vue.js 中的 computed 和 watch 有什么区别？

`computed` 和 `watch` 都用于响应数据的变化，但它们的适用场景和实现方式完全不同。

### `computed` (计算属性)

- **本质**：一个**属性**。它根据其他响应式数据计算得出一个新值。
- **核心特性**：**缓存**。计算属性会缓存其计算结果。只有当它的依赖数据发生改变时，它才会重新计算。如果依赖没有改变，多次访问计算属性会立即返回之前缓存的结果，而不会重新执行函数。
- **使用场景**：当你需要一个值依赖于其他值时使用。例如，从一个数组中过滤出符合条件的新数组，或者将姓和名拼接成全名。
- **语法**：定义在 `computed` 选项中，模板中像普通属性一样使用。
- **示例**：
  ```javascript
  export default {
    data() {
      return {
        firstName: "John",
        lastName: "Doe",
      };
    },
    computed: {
      fullName() {
        // 依赖于firstName和lastName
        return `${this.firstName} ${this.lastName}`;
      },
    },
  };
  ```
  ```html
  <p>{{ fullName }}</p>
  ```

### `watch` (侦听器)

- **本质**：一个**观察者**。它观察一个特定的数据源，并在数据源变化时执行一个**回调函数（副作用）**。
- **核心特性**：不产生新值，而是用于执行异步或开销较大的操作。它没有缓存。
- **使用场景**：当数据变化时，需要执行异步操作（如 API 请求）或复杂逻辑时。
- **语法**：定义在 `watch` 选项中。
- **示例**：
  ```javascript
  export default {
    data() {
      return {
        question: "",
        answer: "I cannot give you an answer until you ask a question!",
      };
    },
    watch: {
      // 侦听question的变化
      question(newQuestion, oldQuestion) {
        // 执行异步操作
        this.getAnswer(newQuestion);
      },
    },
    methods: {
      getAnswer(q) {
        /* ...发起API请求... */
      },
    },
  };
  ```

**总结区别**

| 特性       | `computed`                       | `watch`                     |
| ---------- | -------------------------------- | --------------------------- |
| **用途**   | 计算衍生值 (同步)                | 执行副作用 (异步、复杂逻辑) |
| **缓存**   | **有**，依赖不变不重新计算       | **无**，每次变化都执行回调  |
| **返回值** | **必须有**，返回计算结果         | **无**，关注的是过程        |
| **调用**   | 模板中声明式使用，像普通数据一样 | 数据变化时自动执行回调函数  |

> **一句话概括**：如果你需要根据现有数据派生出一个新数据，用 `computed`；如果你需要在数据变化时做一些事情（比如调用 API），用 `watch`。

---

## 8. Vue.js 中的 v-for 指令和 v-if 指令有什么区别？

`v-for` 用于列表渲染，`v-if` 用于条件渲染。一个常见的问题是将它们用在同一个元素上。

### 两者的优先级

- **Vue 2.x**: `v-for` 的优先级高于 `v-if`。
- **Vue 3.x**: `v-if` 的优先级高于 `v-for`。

### 为什么不推荐一起使用？

不管哪个版本，将它们放在同一个元素上都是**不推荐的**，因为会造成性能浪费或逻辑错误。

- **在 Vue 2 中**: `v-for` 先执行，意味着会先遍历整个列表，然后在每个列表项上再用 `v-if` 去判断是否渲染。如果你的列表很大，而只有少数几项需要显示，这会造成极大的性能浪费。
  ```html
  <div v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </div>
  ```
- **在 Vue 3 中**: `v-if` 先执行。此时 `v-for` 还没执行，所以 `v-if` 无法访问到 `v-for` 作用域中的变量（如 `user`），会导致错误。

### 正确的用法

1.  **如果想根据条件决定是否渲染整个列表**：将 `v-if` 放在 `v-for` 的**外部容器**上。

    ```html
    <div v-if="shouldShowUsers">
      <div v-for="user in users" :key="user.id">{{ user.name }}</div>
    </div>
    ```

2.  **如果想在循环内部根据条件过滤列表项**：

    - **最佳实践**：使用 `computed` 属性预先过滤好数据。这样更清晰、更高效，因为过滤只进行一次。
      ```javascript
      computed: {
        activeUsers() {
          return this.users.filter(user => user.isActive);
        }
      }
      ```
      ```html
      <div v-for="user in activeUsers" :key="user.id">{{ user.name }}</div>
      ```
    - **次要方案**：将 `v-if` 放在 `v-for` 内部的元素上（或使用 `<template>` 标签包裹）。
      ```html
      <template v-for="user in users" :key="user.id">
        <div v-if="user.isActive">{{ user.name }}</div>
      </template>
      ```

---

## 9. 请简述 Vue.js 中的 mixins 和 extends 的作用及其区别。

`mixins` (混入) 和 `extends` (继承) 都是 Vue 中用于复用组件逻辑的方式，但它们有一些关键区别。

### `mixins` (混入)

- **作用**：将可复用的功能（如 `data`, `methods`, `computed`, `created` 等）注入到多个组件中。`mixins` 选项接收一个混入对象的**数组**。
- **合并策略**：
  - `data`: 递归合并，如果键名冲突，以组件自身的数据为准。
  - **生命周期钩子**: 会被合并到一个数组中，**混入对象的钩子会先于组件自身的钩子执行**。
  - `methods`, `components`, `directives`: 合并为一个对象，如果键名冲突，以组件自身的为准。
- **优点**：灵活，可以组合多个混入。
- **缺点**：
  - **数据来源不清晰**：当组件使用多个混入时，很难判断某个属性或方法究竟来自哪个混入。
  - **命名冲突**：不同混入之间可能存在命名冲突，且需要手动解决。
  - **隐式依赖**：混入可能依赖组件的特定属性，这种关系是不明确的。

### `extends` (继承)

- **作用**：类似于 `mixins`，但 `extends` 只能**继承一个**单独的组件选项对象。语义上更接近于 "继承"。
- **合并策略**：与单个 `mixin` 的合并策略基本相同，组件自身的选项优先级更高。
- **区别**：
  1.  **数量**：`mixins` 可以是数组（多个），`extends` 只能是对象（单个）。
  2.  **语义**：`mixins` 是组合/混入，`extends` 是继承/扩展。

### 现代替代方案：组合式 API (Composition API)

在 Vue 3 中，**组合式 API (`setup` 函数和可组合函数)** 是官方推荐的逻辑复用方式，它完美地解决了 `mixins` 的所有缺点：

- **来源清晰**：所有响应式属性和方法都从导入的组合函数中显式解构出来，来源一目了然。
- **没有命名冲突**：可以对解构出来的变量进行重命名。
- **更好的类型支持**。

**结论**：虽然 `mixins` 和 `extends` 仍然可用，但在新项目中，应优先考虑使用**组合式 API**来组织和复用逻辑。

---

## 10. Vue.js 中的 keep-alive 组件有什么作用？如何使用？

### 作用

`<keep-alive>` 是一个 Vue 内置的**抽象组件**。它的主要作用是**缓存**那些不活动的组件实例，而不是销毁它们。这在需要在多个组件间频繁切换并保留它们各自状态（如用户输入、滚动位置）的场景下非常有用。

- **优点**：
  1.  **保留状态**：避免了组件切换时状态的丢失。
  2.  **提升性能**：避免了组件的重复创建和销毁，减少了渲染开销。

### 如何使用

`<keep-alive>` 通常包裹动态组件（使用 `<component :is="...">`）或 `<router-view>`。

- **基本用法**
  ```html
  <keep-alive> <router-view></router-view> </keep-alive>
  ```

### 相关的生命周期钩子

当一个组件在 `<keep-alive>` 中被切换时，它不会触发生命周期中的 `destroyed` 或 `unmounted`。取而代之的是两个新的钩子：

- `activated`：当缓存的组件被重新插入到 DOM 中时调用。
- `deactivated`：当缓存的组件从 DOM 中移除时调用。

可以在这两个钩子中执行那些本应在 `mounted` 和 `beforeDestroy` 中执行的逻辑（比如启动/清除定时器）。

### Props

`<keep-alive>` 提供了三个 props 来进行更精细的控制：

1.  **`include`**: 字符串或正则表达式。只有**名称 (`name` 选项)**匹配的组件才会被缓存。
2.  **`exclude`**: 字符串或正则表达式。任何名称匹配的组件都**不会**被缓存。
3.  **`max`**: 数字。指定最多可以缓存多少个组件实例。一旦达到上限，最久没有被访问的缓存实例将被销毁。

<!-- end list -->

- **使用示例**

  ```html
  <keep-alive include="ComponentA,ComponentB">
    <component :is="currentView"></component>
  </keep-alive>

  <keep-alive :include="/^Page.*/">
    <router-view></router-view>
  </keep-alive>

  <keep-alive exclude="ComponentC">
    <router-view></router-view>
  </keep-alive>
  ```

  **注意**: `include` 和 `exclude` 匹配的是组件的 `name` 选项，而不是组件的文件名或标签名。
```

## 来源 3: Fuwari / `mybatis.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/mybatis.md>
- 本地路径: `mybatis.md`

```markdown
---
title: Mybatis重要概念以及内容
published: 2025-07-09
description: 详细讲解Mybatis重要概念以及内容，其中包含了简洁的面试以及笔试回答
tags: [Mybatis, 面试]
category: Mybatis
draft: false
---

## MyBatis 中的一级缓存和二级缓存有什么区别？

### 面试笔试回答

> [!TIP]
>
> - 一级缓存是 **SqlSession 级别**的缓存，它是默认开启的。当用户在同一个 `SqlSession` 中执行相同的查询（相同的 SQL、相同的参数）时，MyBatis 会直接从缓存中返回结果，而不会再次查询数据库，当 `SqlSession` 被关闭或清空时，其对应的一级缓存也会随之销毁。
> - 二级缓存是 **Mapper (Namespace) 级别**的缓存，它可以被多个 `SqlSession` 共享。要使用二级缓存，需要手动进行配置，只有当应用程序关闭时，二级缓存才会被销毁。
> - 一级缓存 与 二级缓存 所在作用域 执行任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该的所有缓存都会被清除。

MyBatis 作为一款优秀的持久层框架，内置了缓存机制以提升查询性能。其缓存分为一级缓存和二级缓存。

### **一级缓存 (Local Cache)**

一级缓存是 **SqlSession 级别**的缓存，它是默认开启的。当用户在同一个 `SqlSession` 中执行相同的查询（相同的 SQL、相同的参数）时，MyBatis 会直接从缓存中返回结果，而不会再次查询数据库。

- **生命周期**: 一级缓存的生命周期与 `SqlSession` 相同。当 `SqlSession` 被关闭或清空 (`clearCache()`) 时，其对应的一级缓存也会随之销毁。
- **作用域**: **SqlSession 级别**。也就是说，不同 `SqlSession` 之间的一级缓存是相互隔离、互不可见的。
- **特点**:
  - 默认开启，无需额外配置。
  - 缓存范围较小，只在当前 `SqlSession` 内有效。
  - 当执行任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该 `SqlSession` 的所有一级缓存都会被清空，以保证缓存数据的准确性。

### **二级缓存 (Global Cache)**

二级缓存是 **Mapper (Namespace) 级别**的缓存，它可以被多个 `SqlSession` 共享。要使用二级缓存，需要手动进行配置。

- **生命周期**: 二级缓存的生命周期与应用程序的生命周期相同。只有当应用程序关闭时，二级缓存才会被销毁。

- **作用域**: **Namespace (Mapper) 级别**。同一个 Namespace 下的所有 `SqlSession` 可以共享二级缓存。

- **开启步骤**:

  1.  在 MyBatis 的核心配置文件 `mybatis-config.xml` 中启用二级缓存：
      ```xml
      <settings>
          <setting name="cacheEnabled" value="true"/>
      </settings>
      ```
  2.  或在 `application.yml` 中 启用二级缓存：
      ```yml
      mybatis:
        configuration:
        # 启用或禁用二级缓存。true为启用，false为禁用。
        cache-enabled: true
      ```
  3.  在对应的 Mapper XML 文件中添加 `<cache/>` 标签。
      ```xml
      <mapper namespace="com.example.UserMapper">
          <cache/>
      </mapper>
      ```
  4.  查询结果所对应的 POJO (JavaBean) 类必须实现 `java.io.Serializable` 接口。

- **特点**:

  - 需要手动配置才能开启。
  - 缓存范围更大，可以跨 `SqlSession` 共享数据。
  - 当同一个 Namespace 下执行了任何 `INSERT`、`UPDATE` 或 `DELETE` 操作时，该 Namespace 的二级缓存会被清空（或根据配置刷新）。

**总结对比**

| 特性         | 一级缓存 (Local Cache)       | 二级缓存 (Global Cache)                      |
| :----------- | :--------------------------- | :------------------------------------------- |
| **作用域**   | `SqlSession` 级别            | `Namespace` (Mapper) 级别                    |
| **生命周期** | 与 `SqlSession` 同生共死     | 与应用同生共死                               |
| **隔离性**   | 不同 `SqlSession` 间相互隔离 | 多个 `SqlSession` 可共享                     |
| **配置**     | 默认开启，无需配置           | 需手动开启和配置                             |
| **存储**     | POJO 对象本身                | 序列化后的对象                               |
| **适用场景** | 默认的、基本的查询性能提升   | 对数据一致性要求不高，但查询频率非常高的场景 |

---

## MyBatis 中 `#{}` 和 `${}` 的区别是什么？

### 面试笔试回答

> [!TIP]
>
> - `#{}` 在处理时，会将其中的变量替换成一个 JDBC `PreparedStatement` 的参数占位符 `?`。然后通过 `PreparedStatement` 的 `set` 方法来安全地设置参数值。
> - `${}` 在处理时，会将其中的变量值直接拼接到 SQL 语句中，不做任何转义处理。它是一种简单的字符串替换。

`#{}` 和 `${}` 都是 MyBatis 中用于在 SQL 语句中动态传入参数的方式，但它们的工作机制和安全性有本质的区别。

### **`#{}` (预编译参数占位符)**

- **机制**: `#{}` 在处理时，会将其中的变量替换成一个 JDBC `PreparedStatement` 的参数占位符 `?`。然后通过 `PreparedStatement` 的 `set` 方法来安全地设置参数值。
- **安全性**: **能有效防止 SQL 注入**。因为参数值是作为独立的、非 SQL 命令的部分传递给数据库的，数据库驱动会对传入的参数进行类型检查和转义，不会将其作为 SQL 代码的一部分来执行。
- **类型处理**: MyBatis 会根据传入参数的 Java 类型自动进行相应的 JDBC 类型转换。
- **示例**:
  ```xml
  <select id="getUserById" resultType="User">
    SELECT * FROM users WHERE id = #{userId}
  </select>
  ```
  如果 `userId` 的值为 `123`，最终执行的 SQL 类似于 `SELECT * FROM users WHERE id = ?`，然后将 `123` 作为参数安全地设置进去。

### **`${}` (字符串直接拼接)**

- **机制**: `${}` 在处理时，会将其中的变量值直接拼接到 SQL 语句中，不做任何转义处理。它是一种简单的字符串替换。
- **安全性**: **存在严重的 SQL 注入风险**。如果传入的参数值来自用户输入且未经过严格校验，恶意用户可以构造特殊的字符串（如 `1' OR '1'='1`）来改变 SQL 的原有逻辑，从而执行非预期的数据库操作。
- **类型处理**: 不进行类型处理，直接将参数的 `toString()` 结果拼接到 SQL 中。
- **示例**:
  ```xml
  <select id="getUsersByOrder" resultType="User">
    SELECT * FROM users ORDER BY ${columnName}
  </select>
  ```
  如果 `columnName` 的值为 `create_time DESC`，最终执行的 SQL 就是 `SELECT * FROM users ORDER BY create_time DESC`。

**总结与使用场景**

| 特性         | `#{}`                                                                  | `${}`                                                                    |
| :----------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **本质**     | 预编译参数占位符 (`?`)                                                 | 字符串直接拼接                                                           |
| **安全性**   | **安全**，防止 SQL 注入                                                | **不安全**，有 SQL 注入风险                                              |
| **使用场景** | 用于传递**绝大多数**的参数值，如 `WHERE` 条件、`INSERT` 的 `VALUES` 等 | 用于传递**非参数值**的 SQL 部分，如动态指定表名、列名、`ORDER BY` 子句等 |

**核心原则**: **能用 `#{}` 的地方就坚决不用 `${}`**。只有在需要动态改变 SQL 结构（而非参数值）且能确保参数来源安全可靠时，才考虑使用 `${}`。

---

## MyBatis 中的 `resultMap` 与 `resultType` 是什么？如何使用？

### 面试笔试回答

> [!TIP]
>
> - `resultType` 用于指定查询结果集自动映射成的 Java 类型。它适用于查询结果的列名与 Java Bean 的属性名能**自动对应**上的简单场景。
> - `resultMap` 通过一个详细的映射规则配置，明确地告诉 MyBatis 哪个列对应哪个属性，以及它们之间的类型转换关系。它还能处理复杂的对象关系映射。

`resultType` 和 `resultMap` 都是 MyBatis 用来处理 `select` 查询结果集与 Java 对象之间映射关系的机制。它们决定了 MyBatis 如何将从数据库查询出的数据行封装成 Java 对象。

### **`resultType` (结果类型)**

`resultType` 用于指定查询结果集自动映射成的 Java 类型。它适用于查询结果的列名与 Java Bean 的属性名能**自动对应**上的简单场景。

- **机制**: MyBatis 会获取查询返回的 `ResultSet`，然后根据列名（或列的别名）去查找 Java Bean 中对应的 `setter` 方法（遵循驼峰命名规则，如列名 `user_name` 对应属性 `userName` 的 `setUserName` 方法），并将值赋给该属性。

- **使用方法**: 在 `<select>` 标签中，直接指定 `resultType` 属性为目标 Java 类型的全限定名（或在 `mybatis-config.xml` 中配置了别名后的别名）。

- **示例**:
  假设有 Java Bean:

  ```java
  public class User {
      private Integer id;
      private String userName;
      // getters and setters...
  }
  ```

  数据库表 `users` 的列为 `id`, `user_name`。

  ```xml
  <select id="findUserById" resultType="com.example.model.User">
    SELECT id, username FROM users WHERE id = #{id}
  </select>
  ```

  MyBatis 会自动将 `id` 列的值赋给 `User` 对象的 `id` 属性，`user_name` 列的值赋给 `userName` 属性。

### **`resultMap` (结果集映射)**

`resultMap` 提供了更强大、更灵活的结果集映射能力。当数据库列名和 Java Bean 属性名不一致，或者需要处理复杂的关联查询（如一对一、一对多）时，就需要使用 `resultMap`。

- **机制**: `resultMap` 通过一个详细的映射规则配置，明确地告诉 MyBatis 哪个列对应哪个属性，以及它们之间的类型转换关系。它还能处理复杂的对象关系映射。

- **使用方法**:

  1.  在 Mapper XML 文件中定义一个 `<resultMap>` 元素，并在其中详细配置列（`column`）与属性（`property`）的对应关系。
  2.  在 `<select>` 标签中，使用 `resultMap` 属性指向已定义好的 `<resultMap>` 的 `id`。

- **示例 (列名与属性名不一致)**:
  假设数据库列为 `user_id`, `user_name`，而 Java Bean 属性为 `id`, `username`。

  ```xml
  <resultMap id="userResultMap" type="com.example.model.User">
      <id property="id" column="user_id" />
      <result property="username" column="user_name" />
  </resultMap>

  <select id="findUserById" resultMap="userResultMap">
    SELECT user_id, user_name FROM users WHERE id = #{id}
  </select>
  ```

- **示例 (处理关联关系，如一对多)**:
  `resultMap` 还可以通过 `<association>` (一对一) 和 `<collection>` (一对多) 标签来处理复杂的嵌套查询结果。当一个主对象包含一个其他对象的集合时，我们使用 `<collection>`。

  **1. 定义 Java 模型 (POJO)**

  首先，我们需要 `User` 和 `Order` 两个类，并且 `User` 类中包含一个 `Order` 的列表。

  ```java
  // Order.java
  public class Order implements Serializable {
      private Integer id;
      private String orderNumber;
      // getters and setters...
  }

  // User.java
  public class User implements Serializable {
      private Integer id;
      private String username;
      private List<Order> orders; // 一对多关系：一个用户对应一个订单列表
      // getters and setters...
  }
  ```

  **2. 编写 SQL 查询**

  使用 `JOIN` 查询来同时获取用户和其名下所有订单的信息。

  ```sql
  SELECT
      u.id as user_id,
      u.username,
      o.id as order_id,
      o.order_number
  FROM
      users u
  LEFT JOIN
      orders o ON u.id = o.user_id
  WHERE
      u.id = #{userId}
  ```

  **3. 定义 `resultMap` 以处理一对多关系**

  `resultMap` 的核心在于使用 `<collection>` 标签来映射 `User` 类中的 `orders` 列表。

  ```xml
  <resultMap id="userWithOrdersResultMap" type="com.example.model.User">
      <id property="id" column="user_id"/>
      <result property="username" column="username"/>

      <collection property="orders" ofType="com.example.model.Order">
          <id property="id" column="order_id"/>
          <result property="orderNumber" column="order_number"/>
      </collection>
  </resultMap>

  <select id="findUserWithOrders" resultMap="userWithOrdersResultMap">
      SELECT
          u.id as user_id,
          u.username,
          o.id as order_id,
          o.order_number
      FROM
          users u
      LEFT JOIN
          orders o ON u.id = o.user_id
      WHERE
          u.id = #{userId}
  </select>
  ```

通过这种方式，MyBatis 在处理查询结果时，会创建一个 `User` 对象，然后将所有关联的订单数据封装成 `Order` 对象，并填充到 `User` 对象的 `orders` 列表中，最终返回一个结构完整的 `User` 对象。

| 特性         | `resultType`                                                                       | `resultMap`                                                                                                     |
| :----------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **功能**     | 自动进行简单映射                                                                   | 手动定义复杂映射规则                                                                                            |
| **适用场景** | 列名与属性名一致或能通过 `camelCase` 自动匹配的简单查询                            | 1. 列名与属性名不一致\<br\>2. 需要处理复杂的关联关系（一对一、一对多）\<br\>3. 需要对类型转换等进行更精细的控制 |
| **配置**     | 简单，只需在 `<select>` 中指定类型                                                 | 相对复杂，需要先定义 `<resultMap>`，再在 `<select>` 中引用                                                      |
| **优先级**   | 较低。如果同时配置了 `resultType` 和 `resultMap`，MyBatis 会优先使用 `resultMap`。 | 较高                                                                                                            |

**核心思想**: 优先使用 `resultType` 来简化配置。当 `resultType` 无法满足映射需求时，再使用功能更强大的 `resultMap`。`resultMap` 是解决结果集映射问题的终极方案。
```

## 来源 4: Fuwari / `cache/CacheableAndCacheEvict.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/cache/CacheableAndCacheEvict.md>
- 本地路径: `cache/CacheableAndCacheEvict.md`

```markdown
---
title: Spring Boot 本地缓存与清除缓存
published: 2025-07-10
description: 本文详细剖析了 Spring Boot 中用于缓存管理的两个核心注解：`@Cacheable` 和 `@CacheEvict`。`@Cacheable` 负责将高成本操作的结果存入缓存，以提高后续请求的响应速度；而 `@CacheEvict` 则用于在数据发生变更（如更新或删除）时，精确地清除对应的缓存，确保数据的一致性。文章通过代码示例和核心属性详解，帮助开发者理解其工作流程、SpEL 表达式在 `key` 生成中的应用，以及如何处理缓存的同步和清除策略。
tags: [Spring Boot, Java, cache, Cacheable, CacheEvict]
category: Spring Boot
draft: false
---

## `@Cacheable`：缓存的“守门员”

`@Cacheable` 的核心使命是**减少昂贵操作（如数据库查询、远程 API 调用）的执行次数**。它通过将方法的结果存储在缓存中，并在后续相同的请求中直接返回缓存结果来实现这一点。

### 工作流程

它的工作逻辑可以概括为 **“先查缓存，再定行动”**：

1.  **方法调用前拦截**：当一个被 `@Cacheable` 注解的方法被调用时，Spring 的 AOP（面向切面编程）代理会先拦截这个调用。
2.  **生成缓存键 (Key)**：代理会根据方法的参数和注解中定义的 `key` 规则生成一个唯一的缓存键。
3.  **检查缓存**：使用这个键去指定的缓存 (`cacheNames`) 中查找数据。
4.  **决策**：
    - **缓存命中 (Cache Hit)**：如果在缓存中找到了有效的（未过期的）数据，代理会**跳过实际方法的执行**，直接将缓存中的数据返回给调用者。
    - **缓存未命中 (Cache Miss)**：如果在缓存中没有找到数据，代理会**执行原始的业务方法**。
5.  **缓存结果**：方法成功执行后，代理会将其返回值存入缓存，使用的就是第 2 步生成的那个键。下次再有相同的请求，就会直接命中缓存。

### 核心属性详解

|            属性            |    类型    | 是否必须 | 描述和用法示例                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|:--------------------------:|:----------:|:--------:| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`value` / `cacheNames`** | `String[]` |  **是**  | 指定要使用的缓存空间名称。可以指定一个或多个，例如 `cacheNames = "users"` 或 `cacheNames = {"users", "profiles"}`。                                                                                                                                                                                                                                                                                                                                           |
|         **`key`**          |  `String`  |    否    | 定义缓存键的生成规则，使用 **SpEL (Spring Expression Language)** 表达式。**这是最重要的属性之一**。\<br/\>- **默认**：如果不指定，Spring 会使用所有方法参数的 `hashCode()` 组合生成一个默认的键。\<br/\>- **示例**：\<br/\> - `key = "#id"`: 使用名为 `id` 的参数作为键。\<br/\> - `key = "#p0"`: 使用第一个参数作为键。\<br/\> - `key = "#user.id"`: 使用 `user` 对象的 `id` 属性作为键。\<br/\> - `key = "'activeUsers'"`: 使用一个固定的字符串常量作为键。 |
|     **`keyGenerator`**     |  `String`  |    否    | 指定一个自定义的键生成器 Bean 的名称。当 `key` 属性无法满足复杂的键生成逻辑时使用。                                                                                                                                                                                                                                                                                                                                                                           |
|      **`condition`**       |  `String`  |    否    | SpEL 表达式，在**方法执行前**进行判断。只有当表达式为 `true` 时，才会检查缓存和缓存结果。\<br/\>- **示例**：`condition = "#id > 10"`，表示只有当 `id` 大于 10 时才启用缓存功能。                                                                                                                                                                                                                                                                              |
|        **`unless`**        |  `String`  |    否    | SpEL 表达式，在**方法执行后**对**结果 (`#result`)** 进行判断。只有当表达式为 `false` 时，才会将结果缓存。\<br/\>- **示例**：`unless = "#result == null"`，这是最常见的用法，防止将 `null` 值缓存起来。                                                                                                                                                                                                                                                        |
|         **`sync`**         | `boolean`  |    否    | `sync = true` 时，可以防止“缓存击穿”（Dogpile Effect）。当多个线程同时请求一个不存在的缓存项时，只允许一个线程执行方法并填充缓存，其他线程会等待。这需要底层的缓存管理器支持（如 Caffeine）。                                                                                                                                                                                                                                                                 |

### 代码示例

```java
@Service
public class BookService {

    // 使用 "books" 缓存空间，并用参数 isbn 作为 key
    @Cacheable(cacheNames = "books", key = "#isbn")
    public Book findBook(String isbn, boolean isVip) {
        // 这段模拟慢查询
        System.out.println("Executing slow database search for ISBN: " + isbn);
        // ... 从数据库查询书籍
        return new Book(isbn, "Some Book");
    }

    // 只有当书名长度大于5，并且查询结果不为null时才缓存
    @Cacheable(
        cacheNames = "booksByName",
        key = "#name",
        condition = "#name.length() > 5",
        unless = "#result == null"
    )
    public Book findBookByName(String name) {
        System.out.println("Searching book by name: " + name);
        // ...
        return new Book("12345", name);
    }
}
```

---

## `@CacheEvict`：缓存的“清理工”

`@CacheEvict` 的核心使命是**从缓存中移除数据**。当你的业务操作导致了数据变更（如更新或删除），就必须用它来清除旧的、不再准确的缓存，以避免用户读到脏数据。

### 工作流程

1.  **方法调用时拦截**：与 `@Cacheable` 类似，`@CacheEvict` 注解的方法在被调用时也会被代理拦截。
2.  **决定清除时机**：根据 `beforeInvocation` 属性，代理决定是在**方法执行前**还是**执行后**进行清除操作。
3.  **生成缓存键**：与 `@Cacheable` 一样，根据 `key` 规则或 `allEntries` 属性来确定要清除的目标。
4.  **执行清除**：从指定的 `cacheNames` 中移除一个或多个缓存项。
5.  **执行原始方法**：代理会继续执行原始的业务方法（例如，执行数据库的 `DELETE` 或 `UPDATE` 语句）。

### 核心属性详解

| 属性                       | 类型       | 是否必须 | 描述和用法示例                                                                                                                                                                                                                                                                           |
| :------------------------- | :--------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`value` / `cacheNames`** | `String[]` | **是**   | 指定要操作的缓存空间名称。                                                                                                                                                                                                                                                               |
| **`key`**                  | `String`   | 否       | SpEL 表达式，用于定位**需要被清除的单个缓存项**。它的写法必须和对应的 `@Cacheable` 中的 `key` 一致，才能精确找到目标。\<br/\>- **示例**：`key = "#user.id"`                                                                                                                              |
| **`allEntries`**           | `boolean`  | 否       | 如果设置为 `true`，则会**忽略 `key` 属性**，直接清除 `cacheNames` 指定的缓存空间中的**所有条目**。\<br/\>- **默认**：`false`。\<br/\>- **用途**：适用于“删除全部”或可能影响大量数据的批量操作。                                                                                          |
| **`beforeInvocation`**     | `boolean`  | 否       | 定义清除操作的执行时机。\<br/\>- `false` (默认值): 在**方法成功执行后**再清除缓存。如果方法执行过程中抛出异常，缓存不会被清除。这是一种安全的策略，保证了操作的原子性（数据操作成功了，才清除缓存）。\<br/\>- `true`: 在**方法执行前**就清除缓存。无论方法是否成功执行，缓存都会被清除。 |

### 代码示例

假设我们有一个 `UserService`，其中 `findById` 方法被缓存了。

```java
@Service
public class UserService {

    @Cacheable(cacheNames = "users", key = "#id")
    public User findById(Long id) {
        System.out.println("Finding user by id: " + id);
        // ... 从数据库查询
        return new User(id, "John Doe");
    }

    // 更新用户：操作成功后，清除对应的缓存
    // key 必须与 findById 中的 key 对应
    @CacheEvict(cacheNames = "users", key = "#user.id")
    public void updateUser(User user) {
        System.out.println("Updating user: " + user.getId());
        // ... 更新数据库
    }

    // 删除用户：操作成功后，清除对应的缓存
    @CacheEvict(cacheNames = "users", key = "#id")
    public void deleteUser(Long id) {
        System.out.println("Deleting user: " + id);
        // ... 从数据库删除
        if (id == -1) { // 模拟失败场景
            throw new RuntimeException("Deletion failed!");
        }
    }

    // 清除所有 users 缓存
    @CacheEvict(cacheNames = "users", allEntries = true)
    public void reloadAllUsers() {
        System.out.println("Evicting all users from cache.");
        // 可能是一些批量重载数据的操作
    }
}
```

### 场景模拟

1.  调用 `userService.findById(100L)` -\> 控制台打印 "Finding user by id: 100"，数据被缓存。
2.  再次调用 `userService.findById(100L)` -\> 控制台**无任何输出**，直接返回缓存数据。
3.  调用 `userService.updateUser(new User(100L, "Jane Doe"))` -\> 控制台打印 "Updating user: 100"，方法成功执行后，`users` 缓存中 `key=100` 的条目被清除。
4.  再次调用 `userService.findById(100L)` -\> 控制台打印 "Finding user by id: 100"，因为缓存已被清除，所以重新执行方法从数据库获取最新数据，并再次缓存。
5.  调用 `userService.deleteUser(-1L)` -\> 控制台打印 "Deleting user: -1"，方法抛出异常。因为 `beforeInvocation` 是默认的 `false`，所以缓存**不会被清除**。

## 重要注意事项

- **AOP 代理限制**：Spring 缓存是通过 AOP 代理实现的。这意味着，只有通过代理对象（通常是注入的 Bean）调用方法时，注解才会生效。在一个类内部，`this.someAnnotatedMethod()` 这样直接调用是**无效**的，因为它绕过了代理。
- **Key 的一致性**：`@CacheEvict` 要想精确地清除由 `@Cacheable` 创建的缓存，它们的 `cacheNames` 和 `key` 生成逻辑必须完全一致。
- **对象可序列化**：如果使用像 Redis 这样的分布式缓存，存入缓存的对象必须是可序列化的 (`implements Serializable`)。
```

## 来源 5: Fuwari / `cache/springbootcache.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/cache/springbootcache.md>
- 本地路径: `cache/springbootcache.md`

```markdown
---
title: Spring Boot 启动 进行缓存数据预热
published: 2025-07-10
description: 本文介绍了在 Spring Boot 应用启动时预热缓存数据的两种主要方法：主动加载和懒加载。主动加载技术包括使用 `CommandLineRunner`、`ApplicationRunner` 接口以及 `@PostConstruct` 注解，可以在应用启动阶段直接将数据加载到缓存中。懒加载则通过 `@Cacheable` 注解，在首次方法调用时触发缓存写入。这些策略有助于提高应用的初始响应速度和性能。
tags: [Spring Boot, Java, cache]
category: Spring Boot
draft: false
---

# 主动加载

## 1. 使用 CommandLineRunner 或 ApplicationRunner 接口

- CommandLineRunner

```java
@Component
public class CacheLoader implements CommandLineRunner {

    //注入相关 bean

    @Override
    public void run(String args) {
        // TODO 预热或存入数据
    }
}
```

```java
@Component
public class CacheLoader implements ApplicationRunner {

    //注入相关 bean

    @Override
    public void run(String args) {
        // TODO 预热或存入数据
    }
}
```

## 2. 使用 @Postconstruct 注解

```java
@Service
public class CacheService {

    // 注入相关 bean

    @PostConstruct
    public void init() {
        // TODO 预热或存入数据
    }
}

```

# 懒加载

## 使用 @Cacheable 注解

> [!NOTE]
> 通过 @cacheable 在首次调用方法时触发缓存写入，但需手动触发首次调用才能完成预加载。

```java
@Service
public class CacheService {

    // 注入相关 bean

    @Cacheable(value = "users", key = "#id", unless = "#result == null", condition = "#useCache == true")
    public User findUserById(Long id, boolean useCache) {
        return userRepository.findById(id).orElse(null);
    }
}
```
```

## 来源 6: Fuwari / `essays/sogou.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/essays/sogou.md>
- 本地路径: `essays/sogou.md`

```markdown
---
title: 解决 Ubuntu 24.04 下 Chrome 无法使用 Fcitx5 搜狗输入法的问题
published: 2025-07-09
tags: [Chrome, Ubuntu, Sogou, Fcitx5]
category: Ubuntu
description: 本文记录了在 Ubuntu 24.04 LTS 环境下，由于 GTK4 前端模块缺失导致 Chrome 浏览器无法正常调用 Fcitx5 输入法（如搜狗输入法）的诊断过程和解决方案。
draft: false
---

### 问题背景

在 Ubuntu 24.04 LTS 上，部分用户报告在 Chrome 浏览器及其他基于 GTK4 的应用程序中无法激活 Fcitx5 输入法。本文将对此问题进行分析并提供解决方案。

### 环境信息

问题复现环境如下：

- **OS**: `Ubuntu 24.04 LTS`
- **Chrome Version**: `138.0.7204.92` (或更高版本)
- **Input Method Framework**: `Fcitx5`
- **Sogou Pinyin**: `sogoupinyin_4.2.1.145_amd64.deb` (或其他版本)

### 症结所在

问题根源在于 Chrome 浏览器（及其他应用）更新其 UI 工具包至 GTK4。Fcitx5 输入法框架需要 `fcitx5-frontend-gtk4` 模块作为其与 GTK4 应用程序通信的前端。若系统缺少该模块，Fcitx5 将无法在这些应用中正常工作。

### 解决方案

解决方案是安装 Fcitx5 缺失的 GTK4 前端模块。

执行以下命令：

```bash
sudo apt update
sudo apt install fcitx5-frontend-gtk4
```

**命令说明:**

- `sudo apt update`: 同步 `apt` 软件包索引，确保获取最新的软件包版本。
- `sudo apt install fcitx5-frontend-gtk4`: 安装 Fcitx5 的 GTK4 前端支持模块。

安装完成后，需**完全退出并重启 Chrome 浏览器**以加载新的模块。

重启 Chrome 后，输入法应恢复正常。此方法同样适用于其他因缺少 GTK 前端而无法使用输入法的 GTK4/GTK3/Qt 应用程序，只需安装对应的 `fcitx5-frontend-gtk3` 或 `fcitx5-frontend-qt5` 等包即可。
```

## 来源 7: Fuwari / `essays/ubunturesolvesversionconflicts.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/essays/ubunturesolvesversionconflicts.md>
- 本地路径: `essays/ubunturesolvesversionconflicts.md`

```markdown
---
title: Ubuntu 24.04 安装旧软件报错“缺少 `libcups2`”的解决方案
published: 2025-07-09
tags: [Ubuntu, T64 ABI]
category: Ubuntu
description: 本文记录了在 Ubuntu 24.04 LTS 环境下，由于 T64 ABI 迁移导致旧软件依赖报错的诊断过程和解决方案。
draft: false
---

## 问题背景

- 从 **Ubuntu 24.04 (Noble)** 开始，许多库包进入 **T64 ABI** 迁移。
- `libcups2` 被替换成了 **`libcups2t64`**。
- 许多旧 `.deb` 软件（如 Kiro）仍然写死依赖 `libcups2`，导致安装时报错：

  ```
  依赖关系无法满足：需要 libcups2
  ```

## 解决思路

通过 `equivs` 创建一个 **虚拟的 `libcups2` 包**，依赖系统现有的 `libcups2t64`，从而绕过依赖错误。

## 步骤

1. **安装 `equivs` 工具**

   ```bash
   sudo apt update
   sudo apt install equivs -y
   ```

2. **生成控制文件**

   ```bash
   equivs-control libcups2
   ```

3. **编辑 `libcups2` 文件，内容示例：**

   ```text
   Package: libcups2
   Version: 9.9.9
   Architecture: amd64
   Maintainer: You <you@example.com>
   Depends: libcups2t64
   Description: Dummy package to satisfy libcups2 dependency
    This package is a dummy package that depends on libcups2t64.
   ```

   > 注意：
   >
   > - `Version` 一定要设置得 **高于** 系统里的 `libcups2t64` 破坏阈值（推荐 `9.9.9`）。
   > - `Depends` 写成 `libcups2t64`。

4. **构建虚拟包**

   ```bash
   equivs-build libcups2
   ```

   输出类似：

   ```
   The package has been created in the /home/USER/tmp directory
   ```

5. **安装虚拟包**

   ```bash
   sudo dpkg -i ~/tmp/libcups2_9.9.9_amd64.deb
   ```

6. **验证安装**

   ```bash
   dpkg -l | grep libcups2
   ```

   应该能看到：

   ```
   ii  libcups2          9.9.9   amd64   Dummy package to satisfy libcups2 dependency
   ii  libcups2t64:amd64 2.4.7   amd64   Common UNIX Printing System(tm) - Core library
   ```

7. **重新安装目标软件**

   ```bash
   sudo apt install ./kiro.deb
   ```

   这时依赖关系会被正确满足。

---

## 移除虚拟包

```bash
sudo dpkg --purge libcups2
sudo apt autoremove -y
```
```

## 来源 8: Fuwari / `essays/visualstudio.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/essays/visualstudio.md>
- 本地路径: `essays/visualstudio.md`

```markdown
---
title: Ubuntu 上通过 APT 安装 VsCode
published: 2025-06-17
tags: [Ubuntu, VsCode]
category: Ubuntu
description: Ubuntu 上通过 APT 安装 Visual Studio Code 权威指南
draft: false
---

## **在 Ubuntu 上通过 APT 安装 Visual Studio Code 权威指南**

**文档版本:** 1.0
**最后更新:** 2025 年 7 月 11 日

### **简介**

本指南将详细介绍在 Ubuntu 及其他基于 Debian 的 Linux 发行版上，通过 `APT` 包管理器安装 **Visual Studio Code (VS Code)** 的官方推荐方法。

**重要概念澄清：**

- **Visual Studio** 是微软的重量级集成开发环境 (IDE)，主要用于 Windows。它**无法**在 Ubuntu 上安装。
- **Visual Studio Code (VS Code)** 是一个轻量级、免费且跨平台的代码编辑器，功能强大，扩展丰富，是 Linux 开发者的首选工具之一。我们将在本文中安装它。

使用官方源和 `APT` 进行安装是最佳实践，因为它可以确保你获得及时的软件更新，并与系统更新无缝集成。

### **前提条件**

- 一台运行 Ubuntu 或其衍生版（如 Linux Mint, Pop\!\_OS）的计算机。
- 拥有 `sudo` 权限的用户账户。
- 稳定的互联网连接。

---

## **安装步骤**

我们将通过配置微软官方的 `apt` 软件源来安装 VS Code。

### **步骤 1: 更新系统并安装依赖**

打开终端（Terminal），首先更新你的包列表，并安装一些必要的工具软件，以确保后续步骤能顺利进行。

```bash
sudo apt update
sudo apt install software-properties-common apt-transport-https wget -y
```

- **说明**:
  - `apt-transport-https`: 允许 `apt` 通过安全的 HTTPS 协议下载软件包。
  - `wget`: 一个用于从网络下载文件的命令行工具。
  - `software-properties-common`: 提供管理软件源的辅助工具。

### **步骤 2: 导入微软官方 GPG 密钥**

GPG 密钥用于验证从软件源下载的软件包确实来自微软，且未经篡改，是保障软件安全的重要一步。

```bash
# 1. 下载微软GPG密钥并解密
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg

# 2. 将密钥安装到推荐的密钥环目录中
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg

# 3. 删除下载的临时密钥文件
rm packages.microsoft.gpg
```

- **说明**: 此方法将密钥存储在 `/etc/apt/keyrings/` 目录中，这是当前 `apt` 推荐的、更安全的密钥管理方式，避免了全局信任的问题。

### **步骤 3: 添加 VS Code 官方软件源**

现在，我们将微软的软件源地址添加到你的系统中，这样 `apt` 才能知道去哪里下载 VS Code。

```bash
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
```

- **说明**:
  - 此命令会创建一个新的软件源列表文件 `/etc/apt/sources.list.d/vscode.list`。
  - `signed-by=` 部分明确指定了只使用我们在上一步中添加的密钥来验证这个源，提高了安全性。

### **步骤 4: 更新并安装 VS Code**

最后，再次更新包列表以包含来自新添加源的软件信息，然后安装 VS Code。

```bash
# 再次更新包列表
sudo apt update

# 安装VS Code（其包名为 code）
sudo apt install code
```

安装完成后，VS Code 已经成功地集成到你的系统中了。

---

## **安装后操作**

### **如何启动 VS Code?**

- **图形界面**: 在你的应用程序菜单中找到 "Visual Studio Code" 并点击启动。
- **终端**: 在任何目录下打开终端，输入 `code` 并按回车。
  ```bash
  code
  # 或者用 code . 在当前目录打开VS Code
  code .
  ```

### **如何更新 VS Code?**

由于我们使用了官方软件源，你无需手动更新 VS Code。当你运行标准的系统更新命令时，VS Code 会自动一起更新。

```bash
sudo apt update
sudo apt upgrade
```

### **如何卸载 VS Code?**

如果你想卸载 VS Code，可以执行以下命令：

```bash
# 仅卸载软件，保留配置文件
sudo apt remove code

# 如果想彻底清除，包括软件源和GPG密钥
sudo apt remove code
sudo rm /etc/apt/sources.list.d/vscode.list
sudo rm /etc/apt/keyrings/packages.microsoft.gpg
sudo apt update # 刷新配置
```

---

## **常见问题与排错 (Troubleshooting)**

如果你在安装过程中遇到问题，很可能是因为系统中存在旧的或冲突的配置。

### **问题 1: `Signed-By` 冲突错误**

- **错误信息**: `E: ... 的选项 Signed-By 中含有互相冲突的值 ...`
- **原因**: 系统中存在多个指向 VS Code 源的配置文件，且它们指定的 GPG 密钥位置不同。
- **解决方案**:
  1.  使用 `grep` 命令找到所有相关的配置文件：
      ```bash
      grep -r "packages.microsoft.com/repos/code" /etc/apt/
      ```
  2.  根据 `grep` 的输出，删除所有找到的配置文件（例如 `/etc/apt/sources.list.d/vscode.sources`, `/etc/apt/sources.list.d/vscode.list` 或主文件 `/etc/apt/sources.list` 中的相关行）。
  3.  然后从本文的**安装步骤**从头开始。

### **问题 2: `NO_PUBKEY` 公钥缺失错误**

- **错误信息**: `W: ... 由于没有公钥，无法验证下列签名： NO_PUBKEY ...`
- **原因**: 系统知道软件源的地址，但找不到用于验证它的 GPG 密钥。这通常发生在清理不彻底之后。
- **解决方案**: 这同样意味着有残留的配置文件。请参照**问题 1**的解决方案，使用 `grep` 找到并删除所有残留配置，然后再重新开始安装。
```

## 来源 9: Fuwari / `basic/FRPSecurityAlertAnalysis.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/basic/FRPSecurityAlertAnalysis.md>
- 本地路径: `basic/FRPSecurityAlertAnalysis.md`

```markdown
---
title: frp内网穿透安全警报完整分析
published: 2025-09-15
description: frp内网穿透安全警报完整分析
tags: [frp, 内网穿透, 安全警报]
category: frp
draft: false
---

## 问题现象

当使用frp进行内网穿透时，安全软件提示"检测到远程攻击"，显示网站IP为127.0.0.1。本文档提供完整的技术分析和解决方案。

![安全警报截图显示检测到远程攻击，网站IP: 127.0.0.1]

## 完整配置信息

### frpc.toml（客户端配置）

```toml
serverAddr = "192.168.1.106"
serverPort = 7000
log.level = "trace"

[[proxies]]
name = "tcp-8001-8002"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8001
remotePort = 8002
transport.bandwidthLimit = "256KB"  # 设置带宽限制为 256KB/s
transport.bandwidthLimitMode = "client"  # 限速作用于客户端
```

### frps.toml（服务端配置）

```toml
bindPort = 7000
```

## 网络拓扑和数据流向

### 实际的网络架构

```
外部用户 → frps服务器(192.168.1.106:8002) → frpc客户端(192.168.1.116) → 本地服务(127.0.0.1:8001)
```

### IP地址分配

- **frpc客户端IP**: 192.168.1.116
- **frps服务端IP**: 192.168.1.106
- **本地服务地址**: 127.0.0.1:8001
- **对外暴露端口**: 192.168.1.106:8002

## frp完整工作日志分析

### 启动和连接建立过程

```log
2025-09-15 12:09:17.051 [I] [sub/root.go:149] start frpc service for config file [./frpc.toml]
2025-09-15 12:09:17.051 [I] [client/service.go:319] try to connect to server...
2025-09-15 12:09:17.758 [I] [client/service.go:311] [0a157201f48d4109] login to server success, get run id [0a157201f48d4109]
2025-09-15 12:09:17.758 [I] [proxy/proxy_manager.go:177] [0a157201f48d4109] proxy added: [tcp-8001-8002]
2025-09-15 12:09:17.758 [T] [proxy/proxy_wrapper.go:205] [0a157201f48d4109] [tcp-8001-8002] change status from [new] to [wait start]
2025-09-15 12:09:18.040 [I] [client/control.go:172] [0a157201f48d4109] [tcp-8001-8002] start proxy success
```

### 工作连接创建和数据转发过程

```log
2025-09-15 12:09:21.215 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:21.215 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:21.215 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60736] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])

2025-09-15 12:09:21.348 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:21.348 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:21.348 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60750] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])

2025-09-15 12:09:24.491 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:24.491 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:24.491 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60752] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
```

### 连接异常和错误

```log
2025-09-15 12:09:24.525 [D] [proxy/proxy.go:215] [0a157201f48d4109] [tcp-8001-8002] join connections closed
2025-09-15 12:09:24.525 [T] [proxy/proxy.go:217] [0a157201f48d4109] [tcp-8001-8002] join connections errors: [writeto tcp 127.0.0.1:60750->127.0.0.1:8001: read tcp 127.0.0.1:60750->127.0.0.1:8001: use of closed network connection]

2025-09-15 12:09:24.531 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:24.531 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:24.531 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60758] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])

2025-09-15 12:09:24.544 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:24.544 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:24.545 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60766] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
```

### 高频连接创建

```log
2025-09-15 12:09:25.182 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:25.182 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:25.182 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:25.182 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:25.182 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60780] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
2025-09-15 12:09:25.182 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60784] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])

2025-09-15 12:09:25.616 [D] [proxy/proxy_wrapper.go:265] [0a157201f48d4109] [tcp-8001-8002] start a new work connection, localAddr: 192.168.1.116:59172 remoteAddr: 192.168.1.106:7000
2025-09-15 12:09:25.616 [T] [proxy/proxy.go:150] [0a157201f48d4109] [tcp-8001-8002] handle tcp work connection, useEncryption: false, useCompression: false
2025-09-15 12:09:25.616 [D] [proxy/proxy.go:203] [0a157201f48d4109] [tcp-8001-8002] join connections, localConn(l[127.0.0.1:60786] r[127.0.0.1:8001]) workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
```

## frp工作机制深度分析

### 1. 连接建立层次

```
第一层：控制连接
frpc客户端(192.168.1.116) ←→ frps服务器(192.168.1.106:7000)
- 用途：传输控制命令和会话管理
- 特点：持久连接，维持整个代理会话

第二层：工作连接
frpc客户端(192.168.1.116:随机端口) ←→ frps服务器(192.168.1.106:7000)
- 用途：实际数据转发
- 特点：按需创建，每个外部连接对应一个工作连接

第三层：本地连接
frpc进程内部 ←→ 127.0.0.1:8001
- 用途：连接本地实际服务
- 特点：由frpc主动发起，建立到目标服务的连接
```

### 2. 数据桥接机制

从日志中的关键信息可以看出：

```
join connections, localConn(l[127.0.0.1:60736] r[127.0.0.1:8001])
workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
```

frpc同时维护两个连接：

- **localConn**: 连接本地服务（127.0.0.1:随机端口 ↔ 127.0.0.1:8001）
- **workConn**: 连接frps服务器（192.168.1.116:随机端口 ↔ 192.168.1.106:7000）

### 3. 连接生命周期

根据日志时间戳分析：

```
12:09:21.215 - 第1个工作连接建立 (端口60736)
12:09:21.348 - 第2个工作连接建立 (端口60750) [133ms后]
12:09:24.491 - 第3个工作连接建立 (端口60752) [3.1秒后]
12:09:24.525 - 第2个连接关闭并出错 [34ms后]
12:09:24.531 - 第4个工作连接建立 (端口60758) [6ms后]
12:09:24.544 - 第5个工作连接建立 (端口60766) [13ms后]
12:09:25.182 - 同时建立2个工作连接 (端口60780, 60784) [638ms后]
12:09:25.616 - 第8个工作连接建立 (端口60786) [434ms后]
```

## 理论基础：127.0.0.1的特殊性

### 本地回环地址的技术特点

```
127.0.0.1是本地回环地址，它代表的是计算机自身，数据不会通过网卡发送到外部网络，
所以从本质上来说，不可能存在来自127.0.0.1的"远程攻击"，因为远程攻击的来源应该
是外部网络中的IP地址。
```

### 为什么会出现这种"矛盾"现象？

这种提示大概率是电脑自身的程序或配置出了问题：

1. **高频本地访问模式**
   某个程序（如frpc）在高频次地尝试访问本机需要密码验证的服务（如远程桌面、数据库等），但密码一直验证失败

2. **请求源IP显示异常**
   由于这些请求是由本地程序发起的，源IP就显示为127.0.0.1，再加上安全软件的检测规则，就被误判为了"远程攻击"

3. **软件配置问题**
   部分软件在处理本地请求时，因配置问题错误地将本地请求标记为"远程"，同时又出现了验证失败的情况，从而触发了这些警告

### 复现示例

可以通过以下代码验证这种现象：

```python
# 连接本地MySQL数据库的脚本，故意填错用户名和密码，让它不停地循环尝试连接
import mysql.connector
import time

while True:
    try:
        connection = mysql.connector.connect(
            host='127.0.0.1',
            database='test',
            user='wrong_user',
            password='wrong_password'
        )
    except:
        pass  # 忽略连接失败
    time.sleep(0.1)
```

## 安全警报触发的技术分析

### 1. frp行为模式特征

根据完整日志分析，frp表现出以下可疑特征：

**高频连接创建**：

- 在4秒内创建了8个工作连接
- 平均每500ms创建一个新连接
- 同时存在多个并发连接

**异常连接行为**：

- 连接频繁建立和关闭
- 出现网络连接错误：`use of closed network connection`
- 所有本地连接都指向127.0.0.1:8001

**资源消耗模式**：

- 每个连接占用一个随机端口（60736, 60750, 60752等）
- 无加密无压缩的明文传输
- 带宽限制可能导致异常的传输模式

### 2. 安全软件检测逻辑

**检测层级1：连接监控**

- 监控系统调用，发现大量127.0.0.1的连接
- 检测到异常的连接频率和模式
- 结合连接错误，触发攻击警报

**检测层级2：行为分析**

- 分析网络行为模式，识别类似后门的特征
- frpc的"内部主动外连+本地高频访问"符合木马特征
- 触发启发式检测规则

**检测层级3：协议识别**

- 某些安全软件可能识别frp协议特征
- 将内网穿透工具归类为潜在威胁
- 基于工具类型进行风险评估

## 防火墙可能记录的IP地址分析

### 基于不同检测层级的IP记录

**1. 127.0.0.1（最高可能性 - 95%）**

```
检测层级：本地连接监控
检测对象：localConn(l[127.0.0.1:60736] r[127.0.0.1:8001])
记录原因：
- 安全软件直接监控到本地连接异常
- 大量127.0.0.1到127.0.0.1:8001的连接
- 结合连接错误和高频模式，误判为攻击
- 这完美解释了截图中显示的IP地址
```

**2. 192.168.1.106（中等可能性 - 30%）**

```
检测层级：网络流量分析
检测对象：workConn(l[192.168.1.116:59172] r[192.168.1.106:7000])
记录原因：
- 安全软件追踪到异常行为的根本来源
- 识别出frps服务器是触发本地异常的源头
- 需要更深层的网络分析能力
```

**3. 192.168.1.116（低可能性 - 5%）**

```
检测层级：本机IP监控
记录原因：
- 某些安全软件错误地将本机IP标记为攻击源
- 逻辑上不合理（自己攻击自己）
```

**4. 外部用户真实IP（极低可能性 - <1%）**

```
检测层级：深度包检测和协议解析
所需能力：
- frp协议深度解析
- 代理链路追踪
- 大多数安全软件不具备此能力
```

## 解决方案和预防措施

### 1. 即时解决方案

```toml
# 优化frpc配置
serverAddr = "192.168.1.106"
serverPort = 7000
log.level = "info"  # 降低日志级别

[[proxies]]
name = "tcp-8001-8002"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8001
remotePort = 8002
transport.bandwidthLimit = "1MB"  # 提高带宽限制
transport.bandwidthLimitMode = "client"
transport.heartbeatInterval = 30  # 增加心跳间隔
transport.heartbeatTimeout = 90
```

### 2. 安全软件配置

- 将frpc进程加入白名单
- 将127.0.0.1:8001添加到信任列表
- 将frps服务器IP（192.168.1.106）添加到信任源
- 禁用对内网穿透工具的启发式检测

### 3. 网络层面优化

```toml
# frps服务端增强配置
bindPort = 7000
transport.maxPoolCount = 10
auth.token = "secure_token_here"  # 添加认证token
transport.tcpKeepalive = true
```

### 4. 监控和诊断

```bash
# 监控frp连接状态
netstat -an | grep 8001
netstat -an | grep 7000

# 检查frpc进程状态
ps aux | grep frpc
lsof -i :8001
```

## 结论

基于完整的技术分析和日志证据，**frp触发"检测到远程攻击，网站IP: 127.0.0.1"的根本原因是：**

1. **frp工作机制导致的异常本地连接模式**：frpc在短时间内创建大量指向127.0.0.1:8001的连接，形成高频本地访问模式

2. **连接异常和错误触发安全检测**：连接的频繁建立、关闭和网络错误（如`use of closed network connection`）被安全软件识别为攻击行为

3. **检测层级决定记录的IP**：安全软件在本地连接监控层级检测到异常，因此记录的IP地址就是127.0.0.1

4. **误判机制**：安全软件将正常的代理工具工作模式误判为恶意攻击，这是启发式检测的常见问题

**最终答案**：防火墙记录的IP地址最可能是**127.0.0.1**，这与截图中显示的信息完全吻合。
```

## 来源 10: Fuwari / `basic/PremiumContent.md`

- 原始 URL: <https://github.com/DavidHLP/Fuwari/blob/07cee2baf9cee227807dcd68004c5f2493e5ac52/src/content/posts/basic/PremiumContent.md>
- 本地路径: `basic/PremiumContent.md`

```markdown
---
title: 设计模式
published: 2025-07-26
description: 设计模式
tags: [设计模式, 创建型模式, 工厂方法模式, Factory Method, Java]
category: 设计模式
draft: false
---

## 创造型模式

### 💡 工厂方法模式

> [!NOTE]
> 工厂方法模式（Factory Method Pattern）是一种创建型设计模式。
> 亦称：虚拟构造函数、Virtual Constructor、Factory Method

#### 💬 设计意图

工厂方法模式是一种创建型设计模式， 其在父类中提供一个创建对象的方法， 允许子类决定实例化对象的类型。

[image: img.png](img.png)

#### 😟 问题引出

假设你正在开发一款物流管理应用。 最初版本只能处理卡车运输， 因此大部分代码都在位于名为 `卡车`的类中。一段时间后，
这款应用变得极受欢迎。 你每天都能收到十几次来自海运公司的请求， 希望应用能够支持海上物流功能。

[image: img_1.png](img_1.png)

> 如果代码其余部分与现有类已经存在耦合关系， 那么向程序中添加新类其实并没有那么容易。

这可是个好消息。 但是代码问题该如何处理呢？ 目前， 大部分代码都与 `卡车`类相关。 在程序中添加 `轮船`类需要修改全部代码。
更糟糕的是， 如果你以后需要在程序中支持另外一种运输方式， 很可能需要再次对这些代码进行大幅修改。

最后， 你将不得不编写繁复的代码， 根据不同的运输对象类， 在应用中进行不同的处理。

#### ☺️ 解决方案

工厂方法模式建议使用特殊的工厂方法代替对于对象构造函数的直接调用 （即使用 `new`运算符）。 不用担心， 对象仍将通过 `new`
运算符创建， 只是该运算符改在工厂方法中调用罢了。 工厂方法返回的对象通常被称作 “产品”。

[image: img_2.png](img_2.png)

乍看之下， 这种更改可能毫无意义： 我们只是改变了程序中调用构造函数的位置而已。 但是， 仔细想一下， 现在你可以在子类中重写工厂方法，
从而改变其创建产品的类型。

但有一点需要注意:仅当这些产品具有共同的基类或者接口时， 子类才能返回不同类型的产品， 同时基类中的工厂方法还应将其返回类型声明为这一共有接口。

[image: img_3.png](img_3.png)

> 所有产品都必须使用同一接口。

举例来说， `卡车Truck`和 `轮船Ship`类都必须实现 运输`Transport`接口， 该接口声明了一个名为 `deliver交付`的方法。
每个类都将以不同的方式实现该方法： 卡车走陆路交付货物， 轮船走海路交付货物。 `陆路运输RoadLogistics`类中的工厂方法返回卡车对象，
而 `海路运输SeaLogistics`类则返回轮船对象。

[image: img_4.png](img_4.png)

> 只要产品类实现一个共同的接口， 你就可以将其对象传递给客户代码， 而无需提供额外数据。

调用工厂方法的代码 （通常被称为`客户端`代码） 无需了解不同子类返回实际对象之间的差别。 客户端将所有产品视为抽象的
`运输` 。 客户端知道所有运输对象都提供 `交付`方法， 但是并不关心其具体实现方式。

#### 💡 工厂方法模式结构

[image: img_5.png](img_5.png)

1. 产品 （Product） 将会对接口进行声明。 对于所有由创建者及其子类构建的对象， 这些接口都是通用的。
2. 具体产品 （Concrete Products） 是产品接口的不同实现。
3. 创建者 （Creator） 类声明返回产品对象的工厂方法。 该方法的返回对象类型必须与产品接口相匹配。 你可以将工厂方法声明为抽象方法，
   强制要求每个子类以不同方式实现该方法。 或者， 你也可以在基础工厂方法中返回默认产品类型。 注意， 尽管它的名字是创建者，
   但它最主要的职责并不是创建产品。 一般来说， 创建者类包含一些与产品相关的核心业务逻辑。 工厂方法将这些逻辑处理从具体产品类中分离出来。
   打个比方， 大型软件开发公司拥有程序员培训部门。 但是， 这些公司的主要工作还是编写代码， 而非生产程序员。
4. 具体创建者 （Concrete Creators） 将会重写基础工厂方法， 使其返回不同类型的产品。 注意， 并不一定每次调用工厂方法都会创建新的实例。
   工厂方法也可以返回缓存、 对象池或其他来源的已有对象。

#### 代码实现

[image: img_6.png](img_6.png)

#### 💡 使用工厂方法模式创建语言处理模板

假设我们正在构建一个在线判题（OJ）系统，该系统需要为用户创建不同编程语言的代码模板（例如 Java, C++, Python）。这些模板虽然在具体语法和默认语句上有所不同，但其核心功能（例如，包含一个主函数/入口点，准备好读取输入）是保持一致的。

如果使用**工厂方法**模式，我们就不需要为每一种编程语言重写核心的代码生成和提交流程逻辑。如果我们在一个基础语言处理器（`CodeTemplateFactory`）类中声明一个用于生成代码模板的工厂方法（例如 `createTemplate()`），那么我们就可以创建一个具体的语言处理器子类（例如 `JavaTemplateFactory`），并使其通过重写工厂方法来返回一个包含 Java 特定语法的代码模板。

这个 `JavaTemplateFactory` 子类将继承基础语言处理器的大部分通用代码（例如，接收用户提交、调用编译器/解释器的通用逻辑），同时能够根据 Java 的语法规则，生成一个完整的、可直接使用的初始代码框架。

如需该模式正常工作，基础的**语言处理器**类必须依赖于一个抽象的代码模板（`CodeTemplate`）——可以是一个基类或接口。这个抽象模板之后可以被扩展为各种具体的语言模板（如 `JavaTemplate`, `CppTemplate` 等）。这样一来，无论语言处理器最终生成的是何种具体语言的模板，其核心的调用和处理代码都可以保持一致并正常工作。

你可以运用此方法来开发其他与语言相关的组件，例如不同语言的“标准输入读取器”或“特定数据结构的样例代码”。不过，每当你向语言处理器中添加一个新的工厂方法时（例如，除了 `createTemplate()` 再增加一个 `createInputReader()`），你就离**抽象工厂**模式更近了一步。我们将在稍后谈到这个模式。

```java
/**
 * 代码模板接口
 */
public interface CodeTemplate {
    String getCodeTemplate();
}

/**
 * 代码模板工厂接口
 */
public interface CodeTemplateFactory {
   /**
    * 创建代码模板实例
    *
    * @return 代码模板实例
    */
   CodeTemplate createCodeTemplate();
}

/**
 * Java代码模板实现类
 * 提供标准的Java代码模板，包含必要的包导入和主类结构
 */
public class JavaCodeTemplate implements CodeTemplate {

   /**
    * 获取Java代码模板
    *
    * @return 包含标准Java代码结构的字符串模板
    */
   @Override
   public String getCodeTemplate() {
      return """
              import java.util.*;
              import java.io.*;

              public class Main {

                  public static void main(String[] args) {
                      Scanner scanner = new Scanner(System.in);
                      // 在此处编写您的代码逻辑
                  }
              }
              """;
   }
}

/**
 * Java代码模板工厂实现类
 */
public class JavaCodeTemplateFactory implements CodeTemplateFactory {

   /**
    * 创建Java代码模板实例
    *
    * @return Java代码模板实例
    */
   @Override
   public CodeTemplate createCodeTemplate() {
      return new JavaCodeTemplate();
   }
}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String language = scanner.nextLine();
        if (language.equals("Java")){
           CodeTemplateFactory factory = new JavaCodeTemplateFactory();
           CodeTemplate template = factory.createCodeTemplate();
           System.out.println(template.generateCode());
        }else System.out.println("暂不支持该语言的代码模板");
    }
}
```

#### 💡 工厂方法模式适合应用场景

1. 🤔 **当你在编写代码的过程中， 如果无法预知对象确切类别及其依赖关系时， 可使用工厂方法。**
   - 工厂方法将创建产品的代码与实际使用产品的代码分离， 从而能在不影响其他代码的情况下扩展产品创建部分代码。
   - 例如， 如果需要向应用中添加一种新产品， 你只需要开发新的创建者子类， 然后重写其工厂方法即可。

2. 🤔 **如果你希望用户能扩展你软件库或框架的内部组件， 可使用工厂方法。**
   - 继承可能是扩展软件库或框架默认行为的最简单方法。 但是当你使用子类替代标准组件时， 框架如何辨识出该子类？
   - 解决方案是将各框架中构造组件的代码集中到单个工厂方法中， 并在继承该组件之外允许任何人对该方法进行重写。
   - 让我们看看具体是如何实现的。 假设你使用开源 UI 框架编写自己的应用。 你希望在应用中使用圆形按钮， 但是原框架仅支持矩形按钮。 你可以使用 `圆形按钮 RoundButton`子类来继承标准的 `按钮Button`类。 但是， 你需要告诉 UI框架`UIFramework`类使用新的子类按钮代替默认按钮。
   - 为了实现这个功能， 你可以根据基础框架类开发子类 `圆形按钮 UI UIWithRoundButtons` ， 并且重写其 `createButton创建按钮`方法。 基类中的该方法返回 按钮对象， 而你开发的子类返回 圆形按钮对象。 现在， 你就可以使用 `圆形按钮 UI类`代替 `UI框架类`。 就是这么简单！

3. 🤔 **如果你希望复用现有对象来节省系统资源， 而不是每次都重新创建对象， 可使用工厂方法。**
   - 在处理大型资源密集型对象 （比如数据库连接、 文件系统和网络资源） 时， 你会经常碰到这种资源需求。
   - 让我们思考复用现有对象的方法：
     1. 首先， 你需要创建存储空间来存放所有已经创建的对象。
     2. 当他人请求一个对象时， 程序将在对象池中搜索可用对象。
     3. … 然后将其返回给客户端代码。
     4. 如果没有可用对象， 程序则创建一个新对象 （并将其添加到对象池中）。

这些代码可不少！ 而且它们必须位于同一处， 这样才能确保重复代码不会污染程序。
可能最显而易见， 也是最方便的方式， 就是将这些代码放置在我们试图重用的对象类的构造函数中。 但是从定义上来讲， 构造函数始终返回的是**新对象**， 其无法返回现有实例。
因此， 你需要有一个既能够创建新对象， 又可以重用现有对象的普通方法。 这听上去和工厂方法非常相像。

#### 📋️ 实现方式

1. 让所有产品都遵循同一接口。 该接口必须声明对所有产品都有意义的方法。
2. 在创建类中添加一个空的工厂方法。 该方法的返回类型必须遵循通用的产品接口。
3. 在创建者代码中找到对于产品构造函数的所有引用。 将它们依次替换为对于工厂方法的调用， 同时将创建产品的代码移入工厂方法。
   - 你可能需要在工厂方法中添加临时参数来控制返回的产品类型。
   - 工厂方法的代码看上去可能非常糟糕。 其中可能会有复杂的 `switch分支运算符`， 用于选择各种需要实例化的产品类。 但是不要担心， 我们很快就会修复这个问题。
4. 现在， 为工厂方法中的每种产品编写一个创建者子类， 然后在子类中重写工厂方法， 并将基本方法中的相关创建代码移动到工厂方法中。
5. 如果应用中的产品类型太多， 那么为每个产品创建子类并无太大必要， 这时你也可以在子类中复用基类中的控制参数。
   - 例如， 设想你有以下一些层次结构的类。 基类 `邮件`及其子类 `航空邮件`和 `陆路邮件` ； `运输`及其子类 `飞机`, `卡车`和 `火车` 。 `航空邮件`仅使用 `飞机对象`， 而 `陆路邮件`则会同时使用 `卡车`和 `火车`对象。 你可以编写一个新的子类 （例如 火车邮件 ） 来处理这两种情况， 但是还有其他可选的方案。 客户端代码可以给 陆路邮件类传递一个参数， 用于控制其希望获得的产品。
6. 如果代码经过上述移动后， 基础工厂方法中已经没有任何代码， 你可以将其转变为抽象类。 如果基础工厂方法中还有其他语句， 你可以将其设置为该方法的默认行为。

#### ⚖️ 工厂方法模式优缺点

- **优点**：
  - ✔️ **单一职责原则**：你可以将产品创建代码放在程序的单一位置， 从而使得代码更容易维护。
  - ✔️ **开闭原则**：无需更改现有客户端代码， 你就可以在程序中引入新的产品类型。
  - ✔️ **可复用性**：通过工厂方法，可以重用已有的对象，节省资源。
  - ✔️ **解耦**：你可以避免创建者和具体产品之间的紧密耦合。
- **缺点**：
  - ❌️ **提高代码复杂度**： 应用工厂方法模式需要引入许多新的子类， 代码可能会因此变得更复杂。 最好的情况是将该模式引入创建者类的现有层次结构中。

#### 💡 与其他模式的关系

- 在许多设计工作的初期都会使用`工厂方法模式` （较为简单， 而且可以更方便地通过子类进行定制）， 随后演化为使用`抽象工厂模式`、 `原型模式`或`生成器模式` （更灵活但更加复杂）。
- `抽象工厂模式`通常基于一组`工厂方法`， 但你也可以使用`原型模式`来生成这些类的方法。
- 你可以同时使用`工厂方法`和`迭代器模式`来让子类集合返回不同类型的迭代器， 并使得迭代器与集合相匹配。
- `原型`并不基于继承， 因此没有继承的缺点。 另一方面， 原型需要对被复制对象进行复杂的初始化。 `工厂方法`基于继承， 但是它不需要初始化步骤。
- `工厂方法`是`模板方法模式`的一种特殊形式。 同时， 工厂方法可以作为一个大型模板方法中的一个步骤。
```
