export interface InquiryBookingFormLabelData {
  listId: number;
  formLabel: string;
  scheckin?: string;  // Format: YYYY-MM-DD
  scheckout?: string; // Format: YYYY-MM-DD
  totalBudget?:string;
}
