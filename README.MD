# This is a simplified CDK v2 implementation of the Serverless Image Handler solution

Enter the source bucket name in the `bin/imagehandler.ts` file.

You can customize the solution by changing the environment variables of the image handler lambda function from `lib/imagehandler-stack.ts` file.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `cdk deploy`      deploy this stack to your AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


Make sure to do `npm install` in the root directory as well as the lambda directory.

Note: If you're using Apple M1, you would have to do `npm install --platform=linux --arch=x64 sharp` inside the lambda directory to install necessary dependencies for the lambda to work.

### Article
Follow the article here for the complete walkthrough: [SIH CDK Solution](https://vishnusblog.tech/serverless-image-handler-cdk-v2-simplified-implementation-sih-cdk-solution)