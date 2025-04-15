export type InvestigationType = 'EO' | 'EI';
export type CategoryType = 'GE' | 'SH' | 'AN';

export type ApplicationStatus = 
  | 'NOT_SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'SECOND_REVIEW' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'DELETED'
  | 'NOT_COMPLETED';

export interface Application {
  id: number;
  user_id: string;
  project_title: string;
  investigation_type: InvestigationType;
  category_type: CategoryType;
  sequential_number: number;
  codification: string;
  date_created: string;
  date_submitted: string | null;
  status: ApplicationStatus;
  metadata: Record<string, any> | null;
}

export interface StatusHistoryEntry {
  id: number;
  application_id: number;
  previous_status: ApplicationStatus;
  new_status: ApplicationStatus;
  changed_by: string;
  change_date: string;
  comments: string | null;
}

export interface ApplicationReview {
  id: number;
  application_id: number;
  reviewer_id: string;
  status: ApplicationStatus;
  comments: string | null;
  date_assigned: string;
  date_reviewed: string | null;
}

// UI helper functions

export function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    // Handle different date formats
    const date = new Date(dateString.replace(/\//g, '-'));
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

export function getStatusLabel(status: ApplicationStatus): string {
  const statusMap: Record<ApplicationStatus, string> = {
    'NOT_SUBMITTED': 'No Enviado',
    'UNDER_REVIEW': 'En Revisión',
    'SECOND_REVIEW': 'Segunda Revisión',
    'ACCEPTED': 'Aceptado',
    'REJECTED': 'Rechazado',
    'DELETED': 'Eliminado',
    'NOT_COMPLETED': 'Incompleto'
  };
  
  return statusMap[status] || status;
}

export function getStatusColor(status: ApplicationStatus): string {
  const colorMap: Record<ApplicationStatus, string> = {
    'NOT_SUBMITTED': 'bg-gray-100 text-gray-800',
    'UNDER_REVIEW': 'bg-blue-100 text-blue-800',
    'SECOND_REVIEW': 'bg-purple-100 text-purple-800',
    'ACCEPTED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
    'DELETED': 'bg-red-100 text-red-800',
    'NOT_COMPLETED': 'bg-yellow-100 text-yellow-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}
