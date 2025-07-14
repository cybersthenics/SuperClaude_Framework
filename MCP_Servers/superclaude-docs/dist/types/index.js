"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchError = exports.TemplateError = exports.ValidationError = exports.LocalizationError = exports.DocumentationError = void 0;
class DocumentationError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'DocumentationError';
    }
}
exports.DocumentationError = DocumentationError;
class LocalizationError extends Error {
    constructor(message, code, language, details) {
        super(message);
        this.code = code;
        this.language = language;
        this.details = details;
        this.name = 'LocalizationError';
    }
}
exports.LocalizationError = LocalizationError;
class ValidationError extends Error {
    constructor(message, code, validationErrors, details) {
        super(message);
        this.code = code;
        this.validationErrors = validationErrors;
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class TemplateError extends Error {
    constructor(message, code, templateId, details) {
        super(message);
        this.code = code;
        this.templateId = templateId;
        this.details = details;
        this.name = 'TemplateError';
    }
}
exports.TemplateError = TemplateError;
class SearchError extends Error {
    constructor(message, code, query, details) {
        super(message);
        this.code = code;
        this.query = query;
        this.details = details;
        this.name = 'SearchError';
    }
}
exports.SearchError = SearchError;
//# sourceMappingURL=index.js.map