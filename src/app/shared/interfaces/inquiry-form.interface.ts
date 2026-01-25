// inquiry-form.interface.ts
export interface InquiryApiRequest {
  // Required fields
  name: string;
  email: string;
  totalGuests: number;
  adults: number;
  kids: number;
  babies: number;
  message: string;
  listId: number;
  formLabel: string;

  // Optional fields
  phone?: string;
  dateRange?: string; // Format: "MM/DD/YYYY - MM/DD/YYYY"
  datesNotProvided?: boolean;
  checkin?: string | null; // Format: "YYYY-MM-DD"
  checkout?: string | null; // Format: "YYYY-MM-DD"
  totalBudget?: string;
}

export interface InquiryApiResponse {
  status: 'success' | 'error';
  message: string;
  code: number;
  inquiry_id?: string; // Optional for success responses
  emails_sent?: {     // Optional for success responses
    user: boolean;
    admin: boolean;
  };
  debug?: string;     // Optional for development error responses
}
