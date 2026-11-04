/**
 * Row types for the tables this site touches. The schema lives in the admin
 * panel's Prisma migrations (tnboard/prisma/schema.prisma) – both apps share
 * one Supabase database. Job/applicant tables use snake_case names; the panel's
 * own tables ("Settings", "Notification", "ActivityLog") are PascalCase.
 */

export type ApplicationStatus = "new" | "in_review" | "interview" | "hired" | "declined";
export type MessageSender = "applicant" | "admin";
export type LoginTokenPurpose = "login" | "notification";

export type JobRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  about: string;
  responsibilities: string[];
  skills: string[];
  employment_type: string;
  location: string;
  schedule: string;
  compensation_headline: string;
  compensation_detail: string;
  is_open: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ApplicationRow = {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
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
  /** Random secret that is part of the Realtime topic name. */
  channel_key: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: MessageSender | null;
  applicant_notified_at: string | null;
  admin_notified_at: string | null;
};

/** A file stored in the "applicant-attachments" bucket. `url` is a short-lived signed link added when serving. */
export type Attachment = {
  path: string;
  name: string;
  type: string;
  size: number;
  url?: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  body: string;
  created_at: string;
  read_at: string | null;
  /** Set when the author changed the text after sending. */
  edited_at: string | null;
  /** Soft delete: the row stays (body cleared) so both sides can show "message deleted". */
  deleted_at: string | null;
  attachments: Attachment[];
};

export type PushScope = "admin" | "applicant";

export type PushSubscriptionRow = {
  id: string;
  scope: PushScope;
  application_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

/* Admin panel tables (managed by Prisma in tnboard) ------------------------------- */

export type SettingsRow = {
  id: number;
  /** Names the panel-wide Realtime channel; lets this site notify the open panel. */
  liveChannelKey: string;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ActivityLogRow = {
  id: string;
  type: string;
  message: string;
  meta: string;
  createdAt: string;
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
      jobs: Table<JobRow, Partial<JobRow>>;
      job_applications: Table<
        ApplicationRow,
        Pick<ApplicationRow, "job_id" | "name" | "email" | "phone" | "location"> & Partial<ApplicationRow>
      >;
      applicant_sessions: Table<
        ApplicantSessionRow,
        Pick<ApplicantSessionRow, "application_id" | "token_hash"> & Partial<ApplicantSessionRow>
      >;
      applicant_login_tokens: Table<
        LoginTokenRow,
        Pick<LoginTokenRow, "application_id" | "token_hash" | "purpose" | "expires_at"> & Partial<LoginTokenRow>
      >;
      applicant_conversations: Table<ConversationRow, Pick<ConversationRow, "application_id"> & Partial<ConversationRow>>;
      applicant_messages: Table<MessageRow, Pick<MessageRow, "conversation_id" | "sender" | "body"> & Partial<MessageRow>>;
      push_subscriptions: Table<
        PushSubscriptionRow,
        Pick<PushSubscriptionRow, "scope" | "endpoint" | "p256dh" | "auth"> & Partial<PushSubscriptionRow>
      >;
      Settings: Table<SettingsRow, Partial<SettingsRow>>;
      Notification: Table<NotificationRow, Pick<NotificationRow, "id" | "type" | "title"> & Partial<NotificationRow>>;
      ActivityLog: Table<ActivityLogRow, Pick<ActivityLogRow, "id" | "type" | "message"> & Partial<ActivityLogRow>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      application_status: ApplicationStatus;
      message_sender: MessageSender;
    };
    CompositeTypes: Record<string, never>;
  };
};
