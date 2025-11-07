export enum Page {
  Home = 'Home',
  Contact = 'Contact',
  SignOn = 'SignOn',
  Profile = 'Profile',
  Admin = 'Admin',
  Softphone = 'Softphone',
  LynxAI = 'LynxAI',
  Chat = 'Chat',
  LocalMail = 'LocalMail',
  Notepad = 'Notepad',
  Calculator = 'Calculator',
  Contacts = 'Contacts',
  Phone = 'Phone',
  VoiceServer = 'VoiceServer',
}

export enum ProfileTab {
  Info = 'Info',
  Billing = 'Billing',
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'standard' | 'trial' | 'guest';
  plan: {
    name: string;
    cost: string;
    details: string;
  };
  email: string;
  sip: string;
  billing: {
    status: 'On Time' | 'Overdue' | 'Suspended';
    owes?: number;
  };
  chat_enabled: boolean;
  ai_enabled: boolean;
  localmail_enabled: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'gemini';
  text: string;
}

export interface DirectMessage {
    id: number;
    sender_id: string;
    recipient_id: string;
    text: string;
    timestamp: string;
}

export interface Alert {
    sender_id: string;
    sender_username: string;
    message_snippet: string;
}

export interface LocalMailMessage {
    id: number;
    sender_id: string;
    sender_username: string;
    recipient_username: string;
    subject: string;
    body: string;
    timestamp: string;
    is_read: boolean;
}

export interface GuestSession {
    responsesLeft: number;
    resetTime: number | null;
}

export interface Contact {
    id: number;
    user_id: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export enum CallStatus {
    Ringing = 'ringing',
    Active = 'active',
    Ended = 'ended',
    Declined = 'declined',
}

export interface Call {
    id: number;
    caller_username: string;
    callee_username: string;
    status: CallStatus;
    answered_at?: string;
}

export interface VoiceServerRoom {
    id: string;
    name: string;
}

export interface VoiceServerParticipant {
    user_id: string;
    username: string;
}

export interface VoiceServerMessage {
    id: number;
    sender_id: string;
    sender_username: string;
    audio_data: string; // base64 string
    created_at: string;
}
