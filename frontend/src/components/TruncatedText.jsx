"use client";

import React, { useState } from "react";

const TruncatedText = ({ text, length = 40 }) => {
  const [expanded, setExpanded] = useState(false);

  const expand = () => {
    setExpanded(true);
  };

  return (
    <>
      {!expanded ? (
        <div>
          {text.substr(0, length)}{" "}
          {text.length > length ? (
            <>
              {"... "}
              <button onClick={expand} className="underline">
                More
              </button>
            </>
          ) : (
            ""
          )}
        </div>
      ) : (
        <div>{text}</div>
      )}
    </>
  );
};

export default TruncatedText;
