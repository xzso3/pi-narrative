# Publishing and Installation

Public repository: `https://github.com/xzso3/pi-narrative`.

Install:

```bash
pi install https://github.com/xzso3/pi-narrative
```

Local development:

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
```

Validate before publishing:

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

Pull requests are validated by GitHub Actions. Keep `package.json` aligned with the current release, update `CHANGELOG.md` for behavior/protocol changes, and add explicit migrations for project-data schema changes.
