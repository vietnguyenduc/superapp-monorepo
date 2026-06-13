import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button appName="test-app">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button appName="test-app" className="custom-class">Click</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('shows alert on click', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    
    render(<Button appName="my-app">Click</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(alertMock).toHaveBeenCalledWith('Hello from your my-app app!');
    alertMock.mockRestore();
  });
});
