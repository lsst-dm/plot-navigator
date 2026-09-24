import { tableFeatures,
  useTable,
  rowPaginationFeature,
  createPaginatedRowModel,
  columnPinningFeature,
  rowSortingFeature,
  createSortedRowModel,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { Button } from '../components/button'


const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnPinningFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  /*
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  */
})

const getStickyColumnProperties = (column) => {
  if(column.getIsPinned()) {
    return 'inset-s-0 sticky opacity-100 bg-white'
  }
  else
  {
    return ''
  }
}

export function MetricTable({data, columns}) {

  const [sorting, setSorting] = useState([])

  const table = useTable({
    features,
    columns,
    data,
    state: {
      sorting
    },
    onSortingChange: setSorting,
  })

  table.setColumnPinning({
    start: ['tract'],
    end: []
  })

  const leftEdges = useMemo(() =>
    table.getHeaderGroups().length > 1 ? table.getHeaderGroups()[1].headers.map((header) => header.column.parent?.getLeafColumns()[0]?.id) : []
  , [data, columns])

  const rightEdges = useMemo(() =>
    table.getHeaderGroups().length > 1 ? table.getHeaderGroups()[1].headers.map((header) => header.column.parent?.getLeafColumns().at(-1)?.id) : []
  , [data, columns])

  const leftEdgeStyles = (col) => leftEdges.includes(col.id) ? "border-l-2 border-slate-300" : ""
  const rightEdgeStyles = (col) => rightEdges.includes(col.id) ? "border-r-2 border-slate-300" : ""

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm m-5">
        <table className="text-sm">
          <thead className="bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan}
                  className={`px-4 py-3 text-center text-s font-medium tracking-wide whitespace-nowrap ${getStickyColumnProperties(header.column)}`}
                  >
                    <span onClick={header.column.getToggleSortingHandler()} className="cursor-pointer hover:underline decoration-1 underline-offset-3">
                      {header.isPlaceholder ? null : (
                        <>
                          <table.FlexRender header={header} />
                        </>
                      )}
                    </span>
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-100 transition-colors">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className={`px-4 py-3 text-gray-700 whitespace-nowrap ${getStickyColumnProperties(cell.column)} ${leftEdgeStyles(cell.column)} ${rightEdgeStyles(cell.column)}`}>
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Button
          className="m-3"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </Button>
        <span>Page {table.state.pagination.pageIndex + 1} / {table.getPageCount()}</span>
        <Button
          className="m-3"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </Button>
      </div>
    </div>
  )
}