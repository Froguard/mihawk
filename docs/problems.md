# 一些常见问题

## 关于 bin scripts

### 问题1：bin文件不能是 CRLF，而应该是 LF

bin 目录下所有文件都必须是 LF 换行，不能使用 CRLF，否则会导致如下报错

```sh
env: node\r: No such file or directory
error Command failed with exit code 127.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

解决办法：更该当前文件的换行符为 LF

```sh
sed -i '' 's/\r$//' ./bin/*
```

> 或者使用额外工具包 dos2unix，本工程并未采用

其他补充：设置全局 git 配置，设置 core.autocrlf 为 false

```sh
git config --global core.autocrlf false
```

**注意**: `.eslintrc.js` 和 `.prettierrc.js`, `tsconfig.json` 中，对于 `newLine` 都需要设置成 `lf`，以便于确保打包产物的换行符为 LF

### 问题2：执行 bin 的时候，提示权限不足 `Permission denied`

检查下对应的 bin 目录，其权限是否和其他 bin 文件一样

```sh
cd ./node_modules/bin
ls -l
```

正常应该是 `drwxr-xr-x` 即 `755` 如果不对，重新设置

```sh
chmod -R 755 ./bin
```
