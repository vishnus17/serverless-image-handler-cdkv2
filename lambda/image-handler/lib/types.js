"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageHandlerError = void 0;
class ImageHandlerError extends Error {
    constructor(status, code, message) {
        super();
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
exports.ImageHandlerError = ImageHandlerError;
//# sourceMappingURL=types.js.map