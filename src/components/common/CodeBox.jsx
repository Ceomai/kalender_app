import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Davet kodunu büyük ve kopyalanabilir şekilde gösterir.
export function CodeBox({ code, label, className }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1">
        {label && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <p className="font-mono text-2xl font-semibold tracking-[0.2em]">{code}</p>
      </div>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
        {copied ? t("common.copied") : t("common.copy")}
      </Button>
    </div>
  );
}