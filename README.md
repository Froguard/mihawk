## simple tiny mockServer(just data-mock)

- 只mock-data，而不mock页面，即返回的response中body多为json，而不会包含html代码，当然，理论上返回任何东西都可以，包括下载文件。需要手动在对应请求的处理js中写逻辑
- 支持通过js动态二次修改返还的json数据，当js不存在是，不修改json，直接返还源数据
- 支持在js中查询与请求相关的一些数据，比如querystring，request.body
- js中可以控制改变statusCode，headers等
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

> 栗子

开启

```bash
$ mihawk 8888
```

访问&nbsp;
[http://localhost:8888/index](http://localhost:8888/index)


## mockData注意事项

> 如何自定义数据

以/get/index为例，index.js是对index.json二次处理，如果没有js则直接不处理，并返还json

```js
/**
 * ctx是koa的app上下文，可以使用它操作很多东西
 * originData 是同名json的数据，这里是index.json
 */
function getMockData(ctx,originData){

    let query = ctx.query || {};//url queryString
    let reqBody = ctx.request.body || {};// post or form or other data

    console.log("QueryString为：\r\n",JSON.stringify(query,null,2));
    console.log("request-body为：\r\n",JSON.stringify(reqBody,null,2));

    return {
        // statusCode: 200,
        // headers:{},
        body: originData
    };
}

// exports
module.exports = getMockData;
```



