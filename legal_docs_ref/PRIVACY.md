# Spotiz Privacy Policy

**Effective Date:** September 20, 2026  
**Last Updated:** September 20, 2026

Spotiz Team ("we", "our", or "us") respects your privacy. This Privacy Policy describes how Spotiz ("the application") processes, stores, and handles information when you install and use the software.

Spotiz is designed primarily as a **local-first client application**. The vast majority of your settings, preferences, profiles, and cached data reside directly on your local device.

---

## 1. Information Handled Locally on Your Device

To provide a personalized, functional experience, Spotiz may store configuration files and local databases directly on your personal device.

Depending on the features you configure and use, locally stored information may include:

- **Local Profiles & Identity:** Profile names, user preferences, selected avatar images, or custom avatar image URLs;
- **Application Preferences:** Language preferences, theme choices, player controls, layout options, and notification settings;
- **Playback & Consumption State:** Watch/listening history, current playback progress, bookmarks, favorites, playlists, and episode/track completion status;
- **Integration & Plugin Configuration:** URLs for external manifests, provider feeds, scraper configurations, and custom addon settings;
- **API Keys & Credentials:** User-configured API credentials (such as external metadata service keys). These credentials are saved in your local application directory;
- **Local Cache:** Temporarily cached artwork, thumbnails, metadata records, or stream manifests to improve performance and reduce external network requests.

*This information remains on your local file system unless you explicitly export, sync, or transmit it.*

---

## 2. Local User Profiles

Spotiz may offer local user profile capabilities allowing multiple configurations on a single installation.

- Profile data is saved locally on your machine;
- Spotiz does not operate a centralized user registration system or require a cloud account to use core application features;
- Local profile names and settings are not publicly published by Spotiz.

---

<!-- OPTIONAL FEATURE: External Metadata Enrichment. Customize or remove if not applicable. -->
## 3. External Metadata Enrichment (e.g., MusicBrainz / JioSaavn / Deezer)

If you enable external metadata enrichment (e.g., connecting to MusicBrainz / JioSaavn / Deezer), Spotiz makes direct HTTP requests to the third-party metadata service from your device.

When metadata requests occur:

- **Data Transmitted:** Search queries, content titles, media identifiers, release years, or language preferences necessary to match and fetch metadata;
- **Network Data:** The external metadata provider receives your IP address and standard HTTP request headers;
- **API Keys:** If you provide your own API key, it is included in requests to authenticate with the provider;
- **Client-Side Key Masking:** Although Spotiz may mask API keys visually in the user interface to prevent casual observation, credentials stored on a local client application can potentially be inspected by individuals with physical or administrative access to the device.

For information on how the metadata provider handles data, please consult the respective privacy policy of MusicBrainz, JioSaavn, and Deezer.

---

## 4. Addons, Plugins, Providers, and External Network Requests

Spotiz allows you to connect to third-party providers, addons, repositories, feeds, and external APIs.

When you install, enable, browse, search, or stream from an external integration, your device communicates directly with the servers hosting that integration.

Depending on the integration and feature used, the destination server may receive:

- Search terms and filtering criteria;
- Specific media, track, or dataset identifiers;
- Stream requests, manifest requests, and subtitle download requests;
- Standard internet network data, including your public IP address, User-Agent, and connection timestamps;
- Any custom authentication headers or tokens required by that specific provider.

**Independent Operators:** Unless explicitly stated otherwise, external integrations, scrapers, and repositories are developed and operated by independent third parties. Spotiz does not control, inspect, or manage the data practices, logging, or policies of third-party servers. We encourage you to review the privacy policies of any third-party service you choose to configure.

---

<!-- OPTIONAL FEATURE: Discord Rich Presence / Activity Sharing. Customize or remove if not applicable. -->
## 5. Discord Rich Presence and Activity Integrations

Spotiz may include optional integration with Discord Rich Presence or desktop activity protocols.

When enabled:

- Spotiz communicates locally with the Discord desktop client running on your machine via local inter-process communication (IPC);
- Activity details (such as the title of the media currently playing, elapsed playback time, and application status) may be sent to Discord for display on your public profile;
- **No Credentials Transmitted:** Spotiz never asks for, reads, or transmits your Discord account password, user token, or authentication secret;
- **User Control:** You may disable Discord Rich Presence at any time in Spotiz's settings. The visibility of your presence to others is also subject to your Discord account privacy settings.

