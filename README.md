# treksavvy
orbital

## Google Maps configuration

Copy `server/.env.example` to `server/.env` and set your own keys. The backend
loads that file for local development; deployment platforms should inject these
values as environment variables. Never commit real keys or put the server key
in React configuration.

- `GOOGLE_MAPS_API_KEY`: private backend key for Places API and Geocoding API.
- `GOOGLE_MAPS_BROWSER_API_KEY`: a separate browser key for Maps JavaScript API.
  `/api/maps-config` intentionally serves this public key to the exported map.
  Apply website/referrer restrictions for your local and deployed origins and
  restrict it to Maps JavaScript API. Restrict the backend key to the needed
  APIs and, where your hosting supports it, the server's outbound IP addresses.

Missing backend configuration returns HTTP 503 for Google-backed routes without
making an upstream request. Missing browser configuration shows a map-unavailable
message. Other functionality, such as pin management, remains available.

Run backend tests with `python -m pytest server/test_app.py` after installing
`server/requirements.txt` and `pytest`. The tests mock Google and do not use a
live API key or make billable Maps requests.

## Replace previously exposed credentials

This repository previously contained literal API keys. Removing them from the
current source does not revoke them or erase earlier commits.

1. In the owning Google Cloud project, rotate the previously exposed key and
   retire the old credential. The backend, start script and exported map used
   the same key; replacements must separate server and browser access.
2. Configure the replacements privately on the deployment platform and in local
   `server/.env`. Use separate restricted server and browser keys as above.
3. Verify the app with the replacement keys, then confirm the old credentials
   have been retired. Review their usage and billing for unexpected activity.
4. Do not paste replacements into GitHub issues, commits, screenshots or chat.

References: [Google Maps security guidance](https://developers.google.com/maps/api-security-best-practices)
and [responding to compromised credentials](https://docs.cloud.google.com/docs/security/compromised-credentials).

Test the exported map's credential-loading behavior without a browser or API key:
`node --test client/test-export-map.cjs`.
