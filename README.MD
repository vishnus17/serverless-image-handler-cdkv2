# This is a simplified CDK v2 implementation of the Serverless Image Handler solution

Enter the source bucket name in the `bin/imagehandler.ts` file.

You can customize the solution by changing the environment variables of the image handler lambda function from `lib/imagehandler-stack.ts` file.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `cdk deploy`      deploy this stack to your AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


Make sure to do `npm install` in the root directory as well as inside the lambda directory before you do cdk commands.