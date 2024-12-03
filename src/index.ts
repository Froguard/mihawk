'use strict';
import path from 'path';
import http from 'http';
import https from 'https';
import { promisify } from 'util';
import Koa from 'koa';
import Colors from 'color-cc';
import mdwBodyParser from 'koa-bodyparser';
import mdwSSL from 'koa-sslify';
import mdwConnect from 'koa-connect';
import { existsSync, ensureDirSync, readFileSync } from 'fs-extra';
import dedupe from 'free-dedupe';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './composites/rc';
import { enableRequireTsFile, loadJS, loadTS, loadJson } from './composites/loader';
import { relPathToCWD, getRootAbsPath, unixifyPath, absifyPath } from './utils/path';
import mdwFavicon from './middlewares/favicon';
import mdwCertFileDown from './middlewares/cert-file';
import mdwCommon from './middlewares/common';
import mdwError from './middlewares/error';
import mdwCors from './middlewares/cors';
import mdwHdCache from './middlewares/cache';
import mdw404 from './middlewares/404';
import mdwRoutes from './middlewares/routes';
import mdwMock from './middlewares/mock';
import { isPortInUse, getMyIp, supportLocalHost } from './utils/net';
import { EnhancedServer, enhanceServer } from './utils/server';
import { isObjStrict } from './utils/is';
import { scanExistedRoutes } from './composites/scanner';
import { delNillProps } from './utils/obj';
import WsCtrl from './composites/websocket';
import { sleep } from './utils/async';
import type { AnyFunc, KoaMiddleware, Loosify, MhkRCWsConfig, MihawkRC, SocketResolveFunc } from './com-types';

// npm pkg absolute root path, eg: xxx_project_path/node_modules/mihawk
const PKG_ROOT_PATH = getRootAbsPath();

/**
 * mihawk
 * - start a mock server
 * @param {Loosify<MihawkRC>} config 启动所需得配置参数
 * @param {boolean} isRestart 用以区分是否为重启
 * @returns {Promise<any>}
 */
