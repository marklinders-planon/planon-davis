var AWS;
if (!AWS) {
    AWS = require('aws-sdk');
}
AWS.config.update({region: 'eu-west-1'})
const config = require("./config");

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
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ['all'],
    VisibilityTimeout: 0,
    WaitTimeSeconds: 20
  };
  var messages = await sqs.receiveMessage(params).promise();
  var foundMessageIds = new Array;
  var uniqeMessages = new Array;
  for (let i=0; i<messages.Messages.length; i++){
    var found = foundMessageIds.find(function(element) {
      return element === messages.Messages[i].MessageId;
    });
    if (!found) {
      foundMessageIds.push(messages.Messages[i].MessageId);
      uniqeMessages.push(messages.Messages[i]);
    }
  }
  return uniqeMessages; 
}

async function handleCommands(payload) {
  if (!payload.text.indexOf("cockpit") || !payload.text.indexOf("give")) {
    var messages = await getsqs();
    var responseText = " ";
    for (let i=0; i<messages.length; i++){
      var body = JSON.parse(messages[i].Body);   
      var incidentNR = i + 1;
      responseText = responseText + 'Incident number : '+incidentNR+'. ' + 'Origin:'  + body.origin + '. ' + 'Occured: ' + body.occured + '. ' + body.message + '. ';
    }
    return { "text": responseText , "card": { "color": "red" } };
  } else if  (!payload.text.indexOf("help")) {
    return {"text": "for example say give me my cockpit incidents!"};
  } else if  (!payload.text.indexOf("no")) {
    return {"text": "Say stop to exit"};
  } else if  (!payload.text.indexOf("planon")) {
    return {"text": "Planon is the greatest company in the world"};
  } else if  (!payload.text.indexOf("mark") || !payload.text.indexOf("kris")) {
    return {"text": "i don't know. I do know Mark and Kris made this stuff"};
  } else {
    return {"text": "Sorry, I don`t know: " + payload.text + "."};
  }
}

module.exports.handler = async (event, context, callback) => {
  //check if we are authorized
  if (!event.headers || event.headers.Authorization !== `Token ${config.CLIENT_SECRET}`) {
    return callback(null, { statusCode: 401, body: "Unauthorized" });
  }

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