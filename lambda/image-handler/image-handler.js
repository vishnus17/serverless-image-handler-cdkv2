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
exports.ImageHandler = void 0;
const sharp_1 = __importDefault(require("sharp"));
const lib_1 = require("./lib");
class ImageHandler {
    constructor(s3Client, rekognitionClient) {
        this.s3Client = s3Client;
        this.rekognitionClient = rekognitionClient;
        this.LAMBDA_PAYLOAD_LIMIT = 6 * 1024 * 1024;
    }
    /**
     * Main method for processing image requests and outputting modified images.
     * @param imageRequestInfo An image request.
     * @returns Processed and modified image encoded as base64 string.
     */
    process(imageRequestInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const { originalImage, edits } = imageRequestInfo;
            let base64EncodedImage = '';
            if (edits && Object.keys(edits).length) {
                let image = null;
                if (edits.rotate !== undefined && edits.rotate === null) {
                    image = (0, sharp_1.default)(originalImage, { failOnError: false });
                }
                else {
                    const metadata = yield (0, sharp_1.default)(originalImage, { failOnError: false }).metadata();
                    image = metadata.orientation
                        ? (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata({ orientation: metadata.orientation })
                        : (0, sharp_1.default)(originalImage, { failOnError: false }).withMetadata();
                }
                const modifiedImage = yield this.applyEdits(image, edits);
                if (imageRequestInfo.outputFormat !== undefined) {
                    if (imageRequestInfo.outputFormat === lib_1.ImageFormatTypes.WEBP && typeof imageRequestInfo.reductionEffort !== 'undefined') {
                        modifiedImage.webp({ reductionEffort: imageRequestInfo.reductionEffort });
                    }
                    else {
                        modifiedImage.toFormat(ImageHandler.convertImageFormatType(imageRequestInfo.outputFormat));
                    }
                }
                const imageBuffer = yield modifiedImage.toBuffer();
                base64EncodedImage = imageBuffer.toString('base64');
            }
            else {
                // change output format if specified
                if (imageRequestInfo.outputFormat !== undefined) {
                    const modifiedImage = (0, sharp_1.default)(originalImage, { failOnError: false });
                    modifiedImage.toFormat(ImageHandler.convertImageFormatType(imageRequestInfo.outputFormat));
                    const imageBuffer = yield modifiedImage.toBuffer();
                    base64EncodedImage = imageBuffer.toString('base64');
                }
                else {
                    base64EncodedImage = originalImage.toString('base64');
                }
            }
            // binary data need to be base64 encoded to pass to the API Gateway proxy https://docs.aws.amazon.com/apigateway/latest/developerguide/lambda-proxy-binary-media.html.
            // checks whether base64 encoded image fits in 6M limit, see https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html.
            if (base64EncodedImage.length > this.LAMBDA_PAYLOAD_LIMIT) {
                throw new lib_1.ImageHandlerError(lib_1.StatusCodes.REQUEST_TOO_LONG, 'TooLargeImageException', 'The converted image is too large to return.');
            }
            return base64EncodedImage;
        });
    }
    /**
     * Applies image modifications to the original image based on edits.
     * @param originalImage The original sharp image.
     * @param edits The edits to be made to the original image.
     * @returns A modifications to the original image.
     */
    applyEdits(originalImage, edits) {
        return __awaiter(this, void 0, void 0, function* () {
            if (edits.resize === undefined) {
                edits.resize = {};
                edits.resize.fit = lib_1.ImageFitTypes.INSIDE;
            }
            else {
                if (edits.resize.width)
                    edits.resize.width = Math.round(Number(edits.resize.width));
                if (edits.resize.height)
                    edits.resize.height = Math.round(Number(edits.resize.height));
            }
            // Apply the image edits
            for (const edit in edits) {
                switch (edit) {
                    case 'overlayWith': {
                        let imageMetadata = yield originalImage.metadata();
                        if (edits.resize) {
                            const imageBuffer = yield originalImage.toBuffer();
                            const resizeOptions = edits.resize;
                            imageMetadata = yield (0, sharp_1.default)(imageBuffer).resize(resizeOptions).metadata();
                        }
                        const { bucket, key, wRatio, hRatio, alpha, options } = edits.overlayWith;
                        const overlay = yield this.getOverlayImage(bucket, key, wRatio, hRatio, alpha, imageMetadata);
                        const overlayMetadata = yield (0, sharp_1.default)(overlay).metadata();
                        const overlayOption = Object.assign(Object.assign({}, options), { input: overlay });
                        if (options) {
                            const { left: leftOption, top: topOption } = options;
                            const getSize = (editSize, imageSize, overlaySize) => {
                                let resultSize = NaN;
                                if (editSize !== undefined) {
                                    if (editSize.endsWith('p')) {
                                        resultSize = parseInt(editSize.replace('p', ''));
                                        resultSize = Math.floor(resultSize < 0 ? imageSize + (imageSize * resultSize) / 100 - overlaySize : (imageSize * resultSize) / 100);
                                    }
                                    else {
                                        resultSize = parseInt(editSize);
                                        if (resultSize < 0) {
                                            resultSize = imageSize + resultSize - overlaySize;
                                        }
                                    }
                                }
                                return resultSize;
                            };
                            const left = getSize(leftOption, imageMetadata.width, overlayMetadata.width);
                            if (!isNaN(left))
                                overlayOption.left = left;
                            const top = getSize(topOption, imageMetadata.height, overlayMetadata.height);
                            if (!isNaN(top))
                                overlayOption.top = top;
                        }
                        originalImage.composite([overlayOption]);
                        break;
                    }
                    case 'smartCrop': {
                        // smart crop can be boolean or object
                        if (edits.smartCrop === true || typeof edits.smartCrop === 'object') {
                            const { faceIndex, padding } = typeof edits.smartCrop === 'object'
                                ? edits.smartCrop
                                : {
                                    faceIndex: undefined,
                                    padding: undefined
                                };
                            const { imageBuffer, format } = yield this.getRekognitionCompatibleImage(originalImage);
                            const boundingBox = yield this.getBoundingBox(imageBuffer.data, faceIndex !== null && faceIndex !== void 0 ? faceIndex : 0);
                            const cropArea = this.getCropArea(boundingBox, padding !== null && padding !== void 0 ? padding : 0, imageBuffer.info);
                            try {
                                originalImage.extract(cropArea);
                                // convert image back to previous format
                                if (format !== imageBuffer.info.format) {
                                    originalImage.toFormat(format);
                                }
                            }
                            catch (error) {
                                throw new lib_1.ImageHandlerError(lib_1.StatusCodes.BAD_REQUEST, 'SmartCrop::PaddingOutOfBounds', 'The padding value you provided exceeds the boundaries of the original image. Please try choosing a smaller value or applying padding via Sharp for greater specificity.');
                            }
                        }
                        break;
                    }
                    case 'roundCrop': {
                        // round crop can be boolean or object
                        if (edits.roundCrop === true || typeof edits.roundCrop === 'object') {
                            const { top, left, rx, ry } = typeof edits.roundCrop === 'object'
                                ? edits.roundCrop
                                : {
                                    top: undefined,
                                    left: undefined,
                                    rx: undefined,
                                    ry: undefined
                                };
                            const imageBuffer = yield originalImage.toBuffer({ resolveWithObject: true });
                            const width = imageBuffer.info.width;
                            const height = imageBuffer.info.height;
                            // check for parameters, if not provided, set to defaults
                            const radiusX = rx && rx >= 0 ? rx : Math.min(width, height) / 2;
                            const radiusY = ry && ry >= 0 ? ry : Math.min(width, height) / 2;
                            const topOffset = top && top >= 0 ? top : height / 2;
                            const leftOffset = left && left >= 0 ? left : width / 2;
                            const ellipse = Buffer.from(`<svg viewBox="0 0 ${width} ${height}"> <ellipse cx="${leftOffset}" cy="${topOffset}" rx="${radiusX}" ry="${radiusY}" /></svg>`);
                            const overlayOptions = [{ input: ellipse, blend: 'dest-in' }];
                            const data = yield originalImage.composite(overlayOptions).toBuffer();
                            originalImage = (0, sharp_1.default)(data).withMetadata().trim();
                        }
                        break;
                    }
                    case 'contentModeration': {
                        // content moderation can be boolean or object
                        if (edits.contentModeration === true || typeof edits.contentModeration === 'object') {
                            const { minConfidence, blur, moderationLabels } = typeof edits.contentModeration === 'object'
                                ? edits.contentModeration
                                : {
                                    minConfidence: undefined,
                                    blur: undefined,
                                    moderationLabels: undefined
                                };
                            const { imageBuffer, format } = yield this.getRekognitionCompatibleImage(originalImage);
                            const inappropriateContent = yield this.detectInappropriateContent(imageBuffer.data, minConfidence);
                            const blurValue = blur !== undefined ? Math.ceil(blur) : 50;
                            if (blurValue >= 0.3 && blurValue <= 1000) {
                                if (moderationLabels) {
                                    for (const moderationLabel of inappropriateContent.ModerationLabels) {
                                        if (moderationLabels.includes(moderationLabel.Name)) {
                                            originalImage.blur(blur);
                                            break;
                                        }
                                    }
                                }
                                else if (inappropriateContent.ModerationLabels.length) {
                                    originalImage.blur(blur);
                                }
                            }
                            // convert image back to previous format
                            if (format !== imageBuffer.info.format) {
                                originalImage.toFormat(format);
                            }
                        }
                        break;
                    }
                    case 'crop': {
                        try {
                            originalImage.extract(edits.crop);
                        }
                        catch (error) {
                            throw new lib_1.ImageHandlerError(lib_1.StatusCodes.BAD_REQUEST, 'Crop::AreaOutOfBounds', 'The cropping area you provided exceeds the boundaries of the original image. Please try choosing a correct cropping value.');
                        }
                        break;
                    }
                    default: {
                        if (edit in originalImage) {
                            originalImage[edit](edits[edit]);
                        }
                    }
                }
            }
            // Return the modified image
            return originalImage;
        });
    }
    /**
     * Gets an image to be used as an overlay to the primary image from an Amazon S3 bucket.
     * @param bucket The name of the bucket containing the overlay.
     * @param key The object keyname corresponding to the overlay.
     * @param wRatio The width rate of the overlay image.
     * @param hRatio The height rate of the overlay image.
     * @param alpha The transparency alpha to the overlay.
     * @param sourceImageMetadata The metadata of the source image.
     * @returns An image to bo ber used as an overlay.
     */
    getOverlayImage(bucket, key, wRatio, hRatio, alpha, sourceImageMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = { Bucket: bucket, Key: key };
            try {
                const { width, height } = sourceImageMetadata;
                const overlayImage = yield this.s3Client.getObject(params).promise();
                const resizeOptions = {
                    fit: lib_1.ImageFitTypes.INSIDE
                };
                // Set width and height of the watermark image based on the ratio
                const zeroToHundred = /^(100|[1-9]?[0-9])$/;
                if (zeroToHundred.test(wRatio)) {
                    resizeOptions.width = Math.floor((width * parseInt(wRatio)) / 100);
                }
                if (zeroToHundred.test(hRatio)) {
                    resizeOptions.height = Math.floor((height * parseInt(hRatio)) / 100);
                }
                // If alpha is not within 0-100, the default alpha is 0 (fully opaque).
                const alphaValue = zeroToHundred.test(alpha) ? parseInt(alpha) : 0;
                const imageBuffer = Buffer.isBuffer(overlayImage.Body) ? overlayImage.Body : Buffer.from(overlayImage.Body);
                return yield (0, sharp_1.default)(imageBuffer)
                    .resize(resizeOptions)
                    .composite([
                    {
                        input: Buffer.from([255, 255, 255, 255 * (1 - alphaValue / 100)]),
                        raw: {
                            width: 1,
                            height: 1,
                            channels: 4
                        },
                        tile: true,
                        blend: 'dest-in'
                    }
                ])
                    .toBuffer();
            }
            catch (error) {
                throw new lib_1.ImageHandlerError(error.statusCode ? error.statusCode : lib_1.StatusCodes.INTERNAL_SERVER_ERROR, error.code, error.message);
            }
        });
    }
    /**
     * Calculates the crop area for a smart-cropped image based on the bounding box data returned by Amazon Rekognition, as well as padding options and the image metadata.
     * @param boundingBox The bounding box of the detected face.
     * @param padding Set of options for smart cropping.
     * @param boxSize Sharp image metadata.
     * @returns Calculated crop area for a smart-cropped image.
     */
    getCropArea(boundingBox, padding, boxSize) {
        // calculate needed options dimensions
        let left = Math.floor(boundingBox.left * boxSize.width - padding);
        let top = Math.floor(boundingBox.top * boxSize.height - padding);
        let extractWidth = Math.floor(boundingBox.width * boxSize.width + padding * 2);
        let extractHeight = Math.floor(boundingBox.height * boxSize.height + padding * 2);
        // check if dimensions fit within image dimensions and re-adjust if necessary
        left = left < 0 ? 0 : left;
        top = top < 0 ? 0 : top;
        const maxWidth = boxSize.width - left;
        const maxHeight = boxSize.height - top;
        extractWidth = extractWidth > maxWidth ? maxWidth : extractWidth;
        extractHeight = extractHeight > maxHeight ? maxHeight : extractHeight;
        // Calculate the smart crop area
        return {
            left: left,
            top: top,
            width: extractWidth,
            height: extractHeight
        };
    }
    /**
     * Gets the bounding box of the specified face index within an image, if specified.
     * @param imageBuffer The original image.
     * @param faceIndex The zero-based face index value, moving from 0 and up as confidence decreases for detected faces within the image.
     * @returns The bounding box of the specified face index within an image.
     */
    getBoundingBox(imageBuffer, faceIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = { Image: { Bytes: imageBuffer } };
            try {
                const response = yield this.rekognitionClient.detectFaces(params).promise();
                if (response.FaceDetails.length <= 0) {
                    return { height: 1, left: 0, top: 0, width: 1 };
                }
                const boundingBox = {};
                // handle bounds > 1 and < 0
                for (const bound in response.FaceDetails[faceIndex].BoundingBox) {
                    if (response.FaceDetails[faceIndex].BoundingBox[bound] < 0)
                        boundingBox[bound] = 0;
                    else if (response.FaceDetails[faceIndex].BoundingBox[bound] > 1)
                        boundingBox[bound] = 1;
                    else
                        boundingBox[bound] = response.FaceDetails[faceIndex].BoundingBox[bound];
                }
                // handle bounds greater than the size of the image
                if (boundingBox.Left + boundingBox.Width > 1) {
                    boundingBox.Width = 1 - boundingBox.Left;
                }
                if (boundingBox.Top + boundingBox.Height > 1) {
                    boundingBox.Height = 1 - boundingBox.Top;
                }
                return { height: boundingBox.Height, left: boundingBox.Left, top: boundingBox.Top, width: boundingBox.Width };
            }
            catch (error) {
                console.error(error);
                if (error.message === "Cannot read property 'BoundingBox' of undefined" || error.message === "Cannot read properties of undefined (reading 'BoundingBox')") {
                    throw new lib_1.ImageHandlerError(lib_1.StatusCodes.BAD_REQUEST, 'SmartCrop::FaceIndexOutOfRange', 'You have provided a FaceIndex value that exceeds the length of the zero-based detectedFaces array. Please specify a value that is in-range.');
                }
                else {
                    throw new lib_1.ImageHandlerError(error.statusCode ? error.statusCode : lib_1.StatusCodes.INTERNAL_SERVER_ERROR, error.code, error.message);
                }
            }
        });
    }
    /**
     * Detects inappropriate content in an image.
     * @param imageBuffer The original image.
     * @param minConfidence The options to pass to the detectModerationLabels Rekognition function.
     * @returns Detected inappropriate content in an image.
     */
    detectInappropriateContent(imageBuffer, minConfidence) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    Image: { Bytes: imageBuffer },
                    MinConfidence: minConfidence !== null && minConfidence !== void 0 ? minConfidence : 75
                };
                return yield this.rekognitionClient.detectModerationLabels(params).promise();
            }
            catch (error) {
                console.error(error);
                throw new lib_1.ImageHandlerError(error.statusCode ? error.statusCode : lib_1.StatusCodes.INTERNAL_SERVER_ERROR, error.code, error.message);
            }
        });
    }
    /**
     * Converts serverless image handler image format type to 'sharp' format.
     * @param imageFormatType Result output file type.
     * @returns Converted 'sharp' format.
     */
    static convertImageFormatType(imageFormatType) {
        switch (imageFormatType) {
            case lib_1.ImageFormatTypes.JPG:
                return 'jpg';
            case lib_1.ImageFormatTypes.JPEG:
                return 'jpeg';
            case lib_1.ImageFormatTypes.PNG:
                return 'png';
            case lib_1.ImageFormatTypes.WEBP:
                return 'webp';
            case lib_1.ImageFormatTypes.TIFF:
                return 'tiff';
            case lib_1.ImageFormatTypes.HEIF:
                return 'heif';
            case lib_1.ImageFormatTypes.RAW:
                return 'raw';
            default:
                throw new lib_1.ImageHandlerError(lib_1.StatusCodes.INTERNAL_SERVER_ERROR, 'UnsupportedOutputImageFormatException', `Format to ${imageFormatType} not supported`);
        }
    }
    /**
     * Converts the image to a rekognition compatible format if current format is not compatible.
     * @param image the image to be modified by rekognition.
     * @returns object containing image buffer data and original image format.
     */
    getRekognitionCompatibleImage(image) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadata = yield image.metadata();
            const format = metadata.format;
            let imageBuffer;
            // convert image to png if not jpeg or png
            if (!['jpeg', 'png'].includes(format)) {
                imageBuffer = yield image.png().toBuffer({ resolveWithObject: true });
            }
            else {
                imageBuffer = yield image.toBuffer({ resolveWithObject: true });
            }
            return { imageBuffer: imageBuffer, format: format };
        });
    }
}
exports.ImageHandler = ImageHandler;
//# sourceMappingURL=image-handler.js.map