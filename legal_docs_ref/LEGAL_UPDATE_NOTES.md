# Legal and Documentation Revision Log

This document tracks revisions, architectural disclosures, and policy updates across releases of [App Name]. Use this log to maintain a clear audit trail when adding new integrations, modifying data practices, or adjusting third-party disclaimers.

---

## [Release Version / Date, e.g., Version 1.0.0 — [Date]]

### Summary of Documentation Updates
Updated the legal and policy framework to support the application's data-fetching, media aggregation, and plugin architecture.

### Key Policy Disclosures
- **Client-Side Operation:** Clarified that [App Name] functions as a client-side player/interface and does not host, store, or distribute third-party media or data streams;
- **Community Integrations & Seeded Repositories:** Documented terms covering preconfigured or seeded community repositories, clarifying that community integrations remain independently developed and hosted;
- **User Responsibility:** Added explicit terms placing responsibility on end users to verify the authorization of content and streams fetched from external sources;
- **Rights-Holder Takedown Flow:** Established a formal DMCA / notice-and-takedown procedure for project-controlled repositories and preconfigured lists;
- **Privacy & Local Storage:** Disclosed all local storage practices (profiles, cache, preferences) and direct-to-server request behaviors when communicating with external APIs or streaming endpoints;
- **Client-Side Key Masking:** Disclosed that visual masking of API credentials in the UI does not provide complete protection against physical or local machine inspection;
- **Security Policy:** Published responsible disclosure channels, supported version lifecycle, and binary checksum verification methods;
- **License Terms:** Maintained full harmony with the underlying open-source software license ([License Name, e.g., GNU GPLv3 / MIT / Apache 2.0]).

---

## Template for Future Revisions

When releasing a new version that introduces new external integrations, telemetry, or architectural changes, copy the block below:

```markdown
## [Version X.Y.Z] — [Date]

### Summary
[Brief description of why the legal or documentation update is occurring, e.g., added new metadata provider, modified plugin sandbox permissions, or updated terms.]

### Changes to Documents
- **TERMS.md:** [Summary of changes]
- **PRIVACY.md:** [Summary of changes]
- **COPYRIGHT.md:** [Summary of changes]
- **SECURITY.md:** [Summary of changes]
- **THIRD_PARTY_NOTICES.md:** [Summary of newly added dependencies or API attributions]
```
