"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws = require("aws-sdk");
const client = new aws.DynamoDB.DocumentClient();
const tableName = process.env.TABLE || "";
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = Date.now();
    console.log(JSON.stringify(event));
    // API Gateway will base64 encode the payload
    const decoded = Buffer.from(event.body || "", "base64").toString("utf-8");
    const body = JSON.parse(decoded);
    const params = event.queryStringParameters || {}; // params
    // Push the next item into the table and assume success.
    yield client.put({
        TableName: tableName,
        Item: { timestamp: timestamp, parameters: params, body: body, }
    }).promise();
    console.log("Saved messaged");
    // return the timestamp as ID for a later lookup
    return {
        statusCode: 200,
        body: JSON.stringify({ "id": timestamp }),
    };
});
exports.handler = handler;
//# sourceMappingURL=api-lambda.js.map