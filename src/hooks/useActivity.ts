import useSWR from "swr";

type ActivityData = Record<string, number[]>;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivity() {
  const { data, error, isLoading } = useSWR<ActivityData>(
    "/api/alerts/activity",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 },
  );

  return {
    activity: data ?? {},
    isLoading,
    isError: !!error,
  };
}
