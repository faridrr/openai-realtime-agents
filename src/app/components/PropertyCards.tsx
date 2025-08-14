"use client";

import React from "react";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import Image from "next/image";

export type Property = {
  title?: string;
  city?: string;
  address?: string;
  min_description?: string;
  link?: string;
  image_url?: string;
  image_urls?: string[];
  price?: number | string; // supports number or pre-formatted string
  property_type?: string; // e.g. "Studio", "2 Beds"
  type?: string; // fallback field name in sample data
};

export function PropertyCards({ properties = [] }: { properties: Property[] }) {
  if (!Array.isArray(properties) || properties.length === 0) return null;

  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 font-mono mb-2">Top matches</div>
      <div className="flex flex-col gap-3">
        {properties.map((p, idx) => (
          <PropertyCard key={`${p.title ?? "prop"}-${idx}`} property={p} />
        ))}
      </div>
    </div>
  );
}

export default PropertyCards;

function detectLanguageFromText(text: string): "fr" | "en" {
  const frenchSignals =
    /[àâçéèêëîïôûùüÿœ]|\b(bonjour|merci|oui|réserver|maintenant|logement|mois|ville|prix|étudi)/i;
  return frenchSignals.test(text) ? "fr" : "en";
}

function PropertyCard({ property }: { property: Property }) {
  const { transcriptItems } = useTranscript();
  const images: string[] =
    Array.isArray(property.image_urls) && property.image_urls.length > 0
      ? property.image_urls
      : property.image_url
      ? [property.image_url]
      : [];

  const [index, setIndex] = React.useState<number>(0);

  const hasMultiple = images.length > 1;

  const goPrev = () => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const goNext = () => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev + 1) % images.length);
  };

  const chatLanguage = React.useMemo(() => {
    const messages = transcriptItems.filter((i) => i.type === "MESSAGE");
    const last = messages[messages.length - 1];
    const lastText = (last?.title as string) || "";
    return detectLanguageFromText(lastText);
  }, [transcriptItems]);

  const bookLabel =
    chatLanguage === "fr" ? "Réserver maintenant" : "Book immediately";

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-3 flex items-center gap-4">
      <div className="relative w-36 h-28 flex-shrink-0 overflow-hidden rounded-xl">
        {images.length > 0 && (
          <Image
            src={images[index]}
            alt={property.title ?? "Property image"}
            className="absolute inset-0 w-full h-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center"
            >
              ›
            </button>
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {property.title && (
          <div className="text-lg font-semibold text-gray-900 truncate">
            {property.title}
          </div>
        )}
        {(property.address || property.city) && (
          <div className="text-sm text-gray-500 mt-0.5 truncate">
            {[property.address, property.city].filter(Boolean).join(" · ")}
          </div>
        )}

        {/* price + type */}
        <div className="mt-2 flex items-center gap-2">
          {typeof property.price !== "undefined" && (
            <span className="text-lg font-bold text-gray-900">
              {typeof property.price === "number"
                ? `${property.price} €/mois`
                : property.price}
            </span>
          )}
          {(property.property_type || property.type) && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">
              {property.property_type ?? property.type}
            </span>
          )}
        </div>

        {property.min_description && (
          <div className="text-sm text-gray-700 mt-2 line-clamp-2">
            {property.min_description}
          </div>
        )}
        {property.link && (
          <div className="mt-2">
            <a
              href={property.link}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {bookLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
