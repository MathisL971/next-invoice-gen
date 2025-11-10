import { HTMLAttributes } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  headers: string[]
  children: React.ReactNode
}

export function Table({ headers, children, className = '', ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
        {...props}
      >
        <thead className="bg-gray-50 dark:bg-zinc-800">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-zinc-900">
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
}

export function TableRow({ children, className = '', ...props }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-zinc-800 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
}

export function TableCell({ children, className = '', ...props }: TableCellProps) {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}

