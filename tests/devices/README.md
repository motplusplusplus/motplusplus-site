# Device tests

Puppeteer checks for the MoTcyclopedia and events pages on iPhone, Pixel, tablet and desktop,
run against live after a deploy.

```bash
npm run test:devices                  # all checks, against https://motplusplusplus.com
npm run test:devices -- --base=URL    # against a preview Worker
npm run test:thirdparty               # every third-party host the pages request, and cookies
```

The first run installs Puppeteer (and its Chrome) into `tests/devices/node_modules`, kept out of
the site's own dependencies. Screenshots and `results.json` land in `tests/devices/screens/<date>/`
(gitignored). The suite exits 1 if any check fails.

Subjects for the zoom check (an event whose hero is 1600 px or wider) and the EN/VN check (an
event with both English and Vietnamese text) are picked from the public Sanity dataset on each
run, so they do not break when one event's photos or translation change.
