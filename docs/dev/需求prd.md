# prd

## 功能

- [x] npm 产物同时支持 `cjs,esm,ts`
- [x] 使用时，通过命令行 `mihawk init` 进行初始化项目，比如
  - [x] 初始化 `.mihawakrc` 文件
  - [x] 创建必要的 `目录`,
  - [x] 创建接口示例代码， `demo` 文件（默认）
  - [x] 创建路由文件 `routes.json`（默认）
- [x] `rc 文件友好提示`
  - [x] json时给出 schema
  - [x] ts时给出类型定义
- [x] server 需要同时支持 http 和 `https`
  - [x] https 支持 boolean，false|true，只写 true 的时候，使用内置的秘钥证书
  - [x] https 支持对象格式 { cert, key }; 用户可以填写自己的证书文件路径
  - [x] https 作为对象自定义 { cert, key } 是，cert 和 key 必须承兑出现，当用户一旦有一个缺失的时候，都会转到使用内置证书
- [x] server启动时的输出，必要信息进行打印
  - [x] 遍历所有可用的路由，进行`可用路由列表输出`
  - [x] 打印当前主机的 ip 地址（如果采用的是`0.0.0.0`地址）
  - [x] 输出当前端口号
  - [x] 输出当前是否开启 watch 模式，同时区分是 start 还是 restart
- [x] server 启动时需要检测端口占用情况
- [x] 使用时，支持用户自定义 `middleware`（Koa 或 express 的 middleware 格式），比如，处理一些公共的接口逻辑
  - [x] 支持用户通过自定义中间件去完成一些特殊的请求处理（如文件下载）
  - [x] 支持 koa2 中间件
  - [x] 支持 express 中间件
  - [x] 中间件处理的时候，能够获取 post 请求上的 body (自定义 middleware 的加载顺序放到 bodyParser 之后就行)
- [x] 使用时，支持用户同时通过 `json,js,ts` 去描述 mock 逻辑
  - [x] ts 支持自定义 tsconfig 的路径（支持相对路径），如果不写则默认配置
    - [x] 加载 tsconfig 的时候，需要强制将其中的打包输出配置覆盖掉，如 `outDir`,`declaration`,`paths`,`include`,`ts-node`
- [x] 当 json,js,ts 文件同时存在的时候，json 作为原始数据，ts|js 作为`处理数据的函数`定义
  - [x] 当 mock 目录中，同时存在 js 和 ts 时，根据配置项中的 `mockLogicFileType` 选择处理方式
    - [x] 验证一下 js 和 ts 文件的逻辑
  - [x] mock 数据文件，同时支持 `json` 和 `json5`
  - [x] `json 文件自定义加载解析`，不走 require|import，而是走文件内容解析，即 fs 加载文本，`JSON5.parse`
    - 这样好处是，即便是 json 文件，也能按照 json5 标准去写，能够支持注释等语法
- [x] 当检测到 json,js,ts 都不存在的时候，`自动创建`一个 json 文件（js 和 ts 不创建）
  - [x] json 自动创建
  - [x] js|ts 根据是否开启 autoCreate 属性决定自动创建
- [x] 日志中，允许进行针对特定 path 进行`日志输出过滤`，比如 `OPTION/ xxx` 请求，配置需要支持 `glob 表达式`
- [x] 支持 `routes.json` 文件，该文件为 kv 键值对（ `k`: 标识路由,`v`: 标识 mock 文件路径），v 支持 `glob` 表达式
  - [x] routes 支持 `ts|cjs|js` 格式
- [x] `watch` 能力默认开启 **实现方案待定！**
  - [ ] ~~方案1：可以考虑使用 nodemon 完成 × ~~
  - [x] 方案2：自己实现（轻量化办法）：√
    - 使用 chokidar 监控文件变化，当文件变化时，刷新 require.cache, 并重新启动整个 server（先 close 再 start，以便于加载 mock 相关文件，并重新执行新逻辑）
    - 使用 lru-cache 算法，缓存 mock 文件的内容，避免重复加载
- [x] 支持 websocket 链接的 mock 能力
  - [x] 自定义 socket 实例上的几个常见 listener 的处理函数

## mocks 目录说明

- mocks
  - `文件`：routes.json ，全局路由配置，`路由→mock文件路径` 的映射关系，方便多条路由能够复用相同逻辑 `(可选)`
  - `文件`：middleware.ts|js，全局中间件，方便全局公共逻辑的处理，比如针对返回格式的处理 `(可选)`
  - `文件`：tsconfig.json，当选择了 ts 作为mock 类型时生效 `(可选，默认不写)`
  - `文件`：scoket.ts|js，全局 websocket 处理逻辑，针对 socket 实例上的监听处理函数 `(可选)`
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
