# Create an API Gateway Instance
Lastly, this exercise will see us create an API Gateway instance to receive our user's request, proxy the request to a lambda function, and commit create a new DynamoDB Item.

## Step 1:
Building on our existing code, add the following code block to your `index.ts` file:

```
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

To test our program, we'll add a script to our `package.json`. Add the following section to your `package.json`:  

```
"scripts": {
        "test-api": "curl -H 'Content-Type: application/json' -d '{ \"key\": \"value\" }' -XPOST $(pulumi stack output messageEndpoint)"
    },
```

Edit the JSON portion of the script to pass whatever information you'd like.  

## Step 5: 
Be sure to cleanup your resources and execute `pulumi destroy`.
