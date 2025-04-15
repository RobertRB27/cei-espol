"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordSchema, ResetPasswordFormData } from "@/lib/auth/schemas";
import { z } from "zod";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await requestPasswordReset(values);

      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Resetea tu contraseña
          </CardTitle>
          <CardDescription className="text-center">
            Introduce tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 text-red-700 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
              <AlertDescription>
                Si existe una cuenta con ese correo electrónico, recibirás un
                enlace para restablecer tu contraseña pronto.
              </AlertDescription>
            </Alert>
          )}

          {!success && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? "Enviando..."
                    : "Enviar enlace de restablecimiento"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            ¿Recordarás tu contraseña?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
