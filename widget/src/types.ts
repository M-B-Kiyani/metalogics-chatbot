export enum Role {
  USER = "user",
  MODEL = "model",
}

export interface Message {
  role: Role;
  text: string;
  timestamp?: number;
}

export interface BookingDetails {
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiry: string;
  timeSlot?: {
    startTime: Date;
    duration: number;
  };
}

export interface TimeSlot {
  startTime: Date;
  duration: number;
}
