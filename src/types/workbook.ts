export interface OvercomerChallenge {
  id: number;
  title: string;
  category: 'memorization' | 'reading' | 'attendance' | 'study' | 'action';
  subtitle?: string;
  badgeEarned?: string;
  scripture?: {
    reference: string;
    text: string;
  };
  instructions: string;
  formFields: OvercomerFormField[];
  isCompleteDefault?: boolean;
}

export interface OvercomerFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'fill_in_the_blank';
  placeholder?: string;
  helperText?: string;
  options?: string[];
  defaultValue?: string;
  required?: boolean;
}

export interface WorkbookBook {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  coverImage?: string;
  badgeEarned?: string;
  description?: string;
  category?: string;
  level?: string;
  challenges: OvercomerChallenge[];
  founderNote?: {
    title: string;
    author: string;
    content: string;
    signoff?: string;
  };
  closingNote?: {
    title: string;
    content: string;
  };
  mediaUrl?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkbookSubmission {
  id: string;
  workbookId?: string;
  userId: string;
  userName: string;
  studentName?: string;
  userAvatar?: string;
  challengeId: number;
  answers: Record<string, string>;
  studentSignature?: string;
  studentSignedDate?: string;
  mediaUrls?: string[];
  status: 'draft' | 'submitted' | 'graded';
  grade?: 'approved' | 'needs_revision' | 'exceptional';
  teacherFeedback?: string;
  teacherSignature?: string;
  teacherSignedDate?: string;
  gradedBy?: string;
  gradedByName?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  designation: string;
  frequency: 'one_time' | 'monthly';
  paymentMethod: 'square_card' | 'cash_app' | 'apple_pay' | 'google_pay';
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
  createdAt: string;
  note?: string;
}

export interface GivingConfig {
  squareAppId?: string;
  squareLocationId?: string;
  squareAccessToken?: string;
  cashAppCashtag?: string;
  ministryName: string;
  parentCompany?: string;
  taxExemptNotice: string;
}
