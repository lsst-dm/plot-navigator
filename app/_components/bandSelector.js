
'use client'

import React from 'react';
import { useState } from 'react'

export default function BandSelector({selectedBands, onBandUpdated}) {

    const bandOrder = ['u', 'g', 'r', 'i', 'z', 'y']

    return (
        <div className="flex flex-row">
            { bandOrder.map((band, n) =>
                <label key={n}>
                    <div className={"p-2 border-2 -ml-1 " + (n==0 ? "rounded-l-lg" : "") + (n== (bandOrder.length - 1) ? "rounded-r-lg" : "")}>
                            <input type="checkbox" className="m-1"
                                checked={selectedBands[band]}
                            onChange={(event) => onBandUpdated(band, event.target.checked)} />
                            {band}
                    </div>
                </label>
            )}
        </div>
    )

}
