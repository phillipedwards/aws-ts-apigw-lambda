import * as aws from "aws-sdk";

const client = new aws.DynamoDB.DocumentClient();

const tableName = process.env.TABLE || "";

export const handler = async (event: any) => {
    const timestamp = Date.now();

    console.log(JSON.stringify(event));

    // API Gateway will base64 encode the payload
    const decoded = Buffer.from(event.body || "", "base64").toString("utf-8");
    const body = JSON.parse(decoded);

    const params = event.queryStringParameters || {}; // params

    // Push the next item into the table and assume success.
    await client.put({
        TableName: tableName,
        Item: { timestamp: timestamp, parameters: params, body: body, }
    }).promise();

    console.log("Saved messaged");

    // return the timestamp as ID for a later lookup
    return {
        statusCode: 200,
        body: JSON.stringify({ "id": timestamp }),
    }
}