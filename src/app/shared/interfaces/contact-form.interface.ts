export interface ContactUSFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  otherArea?: string;
  desDestination?: string;
  arrival?: string;
  departure?: string;
  totalGuests?: number;
  altDates?: string;
  budgets?: string;
  adults?: number;
  kids?: number;
  babies?: number;
  rooms?: number;
  accomType?: string[];
  proximity?: string;
  checkArray?: string[];
  checkArray2?: string[];
  addNotes?: string;
}

export interface ContactUSApiResponse {
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
