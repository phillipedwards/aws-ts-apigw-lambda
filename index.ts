import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { LambdaRole } from "./lambda-role";

// We can provided default config values, if applicable
const config = new pulumi.Config();
const baseName = config.get("base-name") || "message";

const vpcStack = new pulumi.StackReference("my-vpc-stack");
const vpc = vpcStack.getOutputValue("vpc-id");

// ------------ Step 1 --------- //
// Build all infra that is required for the dynamo table

// Create DynamoDB table to store message data from the API.
const dynamoTable = new aws.dynamodb.Table(`${baseName}-webhook-table`, {
    streamEnabled: true,
    streamViewType: "KEYS_ONLY",
    attributes: [{
        name: "timestamp",
        type: "N",
    }],
    hashKey: "timestamp",
    readCapacity: 5,
    writeCapacity: 5,
});

// ------------ Step 2 --------- //
// Build all infra that is required to attach lambda to dynamo stream for SNS processing

// Create the SNS Topic and Subscription to be used for the DynamoDBpuluevent stream
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

// Attach our lambda function to our DynamoDB table to process the new Items
dynamoTable.onEvent(`${baseName}-stream-handler`, dynamoStreamLambda, {
    startingPosition: "TRIM_HORIZON"
});

// ------------ Step 3 --------- //
// Build all infra that is required for the API Gateway and Lambda Proxy

// ComponentResource to encapsulate the Role needed for the Lambda function
const apiRole = new LambdaRole(`${baseName}-api`, {
    assumeService: "lambda.amazonaws.com",
});

const apilambda = new aws.lambda.Function(`${baseName}-api-lambda`, {
    runtime: aws.lambda.Runtime.NodeJS12dX,
    handler: "api-lambda.handler",
    code: lambdaArchive,
    role: apiRole.role.arn,
    environment: {
        variables: {
            TABLE: dynamoTable.name
        }
    }
});

// Creates an API endpoint which exposes a POST endpoint to save messages
// A Lambda is proxied to save the message to a dynamodb table
// AWSX is a great place to see the power of Pulumi. We can easily standup an API Gateway that proxies to lambda function(s).
// This API ComponentResource is built entirely of out of the box Pulumi resources, so we can easily break this down, if needed.
const endpoint = new awsx.apigateway.API(`${baseName}-message-api`, {
    routes: [
        {
            path: "/message",
            method: "POST",
            eventHandler: apilambda
        }
    ]
});

// Export the message endpoint as an Output to be used by others
// This will allow us to execute the `npm run test` script to test our infrastructure.
export const messageEndpoint = pulumi.interpolate`${endpoint.url}message`;