import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../card';

describe('Card', () => {
  it('renders title and children', () => {
    render(
      <Card title="Test Card" href="/test">
        Card content
      </Card>
    );
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a link with correct href', () => {
    render(
      <Card title="Link Card" href="/some-page">
        Content
      </Card>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toContain('/some-page');
  });

  it('applies custom className', () => {
    render(
      <Card title="Styled Card" href="/test" className="custom-class">
        Content
      </Card>
    );
    const link = screen.getByRole('link');
    expect(link.className).toContain('custom-class');
  });

  it('opens in new tab with rel noopener noreferrer', () => {
    render(
      <Card title="External" href="/external">
        Content
      </Card>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
