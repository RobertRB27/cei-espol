"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Application,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/lib/applications/types";
import {
  FilePlus,
  Eye,
  Edit,
  Trash,
  Send,
  Settings,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApplicationFormModal } from "@/components/applications/ApplicationFormModal";
import { DocumentViewerModal } from "@/components/applications/DocumentViewerModal";

// Mock data for applications
const mockApplications: Application[] = [
  {
    id: 1,
    user_id: "user-123",
    project_title: "Study on cognitive development in children",
    investigation_type: "EO",
    category_type: "SH",
    sequential_number: 1,
    codification: "CEISH-ESPOL-23-04-EO-SH-001",
    date_created: "2023/04/12T10:00:00Z",
    date_submitted: "2023/04/15T14:30:00Z",
    status: "UNDER_REVIEW",
    metadata: null,
  },
  {
    id: 2,
    user_id: "user-123",
    project_title: "Analysis of coastal erosion patterns",
    investigation_type: "EI",
    category_type: "GE",
    sequential_number: 2,
    codification: "CEISH-ESPOL-23-05-EI-GE-002",
    date_created: "2023/05/03T09:15:00Z",
    date_submitted: null,
    status: "NOT_SUBMITTED",
    metadata: null,
  },
  {
    id: 3,
    user_id: "user-123",
    project_title: "Effects of new fertilizer on crop yield",
    investigation_type: "EI",
    category_type: "AN",
    sequential_number: 3,
    codification: "CEISH-ESPOL-23-05-EI-AN-003",
    date_created: "2023/05/10T11:30:00Z",
    date_submitted: "2023/05/11T16:45:00Z",
    status: "ACCEPTED",
    metadata: null,
  },
  {
    id: 4,
    user_id: "user-123",
    project_title: "Mental health survey in university students",
    investigation_type: "EO",
    category_type: "SH",
    sequential_number: 4,
    codification: "CEISH-ESPOL-23-06-EO-SH-004",
    date_created: "2023/06/05T14:20:00Z",
    date_submitted: "2023/06/10T09:30:00Z",
    status: "REJECTED",
    metadata: null,
  },
  {
    id: 5,
    user_id: "user-123",
    project_title: "New framework for machine learning applications",
    investigation_type: "EO",
    category_type: "GE",
    sequential_number: 5,
    codification: "CEISH-ESPOL-23-07-EO-GE-005",
    date_created: "2023/07/01T10:45:00Z",
    date_submitted: null,
    status: "NOT_SUBMITTED",
    metadata: null,
  },
];

