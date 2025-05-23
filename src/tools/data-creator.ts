'use strict';
import { dateFormat } from '../utils/date';
import { isNumStrict } from '../utils/is';
import { randPick } from '../utils/list';

/**
 * 获取一个随机日期
 * @returns {Date}
 */
export function createRandDate() {
  return new Date(+new Date() + Math.floor(Math.random() * 1000000000));
}

/**
 * 获取一个随机日期字符串
 * @param {string} fmt = 'yyyy-MM-dd hh:mm:ss'
 * @returns {string}
 */
export function createRandDateStr(fmt?: string) {
  return dateFormat(createRandDate(), fmt || 'yyyy-MM-dd hh:mm:ss');
}

/**
 * 获取随机 ID 字符串
 * @param {number} len 字符长度
 * @returns {string} id
 */
export function createRandId(len: number = 6) {
  return Math.random().toString(36).substring(2, 2 + len); // prettier-ignore
}

/**
 * 生成一个 UUID (v4)
 * @returns {string}
 * @description
 * - https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#answer-2117523
 */
export function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成随机颜色
 * @returns {string} #xxx | #xxxxxx
 * @example
 * const color1 = `#${createRandColor()}`; // #xxxxxx
 * const color2 = `#${createRandColor(true)}`; // #xxx
 */
export function createRandColor(short?: boolean) {
  let SEED = 0xffffff;
  let LEN = 6;
  if (short) {
    SEED = 0xfff;
    LEN = 3;
  }
  const hexStr = Math.ceil(Math.random() * SEED).toString(16);
  return `${'f'.repeat(LEN - hexStr.length)}${hexStr}`; // 确保产生的内容是 6 位长度
}

/**
 * 生成随机图地址
 * - base on picsum
 * @param {object} options
 * @returns {string} img src addr
 */
export function createRandImage(options?: { width?: number; height?: number; query?: Record<string, any> }) {
  const { width, height, query = {} } = options || {};
  const qs = Object.entries(query)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `https://picsum.photos/${width || 100}/${height || 100}?${qs}`;
}

/** 默认随机范围字符集(纯字母) */
export const RAW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'; //[A-Za-z]

/** 默认随机范围字符集(字母+下划线+数字) */
export const RAW_CHARS = `_0123456789${RAW_LETTERS}`; //[_0-9A-Za-z]

/**
 * 获取随机内容的字符串，范围限定在 charsLimit 中
 * - 如无定制需求，推荐优先使用 createRandStr 函数
 * @param {number} len 长度
 * @param {string} charsLimit 范围，即由字符组成的字符串，如 'abc'
 * @returns
 */
export function createRandStrByLimit(len: number, charsLimit: string) {
  len = isNumStrict(len) && len > 0 ? len : 1;
  charsLimit = typeof charsLimit === 'string' && charsLimit?.length ? charsLimit : RAW_CHARS;
  const res: string[] = [];
  let i = 0, n = 0; // prettier-ignore
  for (i = 0; i < len; ++i) {
    n = Math.floor(Math.random() * charsLimit.length);
    res.push(charsLimit.charAt(n));
  }
  return res.join('');
}

/**
 * 获取随机内容的字符串
 * @overload
 * @param {number} len
 * @returns {string} 指定长度的字符串
 * @example
 * const str = createRandStr(5); // 返回一个长度为 5 的字符串
 */
export function createRandStr(len: number): string;
/**
 * 获取随机内容的字符串
 * @overload
 * @param {number} len
 * @param {boolean} onlyLetters 只需要字母
 * @returns {string} 指定长度的字符串
 * @example
 * const str = createRandStr(5, true); // 返回一个长度为 5 的字符串（仅含字母）
 */
export function createRandStr(len: number, onlyLetters: boolean): string;
/**
 * 获取随机内容的字符串
 * @overload
 * @param {number} minLen 最小长度
 * @param {number} maxLen 最大长度
 * @returns {string} 符合指定长度范围的字符串
 * @example
 * const str = createRandStr(3, 8); // 返回一个长度在 3-8 之间的字符串，长度随机
 */
