# 安全策略（Security Policy）

## 支持的版本

`Mihawk` 对版本的安全更新有明确的支持策略。以下是当前支持的版本列表：

| 版本号 | 是否支持 |
| ------ | -------- |
| 1.0.x  | ✅ 是    |
| < 1.0  | ❌ 否    |

> ✅ **支持**：将继续接收关键安全补丁和错误修复。  
> ❌ **不支持**：不再维护或提供安全更新。

我们建议始终使用最新的稳定版本，以确保项目安全性。

---

## 报告安全漏洞

如果您发现了 Mihawk 的安全漏洞，请在公开之前通过以下方式向我们负责任地披露：

- 🛡️ [GitHub Security Advisory](https://github.com/Froguard/mihawk/security/advisories)（推荐）
- 📧 邮箱：[security@mihawk.dev](mailto:figure_wf@163.com)

请**不要**在 GitHub 上提交公开 issue 来报告安全漏洞。

---

## 安全更新策略

- 🔐 所有受支持版本将在发布后至少 **6个月内** 接收关键安全更新。
- 🛠️ 一旦验证漏洞属实并修复，将立即发布补丁版本。
- 📉 已停止维护（EOL）的版本将不再接收任何更新或修复。请升级到受支持的版本。

我们遵循语义化版本规范，并在 changelog 中详细记录所有与安全相关的更改。

---

## 第三方依赖安全监控

我们使用自动化工具来监控 Mihawk 所使用的第三方依赖项的安全性：

- 🤖 已启用 **Dependabot** 自动检测并更新存在漏洞的包。
- 📊 所有与依赖相关的安全通告可在 [GitHub Security Advisories 数据库](https://github.com/Froguard/mihawk/security/advisories) 中查看。

你也可以使用以下工具进行本地检查：

- [`npm audit`](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [`snyk test`](https://support.snyk.io/hc/en-us/articles/360004002698-Snyk-CLI-commands)
