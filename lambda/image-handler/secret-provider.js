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
exports.SecretProvider = void 0;
/**
 * Class provides cached access to the Secret Manager.
 */
class SecretProvider {
    constructor(secretsManager) {
        this.secretsManager = secretsManager;
        this.cache = { secretId: null, secret: null };
    }
    /**
     * Returns the secret associated with the secret ID.
     * Note: method caches the secret associated with `secretId` and makes a call to SecretManager
     * in case if the `secretId` changes, i.e. when SECRETS_MANAGER environment variable values changes.
     * @param secretId The secret ID.
     * @returns Secret associated with the secret ID.
     */
    getSecret(secretId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cache.secretId === secretId && this.cache.secret) {
                return this.cache.secret;
            }
            else {
                const response = yield this.secretsManager.getSecretValue({ SecretId: secretId }).promise();
                this.cache.secretId = secretId;
                this.cache.secret = response.SecretString;
                return this.cache.secret;
            }
        });
    }
}
exports.SecretProvider = SecretProvider;
//# sourceMappingURL=secret-provider.js.map