# Mihawk

轻量级 Mock 服务器，基于 Koa2，支持 HTTP/HTTPS 和 WebSocket。基于 typescript 开发

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

1. 合并 CLI 参数和 `.mihawkrc.json` 配置
2. 检查端口占用
3. 加载路由映射 `routes.json`
4. 注册中间件（顺序见下）
5. 启动 HTTP/HTTPS 服务器

### 中间件执行顺序

```
error → ssl → cert-file → favicon → common → cors → cache → 404 → body-parser → routes → diy-middleware → mock
```

### 请求处理

```
请求 → 路由匹配 → 加载 JSON 数据 → 执行逻辑文件 → 返回响应
```

自定义中间件可通过 `ctx.skipDefaultMock = true` 跳过默认 mock。

## 配置文件 (.mihawkrc.json)

```typescript
interface MihawkRC {
  host?: string; // 默认 "0.0.0.0"
  port?: number; // 默认 8888
  https?: boolean | { key; cert; ca };
  cors?: boolean; // 默认 true
  watch?: boolean; // 文件监控，默认 true
  cache?: boolean; // 默认 false
  mockDir?: string; // 默认 "mocks"
  mockDataFileType?: 'json' | 'json5';
  mockLogicFileType?: 'none' | 'js' | 'cjs' | 'ts';
  socketConfig?: { stomp?: boolean } | boolean;
  setJsonByRemote?: { enable: boolean; target: string };
}
```

## 构建配置

- **tsconfig.esm.json**: ESM 输出 (dist/esm/)
- **tsconfig.cjs.json**: CommonJS 输出 (dist/cjs/)
- **tsconfig.type.json**: 类型声明 (dist/types/)
