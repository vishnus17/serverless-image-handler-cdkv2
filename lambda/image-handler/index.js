"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const rekognition_1 = __importDefault(require("aws-sdk/clients/rekognition"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const secretsmanager_1 = __importDefault(require("aws-sdk/clients/secretsmanager"));
const get_options_1 = require("../solution-utils/get-options");
const helpers_1 = require("../solution-utils/helpers");
const image_handler_1 = require("./image-handler");
const image_request_1 = require("./image-request");
const lib_1 = require("./lib");
const secret_provider_1 = require("./secret-provider");
const awsSdkOptions = (0, get_options_1.getOptions)();
const s3Client = new s3_1.default(awsSdkOptions);
const rekognitionClient = new rekognition_1.default(awsSdkOptions);
const secretsManagerClient = new secretsmanager_1.default(awsSdkOptions);
const secretProvider = new secret_provider_1.SecretProvider(secretsManagerClient);
/**
 * Image handler Lambda handler.
 * @param event The image handler request event.
 * @returns Processed request response.
 */
function handler(event) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Received event:', JSON.stringify(event, null, 2));
        const imageRequest = new image_request_1.ImageRequest(s3Client, secretProvider);
        const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
        const isAlb = event.requestContext && Object.prototype.hasOwnProperty.call(event.requestContext, 'elb');
        try {
            const imageRequestInfo = yield imageRequest.setup(event);
            console.info(imageRequestInfo);
            const processedRequest = yield imageHandler.process(imageRequestInfo);
            let headers = getResponseHeaders(false, isAlb);
            headers['Content-Type'] = imageRequestInfo.contentType;
            // eslint-disable-next-line dot-notation
            headers['Expires'] = imageRequestInfo.expires;
            headers['Last-Modified'] = imageRequestInfo.lastModified;
            headers['Cache-Control'] = imageRequestInfo.cacheControl;
            // Apply the custom headers overwriting any that may need overwriting
            if (imageRequestInfo.headers) {
                headers = Object.assign(Object.assign({}, headers), imageRequestInfo.headers);
            }
            return {
                statusCode: lib_1.StatusCodes.OK,
                isBase64Encoded: true,
                headers: headers,
                body: processedRequest
            };
        }
        catch (error) {
            console.error(error);
            // Default fallback image
            const { ENABLE_DEFAULT_FALLBACK_IMAGE, DEFAULT_FALLBACK_IMAGE_BUCKET, DEFAULT_FALLBACK_IMAGE_KEY } = process.env;
            if (ENABLE_DEFAULT_FALLBACK_IMAGE === 'Yes' && !(0, helpers_1.isNullOrWhiteSpace)(DEFAULT_FALLBACK_IMAGE_BUCKET) && !(0, helpers_1.isNullOrWhiteSpace)(DEFAULT_FALLBACK_IMAGE_KEY)) {
                try {
                    const defaultFallbackImage = yield s3Client.getObject({ Bucket: DEFAULT_FALLBACK_IMAGE_BUCKET, Key: DEFAULT_FALLBACK_IMAGE_KEY }).promise();
                    const headers = getResponseHeaders(false, isAlb);
                    headers['Content-Type'] = defaultFallbackImage.ContentType;
                    headers['Last-Modified'] = defaultFallbackImage.LastModified;
                    headers['Cache-Control'] = 'max-age=31536000,public';
                    return {
                        statusCode: error.status ? error.status : lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                        isBase64Encoded: true,
                        headers: headers,
                        body: defaultFallbackImage.Body.toString('base64')
                    };
                }
                catch (error) {
                    console.error('Error occurred while getting the default fallback image.', error);
                }
            }
            if (error.status) {
                return {
                    statusCode: error.status,
                    isBase64Encoded: false,
                    headers: getResponseHeaders(true, isAlb),
                    body: JSON.stringify(error)
                };
            }
            else {
                return {
                    statusCode: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    isBase64Encoded: false,
                    headers: getResponseHeaders(true, isAlb),
                    body: JSON.stringify({ message: 'Internal error. Please contact the system administrator.', code: 'InternalError', status: lib_1.StatusCodes.INTERNAL_SERVER_ERROR })
                };
            }
        }
    });
}
exports.handler = handler;
/**
 * Generates the appropriate set of response headers based on a success or error condition.
 * @param isError Has an error been thrown.
 * @param isAlb Is the request from ALB.
 * @returns Headers.
 */
function getResponseHeaders(isError = false, isAlb = false) {
    const { CORS_ENABLED, CORS_ORIGIN } = process.env;
    const corsEnabled = CORS_ENABLED === 'Yes';
    const headers = {
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    if (!isAlb) {
        headers['Access-Control-Allow-Credentials'] = true;
    }
    if (corsEnabled) {
        headers['Access-Control-Allow-Origin'] = CORS_ORIGIN;
    }
    if (isError) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}
//# sourceMappingURL=index.js.map