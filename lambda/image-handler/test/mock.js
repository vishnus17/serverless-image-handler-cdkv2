"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAwsRekognition = exports.mockAwsSecretManager = exports.mockAwsS3 = void 0;
exports.mockAwsS3 = {
    headObject: jest.fn(),
    copyObject: jest.fn(),
    getObject: jest.fn(),
    putObject: jest.fn(),
    headBucket: jest.fn(),
    createBucket: jest.fn(),
    putBucketEncryption: jest.fn(),
    putBucketPolicy: jest.fn()
};
jest.mock('aws-sdk/clients/s3', () => jest.fn(() => (Object.assign({}, exports.mockAwsS3))));
exports.mockAwsSecretManager = {
    getSecretValue: jest.fn()
};
jest.mock('aws-sdk/clients/secretsmanager', () => jest.fn(() => (Object.assign({}, exports.mockAwsSecretManager))));
exports.mockAwsRekognition = {
    detectFaces: jest.fn(),
    detectModerationLabels: jest.fn()
};
jest.mock('aws-sdk/clients/rekognition', () => jest.fn(() => (Object.assign({}, exports.mockAwsRekognition))));
//# sourceMappingURL=mock.js.map