"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  File,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Multi-step application form modal component
 */
export function ApplicationFormModal({
  open,
  onClose,
  onApplicationCreated,
}: {
  open: boolean;
  onClose: () => void;
  onApplicationCreated?: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Form steps state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    identificationType: "Cédula",
    identificationNumber: "",
    projectTitle: "",
    investigationType: "",
    categoryType: "",

    vinculationType: "",
    externalInstitution: "",
    level: "",
    risk: "",

    documents: [] as File[],
  });

  // File input ref for document upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form data changes
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle checkbox change for vinculationType
  const handleVinculationChange = (value: string) => {
    setFormData({
      ...formData,
      vinculationType: value,
      // Reset external institution if ESPOL worker is selected
      externalInstitution:
        value === "espol" ? "" : formData.externalInstitution,
    });
  };

  // Handle document upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);

      setFormData({
        ...formData,
        documents: [...formData.documents, ...newFiles],
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove document from list
  const removeDocument = (index: number) => {
    const updatedDocs = [...formData.documents];
    updatedDocs.splice(index, 1);
    setFormData({
      ...formData,
      documents: updatedDocs,
    });
  };

  // Navigate between steps
  const nextStep = () => {
    if (step < totalSteps) {
      // Validate current step before proceeding
      if (validateCurrentStep()) {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Validate current step
  const validateCurrentStep = () => {
    if (step === 1) {
      if (!formData.title) {
        toast.error("Por favor, seleccione un título");
        return false;
      }

      if (!formData.identificationType) {
        toast.error("Por favor, seleccione un tipo de identificación");
        return false;
      }
      if (!formData.identificationNumber) {
        toast.error("Por favor, ingrese su número de identificación");
        return false;
      }
      if (!formData.projectTitle) {
        toast.error("Por favor, ingrese un título de proyecto");
        return false;
      }
      if (!formData.investigationType) {
        toast.error("Por favor, seleccione un tipo de investigación");
        return false;
      }
      if (!formData.categoryType) {
        toast.error("Por favor, seleccione un tipo de categoría");
        return false;
      }
    } else if (step === 2) {
      if (!formData.vinculationType) {
        toast.error("Por favor, seleccione un tipo de vinculación");
        return false;
      }
      if (
        formData.vinculationType === "external" &&
        !formData.externalInstitution
      ) {
        toast.error("Por favor, ingrese su institución o empresa");
        return false;
      }
      if (!formData.level) {
        toast.error("Por favor, seleccione un nivel");
        return false;
      }
      if (!formData.risk) {
        toast.error("Por favor, seleccione un tipo de riesgo");
        return false;
      }
    }

    return true;
  };

  // Validate and submit the form
  const handleSubmit = async () => {
    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
    }

    if (formData.documents.length === 0) {
      toast.error("Por favor, suba al menos un documento");
      return;
    }

    try {
      // Log form data for debugging
      console.log("Submitting form data:", {
        title: formData.title,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
        projectTitle: formData.projectTitle,
        investigationType: formData.investigationType,
        categoryType: formData.categoryType,
        vinculationType: formData.vinculationType,
        externalInstitution: formData.externalInstitution,
        level: formData.level,
        risk: formData.risk,
        documentCount: formData.documents.length,
      });

      // Create application in the database
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: formData.title,
          identificationType: formData.identificationType,
          identificationNumber: formData.identificationNumber,
          projectTitle: formData.projectTitle,
          investigationType: formData.investigationType,
          categoryType: formData.categoryType,
          vinculationType: formData.vinculationType,
          externalInstitution: formData.externalInstitution,
          level: formData.level,
          risk: formData.risk,
          // We'll handle document upload separately
          documentCount: formData.documents.length,
        }),
      });

      // Capture the full response for better error handling
      const responseText = await response.text();
      console.log("API Response:", {
        status: response.status,
        text: responseText,
      });

      if (!response.ok) {
        throw new Error(responseText || "Fallo al crear la aplicación");
      }

      // Parse the response (if it's JSON)
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid response format from server");
      }

      // Upload documents
      if (result.id) {
        // TODO: Implement document upload functionality
        // For now, we'll just simulate it

        toast.success("Aplicación creada exitosamente", {
          description: "Su aplicación ha sido guardada como borrador.",
        });

        // Close modal and refresh only the applications data
        onClose();

        // Call the callback to refresh applications if provided, otherwise refresh the page
        if (onApplicationCreated) {
          onApplicationCreated();
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error creating application:", error);

      // Get more detailed error information
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error type:", typeof error);
      }

      // Show a user-friendly error message
      toast.error("Fallo al crear la aplicación", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Select
                value={formData.title}
                onValueChange={(value: string) => handleChange("title", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su título" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sr">Sr.</SelectItem>
                  <SelectItem value="Sra">Sra.</SelectItem>
                  <SelectItem value="Srta">Srta.</SelectItem>
                  <SelectItem value="Dr">Dr.</SelectItem>
                  <SelectItem value="Dra">Dra.</SelectItem>
                  <SelectItem value="PhD">PhD.</SelectItem>
                  <SelectItem value="MSc">MSc.</SelectItem>
                  <SelectItem value="Eng">Ing.</SelectItem>
                  <SelectItem value="Lcdo">Lcdo.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationType">Tipo de Identificación</Label>
              <Select
                value={formData.identificationType}
                onValueChange={(value: string) =>
                  handleChange("identificationType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo de identificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cédula">Cédula</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identificationNumber">
                Número de Identificación
              </Label>
              <Input
                id="identificationNumber"
                value={formData.identificationNumber}
                onChange={(e) =>
                  handleChange("identificationNumber", e.target.value)
                }
                placeholder="Ingresa el número de identificación"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectTitle">Título del Proyecto</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) => handleChange("projectTitle", e.target.value)}
                placeholder="Ingresa el título del proyecto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investigationType">Tipo de Investigación</Label>
              <RadioGroup
                value={formData.investigationType}
                onValueChange={(value: string) =>
                  handleChange("investigationType", value)
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EI" id="r1" />
                  <Label htmlFor="r1">Estudio de intervención (EI)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EO" id="r2" />
                  <Label htmlFor="r2">Estudio de observación (EO)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryType">Tipo de Categoría</Label>
              <RadioGroup
                value={formData.categoryType}
                onValueChange={(value: string) =>
                  handleChange("categoryType", value)
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GE" id="c1" />
                  <Label htmlFor="c1">Etica General (GE)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SH" id="c2" />
                  <Label htmlFor="c2">Seres Humanos (SH)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="AN" id="c3" />
                  <Label htmlFor="c3">Animales y Seres Vivos (AN)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vinculation</Label>
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="espol"
                    checked={formData.vinculationType === "espol"}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) handleVinculationChange("espol");
                    }}
                  />
                  <Label htmlFor="espol">Trabajador de ESPOL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="external"
                    checked={formData.vinculationType === "external"}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) handleVinculationChange("external");
                    }}
                  />
                  <Label htmlFor="external">Investigador externo</Label>
                </div>
              </div>
            </div>

            {formData.vinculationType === "external" && (
              <div className="space-y-2">
                <Label htmlFor="externalInstitution">
                  Institución o Empresa
                </Label>
                <Input
                  id="externalInstitution"
                  value={formData.externalInstitution}
                  onChange={(e) =>
                    handleChange("externalInstitution", e.target.value)
                  }
                  placeholder="Ingrese la institución o empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="level">Nivel de Riesgo</Label>
              <Select
                value={formData.level}
                onValueChange={(value: string) => handleChange("level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el nivel de riesgo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inexistente">Inexistente</SelectItem>
                  <SelectItem value="Poco probable">Poco probable</SelectItem>
                  <SelectItem value="Probable">Probable</SelectItem>
                  <SelectItem value="Altamente probable">
                    Altamente probable
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk">Tipo deRiesgo</Label>
              <Select
                value={formData.risk}
                onValueChange={(value: string) => handleChange("risk", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo de riesgo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exenta de riesgos">
                    Exenta de riesgos
                  </SelectItem>
                  <SelectItem value="Riesgos mínimos">
                    Riesgos mínimos
                  </SelectItem>
                  <SelectItem value="Riesgos moderados">
                    Riesgos moderados
                  </SelectItem>
                  <SelectItem value="Riesgos máximos">
                    Riesgos máximos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subir Documentos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 mt-2">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Arrastre y suelte archivos aquí o haga clic para buscar
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Documento
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </div>
              </div>
            </div>

            {formData.documents.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Documentos Cargados</Label>
                <div className="space-y-2 mt-2">
                  {formData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Aplicación</DialogTitle>
          <DialogDescription>
            Complete todos los campos obligatorios para crear una nueva
            aplicación de comité de ética.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="w-full flex justify-center mb-4">
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i + 1 === step
                      ? "bg-primary text-primary-foreground"
                      : i + 1 < step
                      ? "bg-primary/20 text-primary border-primary"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`h-1 w-10 ${
                      i + 1 < step ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStepContent()}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <Button onClick={nextStep}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Guardar Aplicación</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
