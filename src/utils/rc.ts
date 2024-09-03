/**
 * .mihawkrc.ts|js|json 配置文件相关操作逻辑
 */
import path from 'path';
import Colors from 'color-cc';
import { cosmiconfig } from 'cosmiconfig';
import { existsSync, writeFileSync } from 'fs-extra';
import { CWD, LOG_FLAG } from '../consts';

interface InitOptions<T = any> {
  fileType?: 'json' | 'js' | 'ts';
  initConfig?: T;
  tsInfo?: {
    typeName: string;
    typeImportId: string;
  };
  overwrite?: boolean; // 是否覆盖
}
/**
 * 初始化 .xxxrc.json|js|ts 配置文件
 * @param {string} name 配置文件名（包含 . 前缀，以及 rc 后缀，如 .abcrc；不强制，只是推荐）
 * @param {InitOptions}
 * @param {"json"|"js"|"ts"} options.fileType
 * @param {any} options.initConfig
 * @returns {Promise<void>}
 */
export async function initRCfile<T = any>(name: string, options: InitOptions<T> = { fileType: 'json' }) {
  const { fileType = 'json', overwrite = false, initConfig = {}, tsInfo = null } = options;
  const rcType = fileType || 'json';
  const rcName = `${name}.${rcType}`;
  console.log(LOG_FLAG, `init ${rcName} file..`);
  // detect if existed or not
  const rcFilePath = path.join(CWD, `./${rcName}`);
  if (existsSync(rcFilePath)) {
    if (overwrite) {
      console.log(LOG_FLAG, `Force Update file ${rcName}..`);
    } else {
      console.log(LOG_FLAG, `${rcName} file already exists. Will skip it..`);
      return;
    }
  }
  // init content
  let initContent = JSON.stringify(initConfig || {}, null, 2);
  switch (rcType) {
    case 'ts': {
      const { typeName, typeImportId } = tsInfo || {};
      const hasTypeInfo = typeName && typeImportId;
      const importTypeCode = hasTypeInfo ? `import type { ${typeName} } from '${typeImportId}';` : '';
      initContent = [
        '"use strict";',
        '/**',
        ` * ${name}.ts`,
        ' */',
        importTypeCode,
        '',
        `const config: ${hasTypeInfo ? typeName : 'any'} = ${initContent};`, //
        'export default config;',
        '',
      ].join('\n');
      break;
    }
    case 'js': {
      initContent = [
        '"use strict";',
        '/**',
        ` * ${name}.js`,
        ' */',
        '',
        `module.exports = ${initContent};`, //
        '',
      ].join('\n');
      break;
    }
    case 'json':
    default:
      // initContent = JSON.stringify(initConfig, null, 2);
      break;
  }
  // write file
  writeFileSync(rcFilePath, initContent, { encoding: 'utf8' });
}

interface GetRcOptions<T = any> {
  initConfig?: T;
}

/**
 * 加载根目录配置文件
 * @param {string} name 配置文件名（包含 . 前缀，以及 rc 后缀，如 .abcrc；不强制，只是推荐）
 * @param {GetRcOptions} options
 * @param {any} options.initConfig 如果不存在时，进行初始化，所需要的初始数据
 * @returns {Promise<FrogaguRcConfig>}
 */
export async function getRcData<T = any>(name: string, options?: GetRcOptions<Partial<T>>): Promise<Partial<T>> {
  const { initConfig = {} } = options || {};
  const defConfig = Object.assign({}, initConfig);
  const rcNames = [`${name}.json`, `${name}.js`, `${name}.ts`];
  try {
    if (rcNames.some(fileName => existsSync(path.join(CWD, fileName)))) {
      // 使用 cosmiconfig 进行 rc 文件的加载
      const explorer = cosmiconfig(name, {
        stopDir: CWD, // 搜索停止的目录
        searchPlaces: rcNames, // 搜索文件顺序
        packageProp: name.replace(/^\.+/g, ''), // package.json 中的属性名
      });
      const res = await explorer.search(CWD);
      const { config, filepath } = res || {};
      console.log(LOG_FLAG, `load root-config file: ${Colors.gray(path.basename(filepath))}`);
      return (config as Partial<T>) || defConfig;
    } else {
      // 未检测到rc文件时，进行自动创建
      console.log(LOG_FLAG, Colors.warn(`Can't found rc-file(.${name}.js|json|ts). Will auto create & init it..`)); // prettier-ignore
      await initRCfile(name, { fileType: 'json', initConfig: defConfig, overwrite: false });
      return defConfig;
    }
  } catch (error) {
    //
    console.error(LOG_FLAG, Colors.error('load config file error..'), error);
    return defConfig;
  }
}
