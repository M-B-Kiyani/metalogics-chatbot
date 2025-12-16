import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../utils/logger";
import { RetryService } from "../services/retry.service";
import { config } from "../config";

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Email sending options
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * Result of email sending operation
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SMTP configuration from environment variables
 */
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * EmailClient handles email sending via SMTP using Nodemailer
 * Implements retry logic for transient failures
 */
export class EmailClient {
  private transporter: Transporter;
  private retryService: RetryService;
  private fromAddress: string;

  constructor() {
    const smtpConfig = this.loadSMTPConfig();
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.fromAddress = config.email.fromEmail;

    // Configure retry service with email-specific settings from config
    this.retryService = new RetryService({
      maxAttempts: config.email.retryAttempts,
      initialDelay: config.email.retryDelay,
      maxDelay: config.email.retryDelay * 4, // Max delay is 4x initial
      backoffMultiplier: 2,
    });

    logger.info("EmailClient initialized", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      from: this.fromAddress,
    });
  }

  /**
   * Loads SMTP configuration from config module
   */
  private loadSMTPConfig(): SMTPConfig {
    return {
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpPort === 465, // Use TLS for port 465
      auth: {
        user: config.email.smtpUser,
        pass: config.email.smtpPassword,
      },
    };
  }

  /**
   * Verifies SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error("SMTP connection verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Sends an email with retry logic
   * Retries up to 3 times with exponential backoff (2s, 4s, 8s)
   *
   * @param options - Email sending options
   * @returns EmailResult indicating success or failure
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      logger.info("Attempting to send email", {
        to: options.to,
        subject: options.subject,
      });

      // Use retry service to handle transient failures
      const info = await this.retryService.withRetry(async () => {
        return await this.transporter.sendMail({
          from: `${config.email.fromName} <${this.fromAddress}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.stripHtml(options.html),
          attachments: options.attachments,
        });
      });

      logger.info("Email sent successfully", {
        to: options.to,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to send email after all retry attempts", {
        to: options.to,
        subject: options.subject,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Strips HTML tags from content to create plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Closes the email transporter connection
   */
  async close(): Promise<void> {
    this.transporter.close();
    logger.info("EmailClient connection closed");
  }
}
