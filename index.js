var Slack = require('slack-client');
var AWS = require('aws-sdk');

var awsAccessKey = process.env.AWS_ACCESS_KEY
if (!awsAccessKey) {
  console.log("Cannot find AWS access key, please set env var AWS_ACCESS_KEY")
  process.exit()
}
var awsAccessSecret = process.env.AWS_SECRET_KEY
if (!awsAccessSecret) {
  console.log("Cannot find AWS secret key, please set env var AWS_SECRET_KEY")
  process.exit()
}
var awsRegion = process.env.AWS_REGION
if (!awsRegion) {
  console.log("Cann ot find aws region, please set env var AWS_REGION")
  process.exit()
}
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.log("Cannot find slack token, , please set env var SLACK_TOKEN")
  process.exit()
}
var teamPrefix = process.env.TEAM_PREFIX
if (!teamPrefix) {
  console.log("Cannot find slack team prefix, please set env var TEAM_PREFIX")
  process.exit()
}
var bucketName = process.env.BUCKET_NAME
if (!bucketName) {
  console.log("Cannot find AWS bucket name, , please set env var BUCKET_NAME")
  process.exit()
}

AWS.config.update({accessKeyId: awsAccessKey, secretAccessKey: awsAccessSecret});
AWS.config.update({region: awsRegion})

var s3 = new AWS.S3({params: {Bucket: bucketName}});
var slack = new Slack(slackToken, true, true);

slack.on('error', function (err) {
  if (err) {
    console.log("An error occurred, ",err);
  }
});

slack.on('open', function () {
    var channels = Object.keys(slack.channels)
        .map(function (k) { return slack.channels[k]; })
        .filter(function (c) { return c.is_member; })
        .map(function (c) { return c.name; });

    console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

    if (channels.length > 0) {
        console.log('You are in: ' + channels.join(', '));
    }
    else {
        console.log('You are not in any channels.');
    }

    channel = slack.getChannelGroupOrDMByName("#bots")
    channel.send("Archiving messages from channels: " + channels.join(', '));
    console.log("Notified #bots channel of archiving")
});

slack.on('message', function(message) {
    var channel = slack.getChannelGroupOrDMByID(message.channel);
    var user = slack.getUserByID(message.user);

    var displayMsg = "";

    if (message.type === 'message') {
        if (!user) {
          displayMsg = ( new Date().toISOString() + " - " + channel.name + ':' + message.text + " \r\n" );
        } else {
          displayMsg = ( new Date().toISOString() + " - " + channel.name + ':' + user.name + ':' + message.text + " \r\n" );
        }
    }

    var currentArchive = '';

    var params = {
      Bucket: bucketName,
      Key: teamPrefix + "_" + channel.name + '_archive.txt',
    }

    s3.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      } else {
        currentArchive = data.Body.toString("utf-8", 0, data.Body.length);
      }

      currentArchive += displayMsg;

      console.log("putting archive ",currentArchive);

      params.Body = currentArchive;

      s3.upload(params, function(err, data) {
          if (err) {
            console.log("Error uploading data: ", err);
          } else {
            console.log("Successfully uploaded data to " + params.Bucket);
          }
        });

      console.log("done putting archive!");
    });

});
slack.login();
