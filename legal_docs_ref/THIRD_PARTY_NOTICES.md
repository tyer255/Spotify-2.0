# Third-Party Software Notices and Attribution

[App Name] may include, link against, bundle, communicate with, or depend on third-party software, open-source libraries, runtime frameworks, APIs, addons, plugins, provider modules, scrapers, metadata services, and other external components.

Each third-party component remains subject to its own copyright notices, software license, terms of service, and attribution requirements.

**[App Name] does not claim ownership of third-party software or services merely because they are bundled, preconfigured, referenced, or technically compatible with the application.**

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

Where required by applicable open-source licenses, [App Name] retains and provides:

- Copyright statements and author credits;
- Complete license texts;
- Source-code modification notices;
- Appropriate warranty and liability disclaimers.

Third-party open-source components are not relicensed under [App Name]'s license merely because they are distributed with or called by the application.

---

## 2. Upstream and Modified Software

If [App Name] includes software derived, forked, or modified from upstream open-source projects:

- All upstream copyright notices, author credits, and license headers are preserved;
- Modifications remain subject to the terms of the applicable upstream license (such as [License Name, e.g., GNU GPLv3 / MIT / Apache 2.0]);
- Any required source code corresponding to modified copyleft components will be made available in accordance with the governing license.

---

## 3. Addons, Plugins, Repositories, and Community Providers

[App Name] may support an extensible addon, plugin, or scraper architecture.

Certain addons, provider scripts, or manifests may be developed, hosted, and operated by independent third parties or community members.

- [App Name] may seed or preconfigure selected community repositories for user convenience;
- Preconfiguration does not imply ownership, operational control, or official endorsement by [App Name];
- Each community integration retains its own author copyrights, licenses, and privacy terms;
- Users should consult the respective repository, manifest, or project page of individual integrations for specific attribution and licensing details.

---

## 4. Metadata, Artwork, and External Service Attribution

[App Name] may retrieve and present metadata, cover artwork, descriptions, and ratings from external public and private databases.

- All trademarks, logos, artwork, titles, and metadata remain the property of their respective rights holders;
- Display within [App Name] does not imply ownership, affiliation, or commercial endorsement;
- Where an external service requires specific attribution wording, [App Name] includes that notice below:

<!-- EXAMPLE METADATA SERVICE ATTRIBUTION (Customize or remove as needed) -->
### [Metadata Service Name, e.g., The Movie Database (TMDB)]
> *"This product uses the TMDB API but is not endorsed or certified by TMDB."*  
> Website: [https://www.themoviedb.org](https://www.themoviedb.org)

<!-- EXAMPLE MUSIC METADATA ATTRIBUTION (Customize or remove as needed) -->
### [Music Metadata Service, e.g., MusicBrainz]
> *"Metadata sourced from MusicBrainz, licensed under Creative Commons Zero (CC0) / CC BY-NC-SA."*  
> Website: [https://musicbrainz.org](https://musicbrainz.org)

---

## 5. Dependency Inventory and Open-Source Licenses

Below is a template inventory of key third-party open-source dependencies used in this project. Replace or update this table with the actual dependencies used by your application build:

| Component / Library | Version | License | Upstream Project / Repository | Copyright Notice |
|---|---|---|---|---|
| `[Library Name 1]` | `[x.y.z]` | `[MIT License]` | `[https://github.com/example/lib1]` | `Copyright © [Year] [Author 1]` |
| `[Library Name 2]` | `[x.y.z]` | `[Apache 2.0]` | `[https://github.com/example/lib2]` | `Copyright © [Year] [Author 2]` |
| `[Library Name 3]` | `[x.y.z]` | `[BSD 3-Clause]` | `[https://github.com/example/lib3]` | `Copyright © [Year] [Author 3]` |
| `[Library Name 4]` | `[x.y.z]` | `[GPLv3 / LGPLv3]`| `[https://github.com/example/lib4]` | `Copyright © [Year] [Author 4]` |

*(Tip: You can generate this list automatically using dependency auditing tools such as `cargo-about`, `license-checker` (npm), `pip-licenses`, or `go-licenses`.)*

---

## 6. How to Access Notice Texts

Third-party license texts and attributions are made available through:

1. This [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) file;
2. The [`LICENSE`](./LICENSE) file located in the project root;
3. The application's **"About"** or **"Licenses"** screen within the running interface;
4. The project source repository at [Repository URL].

---

## 7. Ongoing Maintenance

As dependencies, plugins, and external integrations change between releases, this document should be updated accordingly.

If you identify a missing attribution or require clarification regarding a third-party dependency, please contact the maintainers.

---

## 8. Contact Information

For questions regarding third-party licensing or attributions:

- **Repository:** [Repository URL]
- **Contact:** [Contact Email / Support URL]
- **Website:** [Official Website URL]
