# src/scripts 模块设计说明

## 整体结构概览
TeaTime Prose 的前端代码集中在 `src/scripts` 中，围绕 Backbone.js 的模型、集合、视图及路由构建，并由入口脚本加载配置、鉴权和样式资源。`app.js` 会先确保 jQuery 及其插件加载，再以全局配置调用启动流程【F:src/scripts/app.js†L1-L12】；`boot.js` 负责鉴权、初始化路由与本地化设置，是应用启动的核心【F:src/scripts/boot.js†L1-L111】【F:src/scripts/boot.js†L135-L160】。Router 则根据 URL 切换页面视图，并协调用户、仓库等数据模型【F:src/scripts/router/index.js†L1-L145】。整体遵循“配置→鉴权→路由→视图”链路，辅助以工具、存储和国际化模块。

## 顶层脚本职责
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `app.js` | 引入 jQuery、全局样式并启动 `init(Config)`，是应用入口。【F:src/scripts/app.js†L1-L12】 | 如需在应用启动前执行自定义逻辑，可在 `importJquery()` Promise 之后、`init` 调用之前插入逻辑。 |
| `boot.js` | 处理用户鉴权、全局 AJAX 头、路由启动以及语言初始化。【F:src/scripts/boot.js†L1-L160】 | 扩展鉴权策略时可在 `authenticate` 中添加新的 `config.auth` 分支，或在 `initLanguage` 中加载更多语言偏好。 |
| `config.js` | 暴露 API、站点、OAuth 等配置并从 Cookie 读取用户名。【F:src/scripts/config.js†L1-L14】 | 若要接入新的后端服务，可在 `Config` 中新增键值，并在相关模块引入使用。 |
| `import_jquery.js` | 将 jQuery 挂载到全局并懒加载 chosen 插件。【F:src/scripts/import_jquery.js†L1-L10】 | 新增依赖 jQuery 的全局插件时，可在 Promise 内追加 `require`。 |
| `path-util.js` | 提供跨模块使用的路径拼接工具，去除多余斜杠。【F:src/scripts/path-util.js†L1-L33】 | 可在该模块扩展更多路径相关工具函数，集中维护 URL 处理。 |
| `status.js` | 以 JSONP 查询 GitHub 状态接口，供错误处理使用。【F:src/scripts/status.js†L1-L14】 | 若需要监控其他服务状态，可扩展导出的对象并在视图中调用。 |
| `storage/cookie.js` | 封装 Cookie 的读写、序列化与批量操作。【F:src/scripts/storage/cookie.js†L1-L58】 | 支持更多存储策略时可新增方法（如 `getJSON`），并保持链式接口风格。 |
| `util.js` | 汇集字符串、路径、文件类型判断、页面滚动等大量助手函数。【F:src/scripts/util.js†L5-L203】【F:src/scripts/util.js†L204-L275】 | 添加常用的通用工具时应保持纯函数和命名一致性，以便视图层重用。 |
| `upload.js` | 处理拖拽与文件选择上传流程，读取二进制并回调结果。【F:src/scripts/upload.js†L1-L55】【F:src/scripts/upload.js†L56-L83】 | 扩展上传类型或校验逻辑时，可在 `compileResult` 中添加 MIME/尺寸检查。 |

## 数据层（Collections 与 Models）
### Collections
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `collections/branches.js` | 加载仓库分支并在解析时附带仓库引用，同时处理分页链接。【F:src/scripts/collections/branches.js†L1-L48】 | 若需更复杂的排序或过滤，可在集合模型内添加 comparator 或自定义 fetch。 |
| `collections/commits.js` | 聚合提交记录并根据分支生成请求 URL。【F:src/scripts/collections/commits.js†L6-L29】 | 可在集合里增加分页或搜索方法，再由历史视图调用。 |
| `collections/files.js` | 从 Git 树加载文件，解析 `_config.yml`、metadata 和忽略规则，并提供过滤视图。【F:src/scripts/collections/files.js†L1-L170】 | 当需要支持更多配置占位符或 metadata 类型，可扩展 `parseConfig` 与 `replacePlaceholders`。 |
| `collections/orgs.js` | 根据用户认证范围选择不同的组织列表 API。【F:src/scripts/collections/orgs.js†L1-L33】 | 可添加缓存或分页策略以提升大规模组织加载性能。 |
| `collections/repos.js` | 根据用户类型构造 GitHub API URL，按更新时间排序仓库列表，并处理分页 Link 头。【F:src/scripts/collections/repos.js†L1-L49】【F:src/scripts/collections/repos.js†L50-L70】 | 接入非 GitHub 数据源时可重载 `url` 与 `parse`，并复用分页解析逻辑。 |
| `collections/users.js` | 维护用户模型集合，便于在路由层按需实例化并复用。【F:src/scripts/collections/users.js†L1-L9】 | 可在集合上添加基于登录名的索引方法，加快重复访问。 |

