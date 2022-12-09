import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ImagehandlerStackProps extends cdk.StackProps {
    stageName: string;
    appName: string;
    bucketname: string;
}

export class ImagehandlerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImagehandlerStackProps) {
    super(scope, id, props);

    const appName = props.appName;
    const stageName = props.stageName;
    const bucketname = props.bucketname;
    
    // log bucket for cloudfront
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `s3-logbucket${appName}-${stageName}-cac1-01`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // image handler lambda function
    const imagehandlerFunction = new lambda.Function(this, 'imagehandlerFunction', {
      description: "Serverless Image Handler (v6.0.0): Performs image edits and manipulations",
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: `lambda-${appName}-${stageName}-cac1-01`,
      code: lambda.Code.fromAsset('lambda'),
      handler: "image-handler/index.handler",
      timeout: Duration.seconds(900),
      architecture: lambda.Architecture.X86_64,
      memorySize: 1024,
      tracing: lambda.Tracing.PASS_THROUGH,
      environment: {
        DEFAULT_FALLBACK_IMAGE_BUCKET: "",
        ENABLE_DEFAULT_FALLBACK_IMAGE: "No",
        ENABLE_SIGNATURE: "No",                  // set to "Yes" to enable signature
        DEFAULT_FALLBACK_IMAGE_KEY: "",
        SECRET_KEY: "",
        REWRITE_SUBSTITUTION: "",
        REWRITE_MATCH_PATTERN: "",
        SOURCE_BUCKETS: `${bucketname}`, // Pass the source buckets name here separated by comma
        AUTO_WEBP: "No",
        CORS_ENABLED: "Yes",
        CORS_ORIGIN: "*",
        SECRETS_MANAGER: "",
      },
    });

    // s3 access policy for image handler lambda function
    imagehandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
      ],
      resources: [
        "arn:aws:s3:::*",
      ],
    }));

    // rekognition access policy for image handler lambda function
    imagehandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "rekognition:DetectFaces",
        "rekognition:DetectModerationLabels",
      ],
      resources: [
        "*",
      ],
    }));

    // API Gateway to trigger image handler lambda function
    const apigw = new api.RestApi(this, 'ImagehandlerApi', {
      restApiName: `apigw-${appName}-${stageName}-cac1-01`,
      description: 'This service initiates the image handler lambda function',
      endpointConfiguration: {
        types: [api.EndpointType.REGIONAL],
      },
      apiKeySourceType: api.ApiKeySourceType.HEADER,
      binaryMediaTypes: ['*/*'],
      deployOptions: {
        stageName: 'image',
      },
    });

    // ANY method for API Gateway
    const method = apigw.root.addMethod('ANY', new api.LambdaIntegration(imagehandlerFunction), {
      apiKeyRequired: false,
      authorizationType: api.AuthorizationType.NONE,
    });
    
    // {proxy+} resource for API Gateway
    const resource1 = apigw.root.addResource("{proxy+}");
    const resizeIntegration = new api.LambdaIntegration(imagehandlerFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    resource1.addMethod('ANY', resizeIntegration);


    // cloudfront caching policy
    const cachingPolicy = new cloudfront.CachePolicy(this, 'CachingPolicy', {
        cachePolicyName: 'sih-caching-policy',
        comment: 'Caching policy for imagehandler',
        defaultTtl: Duration.seconds(86400),
        minTtl: Duration.seconds(1),
        maxTtl: Duration.seconds(31536000),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList('accept','origin'),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('signature'),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: false,
      });

    //cloudfront distribution
      const cloudfrontdist = new cloudfront.Distribution(this, 'ImagehandlerHandlerCustomPolicy', {
        defaultBehavior: {
          origin: new origins.RestApiOrigin(apigw),
          cachePolicy: cachingPolicy,
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
        comment: 'Serverless Image handler',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        enableLogging: true,
        logBucket: logBucket,
        logFilePrefix: 'imagehandler',
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
        errorResponses: [
          {
            httpStatus: 500,
            ttl: Duration.seconds(600),
          },
          {
            httpStatus: 501,
            ttl: Duration.seconds(600),
          },
          {
            httpStatus: 502,
            ttl: Duration.seconds(600),
          },
          {
            httpStatus: 503,
            ttl: Duration.seconds(600),
          },
          {
            httpStatus: 504,
            ttl: Duration.seconds(600),
          },
        ],
      });

    // outputs
    new cdk.CfnOutput(this, 'cloudfronturl', {
      value: `https://${cloudfrontdist.distributionDomainName}`,
    });

  }
}
