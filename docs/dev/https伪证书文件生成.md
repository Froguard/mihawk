# 本地调试 https 所需的伪证书

## 生成 CA 证书【可跳过】

```sh
# 生成私钥
openssl genpkey -algorithm RSA -out ca.key

# 生成证书签名请求文件
openssl req -new -key ca.key -out ca.csr

# 生成自签名证书
openssl x509 -req -in ca.csr -signkey ca.key -out ca.crt
```

## 生成服务器证书

```sh
# 生成私钥
openssl genpkey -algorithm RSA -out localhost.key

# 生成证书签名请求文件
openssl req -new -key localhost.key -out localhost.csr

# 生成自签名证书
# openssl req -new -x509 -key localhost.key -sha256 -days 365 -nodes -out localhost.crt
# 生成自签名证书（这一步将会和前面的ca绑定）
openssl x509 -req -in localhost.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out localhost.crt -days 365
```

## 配置

详见 `vite.config.ts` 或者 `vue.config.js` 或者 `wepack.config.js` 文件中，`server.https` 配置项（根据工程不同，属性名不同），配置如下：

```ts
export default {
  server: {
    https:
      process.env.NODE_ENV === 'development'
        ? {
            // 引入这几个文件
            key: './.cert/localhost.key',
            cert: './.cert/localhost.crt',
            ca: './.cert/ca.crt', // 非必须
          }
        : undefined,
  },
};
```

## 使用

1. 正常启动本地的 devServer 之后，访问 https://localhost:8080 即可

2. 访问的时候，浏览器处于安全模式，需要手动信任证书，点击信任（高级 → 继续访问）即可

> 为避免每次都手动点，可以安装 ca.crt 文件，这样不用每次都手动信任
>
> - Windows：双击 ca.crt 文件 → 选择“安装证书” → 选择“本地计算机” → 选择“将所有的证书放入下列存储”并选择“受信任的根证书颁发机构” → 完成安装。
> - macOS： 双击 ca.crt 文件 → 在“钥匙串访问”中，选择“系统”钥匙链 → 右键点击证书，选择“获取信息” → 在“信任”部分，选择“始终信任” → 关闭窗口并输入密码以保存更改。