### Models
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `models/user.js` | 代表当前或目标 GitHub 用户，封装鉴权流程并附带仓库与组织集合。【F:src/scripts/models/user.js†L1-L75】 | 可扩展为支持更多用户属性（如头像缓存），并在 `fetch` 回调中更新。 |
| `models/repo.js` | 封装仓库元数据、默认分支及关联的 branches、commits 集合，并提供 fork/ref 操作。【F:src/scripts/models/repo.js†L1-L88】 | 若需支持额外的仓库设置，可在模型中定义新的子集合或属性，并在视图初始化时注入。 |
| `models/branch.js` | 代表单个分支，建立对应的文件集合并暴露分支 URL。【F:src/scripts/models/branch.js†L1-L24】 | 可在模型上添加比较器或缓存 commit 信息供视图展示。 |
| `models/file.js` | 表示文件元数据（路径、类型等），处理 YAML Front Matter、内容解析与编码。【F:src/scripts/models/file.js†L1-L182】 | 添加新类型时可扩展模型方法（如内容解析器），并在视图中检测使用。 |
| `models/folder.js` | 表示目录节点，保存路径信息并构造内容请求 URL。【F:src/scripts/models/folder.js†L1-L24】 | 可添加懒加载子树逻辑以优化大型目录。 |
| `models/commit.js` | 描述提交记录并拼接访问详情的 URL。【F:src/scripts/models/commit.js†L1-L12】 | 可以在模型中添加格式化日期或作者信息的方法。 |
| `models/org.js` | 代表组织信息，提供轻量化的 Backbone 模型封装。【F:src/scripts/models/org.js†L1-L7】 | 可扩展以存储组织权限或配置，并在侧边栏中使用。 |

## 路由与应用状态
Router 处理 `about`、`profile`、`repo` 等路径，负责销毁旧视图、实例化新视图并协调 loader/nav/sidebar 状态，同时按需拉取用户与仓库数据。【F:src/scripts/router/index.js†L1-L205】 扩展新的页面时，可在 `routes` 中注册路径、编写对应处理方法，并在方法里创建视图与所需集合。注意复用 `this.app.loader` 以保持加载体验，必要时在 `this.view` 替换前调用 `remove()` 释放子视图。

## 工具与基础设施
| 模块 | 作用 | 扩展建议 |
| --- | --- | --- |
| `status.js` | 提供 GitHub 状态查询，供错误通知组件使用。【F:src/scripts/status.js†L1-L14】 | 可增加更多服务的状态接口并返回统一格式。 |
| `path-util.js` | 拼接路径并去掉重复斜杠，供文件/路由模块调用。【F:src/scripts/path-util.js†L1-L33】 | 若新增复杂的路径需求，可在此集中添加函数。 |
| `storage/cookie.js` | 统一 Cookie 读写与序列化，供鉴权和语言选择使用。【F:src/scripts/storage/cookie.js†L15-L58】 | 扩展本地存储支持时可新增模块，如 `localStorage` 封装，与 Cookie 保持接口一致。 |
| `util.js` | 提供字符串/路径处理、Markdown 模式判定、滚动控制、Link 头解析等常用工具。【F:src/scripts/util.js†L5-L275】 | 新增公共逻辑时应保持函数独立性，便于在视图中直接引入。 |
| `upload.js` | 处理拖拽/选择上传并通过回调暴露文件内容。【F:src/scripts/upload.js†L1-L83】 | 若要支持多文件上传或非图片资源，可在 `compileResult` 中添加遍历逻辑或二进制处理。 |

## 国际化与配置
`translations/index.js` 汇总多国语言 JSON，并实现 `locale.current` 与 `t` 翻译函数，默认语言为英文。【F:src/scripts/translations/index.js†L1-L64】 `update_locales.js` 提供从 Transifex 下载并写回 JSON 的脚本。【F:src/scripts/translations/update_locales.js†L1-L84】 语言数据位于 `translations/locales/*.json`，与 `application.yaml` 相互对应，用于组织翻译键值。【F:src/scripts/translations/index.js†L1-L38】 扩展语言时应新增对应 JSON 并在 `index.js` 中导入；若需自动化同步，可完善 `update_locales.js` 的认证和文件生成逻辑。

