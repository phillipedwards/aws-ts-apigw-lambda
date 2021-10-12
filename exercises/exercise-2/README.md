# Add a SNS Subscription for DynamoDB Stream Events
In this section we're going to add some code to create a SNS topic, a SNS subscrition, and attach our new Topic to our DynamoDB table through DynamoDB Streams.

## Step 1:
You should have existing code which looks like:  

![image](https://user-images.githubusercontent.com/25461821/136839027-e188104f-9145-4a00-a8cd-cad1b25c8fee.png). 

## Step 2:
Next we're going to add some SNS code to create a new Topic, a new TopicSubscription, and finally attach our Topic to be triggered when a new Item is inserted into our DynamoDB table.

```
// Create the SNS Topic and Subscription to be used for the DynamoDB event stream
const snsTopic = new aws.sns.Topic(`${baseName}-topic`, {
    displayName: "message-topic",
});

// The subscription needs to be confirmed, once created, through email confirmation.
// The email used here, should receive a "Subscription Confirmation" email from AWS. This needs to be approved before you'll receive any notifications.
const subscriptionEmail = config.require("subscription-email");
new aws.sns.TopicSubscription(`${baseName}-message-sub`, {
    topic: snsTopic.arn,
    protocol: "email-json",
    endpoint: subscriptionEmail
});
```

Note, the use of `config.require("")`. This means Pulumi will throw an error, if this configuration value is not found in your Project configuration. Please, add this value to your Pulumi configuration (using an email you have access to), with:  
`pulumi config set subscription-email {email}`

## Step 3:
Finally we need to create a lambda function that is responsible for publishing the event stream to the SNS topic. 
```
// Create lambda function that will process the DynamoDB event streams
// We'll use a component resource to re-use our Role creation step.
const snsLambaRole = new LambdaRole(`${baseName}-sns-lambda`, {
    assumeService: "lambda.amazonaws.com",
    policyArn: aws.iam.ManagedPolicies.AmazonSNSFullAccess
});

// This will bundle up the 'src' directory into a zip and make it available for use with lambda
const lambdaArchive = new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./src")
});

const dynamoStreamLambda = new aws.lambda.Function(`${baseName}-dynamo-stream-lambda`, {
    runtime: aws.lambda.Runtime.NodeJS12dX,
    handler: "dynamo-stream-lambda.handler",
    code: lambdaArchive,
    role: snsLambaRole.role.arn,
    environment: {
        variables: {
            TOPIC_ARN: snsTopic.arn
        }
    }
});
```

execute a `pulumi up` command and watch as your new infrastructure is created.

## Step 4:
In order to receive our email notification, we need to subscribe to our DynamoDB's event stream and notify SNS of the new Item. Add the following to your `index.ts` file:  

```
// Attach our lambda function to our DynamoDB table to process the new Items
dynamoTable.onEvent(`${baseName}-stream-handler`, dynamoStreamLambda, {
    startingPosition: "LATEST"
});
```

## Step 5:
By now, the email you choose for the `subscription-email` configuration item should have received an email from AWS regarding the new SNS Topic Subscription. Please, confirm the subscription from that email.  

## [Continue to next exercise](https://github.com/phillipedwards/aws-ts-apigw-lambda/blob/master/exercises/exercise-3/README.md)

