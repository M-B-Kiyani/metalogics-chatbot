#!/usr/bin/env ts-node

/**
 * Comprehensive Integration Test Script
 * Tests all external integrations and reports their status
 */

import { config } from "../src/config";
import { databaseClient } from "../src/config/database.client";
import { CalendarClient } from "../src/integrations/calendar.client";
import { HubSpotClient } from "../src/integrations/hubspot.client";
import { EmailClient } from "../src/integrations/email.client";
import { geminiService } from "../src/servic