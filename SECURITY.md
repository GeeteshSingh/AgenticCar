# Security

Please report suspected vulnerabilities privately through [GitHub's security advisory form](https://github.com/GeeteshSingh/AgenticCar/security/advisories/new). Avoid publishing exploit details in a public issue. Repository maintainers can enable private vulnerability reporting in GitHub settings if the form is unavailable.

## Browser security headers

The report-only Content Security Policy lets browser consoles reveal incompatible resources before enforcement. `default-src` restricts unspecified sources; `script-src` allows local scripts and WebAssembly; `style-src` permits local and inline styles; `img-src`, `media-src`, and `connect-src` allow the HTTPS resources needed by radio; `font-src` restricts fonts to this site; `worker-src` permits local and blob workers; `object-src` blocks plugins; `base-uri` restricts base URLs; and `frame-ancestors` denies framing. After testing all routes, radio, audio, and browsers without violations, replace `Content-Security-Policy-Report-Only` with `Content-Security-Policy` in `public/_headers` and retest.

The Permissions-Policy disables geolocation, so the radio's existing location button cannot access the device location on deployments honoring this header; manual filters remain available.
