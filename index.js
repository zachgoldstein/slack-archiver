var Slack = require('slack-client');

var AWS = require('aws-sdk');

var awsAccessKey = process.env.AWS_ACCESS_KEY
var awsAccessSecret = process.env.AWS_SECRET_KEY

var slackToken = process.env.SLACK_TOKEN

AWS.config.update({accessKeyId: awsAccessKey, secretAccessKey: awsAccessSecret});
AWS.config.update({region: 'ap-southeast-2'})

var s3 = new AWS.S3({params: {Bucket: 'slack-archive'}});

var slack = new Slack(slackToken, true, true);

slack.on('open', function () {
    var channels = Object.keys(slack.channels)
        .map(function (k) { return slack.channels[k]; })
        .filter(function (c) { return c.is_member; })
        .map(function (c) { return c.name; });

    var groups = Object.keys(slack.groups)
        .map(function (k) { return slack.groups[k]; })
        .filter(function (g) { return g.is_open && !g.is_archived; })
        .map(function (g) { return g.name; });

    console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

    if (channels.length > 0) {
        console.log('You are in: ' + channels.join(', '));
    }
    else {
        console.log('You are not in any channels.');
    }

    if (groups.length > 0) {
       console.log('As well as: ' + groups.join(', '));
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
      Bucket: 'slack-archive',
      Key: channel.name + '_archive.txt',
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
