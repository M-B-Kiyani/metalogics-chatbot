import { Booking, BookingStatus } from "@prisma/client";
import { config } from "../config";

/**
 * Formats a date to a readable string
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Formats duration in minutes to a readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
}

/**
 * Base email template with consistent styling
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metalogics Booking</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4CAF50;
    }
    .header h1 {
      color: #4CAF50;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin-bottom: 30px;
    }
    .booking-details {
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 20px;
      margin: 20px 0;
    }
    .booking-details h2 {
      margin-top: 0;
      color: #333;
      font-size: 18px;
    }
    .detail-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #666;
      display: inline-block;
      width: 120px;
    }
    .detail-value {
      color: #333;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-pending {
      background-color: #FFF3CD;
      color: #856404;
    }
    .status-confirmed {
      background-color: #D4EDDA;
      color: #155724;
    }
    .status-cancelled {
      background-color: #F8D7DA;
      color: #721C24;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>This is an automated message from Metalogics AI Assistant.</p>
      <p>If you have any questions, please contact us at <a href="mailto:${config.email.adminEmail}">${config.email.adminEmail}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Gets status badge HTML based on booking status
 */
function getStatusBadge(status: BookingStatus): string {
  const statusClass = `status-${status.toLowerCase()}`;
  return `<span class="status-badge ${statusClass}">${status}</span>`;
}

/**
 * Generates calendar event information section
 */
