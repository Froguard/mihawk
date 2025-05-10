# Security Policy

## Supported Versions

`Mihawk` follows a clear version support policy for security updates. Below are the currently supported versions:

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

> ✅ **Supported**: Receiving critical security patches and bug fixes.  
> ❌ **Unsupported**: No longer maintained or receiving security updates.

We recommend always using the latest stable release to ensure your project remains secure.

---

## Reporting a Vulnerability

If you discover a security vulnerability in Mihawk, we ask that you responsibly disclose it to us before making it public. You can report vulnerabilities through the following channels:

- 🛡️ [GitHub Security Advisory](https://github.com/Froguard/mihawk/security/advisories) (preferred)
- 📧 Email: [security@mihawk.dev](mailto:figure_wf@163.com)

Please do **not** file public GitHub issues for security vulnerabilities.

---

## Security Updates Policy

- 🔐 All active supported versions receive **critical security updates for at least 6 months** after release.
- 🛠️ Patch releases are published as soon as a verified vulnerability is fixed.
- 📉 End-of-life (EOL) versions will no longer receive updates or fixes. Please upgrade to a supported version.

We follow semantic versioning and provide changelogs detailing all security-related changes.

---

## Dependency Security Monitoring

We use automated tools to monitor the security of third-party dependencies used in Mihawk:

- 🤖 **Dependabot** is enabled to automatically detect and update vulnerable packages.
- 📊 All dependency-related security advisories are tracked in the [GitHub Security Advisories database](https://github.com/Froguard/mihawk/security/advisories).

You can also run local checks using tools like:

- [`npm audit`](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [`snyk test`](https://support.snyk.io/hc/en-us/articles/360004002698-Snyk-CLI-commands)
