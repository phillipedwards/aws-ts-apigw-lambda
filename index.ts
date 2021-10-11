import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { APIGatewayProxyEvent } from "aws-lambda";

// We can provided default config values, if applicable
const config = new pulumi.Config();
const baseName = config.get("base-name") || "message";

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

// Create in-line lambda function that will process the DynamoDB event streams
// Magic functions can be replaced by traditional representations of lambda functions, if needed.
const messageHandler = new aws.lambda.CallbackFunction(`${baseName}-message-handler`, {
    callback: async (event) => {

        const snsClient = new aws.sdk.SNS();

        await snsClient.publish({
            TopicArn: snsTopic.arn.get(),
            Message: JSON.stringify(event)
        }).promise();
    }
});

// Attach our lambda function to our DynamoDB table to process the new Items
dynamoTable.onEvent(`${baseName}-message-handler`, messageHandler, {
    startingPosition: "LATEST"
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
            eventHandler: async (event: APIGatewayProxyEvent) => {

                const timestamp = Date.now();
                const client = new aws.sdk.DynamoDB.DocumentClient();

                console.log(JSON.stringify(event));

                // API Gateway will base64 encode the payload
                const decoded = Buffer.from(event.body || "", "base64").toString("utf-8");
                const body = JSON.parse(decoded);

                const params = event.queryStringParameters || {}; // params

                // Push the next item into the table and assume success.
                await client.put({
                    TableName: dynamoTable.name.get(),
                    Item: { timestamp: timestamp, parameters: params, body: body, }
                }).promise();

                console.log("Saved messaged");

                // return the timestamp as ID for a later lookup
                return {
                    statusCode: 200,
                    body: JSON.stringify({"id": timestamp}),
                }
            }
        }
    ]
});

// Export the message endpoint as an Output to be used by others
// This will allow us to execute the `npm run test` script to test our infrastructure.
export const messageEndpoint = pulumi.interpolate`${endpoint.url}message`;