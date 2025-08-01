"use client";
import React, { useEffect, useState } from "react";

type AlertProps = {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string;
  expires: string;
  areaDesc: string;
  description: string;
  instruction?: string;
  senderName: string;
};

type StormAlertsProps = {
  lat: number;
  lng: number;
};

// API Response Types
type WeatherAlertFeature = {
  id: string;
  properties: {
    event: string;
    severity: string;
    urgency: string;
    certainty: string;
    effective: string;
    expires?: string;
    ends?: string;
    areaDesc: string;
    description: string;
    instruction?: string;
    senderName: string;
  };
};
type WeatherAlertResponse = {
  features: WeatherAlertFeature[];
};

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Extreme":
      return "bg-red-700 text-white";
    case "Severe":
      return "bg-red-500 text-white";
    case "Moderate":
      return "bg-yellow-400 text-black";
    case "Minor":
      return "bg-green-300 text-black";
    default:
      return "bg-gray-300 text-black";
  }
};

export const StormAlerts: React.FC<StormAlertsProps> = ({ lat, lng }) => {
  const [alerts, setAlerts] = useState<AlertProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    async function fetchAlerts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.weather.gov/alerts/active?point=${lat},${lng}`,
          {
            headers: {
              Accept: "application/ld+json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch alerts: ${res.status} ${res.statusText}`
          );
        }

        // Type assertion, but you can validate further as needed!
        const data = (await res.json()) as WeatherAlertResponse;
        const features = Array.isArray(data.features) ? data.features : [];

        const parsedAlerts: AlertProps[] = features.map((f) => ({
          id: f.id,
          event: f.properties.event,
          severity: f.properties.severity,
          urgency: f.properties.urgency,
          certainty: f.properties.certainty,
          effective: f.properties.effective,
          expires: f.properties.expires || f.properties.ends || "",
          areaDesc: f.properties.areaDesc,
          description: f.properties.description,
          instruction: f.properties.instruction,
          senderName: f.properties.senderName,
        }));

        if (isMounted) setAlerts(parsedAlerts);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unknown error occurred while fetching alerts";
        if (isMounted) setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (lat && lng) fetchAlerts();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">⛈️ Storm Alerts</h2>
      {loading && <p>Loading alerts...</p>}
      {!loading && error && <p className="text-red-600">{error}</p>}
      {!loading && !error && alerts.length === 0 && (
        <p className="text-green-600">
          ✅ No active weather alerts in this area.
        </p>
      )}
      {!loading &&
        !error &&
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl shadow-md p-4 border-l-8 ${getSeverityColor(
              alert.severity
            )}`}
          >
            <h3 className="text-lg font-semibold mb-1">{alert.event}</h3>
            <p className="text-sm">
              <strong>Area:</strong> {alert.areaDesc}
            </p>
            <p className="text-sm">
              <strong>Effective:</strong> {formatDate(alert.effective)}
              <br />
              <strong>Expires:</strong> {formatDate(alert.expires)}
            </p>
            <p className="text-sm mt-2 whitespace-pre-wrap">
              {alert.description}
            </p>
            {alert.instruction && (
              <div className="mt-3 bg-blue-100 text-blue-900 p-2 rounded text-sm">
                <strong>Instruction:</strong> {alert.instruction}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};
