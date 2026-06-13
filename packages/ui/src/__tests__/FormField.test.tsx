import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders label', () => {
    render(<FormField label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<FormField label="Email" type="email" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(<FormField label="Password" error="Password is required" />);
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('does not show error when no error prop', () => {
    render(<FormField label="Name" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forwards ref to input element', () => {
    const ref = { current: null };
    render(<FormField label="Test" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<FormField label="Search" />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    
    expect(input).toHaveValue('hello');
  });
});
