import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretmanager from 'aws-cdk-lib/aws-secretsmanager';

/**
 * Custom properties to define cross account deployment role
 */
interface EnvProps extends cdk.StackProps {
    crossAccountRoleArn: {
        dev: string;
        staging: string;
        prod: string;
    }
}

export class GitActionDeploymentUserStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: EnvProps) {
        super(scope, id, props);

        // Create IAM User
        // Git action will piggy back on this IAM User and assume cross account role for deployment. 
        const deploymentUser = new iam.User(
            this,
            'GitActionDeploymentUser',
            {
                userName: 'git-action-deployment-user'
            }
        )

        // IAM policy for deployment user
        deploymentUser.attachInlinePolicy(
            new iam.Policy(
                this,
                'GitActionDeploymentUserPolicy',
                {
                    statements: [
                        new iam.PolicyStatement({
                            sid: 'CrossAccountAssumeRole',
                            actions: [
                                'sts:AssumeRole'
                            ],
                            effect: iam.Effect.ALLOW,
                            resources: [
                                ...Object.values(props?.crossAccountRoleArn ?? {})
                            ]
                        }),
                        new iam.PolicyStatement({
                            sid: 'STSSessionTagging',
                            actions: [
                                'sts:TagSession'
                            ],
                            effect: iam.Effect.ALLOW,
                            resources: [
                                '*'
                            ]
                        })
                    ]
                }
            )
        )

        // Access Key for the user
        const accessKey = new iam.CfnAccessKey(
            this,
            'GitActionDeploymentUserAccessKey',
            {
                userName: deploymentUser.userName
            }
        )

        // Secret for the user will be stored in secret manager
        const secret = new secretmanager.CfnSecret(
            this,
            'GitActionDeploymentUserSecret',
            {
                name: 'git-action-deployment-user-secret',
                description: 'Secret for the git action deployment user',
                secretString: String(accessKey.getAtt('SecretAccessKey'))
            }
        )

        /*********************************** List of Outputs ************************************/
        new cdk.CfnOutput(
            this,
            'OutGitActionDeploymentUserArn',
            {
                description: 'Git action deployment user arn',
                exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-ARN',
                value: deploymentUser.userArn
            }
        )

        new cdk.CfnOutput(
            this,
            'OutGitActionDeploymentUserAccessKey',
            {
                description: 'Access key for git action deployment user',
                exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-ACCESS-KEY',
                value: accessKey.ref
            }
        )

        new cdk.CfnOutput(
            this,
            'OutGitActionDeploymentUserSecretArn',
            {
                description: 'User secret for git action deployment user',
                exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-SECRET-ARN',
                value: secret.ref
            }
        )
        /****************************************************************************************/
    }
}
