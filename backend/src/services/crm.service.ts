import { Booking, BookingStatus } from "@prisma/client";
import {
  HubSpotClient,
  CreateContactData,
} from "../integrations/hubspot.client";
import { logger } from "../utils/logger";
import { CRMError } from "../errors/CRMError";
import { cacheService, CacheKeys, CacheTTL } from "../utils/cache.service";

/**
 * CRMService handles business logic for CRM operations
 * Manages contact synchronization with HubSpot CRM
 * Implements graceful degradation for external API failures
 */
export class CRMService {
  private hubspotClient: HubSpotClient;

  constructor(hubspotClient: HubSpotClient) {
    this.hubspotClient = hubspotClient;
    logger.info("CRMService initialized");
  }

  /**
   * Synchronize booking data to HubSpot contact
   * Creates or updates contact based on email
   * Maps booking fields to HubSpot contact properties
   *
   * @param booking - Booking data to sync
   * @returns HubSpot contact ID
   * @throws CRMError if sync fails (caller should handle gracefully)
   */
  async syncBookingToContact(booking: Booking): Promise<string> {
    try {
      logger.info("Syncing booking to HubSpot contact", {
        bookingId: booking.id,
        email: booking.email,
      });

      // Check if HubSpot client is authenticated
      if (!this.hubspotClient.isAuthenticated()) {
        throw new CRMError("HubSpot client not authenticated");
      }

      // Parse name into first and last name
      const { firstname, lastname } = this.parseName(booking.name);

      // Prepare contact data with standard fields
      const contactData: CreateContactData = {
        email: booking.email,
        firstname,
        lastname,
        company: booking.company,
        phone: booking.phone || undefined,
        customProperties: this.buildCustomProperties(booking),
      };

      // Upsert contact (create or update)
      const contact = await this.hubspotClient.upsertContact(contactData);

      // Cache the contact ID for future lookups
      const cacheKey = CacheKeys.crmContact(booking.email);
      cacheService.set(cacheKey, contact.id, CacheTTL.CRM_CONTACT);

      logger.info("Successfully synced booking to HubSpot contact", {
        bookingId: booking.id,
        contactId: contact.id,
        email: booking.email,
      });

      return contact.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to sync booking to HubSpot contact", {
        bookingId: booking.id,
        email: booking.email,
        error: errorMessage,
      });

      // Re-throw as CRMError for consistent error handling
      if (error instanceof CRMError) {
        throw error;
      }

      throw new CRMError(
        `Failed to sync booking to contact: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update HubSpot contact with booking status change
   * Updates custom properties related to booking status
   * Uses cached contact lookup to reduce API calls
   *
   * @param email - Contact email address
   * @param bookingId - Booking ID
   * @param status - New booking status
   * @throws CRMError if update fails (caller should handle gracefully)
   */
  async updateContactBookingStatus(
    email: string,
    bookingId: string,
    status: BookingStatus
  ): Promise<void> {
    try {
      logger.info("Updating HubSpot contact booking status", {
        email,
        bookingId,
        status,
      });

      // Check if HubSpot client is authenticated
      if (!this.hubspotClient.isAuthenticated()) {
        throw new CRMError("HubSpot client not authenticated");
      }

      // Check cache for contact ID first
      const cacheKey = CacheKeys.crmContact(email);
      let contactId = cacheService.get<string>(cacheKey);

      if (!contactId) {
        // Search for contact by email
        const contact = await this.hubspotClient.searchContactByEmail(email);

        if (!contact) {
          logger.warn("Contact not found in HubSpot, cannot update status", {
            email,
            bookingId,
          });
          throw new CRMError(`Contact not found for email: ${email}`);
        }

        contactId = contact.id;
        // Cache the contact ID
        cacheService.set(cacheKey, contactId, CacheTTL.CRM_CONTACT);
      }

      // Prepare status update properties
      const updateProperties: Record<string, string> = {
        last_booking_status: status,
        last_booking_status_updated: new Date().toISOString(),
      };

      // Update contact with new status
      await this.hubspotClient.updateContact(contactId, {
        properties: updateProperties,
      });

      logger.info("Successfully updated HubSpot contact booking status", {
        email,
        contactId,
        bookingId,
        status,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to update HubSpot contact booking status", {
        email,
        bookingId,
        status,
        error: errorMessage,
      });

      // Re-throw as CRMError for consistent error handling
      if (error instanceof CRMError) {
        throw error;
      }

      throw new CRMError(
        `Failed to update contact booking status: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse full name into first and last name
   * Handles various name formats
   *
   * @param fullName - Full name string
   * @returns Object with firstname and lastname
   */
  private parseName(fullName: string): {
    firstname: string;
    lastname?: string;
  } {
    const trimmedName = fullName.trim();

    // Split by whitespace
    const parts = trimmedName.split(/\s+/);

    if (parts.length === 0) {
      return { firstname: trimmedName };
    }

    if (parts.length === 1) {
      return { firstname: parts[0] };
    }

    // First part is firstname, rest is lastname
    const firstname = parts[0];
    const lastname = parts.slice(1).join(" ");

    return { firstname, lastname };
  }

  /**
   * Build custom properties for HubSpot contact from booking data
   * Maps booking-specific fields to custom HubSpot properties
   *
   * @param booking - Booking data
   * @returns Custom properties object
   */
  private buildCustomProperties(_booking: Booking): Record<string, string> {
    // Return empty object - custom properties should be created in HubSpot first
    // To add custom properties, create them in HubSpot Settings > Properties
    // Then uncomment and add them here:
    // const properties: Record<string, string> = {
    //   last_booking_id: _booking.id,
    //   last_booking_date: _booking.startTime.toISOString(),
    //   last_booking_duration: _booking.duration.toString(),
    //   last_booking_status: _booking.status,
    // };

    return {};
  }
}
