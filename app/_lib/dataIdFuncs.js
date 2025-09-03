
export default function DataIdSortFunc(dataIdA, dataIdB) {

    const bandsOrder = ['u', 'g', 'r', 'i', 'z', 'y']

    if('tract' in dataIdA && 'tract' in dataIdB) {
        const tract_comparison = dataIdA.tract - dataIdB.tract
        if(tract_comparison != 0) {
            return tract_comparison
        }
    }

    if('visit' in dataIdA && 'visit' in dataIdB) {
        const visit_comparison = dataIdA.visit - dataIdB.visit
        if(visit_comparison != 0) {
            return visit_comparison
        }
    }

    if('band' in dataIdA && 'band' in dataIdB) {
        const band_comparison = bandsOrder.indexOf(dataIdA.band) - bandsOrder.indexOf(dataIdB.band)
        if(band_comparison != 0) {
            return band_comparison
        }
    }

    if('physical_filter' in dataIdA && 'physical_filter' in dataIdB) {
        const physical_filter_comparison = bandsOrder.indexOf(dataIdA.physical_filter[0]) - bandsOrder.indexOf(dataIdB.physical_filter[0])
        if(physical_filter_comparison != 0) {
            return physical_filter_comparison
        }
    }

    /* if none of these dimensions are available */
    return 0
}

export { DataIdSortFunc }
