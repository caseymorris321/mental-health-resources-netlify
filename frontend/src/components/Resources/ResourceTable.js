import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import { Link } from 'react-router-dom';
import '../../index.css';
import '../../loading.css';

const ResourceTable = ({ title, data, columns, globalFilter, isLoading, tableId, onTableReady, highlightMatched, highlightedResourceIds  }) => {
  const tableRef = useRef(null);

  const memoizedColumns = useMemo(() => {
    const columnWidths = {
      name: '20%',
      description: '45%',
      link: '1%',
      contactInfo: '30%',
      city: '1%',
      state: '1%',
    };

    return columns.map(col => ({
      ...col,
      width: columnWidths[col.accessor] || 'auto'
    }));
  }, [columns]);

  const memoizedData = useMemo(() => data, [data]);

  const savedState = JSON.parse(localStorage.getItem(`tableState_${tableId}`)) || {};

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
      initialState: { pageSize: 10, ...savedState },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const { pageIndex, pageSize } = state;

  useEffect(() => {
    setGlobalFilter(globalFilter);
  }, [globalFilter, setGlobalFilter]);

  useEffect(() => {
    localStorage.setItem(`tableState_${tableId}`, JSON.stringify({ pageIndex, pageSize }));
  }, [pageIndex, pageSize, tableId]);

  const scrollToResource = useCallback((resourceId) => {
    if (tableRef.current) {
      const row = tableRef.current.querySelector(`tr[data-resource-id="${resourceId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('table-warning');
        setTimeout(() => row.classList.remove('table-warning'), 3000);
      }
    }
  }, []);


  useEffect(() => {
    if (onTableReady) {
      onTableReady({ scrollToResource });
    }
  }, [onTableReady, scrollToResource]);

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center">
        <h3 className="text-center mb-3">{title}</h3>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center">
        <h3 className="text-center mb-3">{title}</h3>
        <p>No resources found.</p>
      </div>
    );
  }

  const formatLink = (link) => {
    if (!link) return '';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    } else if (link.startsWith('www.')) {
      return `https://${link}`;
    } else {
      return `https://www.${link}`;
    }
  };

  const ExpandableDescription = React.memo(({ value }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 100;

    if (!value || value.length <= maxLength) {
      return value;
    }

    const toggleExpand = (e) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    };

    return (
      <div onClick={toggleExpand} style={{ cursor: 'pointer' }}>
        {isExpanded ? value : `${value.substring(0, maxLength)}...`}
        <span className="ms-1" style={{ color: '#0056b3' }}>
          {isExpanded ? '(Less)' : '(More)'}
        </span>
      </div>
    );
  });

  return (
    <div className="d-flex flex-column align-items-center">
      <h3 className="text-center mb-3">{title}</h3>

      <div className="table-responsive w-100">
        <table {...getTableProps()} className="table table-striped table-hover table-bordered" ref={tableRef}>
          <thead className="table-primary">
            {headerGroups.map(headerGroup => {
              const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map(column => {
                    const { key, ...restHeaderProps } = column.getHeaderProps(column.getSortByToggleProps());
                    return (
                      <th key={key} {...restHeaderProps} className="text-nowrap" style={{ border: 'none', fontSize: 'clamp(12px, 2vw, 16px)', width: column.width }}>
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
          <tbody {...getTableBodyProps()} className="table-light">
            <tr style={{ display: 'none' }}></tr>
            {page.map(row => {
              prepareRow(row);
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr
                  key={key}
                  {...restRowProps}
                  data-resource-id={row.original._id}
                  className={highlightedResourceIds.includes(row.original._id) ? 'table-warning' : ''}
                  >
                  {row.cells.map(cell => {
                    const { key, ...restCellProps } = cell.getCellProps();
                    return (
                      <td
                        key={key}
                        {...restCellProps}
                        className="align-middle"
                        style={{
                          border: 'none',
                          fontSize: 'clamp(12px, 2vw, 16px)',
                          width: cell.column.width,
                          whiteSpace: 'normal',
                          hyphens: 'auto',
                          overflow: cell.column.id === 'link' ? 'hidden' : 'visible',
                          textOverflow: cell.column.id === 'link' ? 'ellipsis' : 'clip'
                        }}
                      >
                        {cell.column.id === 'description' ? (
                          <ExpandableDescription value={cell.value} />
                        ) : cell.column.id === 'name' ? (
                          <Link to={`/resources/${row.original._id}`} className="text-decoration-none" style={{ color: '#0056b3' }}>
                            {cell.value}
                          </Link>
                        ) : cell.column.id === 'link' ? (
                          cell.value ? (
                            <div style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <a
                                href={formatLink(cell.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                                title={cell.value}
                                style={{ color: '#0056b3', fontWeight: 'bold' }}
                              >
                                {new URL(formatLink(cell.value)).hostname}
                              </a>
                            </div>
                          ) : (
                            'N/A'
                          )
                        ) : (
                          cell.value && typeof cell.value === 'string'
                            ? cell.value.split('\n').map((text, index) => (
                              <React.Fragment key={index}>
                                {text}
                                {index < cell.value.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))
                            : cell.render('Cell')
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="d-flex flex-column align-items-center mb-1">
        <div className="mb-2">
          Page <strong>{pageIndex + 1}</strong> of <strong>{pageOptions.length}</strong>
        </div>
        <select
          className="form-select form-select-sm"
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
      <div className="d-flex justify-content-center mt-1 w-100">
        <button className="btn btn-outline-primary me-2" onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button className="btn btn-outline-primary" onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ResourceTable;
