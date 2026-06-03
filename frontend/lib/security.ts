import { logger } from "./logger";

class EnterpriseSecurityEngine {
  /**
   * Escape standard HTML special characters to prevent dynamic scripting injections (XSS).
   */
  public escapeHtml(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Sanitize form inputs by removing dangerous HTML/script elements while leaving normal punctuation intact.
   */
  public sanitizeInput(value: string): string {
    if (!value || typeof value !== "string") return "";
    
    // Remove script tags, onload attributes, javascript: links
    let sanitized = value
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<[^>]*>/g, "") // Strip HTML elements entirely
      .replace(/javascript:/gi, "")
      .replace(/onload\s*=/gi, "")
      .replace(/onerror\s*=/gi, "");

    if (value !== sanitized) {
      logger.audit("INPUT_SANITIZED", "User form values", "system", {
        originalLength: value.length,
        sanitizedLength: sanitized.length
      });
    }

    return sanitized;
  }

  /**
   * Form validation with built-in regex limits to block common SQL injectors or directory path traversals.
   */
  public isSecureString(value: string): boolean {
    if (!value || typeof value !== "string") return true;
    
    const dangerousPatterns = [
      /SELECT\s+.*\s+FROM/i,
      /UNION\s+ALL\s+SELECT/i,
      /INSERT\s+INTO/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+.*SET/i,
      /--/,
      /\.\.\// // Block path traversals
    ];

    const hasThreat = dangerousPatterns.some((pattern) => pattern.test(value));
    if (hasThreat) {
      logger.audit("SECURITY_BLOCK", "Input payload threat matching standard patterns", "system", {
        value
      });
      return false;
    }

    return true;
  }
}

export const securityEngine = new EnterpriseSecurityEngine();
export default securityEngine;
