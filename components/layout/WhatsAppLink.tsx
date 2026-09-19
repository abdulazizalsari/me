"use client";

export function WhatsAppLink({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  return <button className={className} type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-whatsapp-dialog"))}>{children}</button>;
}
