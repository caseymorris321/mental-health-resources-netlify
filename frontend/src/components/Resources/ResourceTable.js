import React, { useMemo, useEffect } from 'react';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';

const ResourceTable = ({ title, data, columns, globalFilter }) => {
  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedData = useMemo(() => data, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state,
    setGlobalFilter,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    setPageSize,
  } = useTable(
    {
      columns: memoizedColumns,
      data: memoizedData,
      initialState: { pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const { pageIndex, pageSize } = state;

  useEffect(() => {
    setGlobalFilter(globalFilter);
  }, [globalFilter, setGlobalFilter]);

  if (data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center">
        <h3 className="text-center mb-3">{title}</h3>
        <p>No resources found.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center">
      <h3 className="text-center mb-3">{title}</h3>
      <div className="table-responsive">
        <table {...getTableProps()} className="table table-striped table-hover">
          <thead className="table-light">
            {headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map(column => {
                    const { key, ...restHeaderProps } = column.getHeaderProps(column.getSortByToggleProps());
                    return (
                      <th key={key} {...restHeaderProps}>
                        {column.render('Header')}
                        <span>
                          {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr key={key} {...restRowProps}>
                  {row.cells.map(cell => {
                    const { key, ...restCellProps } = cell.getCellProps();
                    return (
                      <td key={key} {...restCellProps}>
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => previousPage()} disabled={!canPreviousPage}>
            Previous
          </button>
          <button className="btn btn-outline-primary" onClick={() => nextPage()} disabled={!canNextPage}>
            Next
          </button>
        </div>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>
        </span>
        <select
          className="form-select w-auto"
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ResourceTable;
