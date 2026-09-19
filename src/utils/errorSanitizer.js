/**
 * @file errorSanitizer.js
 * @description Frontend error message sanitizer for member-upload.
 * Translates low-level database exceptions, network failures, and technical errors
 * into clean, user-friendly messages, ensuring raw engine internals never leak to users.
 */

const DEFAULT_ERROR_MESSAGE =
  "We encountered an unexpected issue while processing your request. Please try again or contact support.";

/**
 * Formats any raw error, network response, or exception string into a friendly user message.
 *
 * @param {Error|string|Object} rawError - The error object or string from catch/response
 * @param {Object} [options]
 * @param {string} [options.fallbackMessage] - Custom fallback message if unknown
 * @returns {string} User-friendly sanitized message
 */
export function formatUserErrorMessage(rawError, options = {}) {
  if (!rawError) {
    return options.fallbackMessage || DEFAULT_ERROR_MESSAGE;
  }

  let text = "";
  if (typeof rawError === "string") {
    text = rawError;
  } else if (rawError instanceof Error) {
    text = rawError.message || "";
  } else if (typeof rawError === "object") {
    text = rawError.message || rawError.detail || rawError.error || JSON.stringify(rawError);
  }

  text = String(text || "").trim();
  if (!text) {
    return options.fallbackMessage || DEFAULT_ERROR_MESSAGE;
  }

  const lower = text.toLowerCase();

  // 1. Numerical / Arithmetic Overflow (e.g. 32-bit INT ceiling exceeded)
  if (
    lower.includes("arithmetic overflow") ||
    lower.includes("converting expression to data type int") ||
    lower.includes("numeric overflow") ||
    lower.includes("overflow error")
  ) {
    return "One or more numerical values (such as Staff ID, salary, or sums) exceed supported system limits. Please verify your data and try again.";
  }

  // 2. Field Length Exceeded / String Truncation
  if (
    lower.includes("string or binary data would be truncated") ||
    lower.includes("data would be truncated") ||
    lower.includes("exceeds max length")
  ) {
    return "One or more text fields exceed the maximum allowed length (e.g. name or address). Please shorten the text and re-upload.";
  }

  // 3. Date Parsing / Conversion Failures
  if (
    lower.includes("conversion failed when converting date") ||
    lower.includes("converting date and/or time from character string") ||
    lower.includes("invalid date") ||
    lower.includes("out of range for date")
  ) {
    return "One or more dates in the file are invalid. Please ensure all dates follow the standard YYYY-MM-DD format.";
  }

  // 4. Duplicate / Unique / Primary Key Constraint Violations
  if (
    lower.includes("violation of primary key constraint") ||
    lower.includes("violation of unique key constraint") ||
    lower.includes("cannot insert duplicate key") ||
    lower.includes("duplicate key")
  ) {
    return "Duplicate record conflict detected. Some member records in this file already exist in the database.";
  }

  // 5. Foreign Key / Relationship Integrity Violation
  if (
    lower.includes("foreign key constraint") ||
    lower.includes("conflicted with the foreign key")
  ) {
    return "A referenced corporate, policy, or member ID could not be found in the system.";
  }

  // 6. Concurrency / File Lock Exclusivity
  if (
    lower.includes("is locked by user") ||
    lower.includes("cannot upload. file is locked") ||
    lower.includes("lock request time out") ||
    lower.includes("deadlock victim")
  ) {
    return "This file is currently being reviewed or updated by another user. Please wait a moment and try again.";
  }

  // 7. Policy / Corporate Entity Resolution Mismatch
  if (
    lower.includes("could not resolve policy") ||
    lower.includes("company name does not match policy") ||
    lower.includes("policy number not found")
  ) {
    return "The policy number or company name in this file does not match your corporate records. Please review the policy details.";
  }

  // 8. Excel Workbook / File Structure Failures
  if (
    lower.includes("no headers found") ||
    lower.includes("workbook has no worksheets") ||
    lower.includes("only csv or excel files are allowed") ||
    lower.includes("invalid file type")
  ) {
    return "The uploaded spreadsheet has an invalid format or is missing required columns. Please use the approved template.";
  }

  // 9. S3 / Cloud File Storage Failures
  if (
    lower.includes("s3 storage is not configured") ||
    lower.includes("putobjectcommand") ||
    lower.includes("getobjectcommand") ||
    lower.includes("aws") ||
    lower.includes("bucket")
  ) {
    return "File storage service is temporarily unavailable. Please retry in a few moments or contact support.";
  }

  // 10. Network / Connectivity / Gateway Failures
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("load failed") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("socket hang up") ||
    lower.includes("connection lost") ||
    lower.includes("timeout") ||
    lower.includes("502 bad gateway") ||
    lower.includes("504 gateway")
  ) {
    return "Unable to connect to the server. Please check your internet connection or try again shortly.";
  }

  // 11. Technical Leak Guard: Filter out SQL, driver, and code internals
  if (
    lower.includes("requesterror") ||
    lower.includes("tedious") ||
    lower.includes("syntaxerror") ||
    lower.includes("typeerror") ||
    lower.includes("at connection.") ||
    lower.includes("cannot read properties of") ||
    lower.includes("dbo.") ||
    lower.includes("sql server") ||
    lower.includes("invalid column") ||
    lower.includes("statement(s) could not be prepared")
  ) {
    return options.fallbackMessage || DEFAULT_ERROR_MESSAGE;
  }

  // If the message is already friendly and clean, return it directly
  return text;
}
