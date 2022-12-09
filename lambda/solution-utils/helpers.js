"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNullOrWhiteSpace = void 0;
/**
 * Indicates whether a specified string is null, empty, or consists only of white-space characters.
 * @param str String to test.
 * @returns `true` if the `str` parameter is null or empty, or if value consists exclusively of white-space characters.
 */
function isNullOrWhiteSpace(str) {
    return !str || str.replace(/\s/g, '') === '';
}
exports.isNullOrWhiteSpace = isNullOrWhiteSpace;
//# sourceMappingURL=helpers.js.map