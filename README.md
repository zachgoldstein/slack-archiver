# slack-archiver

A simple bot for archiving slack channels to s3. I've called him archer the archive bot.

Each channel that this bot is in will have all conversations written to a text file in the s3 bucket. So there's a text file per channel, with the naming format as <Team Prefix>_<Channel Name>_archive.txt

A preface: This is primarily geared towards community groups where there are tons of people and not enough cash to pay for slack. If you're a business, I highly suggest you just pay them and let them handle archives.

## Installation:

-Navigate to the integrations page for your team. On the desktop app you can click the team name in the top left and then "Configure Integrations"
-Add a "Bot" integration. I like to call mine "Archer the archiver". There is a archer.jpg icon you can use in this repo.
-Copy the "API Token" there.
-Set the following environment variables on the host
  - AWS_ACCESS_KEY
  - AWS_SECRET_KEY
  - AWS_REGION
  - SLACK_TOKEN (this is the API Token from earlier)
  - TEAM_PREFIX
  - BUCKET_NAME

Run via `node ./index.js` OR `npm start`
