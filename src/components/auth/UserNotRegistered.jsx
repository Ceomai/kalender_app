import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { AuthLayout } from "./AuthLayout";

// Signed in to Base44, but not a user of this app (invite-only apps).
export function UserNotRegistered() {
  const { logout } = useAuth();
  return (
    <AuthLayout icon={UserX} title="Erişim verilmedi" subtitle="Hesabınız bu uygulama için kayıtlı değil.">
      <p className="mb-6 text-center text-sm text-foreground">Uygulama sahibinden davet isteyin veya farklı bir hesapla giriş yapın.</p>
      <Button variant="outline" className="h-12 w-full font-medium" onClick={logout}>
        Çıkış yap
      </Button>
    </AuthLayout>
  );
}