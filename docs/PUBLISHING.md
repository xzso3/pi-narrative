# Publishing this MVP to GitHub

The intended public repository name is `pi-narrative`.

The ChatGPT GitHub connector used during the initial MVP build could write to existing repositories but did not expose repository creation. After an empty public repository named `pi-narrative` is created under the desired owner, publish this local Git history with:

```bash
git remote add origin git@github.com:<owner>/pi-narrative.git
git push -u origin main
```

Or HTTPS:

```bash
git remote add origin https://github.com/<owner>/pi-narrative.git
git push -u origin main
```

Then Pi users can install directly from GitHub:

```bash
pi install https://github.com/<owner>/pi-narrative
```

Recommended repository visibility: **Public**. Recommended license: **MIT** (already included).
