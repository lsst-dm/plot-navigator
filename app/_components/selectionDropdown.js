'use client'


import React from 'react'
import {useState} from 'react'


export default function SelectionDropdown({contents, title, initiallyOpen = false}) {

    const [showContents, setShowContents] = useState(initiallyOpen)

    
    const toggle = () => {
        setShowContents(!showContents)
    }


    return (
        <div className="px-8 py-4 clear-both">
            <div className="cursor-pointer text-xl font-medium border-b-2 border-black ">
                <a onClick={toggle}>{title}</a>
            </div>
            {showContents ? 
                contents
            : ""}
        </div>
    )

}

