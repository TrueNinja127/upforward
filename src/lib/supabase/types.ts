/**
 * Hand-written row types matching the files in supabase/migrations/.
 */

export type JobRole = "virtual-assistant" | "us-partnership" | "remote-connector";
export type ApplicationStatus = "new" | "in_review" | "interview" | "hired" | "declined";
export type MessageSender = "applicant" | "admin";
export type LoginTokenPurpose = "login" | "notification";

export type ApplicationRow = {
  id: string;
  created_at: string;
  role: JobRole;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: ApplicationStatus;
};

export type ApplicantSessionRow = {
  id: string;
  application_id: string;
  token_hash: string;
  created_at: string;
  last_seen_at: string;
};

export type LoginTokenRow = {
  id: string;
  application_id: string;
  token_hash: string;
  purpose: LoginTokenPurpose;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  application_id: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: MessageSender | null;
  applicant_notified_at: string | null;
  admin_notified_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationOverviewRow = Omit<ConversationRow, "applicant_notified_at" | "admin_notified_at"> & {
  name: string;
  email: string;
  phone: string;
  location: string;
  role: JobRole;
  status: ApplicationStatus;
  unread_from_applicant: number;
};

type Table<Row, Insert, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/** Minimal Database typing so supabase-js infers row shapes. */
export type Database = {
  public: {
    Tables: {
      applications: Table<
        ApplicationRow,
        Omit<ApplicationRow, "id" | "created_at" | "status"> & Partial<Pick<ApplicationRow, "id" | "created_at" | "status">>
      >;
      applicant_sessions: Table<
        ApplicantSessionRow,
        Pick<ApplicantSessionRow, "application_id" | "token_hash"> & Partial<ApplicantSessionRow>
      >;
      login_tokens: Table<
        LoginTokenRow,
        Pick<LoginTokenRow, "application_id" | "token_hash" | "purpose" | "expires_at"> & Partial<LoginTokenRow>
      >;
      conversations: Table<ConversationRow, Pick<ConversationRow, "application_id"> & Partial<ConversationRow>>;
      messages: Table<MessageRow, Pick<MessageRow, "conversation_id" | "sender" | "body"> & Partial<MessageRow>>;
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
