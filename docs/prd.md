# prd

## 功能

- [x] npm 产物同时支持 cjs,esm,ts
- [x] 使用时，通过命令行 `mihawk init` 进行初始化项目，比如
  - [x] 初始化 `.mihawakrc` 文件
  - [x] 创建必要的 `目录`,
  - [x] 创建接口示例代码， `demo` 文件（默认）
  - [x] 创建路由文件 `routes.json`（默认）
- [ ] 使用时，支持用户自定义 middleware（Koa 的 middleware 格式），比如，处理一些公共的接口逻辑
  - [ ] 中间件处理的时候，能够获取 post 请求上的 body
- [ ] 使用时，支持用户同时通过 json,js,ts 去描述 mock 逻辑
  - [ ] ts 支持自定义 tsconfig 的路径（支持相对路径），如果不写则默认配置
    - [ ] 加载 tsconfig 的时候，需要强制将其中的打包输出配置覆盖掉，如 `outDir`,`declaration`,`paths`,`include`,`ts-node`
    - [ ] 对于上面的被覆盖掉的配置项，需要在控制台中，给出提示
- [ ] 当 json,js,ts 文件同时存在的时候，json 作为原始数据，ts|js 作为中间件处理数据
  - [ ] 当 mock 目录中，同时存在 js 和 ts 时，根据配置项中的 `mockLogicFileType` 选择处理方式
  - [ ] mock 数据文件，同时支持 `json` 和 `json5`
  - [ ] `json 文件自定义加载解析`，不走 require|import，而是走文件内容解析，即 fs 加载文本，JSON5.parse
    - 这样好处是，即便是 json 文件，也能按照 json5 标准去写，能够支持注释等语法
- [ ] 当检测到 json,js,ts 都不存在的时候，自动创建一个 json 文件（js 和 ts 不创建）
- [ ] 日志中，允许进行针对特定 path 进行输出过滤，比如 `OPTION/ xxx` 请求，配置需要支持 `glob 表达式`
- [ ] 支持 `routes.json` 文件，该文件为 kv 键值对，支持 `glob` 表达式
  - `k`: 标识路由
  - `v`: 标识 mock 文件路径
- [ ] 日志输出时，遍历所有可用的路由，进行输出
- [ ] `watch` 能力默认开启 **实现方案待定！**
  - [ ] 方案1：可以考虑使用 nodemon 完成
  - [ ] 方案2：自己实现：
    - 使用 chokidar 监控文件变化，当文件变化时，重新加载 mock 相关文件，并重新执行新逻辑
    - 使用 lru-cache 算法，缓存 mock 文件的内容，避免重复加载

## mocks 目录说明

- mocks
  - `文件`：routes.json ，全局路由配置，`路由→mock文件路径` 的映射关系，方便多条路由能够复用相同逻辑 `(可选)`
  - `文件`：middleware.ts|js，全局中间件，方便全局公共逻辑的处理，比如针对返回格式的处理 `(可选)`
  - `文件`：tsconfig.json，当选择了 ts 作为mock 类型时生效 `(可选，默认不写)`
  - `目录`：data/ 存放所有接口的 mock 数据
    - `目录`：POST/ 存放所有 POST 请求的 mock 逻辑
    - `目录`：GET/ 存放所有 GET 请求的 mock 逻辑
    - `目录`：PUT/ 存放所有 PUT 请求的 mock 逻辑
    - `目录`：DELETE/ 存放所有 DELETE 请求的 mock 逻辑
    - `目录`：HEAD/ 存放所有 HEAD 请求的 mock 逻辑
    - `目录`：OPTIONS/ 存放所有 OPTIONS 请求的 mock 逻辑
    - `目录`：TRACE/ 存放所有 TRACE 请求的 mock 逻辑
    - `目录`：CONNECT/ 存放所有 CONNECT 请求的 mock 逻辑
    - `目录`：PATCH/ 存放所有 PATCH 请求的 mock 逻辑
