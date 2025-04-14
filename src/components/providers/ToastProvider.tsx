'use client'

import { Toaster } from 'sonner'

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      richColors
      toastOptions={{
        duration: 5000,
        className: 'rounded-md shadow-md'
      }}
    />
  )
}
