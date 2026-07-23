"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TaxSeasonStatus = "planned" | "active" | "archived";

type TaxSeason = {
  id: string;
  year: number;
  name: string;
  status: TaxSeasonStatus;
  projectCount: number;
  enabledProjectCount: number;
};

type TaxSeasonsApiResponse = {
  success?: boolean;
  activeSeasonId?: string;
  seasons?: TaxSeason[];
  error?: string;
};

type SeasonSelectorProps = {
  selectedSeasonId?: string | null;
  onSeasonChange: (seasonId: string) => void;
  disabled?: boolean;
};

export default function SeasonSelector({
  selectedSeasonId,
  onSeasonChange,
  disabled = false,
}: SeasonSelectorProps) {
  const [seasons, setSeasons] = useState<TaxSeason[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initializedSeasonRef = useRef("");

  useEffect(() => {
    async function loadSeasons() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/tax-seasons", {
          cache: "no-store",
        });

        const payload = (await response.json()) as TaxSeasonsApiResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to load tax seasons.");
        }

        if (!Array.isArray(payload.seasons)) {
          throw new Error(
            "The Tax Seasons API did not return a season list.",
          );
        }

        setSeasons(payload.seasons);
        setActiveSeasonId(payload.activeSeasonId ?? "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load tax seasons.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSeasons();
  }, []);

  const currentSeasonId = useMemo(() => {
    const requestedSeasonId = selectedSeasonId?.trim() ?? "";

    if (
      requestedSeasonId &&
      seasons.some((season) => season.id === requestedSeasonId)
    ) {
      return requestedSeasonId;
    }

    if (
      activeSeasonId &&
      seasons.some((season) => season.id === activeSeasonId)
    ) {
      return activeSeasonId;
    }

    return seasons[0]?.id ?? "";
  }, [activeSeasonId, seasons, selectedSeasonId]);

  useEffect(() => {
    if (!currentSeasonId || initializedSeasonRef.current === currentSeasonId) {
      return;
    }

    if (!selectedSeasonId?.trim()) {
      initializedSeasonRef.current = currentSeasonId;
      onSeasonChange(currentSeasonId);
    }
  }, [currentSeasonId, onSeasonChange, selectedSeasonId]);

  if (loading) {
    return (
      <div className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tax Season
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Loading seasons...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-[220px] rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
          Tax Season
        </p>
        <p className="mt-1 text-sm font-semibold text-red-700">
          Unable to load
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-[240px]">
      <label
        htmlFor="salinas-os-season-selector"
        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
      >
        Tax Season
      </label>

      <select
        id="salinas-os-season-selector"
        value={currentSeasonId}
        disabled={disabled || seasons.length === 0}
        onChange={(event) => onSeasonChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
            {season.status === "active" ? " — Active" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
