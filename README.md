# Open Office Bot

This application pretends to be a Zulip user to help people know if people are hanging out in a meeting.

It does this by monitoring meetings and updating its status to be the number of participants in that meeting.

## Setup

1. Clone the repository
2. Install Node modules with `npm ci`
3. Setup the [configuration](#Configuration) variables
4. Start it with `npm run start`

See [Development](#Development) for more information if you plan to make changes.

## Configuration

This application requires you to pass in some variables to run successfully. You'll need the following keys in `.env`:

| Variable | Description | Default | Required? |
| --- | --- | --- | --- |
| `ZULIP_USERNAME` | The username (email) that the Zulip bot user authenticates with. Note that the bot must be a user, not a Zulip interactive bot, for the call status display on the sidebar to be present. | N/A | Y |
| `ZULIP_PASSWORD` | The password that the Zulip bot user authenticates with. | N/A | Y |
| `ZULIP_REALM` | The URL of the Zulip instance that the bot is a user in. | N/A | Y |
| `ZULIP_NAME` | The display name of the Zulip bot. The display name should begin with a symbol or emoji so that it displays at the top of the user list for easier access. | `👀👀 Example Bot 👀👀` | N |
| `DEFAULT_STATUS` | The user status of the Zulip bot, before Meet polling has started successfully. | `...` | N |
| `GOOGLE_USERNAME` | The Google email that has access to the Meet link, for polling the number of Meet participants. | N/A | Y | 
| `GOOGLE_PASSWORD` | The password to authenticate the Google email. | N/A | Y |
| `GOOGLE_TOTP_SECRET` | The 32-character secret key used by an Authenticator app for 2FA verification of your Google email. It's recommended to set up 2FA if it does not exist, and Yubikey authentication may need to be disabled. To find your 32-character key, you'll need to link or re-link your Authenticator app to your Google email, and find the option to enter the key manually. Spaces in the key may be safely ignored. | N/A | Y |
| `GOOGLE_MEET` | The Google Meet URL that will serve as your remote open office space. | N/A | Y |
| `CHROMIUM_BIN` | The local directory for your `chromium` installation. See [here](https://www.chromium.org/getting-involved/download-chromium/) for how to install Chromium for your distribution. | `/usr/bin/chromium-browser` | No if you already have `chromium-browser` installed. |

### Configuration Notes

The Zulip account used is a regular account not a bot. This is because this application pretends to be a user so that it can be visible in the "User" view of the web app.

The realm value is just the domain pointing to your Zulip instance.

_NOTE: It is recommended that you disable all the notifications for this account to not get spammed by activity_

## Development

Create a `.env` file with your configuration variables and than run `npm run dev`.

This will watch all the source files for changes and automatically reload. Changes to the `.env` file are not automatically picked up so you must stop and run the command again.
