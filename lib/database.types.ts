export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          institution: string | null;
          role: "student" | "instructor" | "evaluator";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          institution?: string | null;
          role?: "student" | "instructor" | "evaluator";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          institution?: string | null;
          role?: "student" | "instructor" | "evaluator";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          status: "uploaded" | "processing" | "ready" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type?: string;
          file_size: number;
          status?: "uploaded" | "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          original_filename?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number;
          status?: "uploaded" | "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      vivas: {
        Row: {
          id: string;
          user_id: string;
          submission_id: string;
          status: "created" | "in_progress" | "completed" | "failed";
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          submission_id: string;
          status?: "created" | "in_progress" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          submission_id?: string;
          status?: "created" | "in_progress" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vivas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vivas_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      questions: {
        Row: {
          id: string;
          viva_id: string;
          concept: string;
          question_text: string;
          question_type: "primary" | "follow_up";
          difficulty: "easy" | "medium" | "hard";
          expected_concepts: Json;
          sequence_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          viva_id: string;
          concept: string;
          question_text: string;
          question_type?: "primary" | "follow_up";
          difficulty?: "easy" | "medium" | "hard";
          expected_concepts?: Json;
          sequence_number?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          viva_id?: string;
          concept?: string;
          question_text?: string;
          question_type?: "primary" | "follow_up";
          difficulty?: "easy" | "medium" | "hard";
          expected_concepts?: Json;
          sequence_number?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_viva_id_fkey";
            columns: ["viva_id"];
            isOneToOne: false;
            referencedRelation: "vivas";
            referencedColumns: ["id"];
          }
        ];
      };
      responses: {
        Row: {
          id: string;
          viva_id: string;
          question_id: string;
          audio_storage_path: string | null;
          transcription: string | null;
          duration_seconds: number | null;
          status: "uploaded" | "transcribing" | "evaluating" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          viva_id: string;
          question_id: string;
          audio_storage_path?: string | null;
          transcription?: string | null;
          duration_seconds?: number | null;
          status?: "uploaded" | "transcribing" | "evaluating" | "completed" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          viva_id?: string;
          question_id?: string;
          audio_storage_path?: string | null;
          transcription?: string | null;
          duration_seconds?: number | null;
          status?: "uploaded" | "transcribing" | "evaluating" | "completed" | "failed";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_viva_id_fkey";
            columns: ["viva_id"];
            isOneToOne: false;
            referencedRelation: "vivas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          }
        ];
      };
      evaluations: {
        Row: {
          id: string;
          response_id: string;
          correctness: number;
          completeness: number;
          reasoning_quality: number;
          feedback: string;
          demonstrated_concepts: Json;
          missing_concepts: Json;
          confidence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          correctness?: number;
          completeness?: number;
          reasoning_quality?: number;
          feedback?: string;
          demonstrated_concepts?: Json;
          missing_concepts?: Json;
          confidence?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          correctness?: number;
          completeness?: number;
          reasoning_quality?: number;
          feedback?: string;
          demonstrated_concepts?: Json;
          missing_concepts?: Json;
          confidence?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evaluations_response_id_fkey";
            columns: ["response_id"];
            isOneToOne: true;
            referencedRelation: "responses";
            referencedColumns: ["id"];
          }
        ];
      };
      knowledge_gaps: {
        Row: {
          id: string;
          user_id: string;
          viva_id: string;
          concept: string;
          severity: "low" | "medium" | "high";
          explanation: string;
          recommendation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          viva_id: string;
          concept: string;
          severity?: "low" | "medium" | "high";
          explanation: string;
          recommendation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          viva_id?: string;
          concept?: string;
          severity?: "low" | "medium" | "high";
          explanation?: string;
          recommendation?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_gaps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_gaps_viva_id_fkey";
            columns: ["viva_id"];
            isOneToOne: false;
            referencedRelation: "vivas";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
