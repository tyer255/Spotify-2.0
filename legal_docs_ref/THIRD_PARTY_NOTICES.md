# Third-Party Software Notices and Attribution

Spotiz may include, link against, bundle, communicate with, or depend on third-party software, open-source libraries, runtime frameworks, APIs, addons, plugins, provider modules, scrapers, metadata services, and other external components.

Each third-party component remains subject to its own copyright notices, software license, terms of service, and attribution requirements.

**Spotiz does not claim ownership of third-party software or services merely because they are bundled, preconfigured, referenced, or technically compatible with the application.**

---

## 1. Scope of Third-Party Components

Third-party dependencies and integrations may include:

- Open-source frontend, backend, and desktop frameworks;
- Networking, HTTP, and WebSocket client libraries;
- Media playback engines, decoders, and audio/video processing libraries;
- Metadata and search APIs;
- Subtitle parsers and rendering libraries;
- User interface component libraries and icon packs;
- Community addon repositories and scraper manifests;
- Operating system integration modules (e.g., system trays, notification daemons, window management).

Where required by applicable open-source licenses, Spotiz retains and provides:

- Copyright statements and author credits;
- Complete license texts;
- Source-code modification notices;
- Appropriate warranty and liability disclaimers.

Third-party open-source components are not relicensed under Spotiz's license merely because they are distributed with or called by the application.

---

## 2. Upstream and Modified Software

If Spotiz includes software derived, forked, or modified from upstream open-source projects:

- All upstream copyright notices, author credits, and license headers are preserved;
- Modifications remain subject to the terms of the applicable upstream license (such as MIT License);
- Any required source code corresponding to modified copyleft components will be made available in accordance with the governing license.

---

## 3. Addons, Plugins, Repositories, and Community Providers

Spotiz may support an extensible addon, plugin, or scraper architecture.

Certain addons, provider scripts, or manifests may be developed, hosted, and operated by independent third parties or community members.

- Spotiz may seed or preconfigure selected community repositories for user convenience;
- Preconfiguration does not imply ownership, operational control, or official endorsement by Spotiz;
- Each community integration retains its own author copyrights, licenses, and privacy terms;
- Users should consult the respective repository, manifest, or project page of individual integrations for specific attribution and licensing details.

---

## 4. Metadata, Artwork, and External Service Attribution

Spotiz may retrieve and present metadata, cover artwork, descriptions, and ratings from external public and private databases.

- All trademarks, logos, artwork, titles, and metadata remain the property of their respective rights holders;
- Display within Spotiz does not imply ownership, affiliation, or commercial endorsement;
- Where an external service requires specific attribution wording, Spotiz includes that notice below:

<!-- EXAMPLE METADATA SERVICE ATTRIBUTION (Customize or remove as needed) -->
### MusicBrainz / JioSaavn / Deezer
> *"This product uses the TMDB API but is not endorsed or certified by TMDB."*  
> Website: [https://www.themoviedb.org](https://www.themoviedb.org)

<!-- EXAMPLE MUSIC METADATA ATTRIBUTION (Customize or remove as needed) -->
### MusicBrainz & JioSaavn
> *"Metadata sourced from MusicBrainz, licensed under Creative Commons Zero (CC0) / CC BY-NC-SA."*  
> Website: [https://musicbrainz.org](https://musicbrainz.org)

---

## 5. Dependency Inventory and Open-Source Licenses

Below is a template inventory of key third-party open-source dependencies used in this project. Replace or update this table with the actual dependencies used by your application build:

| Component / Library | Version | License | Upstream Project / Repository | Copyright Notice |
|---|---|---|---|---|
| `React` | `19.2.8` | `MIT License` | `https://github.com/facebook/react` | `Copyright © 2026 Meta Platforms, Inc.` |
| `Express` | `19.2.8` | `Apache 2.0` | `https://github.com/expressjs/express` | `Copyright © 2026 Express Contributors` |
| `Lucide React` | `19.2.8` | `ISC License` | `https://github.com/lucide-icons/lucide` | `Copyright © 2026 Lucide Contributors` |
| `Zustand` | `19.2.8` | `MIT License`| `https://github.com/pmndrs/zustand` | `Copyright © 2026 Poimandres` |

*(Tip: You can generate this list automatically using dependency auditing tools such as `cargo-about`, `license-checker` (npm), `pip-licenses`, or `go-licenses`.)*

---

## 6. How to Access Notice Texts

Third-party license texts and attributions are made available through:

1. This [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) file;
2. The [`LICENSE`](./LICENSE) file located in the project root;
3. The application's **"About"** or **"Licenses"** screen within the running interface;
4. The project source repository at https://github.com/spotiz/spotiz.

---

## 7. Ongoing Maintenance

As dependencies, plugins, and external integrations change between releases, this document should be updated accordingly.

If you identify a missing attribution or require clarification regarding a third-party dependency, please contact the maintainers.

---

## 8. Contact Information

For questions regarding third-party licensing or attributions:

- **Repository:** https://github.com/spotiz/spotiz
- **Support / Contact:** Official Repository Issues & In-App Portal
- **Website:** https://spotiz.app
