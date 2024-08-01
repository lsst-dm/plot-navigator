'use client'

import React from 'react'
import { useState } from 'react'
import Link from "next/link";
import { useSearchParams } from "next/navigation";


export default function TabNav({panes}) {
    const searchParams = useSearchParams();

    const [currentPane, setCurrentPane] = useState(searchParams.get("t") || 0)


    const buttonClass = "p-2 border-t-2 border-x-2 m-1 float-left w-48 text-center hover:underline hover:cursor-pointer m-2 " 
    const buttons = panes.map((pane, n) =>  (
        <Link replace scroll={false} key={n} href={`?t=${n}`} onClick={() => setCurrentPane(n)}>
            <div className={currentPane == n ? buttonClass + " font-bold" : buttonClass} >
                {pane.title}
            </div>
        </Link>
    ))

    return (
        <div className="p-2">
            <div>
                {buttons}
            </div>
            <div className="clear-both">
                {panes[currentPane].content}
            </div>
        </div>

    )


}



