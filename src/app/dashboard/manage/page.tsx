'use client';

import { useState } from 'react';
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
import { Eye, Settings, CheckCircle, X } from 'lucide-react';
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

// Function to fetch applications in SECOND_REVIEW status
const fetchApplicationsForManagement = async () => {
  // This would be an API call in a real app
  // For now, we'll use mock data
  return [
    {
      id: 5,
      user_id: 'bbbbbbbb-2222-2222-2222-222222222222',
      project_title: 'Survey of Mental Health in University Students',
      investigation_type: 'EO',
      category_type: 'SH',
      sequential_number: 5,
      codification: 'CEISH-ESPOL-23-05-EO-SH-005',
      date_created: '2023-05-01T10:45:00+00',
      date_submitted: '2023-05-10T11:15:00+00',
      status: 'SECOND_REVIEW',
      metadata: {
        department: 'Psychology',
        funding: 'University Grant',
        duration_months: 9
      },
      applicant_name: 'María Luisa García López',
      applicant_email: 'mariagarcia@example.com',
      reviewer_name: 'Roberto Alejandro Martínez Sánchez',
      reviewer_comments: 'Reviewed and ready for final approval'
    }
  ] as any[];
};

export default function ManageApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'accept' | 'reject' | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const { data: session } = useSession();
  
  // Fetch applications when the component mounts
  useState(() => {
    const loadApplications = async () => {
      const apps = await fetchApplicationsForManagement();
      setApplications(apps);
    };
    
    loadApplications();
  });

  // Handle dialog confirmation
  const handleConfirm = () => {
    if (!selectedApplication) return;
    
    const newStatus = dialogType === 'accept' ? 'ACCEPTED' : 'REJECTED';
    
    // Update application status
    const updatedApplications = applications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: newStatus }
        : app
    );
    setApplications(updatedApplications);
    
    setDialogOpen(false);
    setSelectedApplication(null);
    setDialogType(null);
    
    // In a real app, you would send this update to your API
  };

  // Open dialog for confirmation
  const openDialog = (type: 'accept' | 'reject', application: any) => {
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
      key: 'reviewer',
      header: 'Reviewer',
      cell: (application: any) => (
        <div>
          <div>{application.reviewer_name}</div>
          <div className="text-xs text-gray-500 italic">{application.reviewer_comments}</div>
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
                <Link href={`/dashboard/manage/${application.id}`} className="w-full cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>
              
              {/* Final Approve */}
              <DropdownMenuItem onClick={() => openDialog('accept', application)}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-green-500">Final Approval</span>
              </DropdownMenuItem>
              
              {/* Reject */}
              <DropdownMenuItem onClick={() => openDialog('reject', application)}>
                <X className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-red-500">Reject</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Applications</h1>
        <p className="text-muted-foreground">
          Final review and management of applications
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
              {dialogType === 'accept' && 'Final Approval'}
              {dialogType === 'reject' && 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'accept' && 'Are you sure you want to give final approval to this application? This will mark it as ACCEPTED.'}
              {dialogType === 'reject' && 'Are you sure you want to reject this application? This will mark it as REJECTED.'}
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
