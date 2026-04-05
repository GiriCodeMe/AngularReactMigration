import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ListErrors from '../components/ListErrors';

describe('ListErrors', () => {
  it('renders nothing when errors is null', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when errors is undefined', () => {
    const { container } = render(<ListErrors errors={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error messages from the errors object', () => {
    render(<ListErrors errors={{ email: ['is invalid'], password: ['is too short'] }} />);
    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/password is too short/i)).toBeInTheDocument();
  });

  it('renders multiple messages for one field', () => {
    render(<ListErrors errors={{ username: ['is blank', 'is too short'] }} />);
    expect(screen.getByText(/username is blank/i)).toBeInTheDocument();
    expect(screen.getByText(/username is too short/i)).toBeInTheDocument();
  });
});
