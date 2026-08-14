export interface Lead {
  id: string;
  customer_name: string;
  phone_number: string | null;
  project_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  lead_id: string;
  livekit_call_id: string | null;
  livekit_room_id: string | null;
  transcript: string | null;
  summary: string | null;
  duration_seconds: number | null;
  status: string;
  created_at: string;
}

export interface Callback {
  id: string;
  lead_id: string;
  callback_requested: boolean;
  callback_date: string | null;
  callback_time: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
