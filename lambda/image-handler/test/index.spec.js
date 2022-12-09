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
Object.defineProperty(exports, "__esModule", { value: true });
const mock_1 = require("./mock");
const index_1 = require("../index");
const lib_1 = require("../lib");
describe('index', () => {
    // Arrange
    process.env.SOURCE_BUCKETS = 'source-bucket';
    const mockImage = Buffer.from('SampleImageContent\n');
    const mockFallbackImage = Buffer.from('SampleFallbackImageContent\n');
    describe('TC: Success', () => {
        beforeEach(() => {
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        Body: mockImage,
                        ContentType: 'image/jpeg'
                    });
                }
            }));
        });
        it('001/should return the image when there is no error', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = { path: '/test.jpg' };
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.OK,
                isBase64Encoded: true,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Content-Type': 'image/jpeg',
                    Expires: undefined,
                    'Cache-Control': 'max-age=31536000,public',
                    'Last-Modified': undefined
                },
                body: mockImage.toString('base64')
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
        it('002/should return the image with custom headers when custom headers are provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = {
                path: '/eyJidWNrZXQiOiJzb3VyY2UtYnVja2V0Iiwia2V5IjoidGVzdC5qcGciLCJoZWFkZXJzIjp7IkN1c3RvbS1IZWFkZXIiOiJDdXN0b21WYWx1ZSJ9fQ=='
            };
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.OK,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Content-Type': 'image/jpeg',
                    Expires: undefined,
                    'Cache-Control': 'max-age=31536000,public',
                    'Last-Modified': undefined,
                    'Custom-Header': 'CustomValue'
                },
                body: mockImage.toString('base64'),
                isBase64Encoded: true
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
        it('003/should return the image when the request is from ALB', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = {
                path: '/test.jpg',
                requestContext: {
                    elb: {}
                }
            };
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.OK,
                isBase64Encoded: true,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Content-Type': 'image/jpeg',
                    Expires: undefined,
                    'Cache-Control': 'max-age=31536000,public',
                    'Last-Modified': undefined
                },
                body: mockImage.toString('base64')
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
    });
    describe('TC: Error', () => {
        it('001/should return an error JSON when an error occurs', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = { path: '/test.jpg' };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.NOT_FOUND, 'NoSuchKey', 'NoSuchKey error happened.'));
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.NOT_FOUND,
                isBase64Encoded: false,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: lib_1.StatusCodes.NOT_FOUND,
                    code: 'NoSuchKey',
                    message: `The image test.jpg does not exist or the request may not be base64 encoded properly.`
                })
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
        it('002/should return 500 error when there is no error status in the error', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = {
                path: 'eyJidWNrZXQiOiJzb3VyY2UtYnVja2V0Iiwia2V5IjoidGVzdC5qcGciLCJlZGl0cyI6eyJ3cm9uZ0ZpbHRlciI6dHJ1ZX19'
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        Body: mockImage,
                        ContentType: 'image/jpeg'
                    });
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                isBase64Encoded: false,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Internal error. Please contact the system administrator.',
                    code: 'InternalError',
                    status: lib_1.StatusCodes.INTERNAL_SERVER_ERROR
                })
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
        it('003/should return the default fallback image when an error occurs if the default fallback image is enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            process.env.ENABLE_DEFAULT_FALLBACK_IMAGE = 'Yes';
            process.env.DEFAULT_FALLBACK_IMAGE_BUCKET = 'fallback-image-bucket';
            process.env.DEFAULT_FALLBACK_IMAGE_KEY = 'fallback-image.png';
            process.env.CORS_ENABLED = 'Yes';
            process.env.CORS_ORIGIN = '*';
            const event = {
                path: '/test.jpg'
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockReset();
            mock_1.mockAwsS3.getObject
                .mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.INTERNAL_SERVER_ERROR, 'UnknownError', null));
                }
            }))
                .mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        Body: mockFallbackImage,
                        ContentType: 'image/png'
                    });
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                isBase64Encoded: true,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'image/png',
                    'Cache-Control': 'max-age=31536000,public',
                    'Last-Modified': undefined
                },
                body: mockFallbackImage.toString('base64')
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenNthCalledWith(1, { Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(mock_1.mockAwsS3.getObject).toHaveBeenNthCalledWith(2, { Bucket: 'fallback-image-bucket', Key: 'fallback-image.png' });
            expect(result).toEqual(expectedResult);
        }));
        it('004/should return an error JSON when getting the default fallback image fails if the default fallback image is enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const event = {
                path: '/test.jpg'
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockReset();
            mock_1.mockAwsS3.getObject.mockImplementation(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.NOT_FOUND, 'NoSuchKey', 'NoSuchKey error happened.'));
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.NOT_FOUND,
                isBase64Encoded: false,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: lib_1.StatusCodes.NOT_FOUND,
                    code: 'NoSuchKey',
                    message: `The image test.jpg does not exist or the request may not be base64 encoded properly.`
                })
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenNthCalledWith(1, { Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(mock_1.mockAwsS3.getObject).toHaveBeenNthCalledWith(2, { Bucket: 'fallback-image-bucket', Key: 'fallback-image.png' });
            expect(result).toEqual(expectedResult);
        }));
        it('005/should return an error JSON when the default fallback image key is not provided if the default fallback image is enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            process.env.DEFAULT_FALLBACK_IMAGE_KEY = '';
            const event = {
                path: '/test.jpg'
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.NOT_FOUND, 'NoSuchKey', 'NoSuchKey error happened.'));
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.NOT_FOUND,
                isBase64Encoded: false,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: lib_1.StatusCodes.NOT_FOUND,
                    code: 'NoSuchKey',
                    message: `The image test.jpg does not exist or the request may not be base64 encoded properly.`
                })
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
        it('006/should return an error JSON when the default fallback image bucket is not provided if the default fallback image is enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            process.env.DEFAULT_FALLBACK_IMAGE_BUCKET = '';
            const event = {
                path: '/test.jpg'
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.NOT_FOUND, 'NoSuchKey', 'NoSuchKey error happened.'));
                }
            }));
            // Act
            const result = yield (0, index_1.handler)(event);
            const expectedResult = {
                statusCode: lib_1.StatusCodes.NOT_FOUND,
                isBase64Encoded: false,
                headers: {
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: lib_1.StatusCodes.NOT_FOUND,
                    code: 'NoSuchKey',
                    message: `The image test.jpg does not exist or the request may not be base64 encoded properly.`
                })
            };
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
            expect(result).toEqual(expectedResult);
        }));
    });
    it('007/should return an error JSON when ALB request is failed', () => __awaiter(void 0, void 0, void 0, function* () {
        // Arrange
        const event = {
            path: '/test.jpg',
            requestContext: {
                elb: {}
            }
        };
        // Mock
        mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
            promise() {
                return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.NOT_FOUND, 'NoSuchKey', 'NoSuchKey error happened.'));
            }
        }));
        // Act
        const result = yield (0, index_1.handler)(event);
        const expectedResult = {
            statusCode: lib_1.StatusCodes.NOT_FOUND,
            isBase64Encoded: false,
            headers: {
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: lib_1.StatusCodes.NOT_FOUND,
                code: 'NoSuchKey',
                message: `The image test.jpg does not exist or the request may not be base64 encoded properly.`
            })
        };
        // Assert
        expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'source-bucket', Key: 'test.jpg' });
        expect(result).toEqual(expectedResult);
    }));
});
//# sourceMappingURL=index.spec.js.map