
import { useState, useRef } from 'react'

import { Button } from '../components/button'

export function DropdownOptions({options, onChange}) {

  const [expanded, setExpanded] = useState(false)
  const [selectedOption, setSelectedOption] = useState(options[0])
  const ref = useRef(null);

  const handleClickOutside = (event) => {

    if (ref.current && !ref.current.contains(event.target)) {
      setExpanded(false);
      document.removeEventListener('click', handleClickOutside, true);
      /* Stop propagataion here, or else when the menu is open, clicking on the
       * button will cause both a close and open event */
      event.stopPropagation();
    }
    if(!ref.current) {
      document.removeEventListener('click', handleClickOutside, true);
    }
  };

  const installListener = () => {
    document.addEventListener('click', handleClickOutside, true);
  }

  return (
    <div className="p-2 static">
      <Button className=""
        onClick={() => {setExpanded(!expanded); if(!expanded) {installListener()};}}
      >
        <span className="text-l">
          Metric Group: {selectedOption}{" "}
          <svg className="h-5 w-5 inline" fill="white">
            <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
          </svg>
        </span>
      </Button>
    {!expanded ? "" :
      <div ref={ref} className="border-2 border-gray-300 rounded-lg absolute z-1 bg-white my-1 drop-shadow-sm">
        {options.map((option) => (
          <div key={option} className={`px-2 py-1 cursor-pointer hover:bg-gray-200 ${option == selectedOption ? "bg-buttons/40 ": ""}`}
            onClick={(e) => {
              setSelectedOption(option);
              setExpanded(false);
              onChange(option);
              }}>
            {option}
          </div>
        ))}
      </div>
     }
    </div>
  )
}