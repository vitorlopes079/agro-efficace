"use client";

import { useState, useEffect, useCallback } from "react";

interface ConfigItem {
  id: string;
  key: string;
  label: string;
}

interface ConfigLabels {
  projectTypes: Record<string, string>;
  cultures: Record<string, string>;
  projectTypeOptions: { value: string; label: string }[];
  cultureOptions: { value: string; label: string }[];
  isLoading: boolean;
  error: string | null;
  getProjectTypeLabel: (key: string) => string;
  getProjectTypesLabel: (keys: string[]) => string;
  getCultureLabel: (key: string) => string;
  refetch: () => Promise<void>;
}

// Module-level cache to avoid refetching on every component mount
let cachedProjectTypes: Record<string, string> | null = null;
let cachedCultures: Record<string, string> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useConfigLabels(): ConfigLabels {
  const [projectTypes, setProjectTypes] = useState<Record<string, string>>(
    cachedProjectTypes || {}
  );
  const [cultures, setCultures] = useState<Record<string, string>>(
    cachedCultures || {}
  );
  const [isLoading, setIsLoading] = useState(!cachedProjectTypes || !cachedCultures);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    // Check if cache is still valid
    if (
      cachedProjectTypes &&
      cachedCultures &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION
    ) {
      setProjectTypes(cachedProjectTypes);
      setCultures(cachedCultures);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [projectTypesRes, culturesRes] = await Promise.all([
        fetch("/api/admin/settings/project-types"),
        fetch("/api/admin/settings/cultures"),
      ]);

      if (!projectTypesRes.ok || !culturesRes.ok) {
        throw new Error("Failed to fetch config");
      }

      const [projectTypesData, culturesData] = await Promise.all([
        projectTypesRes.json(),
        culturesRes.json(),
      ]);

      // Convert arrays to key->label maps
      const ptMap: Record<string, string> = {};
      (projectTypesData.projectTypes || []).forEach((pt: ConfigItem) => {
        ptMap[pt.key.toUpperCase()] = pt.label;
      });

      const cultureMap: Record<string, string> = {};
      (culturesData.cultures || []).forEach((c: ConfigItem) => {
        cultureMap[c.key.toUpperCase()] = c.label;
      });

      // Update cache
      cachedProjectTypes = ptMap;
      cachedCultures = cultureMap;
      cacheTimestamp = Date.now();

      setProjectTypes(ptMap);
      setCultures(cultureMap);
    } catch (err) {
      console.error("Error fetching config labels:", err);
      setError("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const getProjectTypeLabel = useCallback(
    (key: string): string => {
      return projectTypes[key?.toUpperCase()] || key;
    },
    [projectTypes]
  );

  const getProjectTypesLabel = useCallback(
    (keys: string[]): string => {
      if (!keys || keys.length === 0) return "—";
      return keys.map((k) => projectTypes[k?.toUpperCase()] || k).join(", ");
    },
    [projectTypes]
  );

  const getCultureLabel = useCallback(
    (key: string): string => {
      return cultures[key?.toUpperCase()] || key;
    },
    [cultures]
  );

  // Convert to options format for Select components
  const projectTypeOptions = Object.entries(projectTypes).map(([key, label]) => ({
    value: key,
    label,
  }));

  const cultureOptions = Object.entries(cultures).map(([key, label]) => ({
    value: key,
    label,
  }));

  return {
    projectTypes,
    cultures,
    projectTypeOptions,
    cultureOptions,
    isLoading,
    error,
    getProjectTypeLabel,
    getProjectTypesLabel,
    getCultureLabel,
    refetch: fetchConfig,
  };
}
