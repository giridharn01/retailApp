import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../HomePage';

describe('HomePage', () => {
  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it('renders featured products section', () => {
    render(<HomePage />);
    expect(screen.getByText(/featured products/i)).toBeInTheDocument();
  });

  it('renders featured services section', () => {
    render(<HomePage />);
    expect(screen.getByText(/featured services/i)).toBeInTheDocument();
  });
}); 