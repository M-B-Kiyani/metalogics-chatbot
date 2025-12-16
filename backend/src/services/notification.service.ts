import { Booking } from "@prisma/client";
import { EmailClient, EmailResult } from "../integrations/email.client";
import {
  userConfirmationTemplate,
  adminNotificationTemplate,
  bookingUpdateTemplate,
  cancellationTemplate,
} from "../templates/email.templates";
import { logger } from "../utils/logger";
import { config } from "../config";
import { generateICS, generateCancellationICS } from "../utils/ics-generator";

/**
 * NotificationService handles sending booking-related email notifications
 * Implements error handling that logs failures but doesn't block operations
 */
export class NotificationService {
  private emailClient: EmailClient;
  private adminEmail: string;

  constructor(emailClient?: EmailClient) {
    this.emailClient = emailClient || new EmailClient();
    this.adminEmail = config.email.adminEmail;

    logger.info("NotificationService initialized", {
      adminEmail: this.adminEmail,
    });
  }

  /**
   * Sends booking confirmation emails to both user and admin
   * Logs failures but doesn't throw errors to avoid blocking booking creation
   *
   * @param booking - The booking to send confirmation for
   * @returns Promise<void>
   */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    logger.info("Sending booking confirmation emails", {
      bookingId: booking.id,
      userEmail: booking.email,
    });

    // Send confirmation to user
    const userResult = await this.sendUserConfirmation(booking);

    // Send notification to admin
    const adminResult = await this.sendAdminNotification(booking);

    // Log overall result
    if (userResult.success && adminResult.success) {
      logger.info("Booking confirmation emails sent successfully", {
        bookingId: booking.id,
        userMessageId: userResult.messageId,
        adminMessageId: adminResult.messageId,
      });
    } else {
      logger.warn("Some booking confirmation emails failed", {
        bookingId: booking.id,
        userSuccess: userResult.success,
        adminSuccess: adminResult.success,
        userError: userResult.error,
        adminError: adminResult.error,
      });
    }
  }

  /**
   * Sends confirmation email to the user
   */
  private async sendUserConfirmation(booking: Booking): Promise<EmailResult> {
    try {
      const { subject, html } = userConfirmationTemplate(booking);

      // Generate ICS calendar invite
      const icsContent = generateICS(booking);

      const result = await this.emailClient.sendEmail({
        to: booking.email,
        subject,
        html,
        attachments: [
          {
            filename: "invite.ics",
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      });

      if (result.success) {
        logger.info("User confirmation email sent with calendar invite", {
          bookingId: booking.id,
          to: booking.email,
          messageId: result.messageId,
        });
      } else {
        logger.error("Failed to send user confirmation email", {
          bookingId: booking.id,
          to: booking.email,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Unexpected error sending user confirmation email", {
        bookingId: booking.id,
        to: booking.email,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sends notification email to admin
   */
  private async sendAdminNotification(booking: Booking): Promise<EmailResult> {
    try {
      const { subject, html } = adminNotificationTemplate(booking);

      // Generate ICS calendar invite for admin
      const icsContent = generateICS(booking);

      const result = await this.emailClient.sendEmail({
        to: this.adminEmail,
        subject,
        html,
        attachments: [
          {
            filename: "invite.ics",
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      });

      if (result.success) {
        logger.info("Admin notification email sent with calendar invite", {
          bookingId: booking.id,
          to: this.adminEmail,
          messageId: result.messageId,
        });
      } else {
        logger.error("Failed to send admin notification email", {
          bookingId: booking.id,
          to: this.adminEmail,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Unexpected error sending admin notification email", {
        bookingId: booking.id,
        to: this.adminEmail,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sends booking update notification to the user
   * Logs failures but doesn't throw errors
   *
   * @param booking - The updated booking
   * @returns Promise<void>
   */
  async sendBookingUpdate(booking: Booking): Promise<void> {
    logger.info("Sending booking update notification", {
      bookingId: booking.id,
      userEmail: booking.email,
    });

    try {
      const { subject, html } = bookingUpdateTemplate(booking);

      const result = await this.emailClient.sendEmail({
        to: booking.email,
        subject,
        html,
      });

      if (result.success) {
        logger.info("Booking update notification sent successfully", {
          bookingId: booking.id,
          to: booking.email,
          messageId: result.messageId,
        });
      } else {
        logger.error("Failed to send booking update notification", {
          bookingId: booking.id,
          to: booking.email,
          error: result.error,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Unexpected error sending booking update notification", {
        bookingId: booking.id,
        to: booking.email,
        error: errorMessage,
      });
    }
  }

  /**
   * Sends cancellation notification to the user
   * Logs failures but doesn't throw errors
   *
   * @param booking - The cancelled booking
   * @returns Promise<void>
   */
  async sendCancellationNotification(booking: Booking): Promise<void> {
    logger.info("Sending cancellation notification", {
      bookingId: booking.id,
      userEmail: booking.email,
    });

    try {
      const { subject, html } = cancellationTemplate(booking);

      // Generate cancellation ICS to remove event from calendar
      const icsContent = generateCancellationICS(booking);

      const result = await this.emailClient.sendEmail({
        to: booking.email,
        subject,
        html,
        attachments: [
          {
            filename: "cancellation.ics",
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=CANCEL",
          },
        ],
      });

      if (result.success) {
        logger.info(
          "Cancellation notification sent successfully with calendar update",
          {
            bookingId: booking.id,
            to: booking.email,
            messageId: result.messageId,
          }
        );
      } else {
        logger.error("Failed to send cancellation notification", {
          bookingId: booking.id,
          to: booking.email,
          error: result.error,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Unexpected error sending cancellation notification", {
        bookingId: booking.id,
        to: booking.email,
        error: errorMessage,
      });
    }
  }

  /**
   * Closes the email client connection
   */
  async close(): Promise<void> {
    await this.emailClient.close();
    logger.info("NotificationService closed");
  }
}
