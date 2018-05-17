let AWS = require('aws-sdk');
AWS.config.update({region: 'eu-west-1'});

async function getAccountNumber(payload) {
  var sts = new AWS.STS();
  return await sts.getCallerIdentity().promise();
}

async function getsqs() {
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  var data = await getAccountNumber();
  var queueURL = 'https://sqs.eu-west-1.amazonaws.com/' + data.Account + '/malind-testqueue';
  var params = {
    QueueUrl: queueURL,
    AttributeNames: ['all'],
    MaxNumberOfMessages: 1,
    MessageAttributeNames: ['all'],
    VisibilityTimeout: 0,
    WaitTimeSeconds: 20
  };
  return await sqs.receiveMessage(params).promise(); 
}

async function handleCommands(payload) {
  switch(payload.text) {
    case 'cockpit':
        var sqs = await getsqs();
        var body = JSON.parse(sqs.Messages[0].Body);   
        return '{ "text": "Origin: ' + body.origin + '. ' + 'Occured: ' + body.occured + '. ' + body.message + '. ", "card": { "color": "red" }';
    case 'help':
        return '{"text": "for example say give me my cockpit incidents!"}';
    default:
        return '{"text": "Sorry, I don`t know: ' + payload.text + '."}';
  }
}

module.exports.handler = async (event, context, callback) => {
  console.log(event);  
  try {
    var body = JSON.parse(event.body);
    var eventtype = body.type;
    if ((eventtype === "override") && (body.event  === "fullTextInterception")) {   
      var repsonseFromCommands = await handleCommands(body.payload);
      return callback (null, {
        statusCode: 200,
        body: JSON.stringify({
          delegate: false,
          confirmation: false,
          response: repsonseFromCommands
        })
      });      
    }
  }
  catch(error) {
    console.log("ERROR : " + error);
    return callback ('{"text": "'+ error + '"}',null);
  }
};