export function createRandStr(minLen: number, maxLen: number): string;
/**
 * 获取随机内容的字符串
 * @overload
 * @param {number} minLen 最小长度
 * @param {number} maxLen 最大长度
 * @param {boolean} onlyLetters 只需要字母
 * @example
 * const str = createRandStr(3, 8, true); // 返回一个长度在 3-8 之间的字符串（仅含字母），长度随机
 */
export function createRandStr(minLen: number, maxLen: number, onlyLetters: boolean): string;
/**
 * @implements
 * 获取一个随机字符串
 * - createRandStr(len)
 * - createRandStr(len, true)
 * - createRandStr(minLen, maxLen)
 * - createRandStr(minLen, maxLen, true)
 * @param {number} p1
 * @param {number} p2
 * @returns {string}
 */
export function createRandStr(p1: number, p2?: number | boolean, p3?: boolean) {
  if (!isNumStrict(p1) || p1 <= 0) {
    return '';
  }
  let len = p1;
  let onlyLetters = false;
  if (typeof p2 === 'boolean') {
    onlyLetters = p2;
  } else if (isNumStrict(p2)) {
    if (p2 > 0 && p2 > p1) {
      len = Math.floor(Math.random() * (p2 - p1 + 1)) + p1;
    }
    onlyLetters = !!p3;
  } else {
    len = p1;
    onlyLetters = false;
  }
  return createRandStrByLimit(len, onlyLetters ? RAW_LETTERS : RAW_CHARS);
}

/**
 * 获取一个随机字符
 * @returns {char}
 */
export function createRandChar(onlyLetters?: boolean) {
  return createRandStrByLimit(1, onlyLetters ? RAW_LETTERS : RAW_CHARS);
}

/**
 * 生成随机 email 地址
 * - 粗略生成，如需更佳效果，请直接使用 mockjs
 * @returns {string}
 */
export function createRandEmail() {
  const DOMAINS = ['gmail', 'yahoo', 'hotmail', 'qq', '163', '126', 'sina', 'outlook', 'live', 'icloud', 'apple'];
  return `${createRandChar(true)}${createRandStr(4, 14)}@${randPick(DOMAINS)}.com`;
}

/**
 * 生成随机手机号
 * - 粗略生成，如需更佳效果，请直接使用 mockjs
 * @returns {string}
 */
export function createRandPhone() {
  // 中国大陆手机号有效号段前缀
  const validPrefixes = [
    130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 145, 147, 149, 150, 151, 152, 153, 155, 156, 157, 158, 159, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177,
    178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 191, 192, 193, 195, 196, 197, 198, 199,
  ];
  // 随机选择号段前缀
  const prefix = randPick(validPrefixes);
  // 生成后8位随机数字
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += createRandNum(0, 9);
  }
  //
  return `${prefix}${suffix}`;
}

/**
 * 生成随机 boolean 值
 * @returns {boolean}
 */
export function creataRandBool() {
  return Math.random() > 0.5;
}

/**
 * 创建随机数
 * - 随机数满足范围限定
 * - 随机数是一个整数，而非小数
 * @param {number} min 生成的数限定范围，最小值
 * @param {number} max 生成的数限定范围，最大值
 * @returns {number} 生成的随机数
 */
export function createRandNum(min: number = 0, max: number = 9999) {
  // 参数合法性校验
  if (typeof min !== 'number' || isNaN(min) || typeof max !== 'number' || isNaN(max)) {
    throw new Error('Arguments must be valid numbers');
  }

  // 处理 min > max 的边界情况（自动交换）
  const [lowerBound, upperBound] = min <= max ? [min, max] : [max, min];

  // 计算有效整数范围
  const minInt = Math.ceil(lowerBound);
  const maxInt = Math.floor(upperBound);

  // 检查是否存在有效整数区间
  if (minInt > maxInt) {
    throw new Error('No valid integer exists between min and max');
  }

  // 生成区间内随机整数（闭区间 [minInt, maxInt]）
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}

