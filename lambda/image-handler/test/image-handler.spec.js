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
const mock_1 = require("./mock");
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const rekognition_1 = __importDefault(require("aws-sdk/clients/rekognition"));
const image_handler_1 = require("../image-handler");
const lib_1 = require("../lib");
const s3Client = new s3_1.default();
const rekognitionClient = new rekognition_1.default();
describe('process()', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('001/default', () => {
        it('Should pass if the output image is different from the input image with edits applied', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'sample-image-001.jpg',
                edits: {
                    grayscale: true,
                    flip: true
                },
                originalImage: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            expect(result).not.toEqual(request.originalImage);
        }));
    });
    describe('002/withToFormat', () => {
        it('Should pass if the output image is in a different format than the original image', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'sample-image-001.jpg',
                outputFormat: lib_1.ImageFormatTypes.PNG,
                edits: {
                    grayscale: true,
                    flip: true
                },
                originalImage: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            expect(result).not.toEqual(request.originalImage);
        }));
        it('Should pass if the output image is webp format and reductionEffort is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'sample-image-001.jpg',
                outputFormat: lib_1.ImageFormatTypes.WEBP,
                reductionEffort: 3,
                originalImage: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
            };
            jest.spyOn((0, sharp_1.default)(), 'webp');
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            expect(result).not.toEqual(request.originalImage);
        }));
    });
    describe('003/noEditsSpecified', () => {
        it('Should pass if no edits are specified and the original image is returned', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'sample-image-001.jpg',
                originalImage: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            expect(result).toEqual(request.originalImage.toString('base64'));
        }));
    });
    describe('004/ExceedsLambdaPayloadLimit', () => {
        it('Should fail the return payload is larger than 6MB', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'sample-image-001.jpg',
                originalImage: Buffer.alloc(6 * 1024 * 1024)
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            try {
                yield imageHandler.process(request);
            }
            catch (error) {
                // Assert
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.REQUEST_TOO_LONG,
                    code: 'TooLargeImageException',
                    message: 'The converted image is too large to return.'
                });
            }
        }));
    });
    describe('005/RotateNull', () => {
        it('Should pass if rotate is null and return image without EXIF and ICC', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = fs_1.default.readFileSync('./test/image/1x1.jpg');
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'test.jpg',
                edits: {
                    rotate: null
                },
                originalImage: originalImage
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            const metadata = yield (0, sharp_1.default)(Buffer.from(result, 'base64')).metadata();
            expect(metadata).not.toHaveProperty('exif');
            expect(metadata).not.toHaveProperty('icc');
            expect(metadata).not.toHaveProperty('orientation');
        }));
    });
    describe('006/ImageOrientation', () => {
        it('Should pass if the original image has orientation', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = fs_1.default.readFileSync('./test/image/1x1.jpg');
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'test.jpg',
                edits: {
                    resize: {
                        width: 100,
                        height: 100
                    }
                },
                originalImage: originalImage
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            const metadata = yield (0, sharp_1.default)(Buffer.from(result, 'base64')).metadata();
            expect(metadata).toHaveProperty('icc');
            expect(metadata).toHaveProperty('exif');
            expect(metadata.orientation).toEqual(3);
        }));
    });
    describe('007/ImageWithoutOrientation', () => {
        it('Should pass if the original image does not have orientation', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const request = {
                requestType: lib_1.RequestTypes.DEFAULT,
                bucket: 'sample-bucket',
                key: 'test.jpg',
                edits: {
                    resize: {
                        width: 100,
                        height: 100
                    }
                },
                originalImage: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.process(request);
            // Assert
            const metadata = yield (0, sharp_1.default)(Buffer.from(result, 'base64')).metadata();
            expect(metadata).not.toHaveProperty('orientation');
        }));
    });
});
describe('applyEdits()', () => {
    describe('001/standardEdits', () => {
        it('Should pass if a series of standard edits are provided to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                grayscale: true,
                flip: true
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            /* eslint-disable dot-notation */
            const expectedResult1 = result['options'].greyscale;
            const expectedResult2 = result['options'].flip;
            const combinedResults = expectedResult1 && expectedResult2;
            expect(combinedResults).toEqual(true);
        }));
    });
    describe('002/overlay', () => {
        it('Should pass if an edit with the overlayWith keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'aaa',
                    key: 'bbb'
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input.buffer).toEqual(originalImage);
        }));
    });
    describe('003/overlay/options/smallerThanZero', () => {
        it('Should pass if an edit with the overlayWith keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'aaa',
                    key: 'bbb',
                    options: {
                        left: '-1',
                        top: '-1'
                    }
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input.buffer).toEqual(originalImage);
        }));
    });
    describe('004/overlay/options/greaterThanZero', () => {
        it('Should pass if an edit with the overlayWith keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'aaa',
                    key: 'bbb',
                    options: {
                        left: '1',
                        top: '1'
                    }
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input.buffer).toEqual(originalImage);
        }));
    });
    describe('005/overlay/options/percentage/greaterThanZero', () => {
        it('Should pass if an edit with the overlayWith keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'aaa',
                    key: 'bbb',
                    options: {
                        left: '50p',
                        top: '50p'
                    }
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input.buffer).toEqual(originalImage);
        }));
        it('Should pass if an edit with the overlayWith keyname contains position which could produce float number', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = fs_1.default.readFileSync('./test/image/25x15.png');
            const overlayImage = fs_1.default.readFileSync('./test/image/1x1.jpg');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'bucket',
                    key: 'key',
                    options: {
                        left: '25.5p',
                        top: '25.5p'
                    }
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: overlayImage });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            const metadata = yield result.metadata();
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(metadata.width).toEqual(25);
            expect(metadata.height).toEqual(15);
            expect(result.toBuffer()).not.toEqual(originalImage);
        }));
    });
    describe('006/overlay/options/percentage/smallerThanZero', () => {
        it('Should pass if an edit with the overlayWith keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                overlayWith: {
                    bucket: 'aaa',
                    key: 'bbb',
                    options: {
                        left: '-50p',
                        top: '-50p'
                    }
                }
            };
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input.buffer).toEqual(originalImage);
        }));
    });
    describe('007/smartCrop', () => {
        it('Should pass if an edit with the smartCrop keyname is passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                smartCrop: {
                    faceIndex: 0,
                    padding: 0
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 0.18,
                                    Left: 0.55,
                                    Top: 0.33,
                                    Width: 0.23
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result['options'].input).not.toEqual(originalImage);
        }));
    });
    describe('008/smartCrop/paddingOutOfBoundsError', () => {
        it('Should pass if an excessive padding value is passed to the smartCrop filter', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                smartCrop: {
                    faceIndex: 0,
                    padding: 80
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 0.18,
                                    Left: 0.55,
                                    Top: 0.33,
                                    Width: 0.23
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            try {
                const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
                yield imageHandler.applyEdits(image, edits);
            }
            catch (error) {
                // Assert
                expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.BAD_REQUEST,
                    code: 'SmartCrop::PaddingOutOfBounds',
                    message: 'The padding value you provided exceeds the boundaries of the original image. Please try choosing a smaller value or applying padding via Sharp for greater specificity.'
                });
            }
        }));
    });
    describe('009/smartCrop/boundingBoxError', () => {
        it('Should pass if an excessive faceIndex value is passed to the smartCrop filter', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                smartCrop: {
                    faceIndex: 10,
                    padding: 0
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 0.18,
                                    Left: 0.55,
                                    Top: 0.33,
                                    Width: 0.23
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            try {
                const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
                yield imageHandler.applyEdits(image, edits);
            }
            catch (error) {
                // Assert
                expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.BAD_REQUEST,
                    code: 'SmartCrop::FaceIndexOutOfRange',
                    message: 'You have provided a FaceIndex value that exceeds the length of the zero-based detectedFaces array. Please specify a value that is in-range.'
                });
            }
        }));
    });
    describe('010/smartCrop/faceIndexUndefined', () => {
        it('Should pass if a faceIndex value of undefined is passed to the smartCrop filter', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                smartCrop: true
            };
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 0.18,
                                    Left: 0.55,
                                    Top: 0.33,
                                    Width: 0.23
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result['options'].input).not.toEqual(originalImage);
        }));
    });
    describe('011/resizeStringTypeNumber', () => {
        it('Should pass if resize width and height are provided as string number to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                resize: {
                    width: '99.1',
                    height: '99.9'
                }
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            const resultBuffer = yield result.toBuffer();
            const convertedImage = yield (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata().resize({ width: 99, height: 100 }).toBuffer();
            expect(resultBuffer).toEqual(convertedImage);
        }));
    });
    describe('012/roundCrop/noOptions', () => {
        it('Should pass if roundCrop keyName is passed with no additional options', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const metadata = yield image.metadata();
            const edits = {
                roundCrop: true
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            const expectedResult = { width: metadata.width / 2, height: metadata.height / 2 };
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input).not.toEqual(expectedResult);
        }));
    });
    describe('013/roundCrop/withOptions', () => {
        it('Should pass if roundCrop keyName is passed with additional options', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAEAAQDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const metadata = yield image.metadata();
            const edits = {
                roundCrop: {
                    top: 100,
                    left: 100,
                    rx: 100,
                    ry: 100
                }
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            const expectedResult = { width: metadata.width / 2, height: metadata.height / 2 };
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'aaa', Key: 'bbb' });
            expect(result['options'].input).not.toEqual(expectedResult);
        }));
    });
    describe('014/contentModeration', () => {
        it('Should pass and blur image with minConfidence provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                contentModeration: {
                    minConfidence: 75
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectModerationLabels.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        ModerationLabels: [
                            {
                                Confidence: 99.76720428466,
                                Name: 'Smoking',
                                ParentName: 'Tobacco'
                            },
                            { Confidence: 99.76720428466, Name: 'Tobacco', ParentName: '' }
                        ],
                        ModerationModelVersion: '4.0'
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            const expected = image.blur(50);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result['options'].input).not.toEqual(originalImage);
            expect(result).toEqual(expected);
        }));
        it('should pass and blur to specified amount if blur option is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                contentModeration: {
                    minConfidence: 75,
                    blur: 100
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectModerationLabels.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        ModerationLabels: [
                            {
                                Confidence: 99.76720428466,
                                Name: 'Smoking',
                                ParentName: 'Tobacco'
                            },
                            { Confidence: 99.76720428466, Name: 'Tobacco', ParentName: '' }
                        ],
                        ModerationModelVersion: '4.0'
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            const expected = image.blur(100);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result['options'].input).not.toEqual(originalImage);
            expect(result).toEqual(expected);
        }));
        it('should pass and blur if content moderation label matches specified moderation label', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                contentModeration: {
                    moderationLabels: ['Smoking']
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectModerationLabels.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        ModerationLabels: [
                            {
                                Confidence: 99.76720428466,
                                Name: 'Smoking',
                                ParentName: 'Tobacco'
                            },
                            { Confidence: 99.76720428466, Name: 'Tobacco', ParentName: '' }
                        ],
                        ModerationModelVersion: '4.0'
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            const expected = image.blur(50);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result['options'].input).not.toEqual(originalImage);
            expect(result).toEqual(expected);
        }));
        it('should not blur if provided moderationLabels not found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                contentModeration: {
                    minConfidence: 75,
                    blur: 100,
                    moderationLabels: ['Alcohol']
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectModerationLabels.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        ModerationLabels: [
                            {
                                Confidence: 99.76720428466,
                                Name: 'Smoking',
                                ParentName: 'Tobacco'
                            },
                            { Confidence: 99.76720428466, Name: 'Tobacco', ParentName: '' }
                        ],
                        ModerationModelVersion: '4.0'
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.applyEdits(image, edits);
            // Assert
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
            expect(result).toEqual(image);
        }));
        it('should fail if rekognition returns an error', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const buffer = yield image.toBuffer();
            const edits = {
                contentModeration: {
                    minConfidence: 75,
                    blur: 100
                }
            };
            // Mock
            mock_1.mockAwsRekognition.detectModerationLabels.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.INTERNAL_SERVER_ERROR, 'InternalServerError', 'Amazon Rekognition experienced a service issue. Try your call again.'));
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            try {
                yield imageHandler.applyEdits(image, edits);
            }
            catch (error) {
                // Assert
                expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: buffer } });
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    code: 'InternalServerError',
                    message: 'Amazon Rekognition experienced a service issue. Try your call again.'
                });
            }
        }));
    });
    describe('015/crop/areaOutOfBoundsError', () => {
        it('Should pass if a cropping area value is out of bounds', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const originalImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            const image = (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
            const edits = {
                crop: {
                    left: 0,
                    right: 0,
                    width: 100,
                    height: 100
                }
            };
            // Act
            try {
                const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
                yield imageHandler.applyEdits(image, edits);
            }
            catch (error) {
                // Assert
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.BAD_REQUEST,
                    code: 'Crop::AreaOutOfBounds',
                    message: 'The cropping area you provided exceeds the boundaries of the original image. Please try choosing a correct cropping value.'
                });
            }
        }));
    });
});
describe('getOverlayImage()', () => {
    describe('001/validParameters', () => {
        it('Should pass if the proper bucket name and key are supplied, simulating an image file that can be retrieved', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const metadata = yield (0, sharp_1.default)(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')).metadata();
            const result = yield imageHandler.getOverlayImage('validBucket', 'validKey', '100', '100', '20', metadata);
            // Assert
            expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'validBucket', Key: 'validKey' });
            expect(result).toEqual(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADUlEQVQI12P4z8CQCgAEZgFlTg0nBwAAAABJRU5ErkJggg==', 'base64'));
        }));
        it('Should pass and do not throw an exception that the overlay image dimensions are not integer numbers', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock
            const originalImage = fs_1.default.readFileSync('./test/image/25x15.png');
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({ Body: originalImage });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const originalImageMetadata = yield (0, sharp_1.default)(originalImage).metadata();
            const result = yield imageHandler.getOverlayImage('bucket', 'key', '75', '75', '20', originalImageMetadata);
            const overlayImageMetadata = yield (0, sharp_1.default)(result).metadata();
            // Assert
            expect(overlayImageMetadata.width).toEqual(18);
            expect(overlayImageMetadata.height).toEqual(11);
        }));
    });
    describe('002/imageDoesNotExist', () => {
        it('Should throw an error if an invalid bucket or key name is provided, simulating a nonexistent overlay image', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock
            mock_1.mockAwsS3.getObject.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.INTERNAL_SERVER_ERROR, 'InternalServerError', 'SimulatedInvalidParameterException'));
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const metadata = yield (0, sharp_1.default)(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')).metadata();
            try {
                yield imageHandler.getOverlayImage('invalidBucket', 'invalidKey', '100', '100', '20', metadata);
            }
            catch (error) {
                // Assert
                expect(mock_1.mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'invalidBucket', Key: 'invalidKey' });
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    code: 'InternalServerError',
                    message: 'SimulatedInvalidParameterException'
                });
            }
        }));
    });
});
describe('getCropArea()', () => {
    describe('001/validParameters', () => {
        it('Should pass if the crop area can be calculated using a series of valid inputs/parameters', () => {
            // Arrange
            const boundingBox = {
                height: 0.18,
                left: 0.55,
                top: 0.33,
                width: 0.23
            };
            const metadata = {
                width: 200,
                height: 400
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = imageHandler.getCropArea(boundingBox, 20, metadata);
            // Assert
            const expectedResult = {
                left: 90,
                top: 112,
                width: 86,
                height: 112
            };
            expect(result).toEqual(expectedResult);
        });
    });
    describe('002/validParameters and out of range', () => {
        it('Should pass if the crop area is beyond the range of the image after padding is applied', () => {
            // Arrange
            const boundingBox = {
                height: 0.18,
                left: 0.55,
                top: 0.33,
                width: 0.23
            };
            const metadata = {
                width: 200,
                height: 400
            };
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = imageHandler.getCropArea(boundingBox, 500, metadata);
            // Assert
            const expectedResult = {
                left: 0,
                top: 0,
                width: 200,
                height: 400
            };
            expect(result).toEqual(expectedResult);
        });
    });
});
describe('getBoundingBox()', () => {
    describe('001/validParameters', () => {
        it('Should pass if the proper parameters are passed to the function', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const currentImage = Buffer.from('TestImageData');
            const faceIndex = 0;
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 0.18,
                                    Left: 0.55,
                                    Top: 0.33,
                                    Width: 0.23
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.getBoundingBox(currentImage, faceIndex);
            // Assert
            const expectedResult = {
                height: 0.18,
                left: 0.55,
                top: 0.33,
                width: 0.23
            };
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: currentImage } });
            expect(result).toEqual(expectedResult);
        }));
    });
    describe('002/errorHandling', () => {
        it('Should simulate an error condition returned by Rekognition', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const currentImage = Buffer.from('NotTestImageData');
            const faceIndex = 0;
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.reject(new lib_1.ImageHandlerError(lib_1.StatusCodes.INTERNAL_SERVER_ERROR, 'InternalServerError', 'SimulatedError'));
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            try {
                yield imageHandler.getBoundingBox(currentImage, faceIndex);
            }
            catch (error) {
                // Assert
                expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: currentImage } });
                expect(error).toMatchObject({
                    status: lib_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    code: 'InternalServerError',
                    message: 'SimulatedError'
                });
            }
        }));
    });
    describe('003/noDetectedFaces', () => {
        it('Should pass if no faces are detected', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const currentImage = Buffer.from('TestImageData');
            const faceIndex = 0;
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: []
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.getBoundingBox(currentImage, faceIndex);
            // Assert
            const expectedResult = {
                height: 1,
                left: 0,
                top: 0,
                width: 1
            };
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: currentImage } });
            expect(result).toEqual(expectedResult);
        }));
    });
    describe('004/boundsGreaterThanImageDimensions', () => {
        it('Should pass if bounds detected go beyond the image dimensions', () => __awaiter(void 0, void 0, void 0, function* () {
            // Arrange
            const currentImage = Buffer.from('TestImageData');
            const faceIndex = 0;
            // Mock
            mock_1.mockAwsRekognition.detectFaces.mockImplementationOnce(() => ({
                promise() {
                    return Promise.resolve({
                        FaceDetails: [
                            {
                                BoundingBox: {
                                    Height: 1,
                                    Left: 0.5,
                                    Top: 0.3,
                                    Width: 0.65
                                }
                            }
                        ]
                    });
                }
            }));
            // Act
            const imageHandler = new image_handler_1.ImageHandler(s3Client, rekognitionClient);
            const result = yield imageHandler.getBoundingBox(currentImage, faceIndex);
            // Assert
            const expectedResult = {
                height: 0.7,
                left: 0.5,
                top: 0.3,
                width: 0.5
            };
            expect(mock_1.mockAwsRekognition.detectFaces).toHaveBeenCalledWith({ Image: { Bytes: currentImage } });
            expect(result).toEqual(expectedResult);
        }));
    });
});
//# sourceMappingURL=image-handler.spec.js.map