"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingLevel = void 0;
/**
 * The supported logging level.
 */
var LoggingLevel;
(function (LoggingLevel) {
    LoggingLevel[LoggingLevel["ERROR"] = 1] = "ERROR";
    LoggingLevel[LoggingLevel["WARN"] = 2] = "WARN";
    LoggingLevel[LoggingLevel["INFO"] = 3] = "INFO";
    LoggingLevel[LoggingLevel["DEBUG"] = 4] = "DEBUG";
    LoggingLevel[LoggingLevel["VERBOSE"] = 5] = "VERBOSE";
})(LoggingLevel = exports.LoggingLevel || (exports.LoggingLevel = {}));
/**
 * Logger class.
 */
class Logger {
    /**
     * Sets up the default properties.
     * @param name The logger name which will be shown in the log.
     * @param loggingLevel The logging level to show the minimum logs.
     */
    constructor(name, loggingLevel) {
        this.name = name;
        if (typeof loggingLevel === 'string' || !loggingLevel) {
            this.loggingLevel = LoggingLevel[loggingLevel] || LoggingLevel.ERROR;
        }
        else {
            this.loggingLevel = loggingLevel;
        }
    }
    /**
     * Logs when the logging level is lower than the default logging level.
     * @param loggingLevel The logging level of the log.
     * @param messages The log messages.
     */
    log(loggingLevel, ...messages) {
        if (loggingLevel <= this.loggingLevel) {
            this.logInternal(loggingLevel, ...messages);
        }
    }
    /**
     * Logs based on the logging level.
     * @param loggingLevel The logging level of the log.
     * @param messages The log messages.
     */
    logInternal(loggingLevel, ...messages) {
        switch (loggingLevel) {
            case LoggingLevel.VERBOSE:
            case LoggingLevel.DEBUG:
                console.debug(`[${this.name}]`, ...messages);
                break;
            case LoggingLevel.INFO:
                console.info(`[${this.name}]`, ...messages);
                break;
            case LoggingLevel.WARN:
                console.warn(`[${this.name}]`, ...messages);
                break;
            default:
                console.error(`[${this.name}]`, ...messages);
                break;
        }
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map