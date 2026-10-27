// TanStack Query hooks over the services. Keys match the web app's so ported screens
// invalidate the same lists after a change.
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useAuth } from '@/src/lib/AuthContext';
import { getAnalytics, type Period } from '@/src/services/analytics';
import { listCalendars } from '@/src/services/calendars';
import { listEvents, listUpcoming, type EventFilters } from '@/src/services/events';
import { listFriends } from '@/src/services/friends';
import { listEventInvitations, listPendingInvitations } from '@/src/services/invitations';
import { getMySpace } from '@/src/services/profiles';
import { listTasks } from '@/src/services/tasks';
import { listTemplates } from '@/src/services/templates';

export const queryKeys = {
  mySpace: ['auth', 'me'] as const,
  events: ['events'] as const,
  eventsRange: (f: EventFilters) =>
    ['events', f.from, f.to, (f.categories ?? []).join(','), f.priority ?? '', f.calendarId ?? '', f.search ?? ''] as const,
  upcoming: ['upcoming-reminders'] as const,
  tasks: ['tasks'] as const,
  calendars: ['calendars'] as const,
  templates: ['templates'] as const,
  friends: ['friends'] as const,
  pendingInvitations: ['pending-invitations'] as const,
  eventInvitations: (eventId: string) => ['event-invitations', eventId] as const,
  analytics: (period: Period) => ['analytics', period] as const,
};

/** Queries run only with a session, so nothing is fetched on the auth screens. */
function useSignedIn() {
  return useAuth().isAuthenticated;
}

export function useMySpace() {
  return useQuery({ queryKey: queryKeys.mySpace, queryFn: getMySpace, enabled: useSignedIn() });
}

export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.eventsRange(filters),
    queryFn: () => listEvents(filters),
    enabled: useSignedIn(),
  });
}

export function useUpcoming(days = 7) {
  return useQuery({
    queryKey: queryKeys.upcoming,
    queryFn: () => listUpcoming(days),
    enabled: useSignedIn(),
    refetchInterval: 60_000,
  });
}

export function useTasks() {
  return useQuery({ queryKey: queryKeys.tasks, queryFn: listTasks, enabled: useSignedIn() });
}

export function useCalendars() {
  return useQuery({ queryKey: queryKeys.calendars, queryFn: listCalendars, enabled: useSignedIn() });
}

export function useTemplates() {
  return useQuery({ queryKey: queryKeys.templates, queryFn: listTemplates, enabled: useSignedIn() });
}

export function useFriends() {
  return useQuery({ queryKey: queryKeys.friends, queryFn: listFriends, enabled: useSignedIn() });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.pendingInvitations,
    queryFn: listPendingInvitations,
    enabled: useSignedIn(),
  });
}

export function useEventInvitations(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.eventInvitations(eventId ?? ''),
    queryFn: () => listEventInvitations(eventId!),
    enabled: useSignedIn() && !!eventId,
  });
}

export function useAnalytics(period: Period) {
  return useQuery({ queryKey: queryKeys.analytics(period), queryFn: () => getAnalytics(period), enabled: useSignedIn() });
}

/**
 * A mutation that refreshes the given lists afterwards, e.g.
 * `useServiceMutation(createEvent, [queryKeys.events, queryKeys.upcoming])`.
 */
export function useServiceMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, invalidate: QueryKey[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}
