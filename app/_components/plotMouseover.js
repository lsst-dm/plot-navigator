"use client"

import { useState, useRef } from "react";

export default function PlotMouseover({img, regions, label}) {

    const [displayString, setDisplayString] = useState("");

    const parentRef = useRef(null);

    img.ref = parentRef

    /*
    const md = [{x: [179.2, 179.2, 278.4, 278.4, 179.2],
        y: [274.56, 496.32, 496.32, 274.56, 274.56],
        value: 123}]
    */

    console.log(`regions ${JSON.stringify(regions)}`);

    const find_label_value = (md, x, y) => {
        return (md ?? []).flatMap(entry =>
            (x > Math.min(...entry.x) && x < Math.max(...entry.x) &&
             y > Math.min(...entry.y) && y < Math.max(...entry.y)) ? [entry.value] : []
        )
    }

    const mouseMove = (event) => {
        const img_display_width = parentRef.current?.getBoundingClientRect().right - parentRef.current?.getBoundingClientRect().left;
        const img_display_height = parentRef.current?.getBoundingClientRect().top - parentRef.current?.getBoundingClientRect().bottom;

        const x_scale = img_display_width/parentRef.current?.naturalWidth;
        const y_scale = img_display_height/parentRef.current?.naturalHeight;

        const x_value = (event.clientX - parentRef.current?.getBoundingClientRect().left) / x_scale;
        const y_value = (event.clientY - parentRef.current?.getBoundingClientRect().bottom) / y_scale;
        setDisplayString("Tract: " + find_label_value(regions, x_value, y_value));
    }

    return (
        <div >
            <div onMouseMove={mouseMove}>
                {img}
            </div>
            <div>{displayString}</div>
        </div>
    )
}
