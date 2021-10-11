# Create an API Gateway Instance
Lastly, this exercise will see us create an API Gateway instance to receive our user's request, proxy the request to a lambda function, and commit create a new DynamoDB Item.

## Step 1:
Building on our existing code, add the following code block to your `index.ts` file:

```
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
```

There is a lot happening here, but the result is a new API Gateway and a Lambda function that will commit user's requests to our DynamoDB table.

## Step 2:
Ouput our new DynamoDB URL to be used by other consumers. (There is a npm script in our `package.json` that uses this output).

```
// Export the message endpoint as an Output to be used by others
// This will allow us to execute the `npm run test` script to test our infrastructure.
export const messageEndpoint = pulumi.interpolate`${endpoint.url}message`;
```

## Step 3:
Execute a `pulumi up` and watch as the final pieces of infrastructure are created.

## Step 4:
Test the program.  

To test our program, we'll use the inline script in our `package.json`. From your terminal, execute `npm run test` and you should receive an email showing the keys of the new DynamoDB item!

## Step 5: 
Be sure to cleanup your resources and execute `pulumi destroy`.
