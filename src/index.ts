'use strict';
import path from 'path';
import http from 'http';
import https from 'https';
import Koa from 'koa';
import Colors from 'color-cc';
import mdwBodyParser from 'koa-bodyparser';
import mdwSSL from 'koa-sslify';
import { existsSync, ensureDirSync, readFileSync } from 'fs-extra';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './composites/rc';
import { enableRequireTsFile, loadJS, loadTS, loadJson } from './composites/loader';
import { relPathToCWD, getRootAbsPath, unixifyPath, absifyPath } from './utils/path';
import mdwCommon from './middlewares/common';
import mdwCors from './middlewares/cors';
import mdwFavicon from './middlewares/favicon';
import mdwHdCache from './middlewares/cache';
import mdwRoutes from './middlewares/routes';
import mdwMock from './middlewares/mock';
import { isPortInUse, getMyIp } from './utils/net';
import { enhanceServer } from './utils/server';
import type { HttpsConfig, KoaMiddleware, Loosify, MihawkRC } from './com-types';

const PKG_ROOT_PATH = getRootAbsPath();

/**
 * mihawk
 * @param {Loosify<MihawkRC>} config
 */
export default async function mihawk(config?: Loosify<MihawkRC>) {
  delete config._;
  delete config['--'];
  Printer.log('config:', config);
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
   * 1.ensure mock data dir exists
   */
  ensureDirSync(mockDataDirPath);

  /**
   * 2.detect if support typescript mode
   */
  if (isTypesctiptMode) {
    // 启用 ts 模式
    const tsconfig = require(tsconfigPath) || {};
    enableRequireTsFile(tsconfig);
  }

  /**
   * 3.load routes file
   */
  let routes: Record<string, string> = {};
  if (existsSync(routesFilePath)) {
    routes = (await loadRoutesFile(routesFilePath)) as Record<string, string>;
    Printer.log(`load routes file: ${relPathToCWD(routesFilePath)}`);
  }

  /**
   * 4.load diy middleware if exists
   */
  let diyMiddleware: KoaMiddleware | null = null;
  if (useLogicFile && existsSync(middlewareFilePath)) {
    Printer.log(`load diy middleware file: ${relPathToCWD(middlewareFilePath)}`);
    diyMiddleware = (await loadLogicFile(middlewareFilePath)) as KoaMiddleware;
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

  // middleware: cors
  cors && app.use(mdwCors(options));

  // middleware: cache middleware
  app.use(mdwHdCache(options));

  // middleware: body parser
  app.use(mdwBodyParser());

  // middleware: special routes mapping
  app.use(mdwRoutes(routes, options));

  // ★ middleware: diy middleware ★
  typeof diyMiddleware === 'function' && app.use(diyMiddleware);

  // middleware: mock middleware
  app.use(mdwMock(options));

  //

  /**
   * 6.server configuration
   */
  let server: http.Server | https.Server | null = null;
  // create http|https server
  if (useHttps) {
    const httpsOptions: Record<'key' | 'cert', any> | null = { key: null, cert: null };
    let key = '', cert = ''; // prettier-ignore
    if (typeof httpsConfig === 'object') {
      key = httpsConfig.key;
      cert = httpsConfig.cert;
    }
    const keyFilePath = absifyPath(key);
    const certFilePath = absifyPath(cert);
    if (!key || !cert || !existsSync(keyFilePath) || !existsSync(certFilePath)) {
      // use built-in https cert files
      httpsOptions.key = readFileSync(path.resolve(PKG_ROOT_PATH, './assets/.cert/localhost.key'));
      httpsOptions.cert = readFileSync(path.resolve(PKG_ROOT_PATH, './assets/.cert/localhost.cert'));
      Printer.log(Colors.gray(`Custom https cert files ware found, use default build-in https cert files`));
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
        Printer.error(Colors.yellow(`MockServer failed! Port ${port} requires elevated privileges`));
        process.exit(1);
        break;
      case 'EADDRINUSE':
        Printer.error(Colors.yellow(`MockServer failed! Port ${port} is already in use`));
        process.exit(1);
        break;
      default:
        Printer.error(error);
        throw error;
    }
  });

  // server-event: listening
  server.on('listening', function () {
    Printer.log(Colors.green('Start mock-server success!'));
    Printer.log(Colors.gray(`Mock Data directory: ${unixifyPath(mockDir)}`));
    const protocol = useHttps ? 'https' : 'http';
    const addr1 = `${protocol}://${host}:${port}`;
    const addr2 = `${protocol}://${getMyIp()}:${port}`;
    Printer.log(`- ${Colors.cyan(addr1)}`);
    Printer.log(`- ${Colors.cyan(addr2)}`);
    console.log();
  });

  // enhance server: add server.destory() method
  server = enhanceServer(server);

  // start
  server.listen(port, host); // or 443(https) 80(http)
}
