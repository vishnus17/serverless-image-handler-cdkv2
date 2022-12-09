#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImagehandlerStack } from '../lib/imagehandler-stack';

const app = new cdk.App();

new ImagehandlerStack(app, 'ImagehandlerStack', {
    stageName: 'sbx',
    bucketname: 'enter-bucket-name',
    appName: 'sih',
    env: { account: 'account_number', region: 'region_name' }
});