export default async function mihawk(config: Loosify<MihawkRC>, isRestart: boolean = false) {
  delete config._;
  delete config['--'];
  delete config.$schema;
  delNillProps(config);
  !isRestart && Printer.log('config:', config);
  const options = formatOptionsByConfig(config);
  Debugger.log('formated options:', options);
  //
  const {
    // cache,
    cors,
    https: httpsConfig,
    useHttps,
    host,
    port,
    //
    mockDir,
    // mockDirPath: MOCKS_ROOT_PATH,
    mockDataDirPath,
    //
    dataFileExt,
    // logicFileExt,
    useLogicFile,
    isTypesctiptMode,
    tsconfigPath,
    //
    routesFilePath,
    //
    middlewareFilePath,
    //
    useWS,
    socketConfig,
    socketFilePath,
  } = options;
  const loadLogicFile = isTypesctiptMode ? loadTS : loadJS;
  const loadRoutesFile = useLogicFile ? loadLogicFile : loadJson;

  /**
   * 0.detect port in use
   */
  const isPortAlreadyInUse = await isPortInUse(port);
  if (isPortAlreadyInUse) {
    Printer.error(Colors.yellow(`Port ${port} is already in use`));
    process.exit(1);
    // return;
  }

  /**
   * 1.ensure mock data dir exists, scan its json files to get routes
   */
  ensureDirSync(mockDataDirPath);

  /**
   * 2.detect if support typescript mode
   */
  if (isTypesctiptMode) {
    // 启用 ts 模式
    let tsconfig = null;
    if (existsSync(tsconfigPath)) {
      tsconfig = require(tsconfigPath);
    } else {
      !isRestart && Printer.log(Colors.gray(`Skip load "${unixifyPath(relPathToCWD(tsconfigPath))}"(file-not-existed), will use default build-in tsconfig.json`));
    }
    enableRequireTsFile(tsconfig || {});
    !isRestart && Printer.log(Colors.success('Enable typescript mode success!'), Colors.gray('You can write logic in routes.ts, middleware.ts, data/**/*.ts'));
  }

  /**
   * 3.load routes file
   */
  let routes: Record<string, string> = {};
  if (existsSync(routesFilePath)) {
    routes = (await loadRoutesFile(routesFilePath, { noLogPrint: true })) as Record<string, string>;
    !isRestart && Printer.log(Colors.success('Load routes file success!'), Colors.gray(unixifyPath(relPathToCWD(routesFilePath))));
  }

  /**
   * 4.load diy middleware if exists
   */
  let diyMiddleware: KoaMiddleware | null = null;
  if (useLogicFile && existsSync(middlewareFilePath)) {
    // use mdwConnect to wrap around, if it is express middleware (detect by functionVar.isExpress)
    const tmpFunction = await loadLogicFile<AnyFunc>(middlewareFilePath, { noLogPrint: true });
    const isExpressMiddleware = typeof tmpFunction === 'function' && !!(tmpFunction as any).isExpress;
    diyMiddleware = isExpressMiddleware ? mdwConnect(tmpFunction) : tmpFunction;
    !isRestart &&
      Printer.log(
        Colors.success('Load custom middleware file success!'),
        Colors.gray(unixifyPath(relPathToCWD(middlewareFilePath))),
        isExpressMiddleware ? Colors.yellow('Express-Style-Middleware') : '',
      );
  }

  /**
   * 5. create koa app (http-server instance)
   */
  const app = new Koa();

  // middleware: error resolve
  app.use(mdwError());

  // middleware: https base ssl
  useHttps && app.use(mdwSSL({ hostname: host, port }));

  // middleware: certificate authority file download
  useHttps && app.use(mdwCertFileDown());

  // middleware: favicon
  app.use(mdwFavicon(path.resolve(PKG_ROOT_PATH, './assets/favicon.ico')));

  // middleware: common middleware
  app.use(mdwCommon(options));

  // middleware: cors setting(ACAO,ACAM,ACAH)
  cors && app.use(mdwCors());

  // middleware: response cache setting (expire,cache-control,Pragma)
  app.use(mdwHdCache());

  // middleware: 404
  app.use(mdw404());

  // middleware: body parser
  app.use(mdwBodyParser());

  // middleware: special routes mapping
  app.use(mdwRoutes(routes));

  // ★ middleware: diy middleware ★
  typeof diyMiddleware === 'function' && app.use(diyMiddleware);

  // middleware: mock middleware
  app.use(mdwMock(options));

  //

  /**
   * 6.server configuration
   */
  const protocol = useHttps ? 'https' : 'http';
  const addr1 = `${protocol}://${host}:${port}`;
  let server: http.Server | https.Server | null = null;
  // create http|https server
  if (useHttps) {
    const httpsOptions: Record<'key' | 'cert', any> | null = { key: null, cert: null };
    let key = '', cert = ''; // prettier-ignore
    if (isObjStrict(httpsConfig)) {
      key = httpsConfig.key;
      cert = httpsConfig.cert;
    }
    const keyFilePath = absifyPath(key);
    const certFilePath = absifyPath(cert);
    if (!key || !cert || !existsSync(keyFilePath) || !existsSync(certFilePath)) {
      // use built-in https cert files
      httpsOptions.key = readFileSync(path.resolve(PKG_ROOT_PATH, './assets/.cert/localhost.key'));
      httpsOptions.cert = readFileSync(path.resolve(PKG_ROOT_PATH, './assets/.cert/localhost.crt'));
      !isRestart && Printer.log(Colors.gray(`Custom https cert files ware not found, use default build-in https cert files`));
    } else {
      // load custom https cert files
      httpsOptions.key = readFileSync(keyFilePath);
      httpsOptions.cert = readFileSync(certFilePath);
      !isRestart && Printer.log(Colors.success('Load https cert files success!'), Colors.gray(`${key} ${cert}`));
    }
    // create https server (SSL)
    server = https.createServer(httpsOptions, app.callback());
  } else {
    // create http server (normal)
    server = http.createServer(app.callback());
  }

  // server-event: error
  server.on('error', function (error: any) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        Printer.error(Colors.error(`MockServer failed! Port ${port} requires elevated privileges!!!\n`));
        process.exit(1);
        break;
      case 'EADDRINUSE':
        Printer.error(Colors.error(`MockServer failed! Port ${port} is already in use!!!\n`));
        process.exit(1);
        break;
      default:
        Printer.error(Colors.red('Server Error:\n'), error);
        throw error;
    }
  });

  // server-event: listening
  server.on('listening', function () {
    Printer.log(Colors.green(`🚀 ${isRestart ? 'Restart' : 'Start'} mock-server success!`));
    //
    !isRestart && Printer.log('Mock directory: ', Colors.gray(unixifyPath(mockDir)));
    const existedRoutes = scanExistedRoutes(mockDataDirPath, dataFileExt) || [];
    Debugger.log('Existed routes by scann:', existedRoutes);
    let existedRoutePaths = existedRoutes.map(({ method, path }) => `${method} ${path}`);
    existedRoutePaths.push(...Object.keys(routes));
    existedRoutePaths = dedupe(existedRoutePaths);
    existedRoutePaths.sort();
    const existedCount = existedRoutePaths.length;
    !isRestart && Printer.log(`Detected-Routes(${Colors.green(existedCount)}):`, existedCount ? existedRoutePaths : Colors.grey('empty'));
    //
    !isRestart && Printer.log(`Mock Server address:`);
    Printer.log(`${Colors.gray('-')} ${Colors.cyan(addr1)}`);
    if (supportLocalHost(host)) {
      const addr2 = `${protocol}://${getMyIp()}:${port}`;
      Printer.log(`${Colors.gray('-')} ${Colors.cyan(addr2)}`);
    }
    if (useHttps && !isRestart) {
      Printer.log('🗝', Colors.gray(`You can download CA file for https dev, from url -> https://${getMyIp()}:${port}/.cert/ca.crt`));
    }
    !wsController && console.log();
  });

  // enhance server: add server.destory() method
  server = enhanceServer(server);

  // start
  server.listen(port, host); // or 443(https) 80(http)

  /**
   * 7.websocket server
   */
  let wsController: WsCtrl | null = null;
  if (useWS) {
    const { stomp } = (socketConfig as MhkRCWsConfig) || {};
    let resolveFunc: SocketResolveFunc | null = null;
    if (existsSync(socketFilePath)) {
      resolveFunc = await loadLogicFile<SocketResolveFunc>(socketFilePath, { noLogPrint: true });
      !isRestart && Printer.log(Colors.success('Load socket logic file success!'), Colors.gray(unixifyPath(relPathToCWD(socketFilePath))));
    }
    // create
    wsController = new WsCtrl({
      stomp,
      server,
      host,
      port,
      secure: useHttps,
      resolve: resolveFunc,
    });
    // start
    wsController.start(null, isRestart); // 不加 await
  }

  /**
   * return handle obj with "destory" & "close" method props
   */
  return {
    /**
     * destory server
     * - use during error caught
     */
    destory: async () => {
      // 1.destory websocket server
      if (wsController) {
        //
        Debugger.log('Detected websocket server existed, will destory it...');
        const destoryWsSvr = (wsController as WsCtrl)?.destory?.bind(wsController);
        if (typeof destoryWsSvr === 'function') {
          try {
            await destoryWsSvr();
            wsController = null; // set null
            Printer.log('Websocket server has been destoryed.');
          } catch (error) {
            Printer.error(`Destory websocket server failed!\n`, error);
          }
        }
      }
      //
      await sleep(0);
      //
      // 2.destory http/https server
      if (server) {
        Debugger.log('Detected http/https server existed, will destory it...');
        const destoryServer = (server as EnhancedServer<http.Server | https.Server>)?.destory?.bind(server);
        if (typeof destoryServer === 'function') {
          try {
            await destoryServer();
            server = null; // set null
            Printer.log(Colors.success(`Destory mock-server(${Colors.gray(addr1)}) success!`));
          } catch (error) {
            Printer.error(`Destory Server Failed!\n`, error);
          }
        }
      }
    },
    /**
     * close server
     * - use during restart
     */
    close: async () => {
      // 1.close websocket server
      if (wsController) {
        Debugger.log('Detected websocket server existed, will close it...');
        const closeWsSvr = wsController?.close?.bind(wsController);
        if (typeof closeWsSvr === 'function') {
          try {
            await closeWsSvr();
            wsController = null; // set null
            Printer.log(Colors.success('Close websocket server success!'));
          } catch (error) {
            Printer.error(`Close websocket server failed!\n`, error);
          }
        }
      }
      //
      await sleep(0);
      //
      // 2.close http/https Server
      if (server) {
        Debugger.log('Detected http/https server existed, will destory it...');
        typeof server?.closeAllConnections === 'function' && server.closeAllConnections(); // v18.2.0+
        typeof server?.closeIdleConnections === 'function' && server.closeIdleConnections(); // v18.2.0+
        const closeServerAsync = promisify(server.close).bind(server);
        try {
          await closeServerAsync();
          server = null; // set null
          Printer.log(Colors.success('Close Mock-Server success!'));
        } catch (error) {
          Printer.error(`Close Server Failed!\n`, error);
        }
      }
    },
  };
}
