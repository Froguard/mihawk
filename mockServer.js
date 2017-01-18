/**
 * mock数据的服务，用以模拟后端java的接口
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
const favicon = require('koa-favicon');

// json5
let JSON5 = require('json5');
global.JSON5 = JSON5;


//port
const runTimePort = process.argv[2] || 0;
const port = runTimePort || 8888;
// data director
const dPath = "./data";
const comApiDealJsPath = path.resolve(path.join(cwd,dPath,"./comApiData.js")).replace(/\\/g,"/");
const comApiDealJsonPath = path.join(cwd,dPath,"./comApiData.json").replace(/\\/g,"/");
let hasWarnComApiJs = false;
let hasWarnComApiJson = false;

// 遍历data文件夹，抓取可用mock的请求，并记录
// json-toy
const jsonToy = require('json-toy');
const dir2Json = require('json-toy/lib/cli/walk-dir');
const Type = require('json-toy/lib/typeOf');
const existsSync = fs.existsSync || path.existsSync;
let mockUrlsSet = [];
var _dPath = path.join(cwd,dPath);
if(existsSync(_dPath)){
    let dirJson = dir2Json(_dPath);
    jsonToy.travelJson(dirJson,function(key,val,curKeyPath,typeStr,isComplexObj,curDepth,isCircular){
        if(!isComplexObj && curDepth>2){
            let cp = curKeyPath.replace("ROOT.","").replace(/(.js|.json)$/g,"");
            let cpStr = cp.split(".").map((it,index)=>{
                return index===0 ? (it.toUpperCase()+" ") : it;
            }).join("/");
            if(!~mockUrlsSet.indexOf(cpStr)){//不加入重复的
                mockUrlsSet.push(cpStr);
            }
        }
    },"ROOT");
}else{
    mockUrlsSet.push("GET /index (It's a default url :-(  Because you have no directory './data')");
}


/**
 * config
 */

// favicon.ico
app.use(favicon(path.join(__dirname, './res/favicon.ico')));

// 方便使用post类型的请求数据挂载到this.request.body
app.use(bodyParser());

// 允许跨域，不在这里写，手动在headers里面设置三个属性进行实现了
// app.use(cors());

