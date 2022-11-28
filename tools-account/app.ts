#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import fs from 'fs';
import 'source-map-support/register';
import { GitActionDeploymentUserStack } from './src/cdk-stack';

const REGION = process.env.CDK_DEFAULT_REGION;
const ACCOUNT = "877284483892"; //  This should only be deployed in the CICD account.
const DEFAULT_ENV = {
    account: ACCOUNT,
    region: REGION,
}


// Read parameter file
const params = JSON.parse(fs.readFileSync('src/cdk-stack-param.json', 'utf-8'))

// Create App
const app = new cdk.App();
// Deployment User Stack
new GitActionDeploymentUserStack(app, 'GitActionDeploymentUserStack', {
    description: 'Creates Cross Account Role and Cloudformation Execution Roles',
    stackName: 'cf-GitActionDeploymentUserStack',
    env: DEFAULT_ENV,
    crossAccountRoleArn: params.CROSS_ACCOUNT_ROLE_ARN
});
