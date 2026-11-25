"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, X } from "lucide-react";

interface QrModalProps {
  open: boolean;
  linkName: string;
  url: string;
  onClose: () => void;
}

export function QrModal({ open, linkName, url, onClose }: QrModalProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open || !url) return;
    let active = true;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: "#1E1B4B",
        light: "#FFFFFF",
      },
    })
      .then((res) => {
        if (active) setDataUrl(res);
      })
      .catch(() => {
        if (active) setDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [open, url]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
            QR Code · {linkName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto mb-4 flex h-60 w-60 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-3">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`QR code for ${linkName}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="h-44 w-44 animate-pulse rounded-xl bg-slate-100" />
          )}
        </div>

        <p className="mb-5 break-all text-xs text-slate-500 dark:text-slate-400">
          {url}
        </p>

        {dataUrl && (
          <a
            href={dataUrl}
            download={`petalmatch-qr-${linkName.toLowerCase().replace(/\s+/g, "-")}.png`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download QR PNG</span>
          </a>
        )}
      </div>
    </div>
  );
}
