# Creating a New Project
Create a new Pulumi project that will house the infrastructure we'll be creating.

## Step 1: Create a Directory
```
mkdir pulumi-project
cd pulumi
```

Note: Pulumi will use your directory as your project name by default. In a Pulumi organization, project names must be unique.

## Step 2: Initialize your Project
```pulumi new aws-typescript```

Follow the CLI prompt, and watch as Pulumi creates a new project and installs node dependencies.

## Step 3: Open your IDE
Note the files, Pulumi automatically created for you.
- index.ts
- package.json
- Pulumi.yaml
- tsconfig.json

## Step 4: Let's Add Some Code!
Inspect the current state of your `index.ts` file and you should see this:
![image](https://user-images.githubusercontent.com/25461821/136837422-d96f0b70-e7c0-4826-a7d9-7c9b70fdd969.png)

Delete the code from line 4 down, so we are left only with the import statements at the top of your `index.ts` file.

Add the following code to your `index.ts` file to create a new DynamoDB table.

```
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
```
You should see an error in your IDE because we haven't defined the `base-name` variable. Let's do that:
```
// We can provided default config values, if applicable
const config = new pulumi.Config();
const baseName = config.get("base-name") || "message";
```

## Step 5: Create Some Infrastructure!
Execute `pulumi up` and follow the command prompt. Be sure to confirm the "Yes" option if you're ready to create infrastructure.
