
export function Lightbox({
    plotFunction,
    prevEntry,
    nextEntry,
    canGoPrev,
    canGoNext,
    exit
}) {
  const doNothing = (e) => {
    e.stopPropagation();
  };


    return (
    <div
        className="fixed top-0 left-0 w-screen h-screen bg-slate-800/85"
        onClick={exit}
    >
        <div className="h-12"></div>
            <div className="w-1/6 float-left h-1">
            {canGoPrev ? (
                <div
                className={`absolute left-1/16 top-1/2 -translate-y-1/2 m-8 h-14 w-14 bg-lightbox-buttons/80 hover:bg-buttons-hover
                            hover:cursor-pointer rounded-full
                            flex items-center justify-center transition-colors`}
                onClick={prevEntry}
                >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
                </div>
            ) : (
                ""
            )}
            </div>
            <div className="w-2/3 float-left bg-white" onClick={doNothing}>
            <div className="[&_img]:[max-height:75vh]">
                {plotFunction(true)}
            </div>
            </div>
            <div className="w-1/6 float-left">
            {canGoNext ? (
                <div
                className={`absolute right-12 top-1/2 -translate-y-1/2 m-8 h-14 w-14 bg-lightbox-buttons/80 hover:bg-buttons-hover
                            hover:cursor-pointer rounded-full
                            flex items-center justify-center transition-colors`}
                onClick={nextEntry}
                >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                </div>
            ) : (
                ""
            )}
            </div>
    </div>

    )

}