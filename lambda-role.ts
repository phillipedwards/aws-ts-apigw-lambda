import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RoleArgs {
    assumeService: string,
    policyArn?: string
}

// This is an example of a ComponentResource which can be used to abstract and encapsulate re-usable logic
export class LambdaRole extends pulumi.ComponentResource {

    public readonly role: aws.iam.Role;

    constructor(name: string, roleArgs: RoleArgs, opts?: pulumi.ComponentResourceOptions) {
        super(`index:${name}`, name, opts);

        const { assumeService, policyArn } = roleArgs;

        // Build Lambda with Role that has Full Access to Dynamo DB
        this.role = new aws.iam.Role(`${name}-role`, {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: assumeService })
        }, {
            parent: this
        });

        if (policyArn) {
            new aws.iam.RolePolicyAttachment(`${name}-role-attachment`, {
                role: this.role.name,
                policyArn: policyArn
            }, {
                parent: this
            });
        }
        
        new aws.iam.RolePolicyAttachment(`${name}-role-attachment-basic`, {
            role: this.role.name,
            policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole
        }, {
            parent: this
        });

        new aws.iam.RolePolicyAttachment(`${name}-role-attachment-full-dynamo`, {
            role: this.role.name,
            policyArn: aws.iam.ManagedPolicies.AmazonDynamoDBFullAccess
        }, {
            parent: this
        });

        this.registerOutputs();
    }
}