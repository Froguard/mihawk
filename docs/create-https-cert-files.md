# 内置调试 https 所需的伪证书

> **调试用，请勿用于生产环境！**

## 生成

```sh
# 生成私钥
openssl genpkey -algorithm RSA -out localhost.key

# 生成自签名证书
openssl req -new -x509 -key localhost.key -sha256 -days 365 -nodes -out localhost.crt
```

## 配置示例

可能得配置项如下

```js
export datault {
  https: {
    // 引入这两个文件
    key: './assets/.cert/localhost.key',
    cert: './assets/.cert/localhost.crt',
  },
};
```

> 目前这两个证书作为内置证书在使用，方便用户如果没有证书时，不用自己生成

## 使用

访问的时候，浏览器处于安全模式，需要手动信任证书，点击信任（高级→继续访问）即可
