import * as aws from "aws-sdk";

const client = new aws.SNS();

const topicArn = process.env.TOPIC_ARN || "";

export const handler = async (event: any) => {

    await client.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(event)
    }).promise();
}