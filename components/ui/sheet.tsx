"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" />
    <DialogPrimitive.Content aria-describedby={undefined} ref={ref} className={cn("top-drawer fixed inset-x-0 top-0 z-50 w-full rounded-b-2xl bg-white px-4 pb-5 pt-14 shadow-[0_10px_30px_rgba(0,0,0,.08)] outline-none", className)} {...props}>
      <DialogPrimitive.Title className="sr-only">Меню</DialogPrimitive.Title>
      {children}
      <DialogPrimitive.Close className="sheet-close absolute inline-flex h-8 w-8 items-center justify-center border border-black/30 bg-white text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2" aria-label="Закрыть"><X size={16} strokeWidth={2.25} /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetClose, SheetContent };
