# Mailchimp signup monitor workflow

This repository includes a scheduled GitHub Actions workflow at `.github/workflows/mailchimp-signup-monitor.yml`.

## What it does

Once per day (and on manual dispatch), it runs `scripts/mailchimp-healthcheck.mjs` to:

1. Open the production website in a headless Chromium browser.
2. Submit the real signup form with a unique test email address.
3. Poll the Mailchimp API until the member appears in the audience.
4. Archive the test member through the Mailchimp API for cleanup.
5. Confirm the archived member is no longer retrievable.

If any step fails, the workflow exits non-zero so GitHub marks the run as failed.

## Required GitHub repository secrets

- `MAILCHIMP_API_KEY`
- `MAILCHIMP_SERVER_PREFIX` (example: `us22`)
- `MAILCHIMP_AUDIENCE_ID`
- `MAILCHIMP_HEALTHCHECK_EMAIL_DOMAIN` (domain part only, example: `example.com`)
- `PROD_SIGNUP_URL` (full URL to the production page containing the signup form)

## Notifications

GitHub Actions can notify you automatically when scheduled workflows fail.
In GitHub, ensure notifications for Actions failures are enabled for your account/watch settings.