// Function to fetch applications from the database
const fetchUserApplications = async (userId: string) => {
  try {
    const response = await fetch(`/api/applications?userId=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch applications");
    return await response.json();
  } catch (error) {
    console.error("Error fetching applications:", error);
    return mockApplications; // Fallback to mock data if fetch fails
  }
};

// Function to submit an application to the database
const submitApplication = async (applicationId: number) => {
  try {
    const response = await fetch(`/api/applications/${applicationId}/submit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to submit application");
    return true;
  } catch (error) {
    console.error("Error submitting application:", error);
    return false;
  }
};

// Function to delete (mark as deleted) an application
const deleteApplication = async (applicationId: number) => {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete application");
    return true;
  } catch (error) {
    console.error("Error deleting application:", error);
    return false;
  }
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"submit" | "delete" | null>(
    null
  );
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  // State for new modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [viewingApplication, setViewingApplication] =
    useState<Application | null>(null);

  // Load applications when component mounts or userId changes
  useEffect(() => {
    const loadApplications = async () => {
      if (userId) {
        const apps = await fetchUserApplications(userId);
        setApplications(apps);
      }
    };

    loadApplications();
  }, [userId]);

  // Handle dialog confirmation
  const handleConfirm = async () => {
    if (!selectedApplication) return;

    let success = false;

    if (dialogType === "submit") {
      // Submit application to database
      success = await submitApplication(selectedApplication.id);
      if (success) {
        // Update application status locally
        const updatedApplications = applications.map((app) =>
          app.id === selectedApplication.id
            ? {
                ...app,
                status: "UNDER_REVIEW" as const,
                date_submitted: new Date().toISOString(),
              }
            : app
        );
        setApplications(updatedApplications);
        toast.success("Application submitted successfully", {
          description: "Your application is now under review.",
        });
      } else {
        toast.error("Failed to submit application", {
          description: "Please try again or contact support.",
        });
      }
    } else if (dialogType === "delete") {
      // Delete application in database
      success = await deleteApplication(selectedApplication.id);
      if (success) {
        // Update application status locally
        const updatedApplications = applications.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, status: "DELETED" as const }
            : app
        );
        setApplications(updatedApplications);
        toast.success("Application deleted successfully");
      } else {
        toast.error("Failed to delete application", {
          description: "Please try again or contact support.",
        });
      }
    }

    // If the operation failed, we could show an error toast here

    setDialogOpen(false);
    setSelectedApplication(null);
    setDialogType(null);
  };

  // Open dialog for submit or delete confirmation
  const openDialog = (type: "submit" | "delete", application: Application) => {
    setDialogType(type);
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  // Define table columns
  const columns = [
    {
      key: "codification",
      header: "Código",
      cell: (application: Application) => (
        <span className="font-medium min-w-[200px] inline-block">
          {application.codification}
        </span>
      ),
      sortable: true,
    },
    {
      key: "project_title",
      header: "Título del Proyecto",
      cell: (application: Application) => (
        <div
          className="max-w-[450px] break-words"
          title={application.project_title}
        >
          {application.project_title}
        </div>
      ),
      sortable: true,
    },
    {
      key: "date_created",
      header: "Fecha de Creación",
      cell: (application: Application) => formatDate(application.date_created),
      sortable: true,
    },
    {
      key: "date_submitted",
      header: "Fecha de Envío",
      cell: (application: Application) =>
        formatDate(application.date_submitted),
      sortable: true,
    },
    {
      key: "status",
      header: "Estado",
      cell: (application: Application) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            application.status
          )}`}
        >
          {getStatusLabel(application.status)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (application: Application) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <span className="sr-only">Abrir Menu</span>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* View - always available */}
              <DropdownMenuItem
                onClick={() => {
                  setViewingApplication(application);
                  setViewerModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                <span>Ver</span>
              </DropdownMenuItem>

              {/* Edit - only for NOT_SUBMITTED or NOT_COMPLETED */}
              {(application.status === "NOT_SUBMITTED" ||
                application.status === "NOT_COMPLETED") && (
                <DropdownMenuItem
                  onClick={() => {
                    // For now we'll just show a toast since the edit form needs further implementation
                    toast.info("Edit functionality will be implemented soon");
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span>Editar</span>
                </DropdownMenuItem>
              )}

              {/* Submit - only for NOT_SUBMITTED or NOT_COMPLETED */}
              {(application.status === "NOT_SUBMITTED" ||
                application.status === "NOT_COMPLETED") && (
                <DropdownMenuItem
                  onClick={() => openDialog("submit", application)}
                >
                  <Send className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-blue-500">Enviar</span>
                </DropdownMenuItem>
              )}

              {/* Delete - only for NOT_SUBMITTED or NOT_COMPLETED */}
              {(application.status === "NOT_SUBMITTED" ||
                application.status === "NOT_COMPLETED") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDialog("delete", application)}
                  >
                    <Trash className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-red-500">Eliminar</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Aplicaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus aplicaciones de ética
          </p>
        </div>
        <Button onClick={() => setFormModalOpen(true)}>
          <FilePlus className="h-4 w-4 mr-2" />
          Nueva Aplicación
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        primaryKey="id"
        searchable={true}
        searchKeys={["codification", "project_title"]}
      />

      {/* Confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "submit"
                ? "Enviar Aplicación"
                : "Eliminar Aplicación"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "submit"
                ? "¿Estás seguro de enviar esta aplicación? Una vez enviada, no podrá ser modificada."
                : "¿Estás seguro de eliminar esta aplicación? Esta acción no podrá ser deshecha."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={dialogType === "delete" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {dialogType === "submit" ? "Enviar" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Form Modal */}
      {formModalOpen && (
        <ApplicationFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onApplicationCreated={() =>
            fetchUserApplications(userId).then((apps) => setApplications(apps))
          }
        />
      )}

      {/* Document Viewer Modal */}
      {viewerModalOpen && viewingApplication && (
        <DocumentViewerModal
          open={viewerModalOpen}
          onClose={() => setViewerModalOpen(false)}
          applicationId={viewingApplication.id}
          applicationTitle={viewingApplication.project_title}
        />
      )}
    </div>
  );
}
