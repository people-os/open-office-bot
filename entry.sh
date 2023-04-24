#!/bin/sh

# Check service env vars are set:
# Everything else has a sensible default, but these vars should be
# set in the cloud instead of through docker-compose.yml for security.
if [ -z "$ZULIP_API_KEY" ]; then
    echo "ZULIP_API_KEY is not set"
    exit 1
fi

if [ -z "$GOOGLE_PASSWORD" ]; then
    echo "GOOGLE_PASSWORD is not set"
    exit 1
fi

if [ -z "$GOOGLE_TOTP_SECRET" ]; then
    echo "GOOGLE_TOTP_SECRET is not set"
    exit 1
fi

export CHROMIUM_BIN=/usr/bin/chromium-browser

exec npm run prod

