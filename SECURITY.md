# Security Policy

## Supported Versions

We release security patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security
vulnerability, please report it responsibly.

### How to Report

**Email**: security@chrome-extensions.example.com

**PGP Key**: Available at [keys.openpgp.org](https://keys.openpgp.org/search?q=security%40chrome-extensions.example.com)

### What to Include

Please include the following information in your report:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and attack vectors
3. **Reproduction**: Steps to reproduce (if possible)
4. **Environment**: Chrome version, OS, extension version
5. **Proof of Concept**: Minimal PoC (if applicable)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Every 5 business days until resolution
- **Resolution Timeline**: Typically 30-90 days depending on severity

## Disclosure Policy

- We follow [Coordinated Vulnerability Disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure)
- We request 90 days before public disclosure
- We will credit reporters (unless anonymity is requested)
- We publish advisories for confirmed vulnerabilities

## Security Best Practices for Contributors

### Dependencies

- Run `npm audit` before submitting PRs
- Keep dependencies updated
- Review `npm audit` output for high/critical issues
- Use `npm audit fix` when safe

### Code Review

- Review for XSS vulnerabilities in content scripts
- Validate all external inputs
- Use `chrome.runtime.sendMessage` with origin validation
- Sanitize data before injecting into DOM
- Avoid `eval()`, `innerHTML` with user data

### Manifest V3 Security

- Use minimal permissions
- Declare all hosts in `host_permissions`
- Use `content_security_policy` for extension pages
- Avoid `unsafe-inline` and `unsafe-eval`

### Content Scripts

- Run in isolated world
- Validate messages from web pages
- Don't trust data from `window` object
- Use `chrome.runtime.sendMessage` for privileged operations

### Storage

- Don't store sensitive data (tokens, passwords)
- Use `chrome.storage.session` for temporary data
- Encrypt sensitive data if storage is required

## Security Checklist for Releases

- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Dependencies updated to latest secure versions
- [ ] Content Security Policy configured
- [ ] Permissions minimized
- [ ] No console.log with sensitive data
- [ ] Source maps not included in production build
- [ ] Extension signed and verified

## Bug Bounty

We do not currently offer a formal bug bounty program. However, we
acknowledge security researchers in our [Hall of Fame](SECURITY_HALL_OF_FAME.md)
and provide swag for validated reports.

## Contact

For security-related questions not covered by this policy:
- Email: security@chrome-extensions.example.com
- For general questions: See [CONTRIBUTING.md](CONTRIBUTING.md)