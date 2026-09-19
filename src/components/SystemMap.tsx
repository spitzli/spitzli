"use client";
import { useState } from "react";
import { useI18n } from "@/i18n/client";

const layers = [
  {
    id: "interface",
    title: "Interface",
    subtitle: "Websites & applications",
    text: "The part people use: clear interfaces, accessible websites and applications that fit the task.",
  },
  {
    id: "api",
    title: "APIs & data",
    subtitle: "Logic & connections",
    text: "The connections underneath: APIs, data models, authentication and integrations that work together.",
  },
  {
    id: "cloud",
    title: "Google Cloud",
    subtitle: "Deployment & operation",
    text: "The system in operation: cloud architecture, Cloud Run, Firebase, access control and deployment. I keep the whole picture in view.",
  },
] as const;

export function SystemMap() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<(typeof layers)[number]["id"]>("cloud");
  return (
    <fieldset className="system-map" aria-label={t("How I connect the layers")}>
      <p className="map-caption">{t("A system is more than its parts.")}</p>
      <div className="system-layers">
        {layers.map((layer) => (
          <button
            type="button"
            key={layer.id}
            className="system-node"
            aria-pressed={selected === layer.id}
            aria-controls="system-explanation"
            onClick={() => setSelected(layer.id)}
          >
            <span className="node-dot" aria-hidden="true" />
            <span>
              <strong>{t(layer.title)}</strong>
              <small>{t(layer.subtitle)}</small>
            </span>
            <span className="node-indicator" aria-hidden="true">
              {selected === layer.id ? "−" : "+"}
            </span>
          </button>
        ))}
      </div>
      <p id="system-explanation" className="map-explanation" aria-live="polite">
        {t(layers.find((layer) => layer.id === selected)?.text || "")}
      </p>
      <span className="map-hint">{t("Choose a layer to explore.")}</span>
    </fieldset>
  );
}
