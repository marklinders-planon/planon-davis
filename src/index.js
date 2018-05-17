var AWS;
if (!AWS) {
    AWS = require('aws-sdk');
}

async function amazonLamdbaRunner() {
  //exmple event to be able to local test davis
  var event = {   
    "resource": "/planon-davis",
    "path": "/planon-davis",
    "httpMethod": "POST",
    "headers": {
      "Accept": "application/json",
      "Authorization": "null",
      "CloudFront-Forwarded-Proto": "null",
      "CloudFront-Is-Desktop-Viewer": "null",
      "CloudFront-Is-Mobile-Viewer": "null",
      "CloudFront-Is-SmartTV-Viewer": "null",
      "CloudFront-Is-Tablet-Viewer": "null",
      "CloudFront-Viewer-Country": "null",
      "content-type": "application/json",
      "Host": "null",
      "Via": "null",
      "X-Amz-Cf-Id": "null",
      "X-Amzn-Trace-Id": "null",
      "x-davis-custom-action-event": "fullTextInterception",
      "x-davis-custom-action-type": "override",
      "x-dynatrace": "null",
      "X-Forwarded-For": "null",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
      "resourceId": "null",
      "resourcePath": "/davistest",
      "httpMethod": "POST",
      "extendedRequestId": "null",
      "requestTime": "25/Apr/2018:06:58:27 +0000",
      "path": "/dev/davistest",
      "accountId": "null",
      "protocol": "HTTP/1.1",
      "stage": "dev",
      "requestTimeEpoch": 1524639507124,
      "requestId": "null",
      "identity": {
        "cognitoIdentityPoolId": null,
        "accountId": null,
        "cognitoIdentityId": null,
        "caller": null,
        "sourceIp": "52.0.97.215",
        "accessKey": null,
        "cognitoAuthenticationType": null,
        "cognitoAuthenticationProvider": null,
        "userArn": null,
        "userAgent": null,
        "user": null
      },
      "apiId": "null"
    },
    "body": "{\"type\":\"override\",\"event\":\"fullTextInterception\",\"user\":\"mark@planonsoftware.com\",\"payload\":{\"text\":\"cockpit\"}}",
    "isBase64Encoded": false   
  };
  //All the options
  //"body": "{\"type\":\"override\",\"event\":\"fullTextInterception\",\"user\":\"mark@planonsoftware.com\",\"payload\":{\"text\":\"cockpit\"}}",
  //"body": "{\"type\":\"override\",\"event\":\"fullTextInterception\",\"user\":\"mark@planonsoftware.com\",\"payload\":{\"text\":\"help\"}}",
  //"body": "{\"type\":\"override\",\"event\":\"fullTextInterception\",\"user\":\"marks@planonsoftware.com\",\"payload\":{\"text\":\"no\"}}",


  async function exportsHandlerFunctionInAwsLambda(event, context, callback) {
    //-----------------------------------------cut and paste below to lambda in aws to make it work-----------------------------------------
    let AWS = require('aws-sdk');
    AWS.config.update({region: 'eu-west-1'});

    async function getsqs() {
      var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
      var queueURL = 'https://sqs.eu-west-1.amazonaws.com/'+ process.env.ACCOUNTID + '/' + process.env.SQSQUENAME;
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
            break;
        case 'help':
            return '{"text": "for example say give me my cockpit incidents!"}';
            break;
        default:
            return '{"text": "Sorry, I don`t know: ' + payload.text + '."}';
      }
    }

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
      console.log("ERROR : " + error)
      return callback ('{"text": "'+ error + '"}',null);
    }
    //-----------------------------------------cut and paste above to lambda in aws to make it work-----------------------------------------
  }

  await exportsHandlerFunctionInAwsLambda(event ,"context",testCallaback);

  function testCallaback(error,repsonse) {
    if (error != null) {
      console.log("error  :" + error);  
    }
    if (repsonse != null) {
      console.log("Response :" +repsonse.body);
    }
  }
}

amazonLamdbaRunner();
