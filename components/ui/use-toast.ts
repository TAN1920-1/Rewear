"use client"

import type { ExternalToast } from "sonner"
import { toast as sonnerToast } from "sonner"

export type ToasterToast = ExternalToast & {
  title?: string
  description?: string
  id?: string | number
}

const toast = (props: ToasterToast) => {
  const { title, description, ...rest } = props
  const id = rest.id ?? crypto.randomUUID()

  if (title && description) {
    sonnerToast(title, { description, id, ...rest })
  } else if (title) {
    sonnerToast(title, { id, ...rest })
  } else if (description) {
    sonnerToast.message(description, { id, ...rest })
  } else {
    sonnerToast.message("", { id, ...rest })
  }

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToasterToast) => {
      const t = next.title ?? ""
      const d = next.description
      if (t && d) sonnerToast(t, { description: d, id, ...next })
      else if (t) sonnerToast(t, { id, ...next })
      else sonnerToast.message(d ?? "", { id, ...next })
    },
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    toasts: [] as ToasterToast[],
  }
}

export { useToast, toast }