/**
 * 创建随机 IO
 * @param {boolean} isIPV6
 * @returns {string}
 * @example
 * console.log(createRandIp()); // 生成IPv4，例如：192.168.1.1
 * console.log(createRandIp(true)); // 生成IPv6，例如：2001:0db8:85a3:0000:0000:8a2e:0370:7334
 */
export function createRandIp(isIPV6?: boolean) {
  if (isIPV6) {
    // 生成随机的IPv6地址
    return Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0'),
    ).join(':');
  } else {
    // 默认生成随机的IPv4地址
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
  }
}

/**
 * 生成随机的 URL
 * @returns {string}
 */
export function createRandUrl(options?: { includeHash?: boolean; includeQuery?: boolean; specialProtocol?: boolean }) {
  const { includeHash, includeQuery, specialProtocol } = options || {};
  // protocol
  const PROTOCOLS = ['http', 'https'];
  if (specialProtocol) {
    PROTOCOLS.push(...['file', 'ws', 'wss', 'ftp', 'rtsp', 'rtmp']);
  }
  const protocol = randPick(PROTOCOLS);
  // domain
  const DOMAINS = ['com', 'net', 'org', 'io', 'tv', 'tw', 'jp', 'cn', 'com.cn', 'net.cn', 'gov.cn', 'org.cn'];
  const domain = protocol === 'file' ? `/localfile/${createRandStr(3, 10, true)}` : `${createRandStr(3, 10, true)}.${createRandStr(3, 10, true)}.${randPick(DOMAINS)}`;
  // pathname  xx/xx/xx
  const randPathSize = Math.floor(Math.random() * 3) + 1;
  const paths: string[] = [];
  for (let i = 0; i < randPathSize; i++) {
    paths.push(createRandStr(1, 10, true));
  }
  const pathname = paths.join('/');
  // query ?xx=xx
  let queryString = '';
  if (includeQuery) {
    const randQuerySize = Math.floor(Math.random() * 3) + 1;
    const querys: string[] = [];
    for (let i = 0; i < randQuerySize; i++) {
      querys.push(`${createRandStr(1, 5, true)}=${createRandNum(1, 100)}`);
    }
    queryString = `?${querys.join('&')}`;
  }
  // hash #xx
  let hash = '';
  if (includeHash) {
    hash = `#${createRandStr(1, 5, true)}`;
  }
  //
  return `${protocol}://${domain}/${pathname}${queryString}${hash}`;
}

/**
 * 生成随机姓名（英文）
 * - 只是简单的 mock 姓和名都不全面
 * @param {string} part
 * @returns {string}
 */
export function createRandName(part: 'full' | 'first' | 'last' = 'full') {
  // firse names range:
  const FIRST_NAMES: string[] = [
    'Herry',
    'Tom',
    'Jerry',
    'Sky',
    'Emma',
    'Liam',
    'Olivia',
    'Noah',
    'Ava',
    'Isabella',
    'Sophia',
    'Jackson',
    'Mason',
    'Lucas',
    'Ethan',
    'James',
    'Alexander',
    'Michael',
    'Benjamin',
    'Emily',
    'Abigail',
    'Charlotte',
    'Harper',
    'Megan',
    'Jessica',
    'Robert',
    'William',
    'David',
    'Joseph',
    'Daniel',
    'Matthew',
    'Anthony',
    'Mark',
  ];
  // last names range:
  const LAST_NAMES: string[] = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
  ];
  //
  const firstName = randPick(FIRST_NAMES);
  const lastName = randPick(LAST_NAMES);
  switch (part) {
    case 'first':
      return firstName;
    case 'last':
      return lastName;
    default:
      return `${firstName} ${lastName}`;
  }
}

