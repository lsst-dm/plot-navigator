"use client"

import { useState, useRef } from "react";

export default function PlotMouseover({src, key, regions, label}) {

    /*
     * To display metric values on mouse-over, this component expects to receive a regions paramter
     * containing a list of objects, where each object contains min_x, max_x, min_y, max_y fields
     * with pixel boundaries for the region, along with id and value fields for the corresponding
     * text to display.
     */
    const [displayString, setDisplayString] = useState("");

    const childRef = useRef(null);

    const make_label_string = (md, x, y, label) => {

        const matching_strings = (md ?? []).flatMap(entry =>
            (x >= entry.min_x && x < entry.max_x &&
             y >= entry.min_y && y < entry.max_y) ? [`${label} ${entry.id}: ${entry.value}`] : []
        )
        return matching_strings.join(", ")
    }

    const mouseMove = (event) => {
        const img_display_width = childRef.current?.getBoundingClientRect().width;
        const img_display_height = childRef.current?.getBoundingClientRect().height;

        const x_scale = img_display_width/childRef.current?.naturalWidth;
        const y_scale = img_display_height/childRef.current?.naturalHeight;

        const x_value = (event.clientX - childRef.current?.getBoundingClientRect().left) / x_scale;
        const y_value = (childRef.current?.getBoundingClientRect().bottom - event.clientY) / y_scale;
        setDisplayString(make_label_string(regions, x_value, y_value, label));
    }

    return (
        <div >
            <div onMouseMove={mouseMove}>
                <img key={key} src={src} ref={childRef} />
            </div>
            <div>{displayString}</div>
        </div>
    )
}
