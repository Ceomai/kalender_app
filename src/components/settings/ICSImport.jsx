import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { importICS } from "@/lib/ics-import-fns";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function ICSImport() {
  const t = useT();
  const queryClient = useQueryClient();
  const runImport = useServerFn(importICS);
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: async (file) => {
      // Dosyayı özel depolamaya yükle (stored privately).
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      return runImport({ data: { file_uri } });
    },
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(t("ics.toast").replace("{n}", res.created || 0));
      setFileName("");
    },
    onError: () => {
      toast.error(t("ics.toastErr"));
      setFileName("");
    },
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ics")) {
      toast.error(t("ics.onlyIcs"));
      return;
    }
    setFileName(file.name);
    setResult(null);
    mutation.mutate(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("ics.desc")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".ics,text/calendar"
          onChange={handleFile}
          className="hidden"
          id="ics-file-input"
        />
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {t("ics.importing")}
            </span>
          ) : (
            <>
              <Upload className="mr-1.5 h-4 w-4" />
              {t("ics.choose")}
            </>
          )}
        </Button>
        {fileName && !mutation.isPending && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {fileName}
          </span>
        )}
      </div>
      {result && (
        <p className="text-xs text-muted-foreground">
          {t("ics.result").replace("{created}", result.created || 0).replace("{skipped}", result.skipped || 0)}
        </p>
      )}
    </div>
  );
}