function getCalendarEventSection(booking: Booking): string {
  if (booking.calendarSynced && booking.calendarEventId) {
    return `
      <div style="background-color: #D4EDDA; border-left: 4px solid #28A745; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724;">
          <strong>✓ Calendar Event Created</strong><br>
          This consultation has been automatically added to your calendar. You should receive a calendar invitation at <strong>${
            booking.email
          }</strong> with all the event details including:
        </p>
        <ul style="margin: 10px 0 0 20px; color: #155724;">
          <li>Event date and time: ${formatDate(booking.startTime)}</li>
          <li>Duration: ${formatDuration(booking.duration)}</li>
          <li>Meeting attendees: You and our team</li>
        </ul>
      </div>
    `;
  } else if (booking.requiresManualCalendarSync) {
    const endTime = new Date(
      booking.startTime.getTime() + booking.duration * 60 * 1000
    );
    const startTimeISO =
      booking.startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endTimeISO =
      endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Metalogics+Consultation+-+${encodeURIComponent(
      booking.company
    )}&dates=${startTimeISO}/${endTimeISO}&details=${encodeURIComponent(
      booking.inquiry
    )}&location=Online`;

    return `
      <div style="background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #856404;">
          <strong>⚠ Manual Calendar Action Required</strong><br>
          We couldn't automatically add this to your calendar. Please add it manually to ensure you don't miss your consultation:
        </p>
        <p style="margin: 10px 0; color: #856404;">
          <strong>Event Details:</strong><br>
          Date & Time: ${formatDate(booking.startTime)}<br>
          Duration: ${formatDuration(booking.duration)}<br>
          Company: ${booking.company}
        </p>
        <a href="${googleCalendarUrl}" target="_blank" class="button" style="background-color: #FFC107; color: #000;">
          Add to Google Calendar
        </a>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #856404;">
          You can also add this event to other calendar applications (Outlook, Apple Calendar, etc.) using the details above.
        </p>
      </div>
    `;
  }
  return "";
}

/**
 * User booking confirmation email template
 */
export function userConfirmationTemplate(booking: Booking): {
  subject: string;
  html: string;
} {
  const content = `
    <div class="header">
      <h1>Booking Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear ${booking.name},</p>
      <p>Thank you for scheduling a consultation with Metalogics! We're excited to connect with you.</p>
      <p>Your booking has been received and is currently ${getStatusBadge(
        booking.status
      )}.</p>
      
      <div class="booking-details">
        <h2>Booking Details</h2>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value">${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${booking.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company:</span>
          <span class="detail-value">${booking.company}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${booking.email}</span>
        </div>
        ${
          booking.phone
            ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${booking.phone}</span>
        </div>
        `
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${formatDate(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${formatDuration(booking.duration)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Inquiry:</span>
          <span class="detail-value">${booking.inquiry}</span>
        </div>
      </div>

      ${getCalendarEventSection(booking)}

      <p>We'll send you a confirmation email once your booking is confirmed by our team. If you need to make any changes, please contact us.</p>
      <p>We look forward to speaking with you!</p>
      <p>Best regards,<br>The Metalogics Team</p>
    </div>
  `;

  return {
    subject: `Booking Confirmation - ${formatDate(booking.startTime)}`,
    html: baseTemplate(content),
  };
}

/**
 * Admin booking notification email template
 */
export function adminNotificationTemplate(booking: Booking): {
  subject: string;
  html: string;
} {
  const content = `
    <div class="header">
      <h1>New Booking Received</h1>
    </div>
    <div class="content">
      <p>A new consultation booking has been received.</p>
      
      <div class="booking-details">
        <h2>Booking Details</h2>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value">${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${getStatusBadge(booking.status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${booking.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company:</span>
          <span class="detail-value">${booking.company}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value"><a href="mailto:${booking.email}">${
    booking.email
  }</a></span>
        </div>
        ${
          booking.phone
            ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value"><a href="tel:${booking.phone}">${booking.phone}</a></span>
        </div>
        `
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${formatDate(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${formatDuration(booking.duration)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Inquiry:</span>
          <span class="detail-value">${booking.inquiry}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created:</span>
          <span class="detail-value">${formatDate(booking.createdAt)}</span>
        </div>
      </div>

      <p>Please review and confirm this booking at your earliest convenience.</p>
    </div>
  `;

  return {
    subject: `New Booking: ${booking.name} - ${booking.company}`,
    html: baseTemplate(content),
  };
}

/**
 * Booking update notification email template
 */
export function bookingUpdateTemplate(booking: Booking): {
  subject: string;
  html: string;
} {
  const content = `
    <div class="header">
      <h1>Booking Updated</h1>
    </div>
    <div class="content">
      <p>Dear ${booking.name},</p>
      <p>Your booking has been updated. Please review the updated details below.</p>
      
      <div class="booking-details">
        <h2>Updated Booking Details</h2>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value">${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${getStatusBadge(booking.status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${formatDate(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${formatDuration(booking.duration)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Inquiry:</span>
          <span class="detail-value">${booking.inquiry}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Updated:</span>
          <span class="detail-value">${formatDate(booking.updatedAt)}</span>
        </div>
      </div>

      ${getCalendarEventSection(booking)}

      <p>If you have any questions about these changes, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Metalogics Team</p>
    </div>
  `;

  return {
    subject: `Booking Updated - ${formatDate(booking.startTime)}`,
    html: baseTemplate(content),
  };
}

/**
 * Booking cancellation notification email template
 */
export function cancellationTemplate(booking: Booking): {
  subject: string;
  html: string;
} {
  const calendarCancellationSection =
    booking.calendarSynced && booking.calendarEventId
      ? `
      <div style="background-color: #D4EDDA; border-left: 4px solid #28A745; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724;">
          <strong>✓ Calendar Event Cancelled</strong><br>
          The calendar event for this consultation has been automatically cancelled and removed from your calendar. You should receive a cancellation notification at <strong>${
            booking.email
          }</strong>.
        </p>
        <p style="margin: 10px 0 0 0; color: #155724;">
          <strong>Cancelled Event Details:</strong><br>
          Original Date & Time: ${formatDate(booking.startTime)}<br>
          Duration: ${formatDuration(booking.duration)}
        </p>
      </div>
    `
      : booking.requiresManualCalendarSync
      ? `
      <div style="background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #856404;">
          <strong>⚠ Manual Calendar Action Required</strong><br>
          Please manually remove this event from your calendar if you added it previously.
        </p>
        <p style="margin: 0; color: #856404;">
          <strong>Event to Remove:</strong><br>
          Date & Time: ${formatDate(booking.startTime)}<br>
          Duration: ${formatDuration(booking.duration)}<br>
          Title: Metalogics Consultation - ${booking.company}
        </p>
      </div>
    `
      : "";

  const content = `
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear ${booking.name},</p>
      <p>Your booking has been cancelled as requested.</p>
      
      <div class="booking-details">
        <h2>Cancelled Booking Details</h2>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value">${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${getStatusBadge(booking.status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Original Date:</span>
          <span class="detail-value">${formatDate(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${formatDuration(booking.duration)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancelled On:</span>
          <span class="detail-value">${formatDate(booking.updatedAt)}</span>
        </div>
      </div>

      ${calendarCancellationSection}

      <p>We're sorry we won't be able to meet with you at this time. If you'd like to reschedule, please feel free to book another consultation through our website.</p>
      <p>We hope to connect with you in the future!</p>
      <p>Best regards,<br>The Metalogics Team</p>
    </div>
  `;

  return {
    subject: `Booking Cancelled - ${formatDate(booking.startTime)}`,
    html: baseTemplate(content),
  };
}
