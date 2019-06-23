'use strict';
exports.ERROR_MESSAGE_CODE_INVALID = "The message code is invalid";
/**
 * API Response Error Code
 */
exports.ERROR_CODE_INVALID_INPUT_PARAMETERS = 400;
exports.ERROR_CODE_NOT_AUTHORIZED = 401;
exports.ERROR_CODE_FORBIDDEN = 403;
exports.ERROR_CODE_NO_MODEL_FOUND = 404;
exports.ERROR_CODE_INTERNAL_SERVER_ERROR = 500;

/**
 * API Response Error Name
 */
exports.ERROR_NAME_INVALID_INPUT_PARAMETERS = "Invalid Input Parameters";
exports.ERROR_MESSAGE_NO_MODEL_FOUND = "The target %s is not found";   // e.g. The Architecture is not found
exports.ERROR_TARGET_MODEL_EXISTS = "The target %s is already exists."