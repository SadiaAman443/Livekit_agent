export interface Lead {
  id: string;
  customer_name: string;
  phone_number?: string;
  project_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLeads {
  total: number;
  items: Lead[];
}

export interface Call {
  id: string;
  lead_id: string;
  livekit_call_id?: string;
  livekit_room_id?: string;
  vobiz_call_id?: string;
  recording_url?: string;
  transcript?: string; // May be omitted in list views
  summary?: string;
  duration_seconds?: number;
  status: string;
  created_at: string;
  // Joined fields
  customer_name?: string;
  phone_number?: string;
  project_name?: string;
}

export interface PaginatedCalls {
  total: number;
  items: Call[];
}

export interface Callback {
  id: string;
  lead_id: string;
  callback_requested: boolean;
  callback_date?: string;
  callback_time?: string;
  reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer_name?: string;
  phone_number?: string;
  project_name?: string;
}

export interface PaginatedCallbacks {
  total: number;
  items: Callback[];
}
