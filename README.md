# Mihawk (simple tiny mock-server)

> 中文版说明 → [README.zh-CN.md](./README.zh_CN.md)

## Install

```sh
npm i -g mihawk
```

## Usage

```sh
mihawk 8888
```

> then open browser and visit `http://localhost:8888`
>
> mock data directory: `./data`

```sh
/data
   │
   ├── DELETE
   │     ├──/*.js    DELETE request resolve loggic
   │     └──/*.json  DELETE request resolve data
   │
   ├── GET
   │     ├──/*.js    GET request resolve loggic
   │     └──/*.json  GET request resolve data
   │
   ├── POST
   │     ├──/*.js    POST request resolve loggic
   │     └──/*.json  POST request resolve data
   │
   ├── PUT
   │     ├──/*.js    PUT request resolve loggic
   │     └──/*.json  PUt request resolve data
   │
   ├── middleware.js    [optional] resolve middleware
   │
   └── routes.json   [optional] common routes
```

> mapping：

```sh
request    ： GET http://local:8888/a/b/c/d
JSON-file  ： data/get/a/b/c/d.json
mock-file  :  data/get/a/b/c/d.js
```
