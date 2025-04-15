"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Eye, Settings, CheckCircle, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";

// Function to fetch applications that need review from the API
const fetchApplicationsForReview = async (reviewerId: string) => {
  try {
    const response = await fetch("/api/applications/review");
    if (!response.ok) {
      console.error(
        "Failed to fetch applications for review:",
        response.status
      );
      return [];
    }

    const applications = await response.json();
    console.log("Fetched applications for review:", applications);
    return applications;
  } catch (error) {
    console.error("Error fetching applications for review:", error);
    // Return mock data as fallback if API fails
    return [
      {
        id: 2,
        user_id: "bbbbbbbb-2222-2222-2222-222222222222",
        project_title: "Impact of Climate Change on Local Ecosystems",
        investigation_type: "EO",
        category_type: "AN",
        sequential_number: 2,
        codification: "CEISH-ESPOL-23-02-EO-AN-002",
        date_created: "2023/02/03T09:15:00Z",
        date_submitted: "2023/02/10T16:45:00Z",
        status: "UNDER_REVIEW",
        metadata: {
          department: "Environmental Science",
          funding: "External Grant",
          duration_months: 24,
        },
        applicant_name: "Juan Carlos Pérez Gómez",
        applicant_email: "juanperez@example.com",
      },
      {
        id: 5,
        user_id: "bbbbbbbb-2222-2222-2222-222222222222",
        project_title: "Survey of Mental Health in University Students",
        investigation_type: "EO",
        category_type: "SH",
        sequential_number: 5,
        codification: "CEISH-ESPOL-23-05-EO-SH-005",
        date_created: "2023/05/01T10:45:00Z",
        date_submitted: "2023/05/10T11:15:00Z",
        status: "SECOND_REVIEW",
        metadata: {
          department: "Psychology",
          funding: "University Grant",
          duration_months: 9,
        },
        applicant_name: "María Luisa García López",
        applicant_email: "mariagarcia@example.com",
      },
      {
        id: 8,
        user_id: "bbbbbbbb-2222-2222-2222-222222222222",
        project_title: "Sustainable Urban Planning Model",
        investigation_type: "EO",
        category_type: "GE",
        sequential_number: 8,
        codification: "CEISH-ESPOL-23-08-EO-GE-008",
        date_created: "2023/08/22T15:10:00Z",
        date_submitted: "2023/08/30T10:20:00Z",
        status: "UNDER_REVIEW",
        metadata: {
          department: "Urban Planning",
          funding: "Municipal Government",
          duration_months: 18,
        },
        applicant_name: "María Luisa García López",
        applicant_email: "mariagarcia@example.com",
      },
    ] as any[];
  }
};

