## simple tiny mockServer(just data-mock)

- 只mock-data，而不mock页面，即返回的response中body多为json，而不会包含html代码
- 支持通过js动态二次修改返还的json数据，当js不存在是，不修改json，直接返还源数据
- 支持在js中查询与请求相关的一些数据，比如querystring
- 支持跨域使用

### 使用

```bash
$ npm i -g mihawk
````

```bash
$ mihawk 8888
```

> 需要新建一个data文件夹

```
/data
   │
   ├── delete
   │     │
   │     ├──/*.js    DELETE 请求所对应的数据处理逻辑
   │     │
   │     └──/*.json  DELETE 请求所对应的数据
   │
   ├── get
   │     │
   │     ├──/*.js    GET 请求所对应的数据处理逻辑
   │     │
   │     └──/*.json  GET 请求所对应的数据
   │
   ├── post
   │     │
   │     ├──/*.js    POST 请求所对应的数据处理逻辑
   │     │
   │     └──/*.json  POST 请求所对应的数据
   │
   ├── put
   │     │
   │     ├──/*.js    PUT 请求所对应的数据处理逻辑
   │     │
   │     └──/*.json  PUt请求所对应的数据
   │
   ├── comApiData.js     (可选)异步接口公共数据处理函数，会对同名的json文件进行数据处理并返还
   │
   └── comApiData.json   (可选)异步接口公共数据
```

> 举个对应关系的栗子：

```
请求    ： GET http://local:8888/a/b/c/d
独立JSON： data/get/a/b/c/d.json
DATA    :  独立JSON数据（有js就二次处理） + 公共JSON数据（有js就二次处理）
```



## mockData注意事项

> mockData文件夹说明：

```
/
│
├─ /data
│   │
│   ├── delete
│   │     │
│   │     ├──/*.js    DELETE 请求所对应的数据处理逻辑
│   │     │  
│   │     └──/*.json  DELETE 请求所对应的数据
│   │
│   ├── get
│   │     │
│   │     ├──/*.js    GET 请求所对应的数据处理逻辑
│   │     │  
│   │     └──/*.json  GET 请求所对应的数据
│   │
│   ├── post
│   │     │
│   │     ├──/*.js    POST 请求所对应的数据处理逻辑
│   │     │  
│   │     └──/*.json  POST 请求所对应的数据
│   │
│   ├── put
│   │     │
│   │     ├──/*.js    PUT 请求所对应的数据处理逻辑
│   │     │  
│   │     └──/*.json  PUt请求所对应的数据
│   │
│   ├── comApiData.js     异步接口公共数据处理函数，会对同名的json文件进行数据处理并返还
│   │
│   └── comApiData.json   页面同步接口公共数据
│
└── mockServer.js    mockServer的程序入口
```




