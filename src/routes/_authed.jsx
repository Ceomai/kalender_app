import { createFileRoute } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { PreferencesProvider } from "@/lib/PreferencesContext";
import { getMySpace } from "@/lib/profile-fns";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: async (ctx) => {
    const { user } = await requireSignedIn(ctx);
    const space = await getMySpace();
    return { user, profile: space.profile };
  },
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, profile } = Route.useRouteContext();
  return (
    <PreferencesProvider initial={profile}>
      <AppShell user={user} />
    </PreferencesProvider>
  );
}