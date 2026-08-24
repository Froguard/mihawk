# 本地调试 https 所需的伪证书

Mihawk 已内置开发证书。将 `.mihawkrc.json` 中的 `https` 设置为 `true` 即可直接启用 HTTPS；只有需要使用自己的证书时，才需要执行下面的生成步骤。

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

在 `.mihawkrc.json` 中配置证书路径：

```json
{
  "https": {
    "key": "./.cert/localhost.key",
    "cert": "./.cert/localhost.crt",
    "ca": "./.cert/ca.crt"
  }
}
```

`key` 和 `cert` 必填，`ca` 可选。如果 `key`、`cert` 未配置或对应路径不存在，Mihawk 会回退到内置开发证书；文件存在但读取失败时会直接抛出错误。

## 使用

1. 启动 Mihawk 后访问 `https://localhost:8888`；如果配置了其他端口，请使用对应端口

2. 访问的时候，浏览器处于安全模式，需要手动信任证书，点击信任（高级 → 继续访问）即可

> 为避免每次都手动点，可以安装 ca.crt 文件，这样不用每次都手动信任
>
> 使用内置证书时，也可以从运行中的 Mihawk 服务下载：`https://localhost:8888/.cert/ca.crt`。
>
> - Windows：双击 ca.crt 文件 → 选择“安装证书” → 选择“本地计算机” → 选择“将所有的证书放入下列存储”并选择“受信任的根证书颁发机构” → 完成安装。
> - macOS： 双击 ca.crt 文件 → 在“钥匙串访问”中，选择“系统”钥匙链 → 右键点击证书，选择“获取信息” → 在“信任”部分，选择“始终信任” → 关闭窗口并输入密码以保存更改。
