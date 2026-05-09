
import React from "react";
import { useState } from "react";

export default function BandSelector({ selectedBands, onBandUpdated }) {
  const bandOrder = ["u", "g", "r", "i", "z", "y"];

  return (
    <div className="flex flex-row items-center gap-1.5">
      <span className="text-xs uppercase tracking-wide text-gray-500 mr-1">Bands</span>
      {bandOrder.map((b, n) => (
        <button key={b}
          onClick={(event) => onBandUpdated(b, !selectedBands[b])}
          className={selectedBands[b]
          ? "h-7 w-9 rounded-md bg-gray-200 border-teal-500 border-2 text-black text-sm font-medium"
          : "h-7 w-9 rounded-md border border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-100"
        }>{b}</button>
      ))}
    </div>
  );
}