/**
 * 生成随机姓名（中文）
 * - 只是简单的 mock, 姓氏并非完整百家姓
 * @returns {string}
 */
export function createRandCname() {
  // 常见姓氏
  const SUR_NAMES = [
    '赵',
    '钱',
    '孙',
    '李',
    '周',
    '吴',
    '郑',
    '王',
    '冯',
    '陈',
    '褚',
    '卫',
    '蒋',
    '沈',
    '韩',
    '杨',
    '朱',
    '秦',
    '尤',
    '许',
    '阎',
    '颜',
    '马',
    '张',
    '梁',
    '段',
    '唐',
    '徐',
    '庄',
    '吕',
    '冯',
    '俞',
    '沈',
    '苗',
    '林',
    '叶',
    '葛',
    '程',
    '陈',
    '丁',
    '刘',
    '汤',
    '谢',
    '胡',
    '何',
    '诸葛',
    '纳兰',
    '欧阳',
    '上官',
    '南宫',
    '东方',
    '太史',
    '端木',
    '皇甫',
    '呼延',
    '独孤',
    '司马',
    '申屠',
    '慕容',
    '宇文',
    '司徒',
    '公孙',
  ];
  // 中间名字
  const MID_NAMES = [
    '明',
    '刚',
    '伟',
    '金',
    '木',
    '水',
    '火',
    '土',
    '石',
    '永',
    '国',
    '宁',
    '飞',
    '东',
    '西',
    '南',
    '北',
    '子',
    '梓',
    '雨',
    '露',
    '语',
    '宇',
    '予',
    '长',
    '大',
    '小',
    '细',
    '硕',
    '建',
    '美',
    '帅',
    '春',
    '夏',
    '秋',
    '冬',
    '梅',
  ];
  // 常见名字
  const GIVEN_NAMES = [
    '月',
    '磊',
    '犇',
    '玥',
    '蕊',
    '瑞',
    '昊',
    '浩',
    '明',
    '博',
    '伟',
    '芳',
    '娜',
    '敏',
    '静',
    '丽',
    '强',
    '磊',
    '洋',
    '勇',
    '娟',
    '艳',
    '杰',
    '浩',
    '明',
    '波',
    '平',
    '轩',
    '涵',
    '欣',
    '俊',
    '宇',
    '泽',
    '葵',
    '飞',
    '佑',
    '倩',
    '茹',
    '思',
    '怿',
    '乐',
    '悦',
    '峰',
    '锋',
    '东',
    '冬',
    '卓',
    '君',
    '军',
    '敏',
    '魁',
  ];
  // 常见组合
  const COMBS = [
    '宇宁',
    '建国',
    '白樱',
    '丽娟',
    '丽君',
    '宝瑞',
    '宝强',
    '宝国',
    '宝亮',
    '卫国',
    '卫红',
    '子轩',
    '子涵',
    '子强',
    '子豪',
    '梓轩',
    '梓涵',
    '梓豪',
    '紫涵',
    '雨欣',
    '雨夕',
    '明远',
    '明轩',
    '可馨',
    '可心',
    '可灵',
    '诗涵',
    '雨涵',
    '舟虚',
    '星驰',
    '遇春',
    '子龙',
    '豪杰',
    '香玉',
    '龙凤',
    '人风',
    '火风',
    '不悔',
    '弃疾',
    '病已',
    '仲达',
    '无忌',
    '芷若',
    '德华',
    '文采',
    '雪凝',
    '宝华',
    '晓龙',
    '振兴',
    '思聪',
  ];
  //
  const surName = randPick(SUR_NAMES);
  if (Math.random() >= 0.4) {
    // 60%
    const midName = Math.random() > 0.5 ? randPick(MID_NAMES) : '';
    const givenName = randPick(GIVEN_NAMES);
    return `${surName}${midName}${givenName}`;
  } else {
    // 40%
    const comb = randPick(COMBS);
    return `${surName}${comb}`;
  }
}
