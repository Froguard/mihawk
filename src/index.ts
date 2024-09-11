'use strict';
import path from 'path';
import http from 'http';
import https from 'https';
import Koa from 'koa';
import Colors from 'color-cc';
import mdwBodyParser from 'koa-bodyparser';
import mdwSSL from 'koa-sslify';
import { existsSync, ensureDirSync, readFileSync } from 'fs-extra';
import dedupe from 'free-dedupe';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './composites/rc';
import { enableRequireTsFile, loadJS, loadTS, loadJson } from './composites/loader';
import { relPathToCWD, getRootAbsPath, unixifyPath, absifyPath } from './utils/path';
import mdwFavicon from './middlewares/favicon';
import mdwCommon from './middlewares/common';
import mdwError from './middlewares/error';
import mdwCors from './middlewares/cors';
import mdwHdCache from './middlewares/cache';
import mdw404 from './middlewares/404';
import mdwRoutes from './middlewares/routes';
import mdwMock from './middlewares/mock';
import { isPortInUse, getMyIp } from './utils/net';
import { EnhancedServer, enhanceServer } from './utils/server';
import { isObjStrict } from './utils/is';
import { scanExistedRoutes } from './composites/scanner';
import type { KoaMiddleware, Loosify, MihawkRC } from './com-types';

// npm pkg absolute root path, eg: xxx_project_path/node_modules/mihawk
const PKG_ROOT_PATH = getRootAbsPath();

/**
 * mihawk
 * - start a mock server
 * @param {Loosify<MihawkRC>} config
 * @returns {Promise<any>}
 */
export default async function mihawk(config: Loosify<MihawkRC>, isRestart: boolean = false) {
  delete config._;
  delete config['--'];
  delete config.$schema;
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
      Printer.log(Colors.gray(`Cannot find tsconfig.json file in "${relPathToCWD(tsconfigPath)}", will use default build-in tsconfig.json`));
    }
    enableRequireTsFile(tsconfig || {});
    Printer.log(Colors.success('Enable typescript mode success!'), Colors.gray('You can write logic in routes.ts, middleware.ts, data/**/*.ts'));
  }

  /**
   * 3.load routes file
   */
  let routes: Record<string, string> = {};
  if (existsSync(routesFilePath)) {
    routes = (await loadRoutesFile(routesFilePath)) as Record<string, string>;
    Printer.log(Colors.success('Load routes file!'), Colors.gray(relPathToCWD(routesFilePath)));
  }

  /**
   * 4.load diy middleware if exists
   */
  let diyMiddleware: KoaMiddleware | null = null;
  if (useLogicFile && existsSync(middlewareFilePath)) {
    diyMiddleware = await loadLogicFile<KoaMiddleware>(middlewareFilePath);
    Printer.log(Colors.success('Load diy middleware file success!'), Colors.gray(relPathToCWD(middlewareFilePath)));
  }

  /**
   * 5. create koa app (http-server instance)
   */
  const app = new Koa();

  // middleware: https base ssl
  useHttps && app.use(mdwSSL({ hostname: host, port }));

  // middleware: favicon
  app.use(mdwFavicon(path.resolve(PKG_ROOT_PATH, './assets/favicon.ico')));

  // middleware: common middleware
  app.use(mdwCommon(options));

  app.use(mdwError());

  // middleware: cors
  cors && app.use(mdwCors());

  // middleware: cache middleware
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
      Printer.log(Colors.gray(`Custom https cert files ware not found, use default build-in https cert files`));
    } else {
      // load custom https cert files
      httpsOptions.key = readFileSync(keyFilePath);
      httpsOptions.cert = readFileSync(certFilePath);
      Printer.log(Colors.success('Load https cert files success!'), Colors.gray(`${key} ${cert}`));
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
    Printer.log(Colors.green('Start mock-server success!'));
    //
    Printer.log('Mock Data directory: ', Colors.gray(unixifyPath(mockDir)));
    const existedRoutes = scanExistedRoutes(mockDataDirPath, dataFileExt) || [];
    Debugger.log('Existed routes by scann:', existedRoutes);
    let existedRoutePaths = existedRoutes.map(({ method, path }) => `${method} ${path}`);
    existedRoutePaths.push(...Object.keys(routes));
    existedRoutePaths = dedupe(existedRoutePaths);
    const existedCount = existedRoutePaths.length;
    Printer.log(`Detected-Routes(${Colors.green(existedCount)}):`, existedCount ? existedRoutePaths : Colors.grey('empty'));
    //
    const addr2 = `${protocol}://${getMyIp()}:${port}`;
    Printer.log(`🚀 Mock Server address:`);
    Printer.log(`- ${Colors.cyan(addr1)}`);
    Printer.log(`- ${Colors.cyan(addr2)}`);
    console.log();
  });

  // enhance server: add server.destory() method
  server = enhanceServer(server);

  // start
  server.listen(port, host); // or 443(https) 80(http)

  /**
   * return handle obj with a "destory" method prop
   */
  const destoryServer = (server as EnhancedServer<http.Server | https.Server>).destory;
  return {
    destory: async () => {
      if (typeof destoryServer === 'function') {
        await destoryServer(() => Printer.log(Colors.success(`Destory mock-server(${Colors.gray(addr1)}) success!`)));
      }
    },
    close: async () => {
      server.closeAllConnections();
      server.closeIdleConnections();
      await new Promise((res, rej) => {
        server.close(err => (err ? rej(err) : res(null)));
      }).catch(err => Printer.error(`Close Server Failed!\n`, err));
      console.log(Colors.success('Close Mock-Server success!'));
    },
  };
}
