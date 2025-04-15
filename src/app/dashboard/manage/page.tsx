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
import { Eye, Settings, CheckCircle, X } from "lucide-react";
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

// Function to fetch applications in SECOND_REVIEW status
const fetchApplicationsForManagement = async () => {
  try {
    const response = await fetch("/api/applications/manage");
    if (!response.ok) {
      console.error(
        "Failed to fetch applications for management:",
        response.status
      );
      return [];
    }

    const applications = await response.json();
    console.log("Fetched applications for management:", applications);
    return applications;
  } catch (error) {
    console.error("Error fetching applications for management:", error);
    // Return mock data as fallback if API fails
    return [
      {
        id: 5,
        user_id: "bbbbbbbb-2222-2222-2222-222222222222",
        project_title: "Survey of Mental Health in University Students",
        investigation_type: "EO",
        category_type: "SH",
        sequential_number: 5,
        codification: "CEISH-ESPOL-23-05-EO-SH-005",
        date_created: "2023-05-01T10:45:00+00",
        date_submitted: "2023-05-10T11:15:00+00",
        status: "SECOND_REVIEW",
        metadata: {
          department: "Psychology",
          funding: "University Grant",
          duration_months: 9,
        },
        applicant_name: "María Luisa García López",
        applicant_email: "mariagarcia@example.com",
        reviewer_name: "Roberto Alejandro Martínez Sánchez",
        reviewer_comments: "Reviewed and ready for final approval",
      },
    ] as any[];
  }
};

export default function ManageApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"accept" | "reject" | null>(
    null
  );
  const [selectedApplication, setSelectedApplication] = useState<any | null>(
    null
  );
  const { data: session } = useSession();

  // Fetch applications when the component mounts
  useEffect(() => {
    const loadApplications = async () => {
      const apps = await fetchApplicationsForManagement();
      setApplications(apps);
    };

    loadApplications();
  }, []); // Empty dependency array means this effect runs once on mount

  // Handle dialog confirmation
  const handleConfirm = async () => {
    if (!selectedApplication) return;

    const newStatus = dialogType === "accept" ? "ACCEPTED" : "REJECTED";
    const actionDescription =
      dialogType === "accept"
        ? "Aprobación final de la aplicación por el revisor final"
        : "Rechazo de la aplicación en la revisión final";

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

      // Remove the application from the list after action
      setApplications(
        applications.filter((app) => app.id !== selectedApplication.id)
      );

      // Show success message
      console.log(
        `Aplicación ${selectedApplication.id} estado actualizado a ${newStatus}`
      );

      // Show success toast based on the action
      if (newStatus === "ACCEPTED") {
        toast.success("Aplicación aprobada", {
          description: "La aplicación ha sido aprobada y finalizada.",
        });
      } else if (newStatus === "REJECTED") {
        toast.success("Aplicación rechazada", {
          description: "La aplicación ha sido rechazada en la revisión final.",
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
  const openDialog = (type: "accept" | "reject", application: any) => {
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
      key: "reviewer",
      header: "Revisor",
      cell: (application: any) => (
        <div>
          <div>{application.reviewer_name}</div>
          <div className="text-xs text-gray-500 italic">
            {application.reviewer_comments}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date_submitted",
      header: "Fecha de envío",
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
                  href={`/dashboard/manage/${application.id}`}
                  className="w-full cursor-pointer"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Ver Detalles</span>
                </Link>
              </DropdownMenuItem>

              {/* Final Approve */}
              <DropdownMenuItem
                onClick={() => openDialog("accept", application)}
              >
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-green-500">Aprobación Final</span>
              </DropdownMenuItem>

              {/* Reject */}
              <DropdownMenuItem
                onClick={() => openDialog("reject", application)}
              >
                <X className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-red-500">Rechazo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Aplicaciones</h1>
        <p className="text-muted-foreground">
          Revisión y gestión de aplicaciones
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
              {dialogType === "accept" && "Aprobación Final"}
              {dialogType === "reject" && "Rechazo"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "accept" &&
                "¿Estás seguro de dar aprobación final a esta aplicación? Esto marcará la aplicación como APROBADA."}
              {dialogType === "reject" &&
                "¿Estás seguro de rechazar esta aplicación? Esto marcará la aplicación como RECHAZADA."}
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
