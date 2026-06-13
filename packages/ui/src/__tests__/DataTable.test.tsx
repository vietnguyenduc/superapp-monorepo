import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

interface TestRow {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { key: 'id' as const, header: 'ID' },
  { key: 'name' as const, header: 'Name' },
  { key: 'value' as const, header: 'Value' },
];

const data: TestRow[] = [
  { id: 1, name: 'Item A', value: 100 },
  { id: 2, name: 'Item B', value: 200 },
];

describe('DataTable', () => {
  it('renders column headers in table header', () => {
    render(<DataTable data={data} columns={columns} />);
    // Use getAllByText since mobile + desktop both render headers
    const headers = screen.getAllByText('ID');
    expect(headers.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Name').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Value').length).toBeGreaterThanOrEqual(1);
  });

  it('renders data rows', () => {
    render(<DataTable data={data} columns={columns} />);
    // Use getAllByText since mobile + desktop both render data
    const items = screen.getAllByText('Item A');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Item B').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} columns={columns} />);
    const emptyMessages = screen.getAllByText('No data available');
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onRowClick when a row is clicked', async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    
    render(<DataTable data={data} columns={columns} onRowClick={onRowClick} />);
    
    // Click on the first "Item A" element (desktop view)
    const items = screen.getAllByText('Item A');
    await user.click(items[0]);
    
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders custom cell content via render prop', () => {
    const customColumns = [
      { key: 'name' as const, header: 'Name' },
      {
        key: 'value' as const,
        header: 'Value',
        render: (row: TestRow) => `$${row.value}`,
      },
    ];
    
    render(<DataTable data={data} columns={customColumns} />);
    const values = screen.getAllByText('$100');
    expect(values.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$200').length).toBeGreaterThanOrEqual(1);
  });
});
