import { Booking } from "@prisma/client";
import { addMinutes, format } from "date-fns";
import { config } from "../config";

/**
 * Generate ICS (iCalendar) file content for a booking
 * This allows sending calendar invites via email without Google Calendar API attendee limitations
 */
export function generateICS(booking: Booking): string {
  const startTime = booking.startTime;
  const endTime = addMinutes(startTime, booking.duration);

  // Format dates in iCalendar format (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  // Generate unique ID for the event
  const uid = `${booking.id}@metalogics.com`;

  // Current timestamp for DTSTAMP
  const now = new Date();
  const dtstamp = formatICSDate(now);

  // Escape special characters in text fields
  const escapeICSText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  // Build description
  const description = escapeICSText(
    `Consultation Booking\\n\\n` +
      `Client: ${booking.name}\\n` +
      `Company: ${booking.company}\\n` +
      `Email: ${booking.email}\\n` +
      `Phone: ${booking.phone || "N/A"}\\n\\n` +
      `Inquiry:\\n${booking.inquiry}\\n\\n` +
      `Booking ID: ${booking.id}`
  );

  const summary = escapeICSText(`Metalogics Consultation - ${booking.company}`);
  const location = escapeICSText("Online Meeting");

  // Organizer email
  const organizerEmail = config.email.adminEmail;
  const organizerName = escapeICSText("Metalogics Team");

  // Attendee email
  const attendeeEmail = booking.email;
  const attendeeName = escapeICSText(booking.name);

  // Build ICS content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Metalogics//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:EMAIL",
    `SUMMARY:Reminder: ${summary}`,
    `DESCRIPTION:Your consultation is in 24 hours`,
    `ATTENDEE:mailto:${attendeeEmail}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Your consultation starts in 30 minutes`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Generate ICS file for a cancellation
 */
export function generateCancellationICS(booking: Booking): string {
  const startTime = booking.startTime;
  const endTime = addMinutes(startTime, booking.duration);

  const formatICSDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const uid = `${booking.id}@metalogics.com`;
  const now = new Date();
  const dtstamp = formatICSDate(now);

  const escapeICSText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const summary = escapeICSText(
    `CANCELLED: Metalogics Consultation - ${booking.company}`
  );
  const description = escapeICSText(
    `This consultation has been cancelled.\\n\\n` +
      `Original Booking ID: ${booking.id}`
  );

  const organizerEmail = config.email.adminEmail;
  const organizerName = escapeICSText("Metalogics Team");
  const attendeeEmail = booking.email;
  const attendeeName = escapeICSText(booking.name);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Metalogics//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName}:mailto:${attendeeEmail}`,
    "STATUS:CANCELLED",
    "SEQUENCE:1",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}
