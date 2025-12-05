/**
 * Database Types for Secret Santa Chain
 * Generated types for Supabase tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          fid: number;
          username: string | null;
          display_name: string | null;
          pfp_url: string | null;
          custody_address: string | null;
          neynar_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fid: number;
          username?: string | null;
          display_name?: string | null;
          pfp_url?: string | null;
          custody_address?: string | null;
          neynar_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fid?: number;
          username?: string | null;
          display_name?: string | null;
          pfp_url?: string | null;
          custody_address?: string | null;
          neynar_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gift_chains: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_fid: number;
          min_amount: number;
          max_amount: number;
          currency: string;
          min_participants: number;
          max_participants: number;
          join_deadline: string;
          reveal_date: string;
          status:
            | "open"
            | "matching"
            | "active"
            | "revealing"
            | "revealed"
            | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_fid: number;
          min_amount: number;
          max_amount: number;
          currency?: string;
          min_participants?: number;
          max_participants?: number;
          join_deadline: string;
          reveal_date: string;
          status?:
            | "open"
            | "matching"
            | "active"
            | "revealing"
            | "revealed"
            | "completed";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_fid?: number;
          min_amount?: number;
          max_amount?: number;
          currency?: string;
          min_participants?: number;
          max_participants?: number;
          join_deadline?: string;
          reveal_date?: string;
          status?:
            | "open"
            | "matching"
            | "active"
            | "revealing"
            | "revealed"
            | "completed";
          created_at?: string;
        };
      };
      chain_participants: {
        Row: {
          id: string;
          chain_id: string;
          user_fid: number;
          assigned_recipient_fid: number | null;
          has_sent_gift: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          user_fid: number;
          assigned_recipient_fid?: number | null;
          has_sent_gift?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          user_fid?: number;
          assigned_recipient_fid?: number | null;
          has_sent_gift?: boolean;
          joined_at?: string;
        };
      };
      gifts: {
        Row: {
          id: string;
          chain_id: string;
          sender_fid: number;
          recipient_fid: number;
          gift_type: "crypto" | "nft" | "message";
          amount: number | null;
          currency: string | null;
          token_address: string | null;
          token_id: string | null;
          message: string | null;
          tx_hash: string | null;
          is_revealed: boolean;
          sent_at: string;
          revealed_at: string | null;
        };
        Insert: {
          id?: string;
          chain_id: string;
          sender_fid: number;
          recipient_fid: number;
          gift_type: "crypto" | "nft" | "message";
          amount?: number | null;
          currency?: string | null;
          token_address?: string | null;
          token_id?: string | null;
          message?: string | null;
          tx_hash?: string | null;
          is_revealed?: boolean;
          sent_at?: string;
          revealed_at?: string | null;
        };
        Update: {
          id?: string;
          chain_id?: string;
          sender_fid?: number;
          recipient_fid?: number;
          gift_type?: "crypto" | "nft" | "message";
          amount?: number | null;
          currency?: string | null;
          token_address?: string | null;
          token_id?: string | null;
          message?: string | null;
          tx_hash?: string | null;
          is_revealed?: boolean;
          sent_at?: string;
          revealed_at?: string | null;
        };
      };
      thank_you_messages: {
        Row: {
          id: string;
          gift_id: string;
          message: string;
          cast_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_id: string;
          message: string;
          cast_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gift_id?: string;
          message?: string;
          cast_hash?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      chain_status:
        | "open"
        | "matching"
        | "active"
        | "revealing"
        | "revealed"
        | "completed";
      gift_type: "crypto" | "nft" | "message";
    };
  };
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type GiftChain = Database["public"]["Tables"]["gift_chains"]["Row"];
export type ChainParticipant =
  Database["public"]["Tables"]["chain_participants"]["Row"];
export type Gift = Database["public"]["Tables"]["gifts"]["Row"];
export type ThankYouMessage =
  Database["public"]["Tables"]["thank_you_messages"]["Row"];

export type ChainStatus = Database["public"]["Enums"]["chain_status"];
export type GiftType = Database["public"]["Enums"]["gift_type"];
