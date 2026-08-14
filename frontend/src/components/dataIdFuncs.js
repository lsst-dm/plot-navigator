function DataIdSortFunc(dataIdA, dataIdB) {
  const bandsOrder = ["u", "g", "r", "i", "z", "y"];

  if ("tract" in dataIdA && "tract" in dataIdB) {
    const tract_comparison = dataIdA.tract - dataIdB.tract;
    if (tract_comparison != 0) {
      return tract_comparison;
    }
  }

  if ("visit" in dataIdA && "visit" in dataIdB) {
    const visit_comparison = dataIdA.visit - dataIdB.visit;
    if (visit_comparison != 0) {
      return visit_comparison;
    }
  }

  if ("band" in dataIdA && "band" in dataIdB) {
    const band_comparison =
      bandsOrder.indexOf(dataIdA.band) - bandsOrder.indexOf(dataIdB.band);
    if (band_comparison != 0) {
      return band_comparison;
    }
  }

  if ("physical_filter" in dataIdA && "physical_filter" in dataIdB) {
    const physical_filter_comparison =
      bandsOrder.indexOf(dataIdA.physical_filter[0]) -
      bandsOrder.indexOf(dataIdB.physical_filter[0]);
    if (physical_filter_comparison != 0) {
      return physical_filter_comparison;
    }
  }

  if ("detector" in dataIdA && "detector" in dataIdB) {
    const detector_comparison = dataIdA.detector - dataIdB.detector;
    if (detector_comparison != 0) {
      return detector_comparison;
    }
  }

  /* if none of these dimensions are available */
  return 0;
}

const DataIdMerge = (iterableA, iterableB, sortFunc) => {
  /*
   * This takes two sorted lists of DataIds and merges them in order, returning objects
   * of {a: , b: } with either the data IDs or null to preserve the ordering
   */
  const iteratorA = iterableA[Symbol.iterator]()
  const iteratorB = iterableB[Symbol.iterator]()

  let nextA = iteratorA.next()
  let nextB = iteratorB.next()

  const out = []

  while(!nextA.done || !nextB.done) {

    const comparison = nextA.done ? 1 : (nextB.done ? -1 : sortFunc(nextA.value, nextB.value))
    if(comparison == 0) {
      out.push({a: nextA.value, b: nextB.value})
      nextA = iteratorA.next()
      nextB = iteratorB.next()
    } else if (comparison < 0) {
      out.push({a: nextA.value, b: null})
      nextA = iteratorA.next()
    } else if (comparison > 0) {
      out.push({a: null, b: nextB.value})
      nextB = iteratorB.next()
    }
  }

  return out

}

export { DataIdSortFunc, DataIdMerge };
