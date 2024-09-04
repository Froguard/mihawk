# 本地调试 https 所需的伪证书

## 生成

```sh
# 生成私钥
openssl genpkey -algorithm RSA -out localhost.key

# 生成自签名证书
openssl req -new -x509 -key localhost.key -sha256 -days 365 -nodes -out localhost.crt
```

## 配置

详见 `server.https` 配置项

```ts
export default {
  server: {
    https: {
      // 引入这两个文件
      key: './.cert/localhost.key',
      cert: './.cert/localhost.crt',
    },
  },
};
```

## 使用

访问的时候，浏览器处于安全模式，需要手动信任证书，点击信任（高级→继续访问）即可
