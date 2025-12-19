export enum Role {
  USER = "user",
  MODEL = "model",
}

export interface Message {
  role: Role;
  text: string;
  source?: "text" | "voice"; // Optional: track if message came from voice or text input
}

export interface TimeSlot {
  startTime: Date;
  duration: 15 | 30 | 45 | 60;
}

export interface BookingDetails {
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiry: string;
  timeSlot: TimeSlot | null;
}