---

## 6. Media Playback & Stream Data

To deliver playback controls, resume functionality, and playlist management, Spotiz tracks playback state locally (e.g., timestamps, volume, playback rate).

When streaming media, playback requests are sent directly from your device to the designated media server or content host. Spotiz does not route media streams through a proprietary central intermediary server, and does not maintain centralized logs of your viewing or listening activity.

---

## 7. Information Spotiz Does Not Collect

Spotiz is designed with data minimization in mind. We do not intentionally collect, store, or solicit:

- Government-issued identification numbers;
- Financial account, debit, or credit card information;
- Passwords or private tokens to your personal social media accounts;
- Biometric data or sensitive personal demographic records.

---

## 8. Voluntary Support and Issue Submissions

If you choose to submit a bug report, support request, or crash diagnostic through our issue tracker or support channels:

- You may voluntarily share information such as operating system version, application version, error messages, and reproduction steps;
- **User Verification Caution:** Please review any crash logs, debug traces, or screenshots before uploading. Logs may unintentionally contain file paths, user account names, local IP addresses, or custom URLs. Please redact any sensitive details before submitting.

---

## 9. Data Sharing Disclosures

- **No Sale of Personal Data:** Spotiz does not sell, rent, monetize, or trade your personal data or usage habits to third-party advertisers or data brokers;
- **Direct Third-Party Communications:** When you use features requiring external data (e.g., fetching metadata, parsing web feeds, checking for software updates, or retrieving streams), your client connects directly to the relevant service provider. Each external service operates according to its own privacy policy.

---

## 10. Data Retention and Deletion

All application data stored locally remains on your device until:

1. You manually remove a profile, clear history, or reset settings within the application;
2. You clear the application's local cache or configuration directory via your operating system;
3. You uninstall Spotiz and delete its application data folder.

For information on data retention by external third-party services you communicate with, please refer directly to their privacy documentation.

---

## 11. Security and Device Responsibility

We employ reasonable industry practices in structuring local data storage. However, no client-side desktop or mobile application can offer absolute security against an attacker with direct physical or administrative access to the underlying operating system.

Users are responsible for:

- Keeping their operating system, firewall, and anti-malware protections updated;
- Securing access to their local user account;
- Exercise caution when importing untrusted configuration files, plugins, or custom scripts.

---

## 12. Your Privacy Choices

You have full control over your privacy settings within Spotiz:

- **Disable Activity Sharing:** Toggle Discord Rich Presence or external activity sharing off;
- **Disable Metadata Enrichment:** Disable external metadata API queries;
- **Manage Integrations:** Add, remove, or audit external addon URLs, repositories, and provider modules;
- **Clear Local History:** Purge your search history, playback logs, and cached thumbnails at any time.

---

## 13. Children's Privacy

Spotiz does not knowingly collect or solicit personal information from children under the age of 13 (or under the applicable age threshold defined by regional laws such as the GDPR). If you believe that personal data of a minor has been improperly collected, please contact us so appropriate measures can be taken.

---

## 14. Changes to This Privacy Policy

This Privacy Policy may be updated periodically to reflect new features, architectural improvements, or changes in legal regulations.

The "Effective Date" and "Last Updated" headers at the top of this document will indicate the version in effect. Continued use of Spotiz following the publication of an updated policy indicates your acceptance of the revised practices.

---

## 15. Contact Information

If you have questions, comments, or concerns regarding this Privacy Policy or our data practices, please reach out to us:

- **Repository:** https://github.com/spotiz/spotiz
- **Support / Inquiries:** In-App Privacy Portal & Repository Issues
- **Website:** https://spotiz.app

---

## 16. Summary

- **Local First:** Your settings, profiles, and history stay on your local device.
- **Direct Requests:** Network requests for metadata, feeds, or streams connect directly from your device to third-party endpoints.
- **No Data Sales:** We do not sell or monetize your personal data.
- **Full Control:** You can disable rich presence, remove external providers, and wipe local cache at any time through the application settings.

---

**Spotiz**  
*High-Fidelity Progressive Web App Music Streaming & Discovery*  
Maintained by Spotiz Team
