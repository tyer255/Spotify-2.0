# Spotiz Security Policy

Security is a high priority for the Spotiz project. We appreciate the responsible efforts of security researchers, developers, and users in helping us maintain the security and privacy of the software.

If you discover a security vulnerability, please report it privately and responsibly so we can investigate and address the issue before public disclosure.

---

## Supported Versions

Security fixes and maintenance patches are generally provided for the latest stable release of Spotiz.

| Version | Security Support Status |
|---|---|
| Latest Stable Release | ✅ Fully Supported |
| Previous Minor Release | ⚠️ Limited Support (Critical vulnerabilities only) |
| Development / Nightly / Alpha Builds | ❌ Not Supported (Use at your own risk) |

Users are strongly encouraged to keep Spotiz updated to the latest official stable release.

---

## Reporting a Security Vulnerability

If you believe you have found a security vulnerability in Spotiz, please report it **privately**. Do not open a public issue on GitHub or discuss the vulnerability publicly until a patch is released.

### How to Report Privately

- **Preferred Channel:** GitHub Security Advisories (https://github.com/spotiz/spotiz/security/advisories) or Repository Security Inquiries

### Please Include in Your Report

To help us triage and resolve the issue quickly, please provide:

1. **Affected Software Version:** Exact Spotiz version number and build commit hash (if known);
2. **Environment Details:** Operating system and architecture (e.g., Windows 11 x64, macOS Sonoma ARM64, Ubuntu 24.04 x86_64, Android 14);
3. **Description:** A detailed explanation of the vulnerability and its potential security impact;
4. **Steps to Reproduce:** Step-by-step reproduction instructions or a minimal proof-of-concept (PoC);
5. **Supporting Assets:** Sanitized terminal output, crash logs, or screenshots (ensure no private credentials are visible);
6. **Proposed Remediation:** Suggestions on how to fix or mitigate the issue, if available.

---

## Guidelines for Responsible Disclosure

To protect users while vulnerabilities are being resolved, please adhere to the following guidelines:

- **Do Not Disclose Publicly:** Give the maintainers reasonable time to investigate, remediate, and publish an official update before disclosing details publicly;
- **Do Not Expose Private Data:** Avoid accessing, viewing, modifying, or retaining any data that does not belong to you during testing;
- **Do Not Disrupt Services:** Do not execute attacks that cause denial of service (DoS) or degrade service quality for external providers or APIs;
- **No Malicious Payloads in Public Repositories:** Do not upload functional exploit payloads or malicious binaries to public issue trackers or forums.

---

## Security Vulnerabilities vs. Normal Bugs

Please distinguish between security vulnerabilities and ordinary software defects:

### Submit Privately as Security Reports:
- Remote code execution (RCE) or arbitrary command execution;
- Sandbox escapes or unauthorized local file system access;
- Insecure handling or exposure of stored API keys, authentication tokens, or credentials;
- Insecure auto-update mechanisms or binary integrity bypasses;
- Unsafe deserialization or code injection via untrusted input (e.g., malicious feeds, manifests, or subtitles);
- Cross-Site Scripting (XSS) in UI webviews leading to privilege escalation;
- Critical data integrity or privacy breaches.

### Submit Publicly via GitHub Issues:
- Media playback errors, buffering, or codec incompatibilities;
- User interface glitches, theme issues, or visual misalignment;
- Subtitle parsing errors or character encoding bugs;
- Provider scrapers breaking due to upstream website/API changes;
- Ordinary application crashes without security implications;
- Feature requests and performance optimizations.

Public Issue Tracker: https://github.com/spotiz/spotiz/issues

---

## Release Verification & Binary Integrity

Official releases of Spotiz may provide cryptographic SHA-256 checksums to verify installer and binary integrity.

You can verify downloaded release files using standard terminal commands:

### Windows (PowerShell)
```powershell
Get-FileHash ".\\Spotiz-PWA.msi" -Algorithm SHA256
```

### Linux (Bash)
```bash
sha256sum ./Spotiz-PWA.AppImage
```

### macOS (Terminal)
```bash
shasum -a 256 ./Spotiz-PWA.dmg
```

Compare the calculated hash against the official checksum published on the release page at https://github.com/spotiz/spotiz/releases.

---

## Third-Party Addon and Provider Security Boundaries

Spotiz supports modular integrations, addons, scrapers, and external APIs.

1. **Vulnerabilities in Spotiz's Integration Engine:**  
   If an integration exposes a flaw in Spotiz's own handling—such as improper input sanitization, unsafe sandbox execution, or credential leakage—please report it to the Spotiz security team as described above.

2. **Vulnerabilities in Independent Third-Party Services:**  
   If a security flaw exists solely within an independent third-party server, website, or API that an addon connects to, report the issue directly to the maintainer or operator of that external service.

3. **Safe Testing Requirement:**  
   Do not intentionally exploit third-party servers, scrape unauthorized endpoints, or compromise external services while testing Spotiz integrations.

---

## Contact Information

- **Private Security Reports:** GitHub Security Advisories or Repository Security Portal
- **Public Bug Tracker:** https://github.com/spotiz/spotiz/issues
- **Project Website:** https://spotiz.app

We appreciate your assistance in keeping Spotiz secure for the entire community.
