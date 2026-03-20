import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from '../../components/ui/Avatar';

describe('Avatar', () => {
  it('renders initials when no src', () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar src="/uploads/thumbnails/photo.jpg" name="Jane Smith" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Jane Smith');
    expect(img.getAttribute('src')).toContain('photo.jpg');
  });

  it('uses custom size', () => {
    render(<Avatar name="Test User" size={80} />);
    const el = screen.getByLabelText('Test User');
    expect(el).toHaveStyle({ width: '80px', height: '80px' });
  });
});
