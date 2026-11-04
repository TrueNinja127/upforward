/** Hand-written row types matching supabase/migrations/20261104000000_jobs_and_chat.sql */

export type JobRole = "virtual-assistant" | "us-partnership" | "remote-connector";
export type ApplicationStatus = "new" | "in_review" | "interview" | "hired" | "declined";
export type MessageSender = "applicant" | "admin";

export type ApplicationRow = {
  id: string;
  created_at: string;
  role: JobRole;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: ApplicationStatus;
  session_token_hash: string;
};

export type ConversationRow = {
  id: string;
  application_id: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: MessageSender | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationOverviewRow = ConversationRow & {
  name: string;
  email: string;
  phone: string;
  location: string;
  role: JobRole;
  status: ApplicationStatus;
  unread_from_applicant: number;
};

/** Minimal Database typing so supabase-js infers row shapes. */
export type Database = {
  public: {
    Tables: {
      applications: {
        Row: ApplicationRow;
        Insert: Omit<ApplicationRow, "id" | "created_at" | "status"> & Partial<Pick<ApplicationRow, "id" | "created_at" | "status">>;
        Update: Partial<ApplicationRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Pick<ConversationRow, "application_id"> & Partial<ConversationRow>;
        Update: Partial<ConversationRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Pick<MessageRow, "conversation_id" | "sender" | "body"> & Partial<MessageRow>;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
    };
    Views: {
      conversation_overview: {
        Row: ConversationOverviewRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      job_role: JobRole;
      application_status: ApplicationStatus;
      message_sender: MessageSender;
    };
    CompositeTypes: Record<string, never>;
  };
};
