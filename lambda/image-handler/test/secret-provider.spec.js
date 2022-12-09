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
const secretsmanager_1 = __importDefault(require("aws-sdk/clients/secretsmanager"));
const secret_provider_1 = require("../secret-provider");
describe('index', () => {
    const secretsManager = new secretsmanager_1.default();
    afterEach(() => {
        mock_1.mockAwsSecretManager.getSecretValue.mockReset();
    });
    it('Should get a secret from secret manager if the cache is empty', () => __awaiter(void 0, void 0, void 0, function* () {
        mock_1.mockAwsSecretManager.getSecretValue.mockImplementationOnce(() => ({
            promise() {
                return Promise.resolve({ SecretString: 'secret_value' });
            }
        }));
        const secretProvider = new secret_provider_1.SecretProvider(secretsManager);
        const secretKeyFistCall = yield secretProvider.getSecret('secret_id');
        const secretKeySecondCall = yield secretProvider.getSecret('secret_id');
        expect(secretKeyFistCall).toEqual('secret_value');
        expect(secretKeySecondCall).toEqual('secret_value');
        expect(mock_1.mockAwsSecretManager.getSecretValue).toBeCalledTimes(1);
        expect(mock_1.mockAwsSecretManager.getSecretValue).toHaveBeenCalledWith({ SecretId: 'secret_id' });
    }));
    it('Should get a secret from secret manager and invalidate the cache', () => __awaiter(void 0, void 0, void 0, function* () {
        mock_1.mockAwsSecretManager.getSecretValue.mockImplementationOnce(() => ({
            promise() {
                return Promise.resolve({ SecretString: 'secret_value_1' });
            }
        }));
        mock_1.mockAwsSecretManager.getSecretValue.mockImplementationOnce(() => ({
            promise() {
                return Promise.resolve({ SecretString: 'secret_value_2' });
            }
        }));
        const secretProvider = new secret_provider_1.SecretProvider(secretsManager);
        const getSecretKeyFistCall = yield secretProvider.getSecret('secret_id_1');
        const getSecretKeySecondCall = yield secretProvider.getSecret('secret_id_2');
        const getSecretKeyThirdCall = yield secretProvider.getSecret('secret_id_2');
        expect(getSecretKeyFistCall).toEqual('secret_value_1');
        expect(getSecretKeySecondCall).toEqual('secret_value_2');
        expect(getSecretKeyThirdCall).toEqual('secret_value_2');
        expect(mock_1.mockAwsSecretManager.getSecretValue).toBeCalledTimes(2);
        expect(mock_1.mockAwsSecretManager.getSecretValue).toHaveBeenCalledWith({ SecretId: 'secret_id_1' });
        expect(mock_1.mockAwsSecretManager.getSecretValue).toHaveBeenCalledWith({ SecretId: 'secret_id_2' });
    }));
});
//# sourceMappingURL=secret-provider.spec.js.map