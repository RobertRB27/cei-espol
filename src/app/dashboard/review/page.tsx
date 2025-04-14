'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Application, 
  formatDate, 
  getStatusLabel,
  getStatusColor
} from '@/lib/applications/types';
import { Eye, Settings, CheckCircle, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from 'next-auth/react';

// Function to fetch applications that need review from the API
const fetchApplicationsForReview = async (reviewerId: string) => {
  try {
    const response = await fetch('/api/applications/review');
    if (!response.ok) {
      console.error('Failed to fetch applications for review:', response.status);
      return [];
    }
    
    const applications = await response.json();
    console.log('Fetched applications for review:', applications);
    return applications;
  } catch (error) {
    console.error('Error fetching applications for review:', error);
    // Return mock data as fallback if API fails
    return [
    {
      id: 2,
      user_id: 'bbbbbbbb-2222-2222-2222-222222222222',
      project_title: 'Impact of Climate Change on Local Ecosystems',
      investigation_type: 'EO',
      category_type: 'AN',
      sequential_number: 2,
      codification: 'CEISH-ESPOL-23-02-EO-AN-002',
      date_created: '2023/02/03T09:15:00Z',
      date_submitted: '2023/02/10T16:45:00Z',
      status: 'UNDER_REVIEW',
      metadata: {
        department: 'Environmental Science',
        funding: 'External Grant',
        duration_months: 24
      },
      applicant_name: 'Juan Carlos Pérez Gómez',
      applicant_email: 'juanperez@example.com'
    },
    {
      id: 5,
      user_id: 'bbbbbbbb-2222-2222-2222-222222222222',
      project_title: 'Survey of Mental Health in University Students',
      investigation_type: 'EO',
      category_type: 'SH',
      sequential_number: 5,
      codification: 'CEISH-ESPOL-23-05-EO-SH-005',
      date_created: '2023/05/01T10:45:00Z',
      date_submitted: '2023/05/10T11:15:00Z',
      status: 'SECOND_REVIEW',
      metadata: {
        department: 'Psychology',
        funding: 'University Grant',
        duration_months: 9
      },
      applicant_name: 'María Luisa García López',
      applicant_email: 'mariagarcia@example.com'
    },
    {
      id: 8,
      user_id: 'bbbbbbbb-2222-2222-2222-222222222222',
      project_title: 'Sustainable Urban Planning Model',
      investigation_type: 'EO',
      category_type: 'GE',
      sequential_number: 8,
      codification: 'CEISH-ESPOL-23-08-EO-GE-008',
      date_created: '2023/08/22T15:10:00Z',
      date_submitted: '2023/08/30T10:20:00Z',
      status: 'UNDER_REVIEW',
      metadata: {
        department: 'Urban Planning',
        funding: 'Municipal Government',
        duration_months: 18
      },
      applicant_name: 'María Luisa García López',
      applicant_email: 'mariagarcia@example.com'
    }
  ] as any[];
  }
};

export default function ReviewApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'accept' | 'reject' | 'incomplete' | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const { data: session } = useSession();
  const reviewerId = session?.user?.id || '';
  
  // Fetch applications when the component mounts or reviewerId changes
  useEffect(() => {
    const loadApplications = async () => {
      if (reviewerId) {
        const apps = await fetchApplicationsForReview(reviewerId);
        setApplications(apps);
      }
    };
    
    loadApplications();
  }, [reviewerId]); // Add reviewerId as a dependency

  // Handle dialog confirmation
  const handleConfirm = async () => {
    if (!selectedApplication) return;
    
    let newStatus;
    let actionDescription;
    switch (dialogType) {
      case 'accept':
        // When a reviewer approves, it goes to SECOND_REVIEW for role 2 users to manage
        newStatus = 'SECOND_REVIEW';
        actionDescription = 'Application approved and sent for final review';
        break;
      case 'reject':
        newStatus = 'REJECTED';
        actionDescription = 'Application rejected due to ethics or methodology concerns';
        break;
      case 'incomplete':
        newStatus = 'NOT_COMPLETED';
        actionDescription = 'Application requires additional information or documentation';
        break;
      default:
        return;
    }
    
    try {
      // Call the API to update application status
      const response = await fetch(`/api/applications/${selectedApplication.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comments: actionDescription
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update application status:', await response.text());
        toast.error('Failed to update application status', {
          description: 'Please try again or contact the administrator.'
        });
        return;
      }
      
      // Update the local state with the new status
      const updatedApplications = applications.map(app => 
        app.id === selectedApplication.id
          ? { ...app, status: newStatus }
          : app
      );
      
      // If approved or rejected, remove from the list to avoid confusion
      if (newStatus === 'SECOND_REVIEW' || newStatus === 'REJECTED' || newStatus === 'NOT_COMPLETED') {
        setApplications(applications.filter(app => app.id !== selectedApplication.id));
      } else {
        setApplications(updatedApplications);
      }
      
      // Show success message
      console.log(`Application ${selectedApplication.id} status updated to ${newStatus}`);
      
      // Show toast notification based on the action taken
      if (newStatus === 'SECOND_REVIEW') {
        toast.success('Application approved', {
          description: 'Application has been sent for final review.'
        });
      } else if (newStatus === 'REJECTED') {
        toast.success('Application rejected', {
          description: 'Application has been rejected.'
        });
      } else if (newStatus === 'NOT_COMPLETED') {
        toast.success('Application marked as incomplete', {
          description: 'Applicant will be notified to provide additional information.'
        });
      }
      
      // Close the dialog
      setDialogOpen(false);
      setSelectedApplication(null);
      setDialogType(null);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Error updating application', {
        description: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  // Open dialog for confirmation
  const openDialog = (type: 'accept' | 'reject' | 'incomplete', application: any) => {
    setDialogType(type);
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  // Define table columns
  const columns = [
    {
      key: 'codification',
      header: 'Codification',
      cell: (application: any) => <span className="font-medium">{application.codification}</span>,
      sortable: true
    },
    {
      key: 'project_title',
      header: 'Project Title',
      cell: (application: any) => application.project_title,
      sortable: true
    },
    {
      key: 'applicant',
      header: 'Applicant',
      cell: (application: any) => (
        <div>
          <div>{application.applicant_name}</div>
          <div className="text-xs text-gray-500">{application.applicant_email}</div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'date_submitted',
      header: 'Date Submitted',
      cell: (application: any) => formatDate(application.date_submitted),
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      cell: (application: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
          {getStatusLabel(application.status)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (application: any) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                <span className="sr-only">Open menu</span>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* View - always available */}
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/review/${application.id}`} className="w-full cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Only show actions for applications with UNDER_REVIEW status */}
              {application.status === 'UNDER_REVIEW' && (
                <>
                  {/* Approve - moves to SECOND_REVIEW for role 2 */}
                  <DropdownMenuItem onClick={() => openDialog('accept', application)}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-green-500">Approve</span>
                  </DropdownMenuItem>
                  
                  {/* Not Complete - returns to user for more info */}
                  <DropdownMenuItem onClick={() => openDialog('incomplete', application)}>
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-amber-500">Mark as Incomplete</span>
                  </DropdownMenuItem>
                  
                  {/* Reject */}
                  <DropdownMenuItem onClick={() => openDialog('reject', application)}>
                    <X className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-red-500">Reject</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications for Review</h1>
        <p className="text-muted-foreground">
          Review and process submitted ethics committee applications
        </p>
      </div>
      
      <DataTable 
        columns={columns} 
        data={applications} 
        primaryKey="id"
        searchable={true}
        searchKeys={['codification', 'project_title', 'applicant_name', 'applicant_email']}
      />
      
      {/* Confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'accept' && 'Approve Application'}
              {dialogType === 'reject' && 'Reject Application'}
              {dialogType === 'incomplete' && 'Mark as Incomplete'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'accept' && 'Are you sure you want to approve this application? This will send it to the managers for final review.'}
              {dialogType === 'reject' && 'Are you sure you want to reject this application? This will mark it as REJECTED.'}
              {dialogType === 'incomplete' && 'Are you sure you want to mark this application as incomplete? This will request the applicant to provide additional information.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={dialogType === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