export default function ReviewApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "accept" | "reject" | "incomplete" | null
  >(null);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(
    null
  );
  const { data: session } = useSession();
  const reviewerId = session?.user?.id || "";

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
      case "accept":
        // When a reviewer approves, it goes to SECOND_REVIEW for role 2 users to manage
        newStatus = "SECOND_REVIEW";
        actionDescription = "Aplicación aprobada y enviada para revisión final";
        break;
      case "reject":
        newStatus = "REJECTED";
        actionDescription =
          "Aplicación rechazada por razones éticas o de metodología";
        break;
      case "incomplete":
        newStatus = "NOT_COMPLETED";
        actionDescription =
          "Aplicación requiere información adicional o documentación";
        break;
      default:
        return;
    }

    try {
      // Call the API to update application status
      const response = await fetch(
        `/api/applications/${selectedApplication.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            comments: actionDescription,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Fallo al actualizar el estado de la aplicación:",
          await response.text()
        );
        toast.error("Fallo al actualizar el estado de la aplicación", {
          description:
            "Por favor, inténtelo de nuevo o contacte al administrador.",
        });
        return;
      }

      // Update the local state with the new status
      const updatedApplications = applications.map((app) =>
        app.id === selectedApplication.id ? { ...app, status: newStatus } : app
      );

      // If approved or rejected, remove from the list to avoid confusion
      if (
        newStatus === "SECOND_REVIEW" ||
        newStatus === "REJECTED" ||
        newStatus === "NOT_COMPLETED"
      ) {
        setApplications(
          applications.filter((app) => app.id !== selectedApplication.id)
        );
      } else {
        setApplications(updatedApplications);
      }

      // Show success message
      console.log(
        `Aplicación ${selectedApplication.id} estado actualizado a ${newStatus}`
      );

      // Show toast notification based on the action taken
      if (newStatus === "SECOND_REVIEW") {
        toast.success("Aplicación aprobada", {
          description: "Aplicación ha sido enviada para revisión final.",
        });
      } else if (newStatus === "REJECTED") {
        toast.success("Aplicación rechazada", {
          description: "Aplicación ha sido rechazada.",
        });
      } else if (newStatus === "NOT_COMPLETED") {
        toast.success("Aplicación marcada como incompleta", {
          description:
            "El solicitante será notificado para proporcionar información adicional.",
        });
      }

      // Close the dialog
      setDialogOpen(false);
      setSelectedApplication(null);
      setDialogType(null);
    } catch (error) {
      console.error("Error al actualizar el estado de la aplicación:", error);
      toast.error("Error al actualizar el estado de la aplicación", {
        description:
          "Un error inesperado ocurrió. Por favor, inténtelo de nuevo.",
      });
    }
  };

  // Open dialog for confirmation
  const openDialog = (
    type: "accept" | "reject" | "incomplete",
    application: any
  ) => {
    setDialogType(type);
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  // Define table columns
  const columns = [
    {
      key: "codification",
      header: "Código",
      cell: (application: any) => (
        <span className="font-medium">{application.codification}</span>
      ),
      sortable: true,
    },
    {
      key: "project_title",
      header: "Título del Proyecto",
      cell: (application: any) => application.project_title,
      sortable: true,
    },
    {
      key: "applicant",
      header: "Solicitante",
      cell: (application: any) => (
        <div>
          <div>{application.applicant_name}</div>
          <div className="text-xs text-gray-500">
            {application.applicant_email}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date_submitted",
      header: "Fecha de Envío",
      cell: (application: any) => formatDate(application.date_submitted),
      sortable: true,
    },
    {
      key: "status",
      header: "Estado",
      cell: (application: any) => (
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
      cell: (application: any) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <span className="sr-only">Abrir menu</span>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* View - always available */}
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/review/${application.id}`}
                  className="w-full cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Ver Detalles</span>
                </Link>
              </DropdownMenuItem>

              {/* Only show actions for applications with UNDER_REVIEW status */}
              {application.status === "UNDER_REVIEW" && (
                <>
                  {/* Approve - moves to SECOND_REVIEW for role 2 */}
                  <DropdownMenuItem
                    onClick={() => openDialog("accept", application)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-green-500">Aprobar</span>
                  </DropdownMenuItem>

                  {/* Not Complete - returns to user for more info */}
                  <DropdownMenuItem
                    onClick={() => openDialog("incomplete", application)}
                  >
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-amber-500">
                      Marcar como Incompleto
                    </span>
                  </DropdownMenuItem>

                  {/* Reject */}
                  <DropdownMenuItem
                    onClick={() => openDialog("reject", application)}
                  >
                    <X className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-red-500">Rechazar</span>
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
      <div>
        <h1 className="text-2xl font-bold">Aplicaciones para Revisión</h1>
        <p className="text-muted-foreground">
          Revisa y procesa las aplicaciones presentadas al comité ético
        </p>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        primaryKey="id"
        searchable={true}
        searchKeys={[
          "codification",
          "project_title",
          "applicant_name",
          "applicant_email",
        ]}
      />

      {/* Confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "accept" && "Aprobar Aplicación"}
              {dialogType === "reject" && "Rechazar Aplicación"}
              {dialogType === "incomplete" && "Marcar como Incompleto"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "accept" &&
                "¿Estás seguro de aprobar esta aplicación? Esto enviará la aplicación al gerente para la revisión final."}
              {dialogType === "reject" &&
                "¿Estás seguro de rechazar esta aplicación? Esto marcará la aplicación como REJECTED."}
              {dialogType === "incomplete" &&
                "¿Estás seguro de marcar esta aplicación como incompleta? Esto solicitará al solicitante que proporcione información adicional."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={dialogType === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
