**Deployment checklist (VaultTrace)**

- Required environment variables (set these in your hosting platform):
  - `MONGODB_URI` — MongoDB Atlas connection string (must not point to localhost unless `DEV_ALLOW_LOCAL=true`).
  - `JWT_SECRET` — strong random secret for signing tokens.
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — SMTP provider credentials.
  - `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — S3-compatible object storage (optional but recommended for uploads).
  - `NODE_ENV=production` for production deployments.

- Local development:
  - To allow using a local MongoDB instance during development set `DEV_ALLOW_LOCAL=true`.
  - For quick local runs, create a `.env.local` file with the keys above (be careful not to commit it).

- Notes:
  - The servers will exit at startup if required env vars are missing (protects against accidental local persistence).
  - Replace local file storage with S3 by setting the S3 variables and using the `lib/s3.js` helper.
