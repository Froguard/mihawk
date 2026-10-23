# Mihawk

轻量级 Mock 服务器，基于 Koa 3，支持 HTTP/HTTPS 和 WebSocket。基于 TypeScript 开发

## 常用命令

```bash
npm run dev           # 开发模式运行 demo.ts
npm run dev:bin       # CLI 模式运行
npm run build         # 构建 ESM + CJS + 类型声明
npm test              # 运行 Jest 测试
npm run lint:fix      # 自动修复 ESLint 问题
```

## 项目结构

```
src/
  index.ts           # 主入口，导出 mihawk 函数
  com-types.ts       # 类型定义（MihawkRC 配置接口）
  middlewares/       # Koa 中间件（mock.ts 是核心）
  composites/        # 功能模块（loader, scanner, watcher 等）
  utils/             # 工具函数
bin/
  index.ts           # CLI 入口
  sub-cmds/          # init, start 子命令
```

## 核心架构

### 启动流程

1. 读取 `.mihawkrc.{json|js|ts}`，再用 CLI 参数覆盖同名配置
2. 检查端口占用
3. 根据数据/逻辑模式加载 `routes.{json|json5|js|cjs|ts}`
4. 注册中间件（顺序见下）
5. 启动 HTTP/HTTPS 服务器

### 中间件执行顺序

```
error → ssl（HTTPS）→ cert-file（HTTPS）→ favicon → common → cors（可选）→ cache → 404 → body-parser → routes → diy-middleware（可选）→ mock
```

### 请求处理

```
请求 → 路由匹配 → 加载 JSON 数据 → 执行逻辑文件 → 返回响应
```

自定义中间件可通过 `ctx.skipDefaultMock = true` 跳过默认 mock。

## 配置文件 (`.mihawkrc.{json|js|ts}`)

```typescript
interface MihawkRC {
  host?: string; // 默认 "0.0.0.0"
  port?: number; // 默认 8888
  https?: boolean | { key: string; cert: string; ca?: string }; // 默认 false
  cors?: boolean; // 默认 true
  watch?: boolean; // CLI 文件监控，默认 true
  cache?: boolean; // 默认 false
  mockDir?: string; // 默认 "mocks"
  mockDataFileType?: 'json' | 'json5'; // 默认 "json"
  mockLogicFileType?: 'none' | 'js' | 'cjs' | 'ts'; // 默认 "none"
  autoCreateMockLogicFile?: boolean; // 默认 false
  tsconfigPath?: string | null; // 仅 TypeScript 逻辑模式生效
  logConfig?: { ignoreRoutes?: string[] } | null;
  bodyParser?: { jsonLimit?: string | number; formLimit?: string | number }; // 默认 1mb / 56kb
  onBodyParserError?: (error: unknown, ctx: KoaContext) => void | Promise<void>;
  socketConfig?: { stomp?: boolean } | boolean | null; // 默认关闭
  setJsonByRemote?: {
    enable: boolean;
    target: string;
    timeout?: number; // 默认 10000ms
    changeOrigin?: boolean;
    rewrite?: (path: string) => string;
    coverExistedJson?: boolean;
  } | null;
}
```

`bodyParser` 仅配置 JSON 和 URL 编码表单大小限制；数字为字节，字符串支持 b/kb/mb/gb（忽略大小写、1024 进制），换算后必须为正安全整数字节数，无效值和未知字段在启动时拒绝。未配置时使用解析器默认值，不在 `DEFAULT_RC` 中重复定义。

解析失败会停止下游处理，默认返回 `{ code: status, msg: HTTP标准描述 }`，不包含原始请求体或错误信息。`onBodyParserError` 在默认响应设置后收到原始错误，支持同步或异步修改响应；回调失败返回通用 JSON 500。该回调仅可通过 JS/TS RC 或程序 API 配置，不进入 JSON Schema。未读取完整的失败请求会先流式丢弃剩余请求数据而不缓存，再返回完整错误响应，保留连接复用。旧版解析失败后继续执行业务的行为已移除；读取原始请求流可用 `application/octet-stream`，已有 `ctx.disableBodyParser` 行为保留。

`mockLogicFileType` 为 `none` 时不加载 middleware、单路由逻辑或自定义 socket 逻辑；routes 后缀与 `mockDataFileType` 一致。设置为 `js`、`cjs` 或 `ts` 时，routes、middleware、data 逻辑和 socket 逻辑使用对应后缀。

本地 JSON 不存在时，远端数据、`mocks/template/json.tpl`、内置 `initData` 依次作为初始化来源。只有 `coverExistedJson: true` 时，已有本地 JSON 才会请求远端并尝试覆盖。

## 构建配置

- **tsconfig.esm.json**: ESM 输出 (dist/esm/)
- **tsconfig.cjs.json**: CommonJS 输出 (dist/cjs/)
- **tsconfig.type.json**: 类型声明 (dist/types/)