## 视图层结构
### 布局与页面视图
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `views/app.js` | 根视图，渲染整体布局并持有 loader、sidebar、nav 子视图，处理快捷键和注销。【F:src/scripts/views/app.js†L1-L74】 | 新增全局 UI 组件时，可在构造函数中实例化并加入 `subviews`，并在 `render` 中挂载。 |
| `views/loader.js` | 控制加载提示的显示、隐藏与队列。【F:src/scripts/views/loader.js†L1-L34】 | 可扩展为支持不同加载消息或进度条。 |
| `views/sidebar.js` | 管理侧边栏模板、子视图初始化、开合状态及保存按钮文本。【F:src/scripts/views/sidebar.js†L1-L67】 | 新增侧边栏面板时，在 `views` 映射中注册，并通过 `initSubview` 创建。 |
| `views/nav.js` | 处理顶部导航、模式切换、编辑操作等，并按 scope 渲染登录链接。【F:src/scripts/views/nav.js†L1-L103】 | 扩展新按钮时，遵循事件绑定模式并在模板中加入节点。 |
| `views/start.js` | 渲染初始欢迎页，允许切换授权 scope 并持久化设置。【F:src/scripts/views/start.js†L1-L51】 | 可根据业务添加引导信息或快捷入口。 |
| `views/profile.js` | 展示用户信息、仓库搜索与列表组合视图，并在认证状态下加载组织面板。【F:src/scripts/views/profile.js†L1-L54】 | 可在视图中监听更多用户事件，如组织切换。 |
| `views/repos.js` | 渲染仓库集合列表，并与搜索视图联动响应 hover 状态。【F:src/scripts/views/repos.js†L1-L65】 | 若需要分页或排序，可在视图中调用集合提供的新方法。 |
| `views/repo.js` | 作为仓库页面容器，协调 Header、Search、Files、History 等子视图，并响应新建文件操作。【F:src/scripts/views/repo.js†L14-L146】 | 新增仓库级组件时，可在 `constructor` 或 `init...` 方法里初始化并加入 `subviews`。 |
| `views/files.js` | 显示目录列表、面包屑、草稿链接，并根据搜索或路径过滤项目。【F:src/scripts/views/files.js†L13-L200】 | 可扩展 `render` 以支持更多筛选条件或自定义排序。 |
| `views/file.js` | 编辑/查看具体文件，加载分支文件、绑定导航/侧边栏事件并管理编辑器状态。【F:src/scripts/views/file.js†L1-L200】 | 新增编辑模式时，可在视图内挂钩 toolbar 和 metadata。 |
| `views/search.js` | 提供搜索输入并触发 `search` 事件给父视图。【F:src/scripts/views/search.js†L1-L67】 | 可扩展事件回调，支持模糊匹配或历史记录。 |
| `views/header.js` | 显示仓库标题、路径和头像等信息，支持更新文件路径与标题。【F:src/scripts/views/header.js†L1-L129】 | 若需更多仓库统计信息，可在渲染时注入额外字段。 |
| `views/notification.js` | 渲染通知信息，并支持“创建草稿”跳转逻辑。【F:src/scripts/views/notification.js†L1-L59】 | 可添加更多按钮选项，传入 `options` 数组并在模板中扩展。 |
| `views/chooselanguage.js` | 显示语言选择界面，并将选择写入 Cookie 与全局 locale。【F:src/scripts/views/chooselanguage.js†L1-L48】 | 可接入更多语言或引导说明。 |
| `views/documentation.js` | 渲染帮助文档页面，直接将翻译后的 Markdown 注入视图。【F:src/scripts/views/documentation.js†L1-L12】 | 可按需加入搜索或目录。 |
| `views/modal.js` | 抽象模态框行为（打开、关闭、按钮事件）。【F:src/scripts/views/modal.js†L1-L38】 | 扩展时可新增动画或可拖拽逻辑。 |
| `views/metadata.js` | 根据 `_config.yml` metadata 描述渲染动态表单，组合 meta 子视图。【F:src/scripts/views/metadata.js†L1-L165】 | 要增加表单控件，先在 meta 目录中实现组件，再在此视图中注册。 |
| `views/toolbar.js` | Markdown 工具栏，处理按钮点击、上传、草稿发布和对话框。【F:src/scripts/views/toolbar.js†L1-L140】【F:src/scripts/views/toolbar.js†L141-L220】 | 可通过扩展模板与事件增加新 Markdown 片段或对话框流程。 |

### 列表项子视图（views/li）
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `views/li/file.js` | 渲染文件行，展示提交摘要并绑定点击事件进入文件视图。【F:src/scripts/views/li/file.js†L1-L87】 | 可添加更多状态图标（如草稿标记），在模板中渲染并在视图里计算。 |
| `views/li/folder.js` | 渲染文件夹列表项，处理路径导航。【F:src/scripts/views/li/folder.js†L1-L44】 | 可加入懒加载标记，在点击时触发子目录加载。 |
| `views/li/repo.js` | 渲染仓库卡片，与 repos 集合联动（在 `views/repos.js` 中使用）。【F:src/scripts/views/li/repo.js†L1-L34】 | 可扩展显示仓库语言、stars 等字段。 |

