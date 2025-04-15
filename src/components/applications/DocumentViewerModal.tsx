"use client";

import { useState } from "react";
import { Download, File, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Document = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  downloadUrl?: string;
};

export function DocumentViewerModal({
  open,
  onClose,
  applicationId,
  applicationTitle,
}: {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationTitle: string;
}) {
  // Available documents
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "form1",
      title: "Solicitud de Análisis de Propuestas de Investigación",
      fileName: `Solicitud_${applicationId}.pdf`,
      url: `/api/applications/${applicationId}/documents/solicitud`, // For preview
      downloadUrl: `/api/applications/${applicationId}/documents/solicitud?download=true`, // For download
    },
    {
      id: "form5",
      title: "Declaración de Asunción de Responsabilidad",
      fileName: `Declaracion_${applicationId}.pdf`,
      url: `/api/applications/${applicationId}/documents/declaracion`, // For preview
      downloadUrl: `/api/applications/${applicationId}/documents/declaracion?download=true`, // For download
    },
  ]);

  // Currently selected document
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // PDF loading state
  const [loading, setLoading] = useState(false);

  // Initialize with the first document selected (the new Solicitud de Análisis)
  useState(() => {
    if (documents.length > 0 && !selectedDoc) {
      setSelectedDoc(documents[0]);
    }
  });

  // Handle document selection
  const selectDocument = (doc: Document) => {
    setLoading(true);
    setSelectedDoc(doc);
    // Give the browser time to load the PDF
    setTimeout(() => setLoading(false), 1000);
  };

  // Handle document download
  const downloadDocument = (doc: Document) => {
    // Create a hidden anchor element to trigger the download
    const link = document.createElement("a");
    link.href = doc.downloadUrl || `${doc.url}?download=true`;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloading ${doc.fileName}`, {
      description: "Your document is being downloaded.",
    });

    // In a real implementation, we would trigger the download
    // window.open(doc.url, '_blank')
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ver Documentos de la Aplicación</DialogTitle>
          <DialogDescription>
            {applicationTitle} - Previsualización y descarga de documentos
            generados
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 h-full gap-4 mt-4 overflow-hidden">
          {/* Document list sidebar */}
          <div className="w-1/3 border rounded-md overflow-y-auto">
            <div className="p-3 font-medium border-b">
              Documentos Disponibles
            </div>
            <div className="divide-y">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center ${
                    doc.id === "form1" ? "border-l-4 border-green-500 " : ""
                  }${selectedDoc?.id === doc.id ? "bg-blue-50" : ""}`}
                  onClick={() => selectDocument(doc)}
                >
                  <File
                    className={`h-5 w-5 mr-2 ${
                      selectedDoc?.id === doc.id
                        ? "text-blue-500"
                        : "text-gray-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm ${
                        selectedDoc?.id === doc.id ? "font-medium" : ""
                      }`}
                    >
                      {doc.title}
                    </div>
                    <div className="text-xs text-gray-500">{doc.fileName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document preview pane */}
          <div className="flex-1 border rounded-md flex flex-col h-full overflow-hidden">
            {selectedDoc ? (
              <>
                <div className="p-3 font-medium border-b flex justify-between items-center">
                  <span>{selectedDoc.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(selectedDoc)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
                <div className="flex-1 p-4 bg-gray-50 overflow-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="bg-white h-full w-full overflow-hidden">
                      {/* Actual PDF embedded in an iframe */}
                      <iframe
                        src={selectedDoc.url}
                        className="w-full h-full border-0"
                        title={selectedDoc.title}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-4 text-gray-500">
                <div className="text-center">
                  <File className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Seleccione un documento para previsualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
