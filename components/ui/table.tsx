import { HTMLAttributes } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  headers: string[];
  children: React.ReactNode;
}

export function Table({
  headers,
  children,
  className = "",
  ...props
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-teal-900/5 dark:divide-stone-700 ${className}`}
        {...props}
      >
        <thead className="bg-teal-50/50 dark:bg-stone-800/80">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-900/60 dark:text-teal-300/70"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-teal-900/5 bg-white/50 dark:divide-stone-700 dark:bg-transparent">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export function TableRow({
  children,
  className = "",
  ...props
}: TableRowProps) {
  return (
    <tr
      className={`transition-colors hover:bg-teal-50/40 dark:hover:bg-stone-800/50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableCell({
  children,
  className = "",
  ...props
}: TableCellProps) {
  return (
    <td
      className={`whitespace-nowrap px-6 py-4 text-sm text-stone-800 dark:text-stone-100 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
