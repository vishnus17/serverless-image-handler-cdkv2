#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImagehandlerStack } from '../lib/imagehandler-stack';
import { env } from 'process';

const app = new cdk.App();

new ImagehandlerStack(app, 'ImagehandlerStack', {
    stageName: 'sbx',
    bucketname: 'source-image-bucket-1',
    appName: 'sih',
    env: { account: env.account, region: env.region }
});
