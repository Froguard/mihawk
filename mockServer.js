/**
 * mock数据的服务，用以模拟后端接口
 * 开发调试时候用
 * @type {Application}
 * 备注：
 *     用以mock数据的json文件，在命名以及文件夹目录，规则遵循如下
 *     app/middleware/proxy/rules.js中的key的值
 *
 *      request               =>     json-file
 *     'GET /upload/image'  对应=>   ./data/ + get/upload/image.json
 *
 */
"use strict";
const path = require('path');
const http = require('http');
const fs = require('fs');
const koa = require('koa');
const bodyParser = require('koa-bodyparser');
// const cors = require('koa-cors');
const _ = require("lodash");
const colors = require("colors");
const app = koa();
const cwd = process.cwd();



//port
const runTimePort = process.argv[2] || 0;
const port = runTimePort || 8888;
// data director
const dPath = "./data";
const comApiDealJsPath = path.resolve(path.join(cwd,dPath,"./comApiData.js")).replace(/\\/g,"/");
const comApiDealJsonPath = path.join(cwd,dPath,"./comApiData.json").replace(/\\/g,"/");

// config
// 方便使用post类型的请求数据挂载到this.request.body
app.use(bodyParser());
// 允许跨域，不在这里写，手动在headers里面设置三个属性进行实现了
// app.use(cors());
app.use(function *(next){
    // url
    let theMethod = this.method.toUpperCase(),
        thePath = this.path,// this.url带?a=1这种参数，this.path不带?a=1这种参数
        url = `${theMethod} ${thePath}`,//用以查找mock数据
        theUrl = this.url,
        reqUrl = `${theMethod} ${theUrl}`;//用以输出到控制台

    // mockData
    let mockData = {
        statusCode: 200,
        headers: {
            "Content-Type":"application/json;charset=utf-8"
        },
        body: null
    };
    // headers
	// 允许跨域
	this.set('Access-Control-Allow-Origin','*');
	this.set('Access-Control-Allow-Methods','POST,GET,PUT,DELETE,HEAD,OPTIONS');//*
	this.set('Access-Control-Allow-Headers','Content-Type,Content-Length,Authorization,Accept,X-Requested-With');//*
	// 禁掉缓存
	this.set("Pragma", "No-cache");
	this.set("Cache-Control", "No-cache");
	this.cookies.set("Expires", 0);
	
	
    let methodName = this.method.toLowerCase();
    if(!~['get','post','put','delete'].indexOf(methodName)){//不属于这几种时
        
        //比如chrome在ajax跨域时候，会首先发一个options请求（同时headers会带上本域origin）作为嗅探请求，如果服务器准许（服务器响应access control allow origin的值包含当前域），那么说明被允许跨域，就再重新发一次
		if(methodName==="options"){
			console.log(colors.magenta("处理一个options请求嗅探"));
			this.type = 'json';
			this.status = 200;
			this.body = "接收到请求嗅探，准许跨域请求";	//此时请确保headers头米面设置好了准许跨域的设置！！！
			return;
		}else{
			console.log(colors.yellow(`Resolve the '${methodName}' mtehod request to a get!`));
			methodName = "get";
		}
	}
    let filePath = `/${methodName}${thePath}`,
        jsPath = filePath,  // => "/get(put|post|delete)/**/*.js"
        jsonPath = filePath;// => "/get(put|post|delete)/**/*.json"

    // favicon.ico
    if("/get/favicon.ico" == filePath){ return; }

    // 是否为异步接口: 目前只能处理非页面请求，返回非页面数据，如json
    let isAsync = true;

    // 1.处理‘根’请求："GET /","POST /","DELETE /","PUT /","HEAD /"
    if("/" == thePath){
        filePath += "index";
        jsPath += "index.js";
        jsonPath += "index.json";
    }else{
    // 2.链接末尾如果有“/”的去掉该字符再查找
        if(filePath.substr(-1) == '/'){
            filePath = filePath.slice(0,-1);//substring(0,filePath.length-1)
        }
        jsPath += filePath.substr(-3)!='.js'?'.js':'';
        jsonPath += filePath.substr(-5)!='.json'?'.json':'';
    }
    // format
    jsPath = jsPath.replace(/\\/g,"/");
    jsonPath = jsonPath.replace(/\\/g,"/");

    // get common data
    let comApiDataDeal = false;
    let comApiData = false;
    delete require.cache[comApiDealJsPath];// 确保每次运行都是执行最新的js
    // get common js deal
    try{
        comApiDataDeal = require(comApiDealJsPath);
    }catch(e1){
        console.log(colors.yellow(e1));
        comApiDataDeal = require('./data/comApiData');
    }
    // get common json data
    let comJsonData;
    try{
        comJsonData = JSON.parse(fs.readFileSync(comApiDealJsonPath, 'utf8')) || {};
    }catch(e2){
        console.log(colors.yellow(e2));
        comJsonData = {};
    }
    // do common js deal
    if(comApiDataDeal){
        try{
            comApiData = comApiDataDeal(this, comJsonData);
        }catch(e3){
            console.log(colors.yellow(e3));
            comApiData = false;
        }

    }else{
        comApiData = comJsonData;
    }

    // get orginData via *.json file
    let custom = null;
    try{
        custom = JSON.parse(fs.readFileSync(path.join(cwd,dPath,jsonPath), 'utf8'));
    }catch(e){
        console.log(colors.red.bold("MockError:\r\n",e.message));
        custom = false;
    }
    // if need deal originData via custom js
    let customDeal = null;
    try{
        let custDealJsPath = path.resolve(path.join(cwd,dPath,jsPath));
        delete require.cache[custDealJsPath];// 确保每次运行都是执行最新的js
        customDeal = require(custDealJsPath);
    }catch(e){
        customDeal = false;
    }
    if(customDeal){
        let afterDeal = customDeal(this, custom || {});
        if(afterDeal){ custom = afterDeal; }
    }else{
        if(!custom) {
            console.log(colors.red.bold(`[error] File not found: ${filePath}.(js|json) ,both not found!`));
        }else{
            if(isAsync){ custom = { "body": custom }; }
        }
    }
    // print out
    console.log(
          colors.cyan(`-  MockUrl: ${reqUrl}\r\n`)
        + colors.cyan(`- MockFile: ${path.join(cwd,dPath).replace(/\\/g,"/")}`)
        + (!customDeal ? colors.cyan(jsonPath) : (colors.cyan(jsPath.split(".js")[0]) + colors.yellow(".js")))
    );
    // response
    if(!!custom){
        // combine mock data
        if(isAsync && comApiData){
            comApiData = _.merge(comApiData,custom);
            mockData = _.merge(mockData, comApiData);
        }
        
        // 'XMLHttpRequest' === this.req.get('X-Requested-With');//判断是不是ajax
        // 合并
        let ctx = this, _headers = mockData.headers;
        Object.keys(_headers).forEach(function(k){
            ctx.set(k,_headers[k]);
        });
        // status
        this.status = mockData.statusCode;
        if(mockData.statusCode==302){
        //重定向
            this.redirect(mockData.headers.location);
        }else if(mockData.download){
        //文件下载
            // 要禁掉缓存，不然会发现下载功能在IE下面不行，找不到文件。opera,firefox,chrome没问题
            this.set("Pragma", "No-cache");
            this.set("Cache-Control", "No-cache");
            this.cookies.set("Expires", 0);
            this.body = custom.body;//不可为mockData.body
            console.log(colors.cyan('- MockType: Download-File'));
        }else{
        // 其他正常mock
            // body
            this.body = mockData.body;
        }
    }else{
        this.type = 'html';
        this.status = 404;
        this.body = `404 File not found: The Mock-data('${filePath}.json|js') is not found!!!`;
    }

    yield next;
});

/**
 * server configuration
 */
let server = http.createServer(app.callback());
server.on('error', function (error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(colors.red(`MockServer failed！ ${bind} requires elevated privileges`));
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(colors.red(`MockServer failed！ ${bind} is already in use`));
            process.exit(1);
            break;
        default:
            throw error;
    }
});
server.on('listening', function () {
    let addr = server.address();
    let bind = typeof addr === 'string' ? ('pipe ' + addr ) : ('port ' + addr.port);
    console.log(colors.green(`Start mock-server on ${bind} success! via port of `));
    console.log(`Mock Data directory: ${colors.gray(path.join(cwd,dPath).replace(/\\/g,"/"))}`);
});

// start
server.listen(port);

module.exports = {};