# Creating an AWS Serverless Application using Pulumi!

This example shows how Pulumi can easily create an AWS Serverless application that is comprised of API Gateway, Lambda, DynamoDB, and SNS.

## Topics Included
- Configuration
- Outputs
- Lambda Functions
- and more!

## Getting Started
1. clone this repository
2. set the `subscription-email` configuration value. `pulumi config set subscription-email {email}`
3. execute `pulumi up`
4. wait for the SNS subscription email from AWS and approve, when it's received.
5. execute `npm run test` to trigger a new notification

Make sure to run `pulumi destroy` to clean up your resources when you're finished.

## NOTE: A 'src' directory containing valid lambda function code is required for this solution to work.
