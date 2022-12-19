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

This application requires you to pass in some variables or else it will not run.

See the [config.ts](src/config.ts) file for environment variable keys needed.

### Configuration Notes

The Zulip account used is a regular account not a bot. This is because this application pretends to be a user so that it can be visible in the "User" view of the web app.

The realm value is just the domain pointing to your Zulip instance.

_NOTE: It is recommended that you disable all the notifications for this account to not get spammed by activity_

## Development

Create a `.env` file with your configuration variables and than run `npm run dev`.

This will watch all the source files for changes and automatically reload. Changes to the `.env` file are not automatically picked up so you must stop and run the command again.
