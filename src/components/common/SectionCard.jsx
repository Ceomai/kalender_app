import { cn } from "@/lib/utils";

// Sayfalarda tekrar eden kart yapısı.
export function SectionCard({ title, description, action, className, children }) {
  return (
    <section className={cn("rounded-3xl border border-border/70 bg-card p-5 shadow-sm", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-heading text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}