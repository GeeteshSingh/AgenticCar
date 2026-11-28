# Live counter privacy draft

Draft for legal review; this is not a final privacy notice.

The browser creates a random identifier and keeps it in sessionStorage for the tab session. The application sends this identifier in same-origin heartbeat and start requests without cookies. The Durable Object keeps active identifiers and their last heartbeat in memory for up to 90 seconds while the object is alive. It stores an aggregate start count and a SHA-256 hash of each started identifier with its creation time to prevent duplicate increments across restarts. Hashes are scheduled for removal after 24 hours; a tab lasting longer may be counted again. Restarting a drive in the same tab does not increase the total while its hash exists, so the number is unique started sessions, not every individual run.

The application does not save IP addresses, user agents, cookies or player names in this counter. Hosting providers and browser infrastructure may process or retain request metadata under their own policies; this code does not control those logs. Presence resets when the Durable Object restarts and is approximate. Counts are not authenticated and can be manipulated by clients; they are not a trusted leaderboard or an analytics-grade measure. If the service is unavailable, the menu hides the counter.
