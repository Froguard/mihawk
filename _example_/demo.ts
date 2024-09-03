/**
 * 临时测试代码
 * 命令行中执行 yarn dev 即可
 */
import { singleSelectInCli } from '../src/utils/cli';

async function main() {
  const result = await singleSelectInCli('请选择', [
    { title: '1', value: 1 },
    { title: '2', value: 2 },
    { title: '3', value: 3 },
  ]);
  console.log('result', result);
}

main();