// main
app.use(function *(next){
    // url
    let theMethod = this.method.toUpperCase(),
        thePath = this.path,// this.url带?a=1这种参数，this.path不带?a=1这种参数
        // reqPath = `${theMethod} ${thePath}`,
        theUrl = this.url,
        reqUrl = `${theMethod} ${theUrl}`;//用以输出到控制台

    // 设置headers，必须在所有操作之前，否则会使得跨域失效
    // 允许跨域
    this.set('Access-Control-Allow-Origin','*');
    this.set('Access-Control-Allow-Methods','POST,GET,PUT,DELETE,HEAD,OPTIONS');//*
    this.set('Access-Control-Allow-Headers','Content-Type,Content-Length,Authorization,Accept,X-Requested-With');//*
    // 禁掉缓存，为了确保每次请求过去的数据都是最新的，方便mock时候debug
    this.set("Pragma", "No-cache");
    this.set("Cache-Control", "No-cache");
    this.cookies.set("Expires", 0);

    // mockData
    let mockData = {
        statusCode: 200,
        headers: {
            "Content-Type":"application/json;charset=utf-8"
        },
        body: null
    };
	
    // 已经使用了koa-favicon
    //// favicon.ico 
    //// if("GET /favicon.ico" == reqUrl){
    ////     console.log("\r\n" + colors.cyan(`-  MockUrl: ${reqUrl}`) + colors.gray("skip it!"));
    ////     return;
    //// }

     // print out req url
    console.log("\r\n" + colors.cyan(`-  MockUrl: ${reqUrl}`));
    
    // 0.请求处理嗅探
    let methodName = this.method.toLowerCase();
    if(!~['get','post','put','delete'].indexOf(methodName)){//不属于这几种时
        //比如chrome在ajax跨域时候，会首先发一个options请求（同时headers会带上本域origin）作为嗅探请求，如果服务器准许（服务器响应access control allow origin的值包含当前域），那么说明被允许跨域，就再重新发一次
		if(methodName==="options"){
			console.log(colors.cyan("-  Sniffer: " )+colors.gray(reqUrl));//请求嗅探
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
    // 3.格式化路径
    jsPath = jsPath.replace(/\\/g,"/");
    jsonPath = jsonPath.replace(/\\/g,"/");
   	
    // 4.获取【公共的API格式】
    let comApiDataDeal = false;
    let comApiData = false;
    delete require.cache[comApiDealJsPath];// 确保每次运行都是执行最新的js
    // 4.1 获取【公共的API数据js处理文件中的处理函数】以进行数据的二次处理
    try{
        comApiDataDeal = require(comApiDealJsPath);
    }catch(e1){
        !hasWarnComApiJs && console.log(colors.yellow(e1));
        hasWarnComApiJs = true;
		comApiDataDeal = require('./data/comApiData');
    }
    // 4.2 获取【公共的API数据】
    let comJsonData;
    try{
        try{
            comJsonData = JSON.parse(fs.readFileSync(comApiDealJsonPath, 'utf8')) || {};
        }catch(err){
            comJsonData = JSON5.parse(fs.readFileSync(comApiDealJsonPath, 'utf8')) || {};
        }
    }catch(e2){
        !hasWarnComApiJson && console.log(colors.yellow(e2));
        hasWarnComApiJson = true;
		comJsonData = {};
    }
    // 4.3 进行处理
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

    // 5. 获取mock数据
    // 5.1 查找对应的*.json文件
    let custom = null;
    try{
        try{
            custom = JSON.parse(fs.readFileSync(path.join(cwd,dPath,jsonPath), 'utf8'));
        }catch(err2){
            custom = JSON5.parse(fs.readFileSync(path.join(cwd,dPath,jsonPath), 'utf8'));
        }
    }catch(e){
        console.log(colors.red.bold("MockError:\r\n",e.message));
        custom = false;
    }
    // 5.2 查找对应的*.js文件，如果有的话，得到其中的处理函数，以便对mock数据进行二次处理
    let customDeal = null;
    try{
        let custDealJsPath = path.resolve(path.join(cwd,dPath,jsPath));
        delete require.cache[custDealJsPath];// 确保每次运行都是执行最新的js
        customDeal = require(custDealJsPath);
    }catch(e){
        customDeal = false;
    }
	// 打印
	console.log(colors.cyan(`- MockFile: ${path.join(cwd,dPath).replace(/\\/g,"/")}`)
        + (!customDeal ? colors.cyan(jsonPath) : (colors.cyan(jsPath.split(".js")[0]) + colors.yellow(".js"))));
    // 5.3 对mock数据进行二次梳理（如果有必要的话，即找到了自定义的js）
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

	// 7.响应response
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
        // mock重定向
            this.redirect(mockData.headers.location);
        }else if(mockData.download){
        // mock文件下载
            // 要禁掉缓存，不然会发现下载功能在IE下面不行，找不到文件。opera,firefox,chrome没问题
            this.set("Pragma", "No-cache");
            this.set("Cache-Control", "No-cache");
            this.cookies.set("Expires", 0);
            this.body = custom.body;//不可为mockData.body
            console.log(colors.cyan('- MockType: Download-File'));
        }else{
        // mock其他
            console.log(colors.cyan('- MockType: Api-async'));
            // body
            this.body = mockData.body;
        }
        !Type.isObject.isEmpty(this.query) && console.log("Query String Parameters:\r\n"+JSON.stringify(this.query,null,2));
        !Type.isObject.isEmpty(this.request.body) && console.log("Request Payload:\r\n"+JSON.stringify(this.request.body,null,2));

    }else{
        this.type = 'html';
        this.status = 404;
        var abPath = path.join(cwd,dPath,filePath) + ".json|js";
        var str404Content = fs.readFileSync(path.join(__dirname,'./res/404.html'),'utf-8');
        this.body = str404Content.replace("`${abPath}`",abPath);
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
    console.log(`Mock Requests:\r\n  ${colors.gray(mockUrlsSet.join("\r\n  "))}`);
});

// start
server.listen(port);

/*
var https = require('https');
var enforceHttps = require('koa-sslify');
app = koa();
// Force HTTPS on all page
app.use(enforceHttps());

// SSL options
var options = {
    key: fs.readFileSync('./ssl/server.key'),  //ssl文件路径
    cert: fs.readFileSync('./ssl/server.pem')  //ssl文件路径
};
let server2 = https.createServer(options, app.callback());
server2.listen(443);
*/

module.exports = {};