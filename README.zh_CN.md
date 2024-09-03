# Mihawk (简单小巧的 MockServer 工具)

> English → [README.md](./README.md)

## 安装

```sh
npm i -g mihawk
```

## 使用

```sh
mihawk 8888
```

> 打开网页 `http://localhost:8888`
>
> mock 文件夹: `./data`

```sh
/data
   │
   ├── DELETE
   │     ├──/*.js    DELETE 请求处理逻辑
   │     └──/*.json  DELETE 请求对应的数据
   │
   ├── GET
   │     ├──/*.js    GET 请求处理逻辑
   │     └──/*.json  GET 请求对应的数据
   │
   ├── POST
   │     ├──/*.js    POST 请求处理逻辑
   │     └──/*.json  POST 请求对应的数据
   │
   ├── PUT
   │     ├──/*.js    PUT 请求处理逻辑
   │     └──/*.json  PUt 请求对应的数据
   │
   ├── middleware.js    [可选] 公共逻辑中间件
   │
   └── routes.json   [可选] 自定义的路由映射
```

> 路由与文件的映射关系

```sh
request    ： GET http://local:8888/a/b/c/d
JSON-file  ： data/get/a/b/c/d.json
mock-file  :  data/get/a/b/c/d.js
```