### 元数据控件（views/meta）
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `meta/text.js` / `textarea.js` / `select.js` / `multiselect.js` / `checkbox.js` / `button.js` | 根据配置生成表单控件，向 Metadata 视图回传值。【F:src/scripts/views/metadata.js†L17-L58】 | 若要支持新控件类型（如日期选择），可新增文件并在 `templates/meta` 目录添加对应模板。 |

### 侧边栏子视图（views/sidebar）
| 文件 | 作用 | 扩展建议 |
| --- | --- | --- |
| `sidebar/branches.js` | 获取并渲染分支列表，支持选择后导航。【F:src/scripts/views/sidebar/branches.js†L14-L76】 | 可在 `render` 中加入过滤或搜索分支。 |
| `sidebar/branch.js` | 渲染单个分支选项，供 `branches` 使用。【F:src/scripts/views/sidebar/branch.js†L1-L22】 | 可扩展以显示是否受保护等信息。 |
| `sidebar/history.js` | 展示提交历史列表，监听 `commits` 集合并聚合最近改动。【F:src/scripts/views/sidebar/history.js†L1-L155】 | 可增加对分页或筛选的支持。 |
| `sidebar/drafts.js` | 若存在 `_posts` 目录，则显示草稿入口。【F:src/scripts/views/sidebar/drafts.js†L1-L25】 | 可扩展以显示草稿数量或快捷操作。 |
| `sidebar/orgs.js` | 切换组织上下文并在渲染时高亮当前主体。【F:src/scripts/views/sidebar/orgs.js†L1-L45】 | 可整合搜索或收藏功能。 |
| `sidebar/save.js` | 管理保存面板、文件名输入和保存状态。【F:src/scripts/views/sidebar/save.js†L1-L65】 | 可添加自动保存提示。 |
| `sidebar/settings.js` | 渲染仓库设置相关项并透传文件路径、语言等信息。【F:src/scripts/views/sidebar/settings.js†L1-L67】 | 可加入自定义设置卡片。 |

### 工具栏子模块
`views/toolbar/markdown.js` 集中定义 Markdown 操作逻辑，供 Toolbar 视图调用，实现粗体、引用、列表等文本操作。【F:src/scripts/views/toolbar/markdown.js†L1-L60】【F:src/scripts/views/toolbar.js†L52-L140】 扩展新的 Markdown 快捷键时，可在该模块添加处理函数，并在模板中加入按钮以调用。

## 模板资源
`src/scripts/templates/index.js` 聚合所有 Mustache/Underscore 模板，包括主应用、侧边栏、对话框、列表项等，并从子目录引入 dialogs、li、meta、sidebar 模块。【F:src/scripts/templates/index.js†L1-L51】 各 `.html` 文件定义 HTML 结构，例如 `files.html`、`repo.html` 等，与对应视图一一配合使用。新增界面时，建议在此目录新增模板文件并在 `index.js` 注册，以便视图通过 `templates.<name>` 访问。

## 扩展业务功能的推荐流程
1. **确定数据需求**：若需从 API 获取新数据，先在 `models`/`collections` 下建模，并在 `Config` 中补充所需配置项。【F:src/scripts/config.js†L1-L14】【F:src/scripts/collections/repos.js†L1-L70】
2. **设计路由或入口**：通过 `router/index.js` 注册新路径或扩展现有处理方法，确保在切换视图前正确清理旧实例。【F:src/scripts/router/index.js†L30-L145】
3. **实现视图与模板**：在 `views` 下创建新视图，复用 `AppView` 提供的 loader/sidebar/nav；在 `templates` 中定义 UI 结构并在 `index.js` 注册。【F:src/scripts/views/app.js†L24-L67】【F:src/scripts/templates/index.js†L1-L51】
4. **接入工具与国际化**：复用 `util`、`upload`、`translations` 提供的共用能力，必要时向这些模块添加扩展函数或新语言键值。【F:src/scripts/util.js†L5-L275】【F:src/scripts/translations/index.js†L1-L64】
5. **增强交互与状态**：通过侧边栏、工具栏等子视图组合现有交互模式，或在 `metadata`/`meta` 控件中扩展配置驱动的表单，从而快速适配新业务场景。【F:src/scripts/views/sidebar.js†L14-L67】【F:src/scripts/views/metadata.js†L1-L160】

