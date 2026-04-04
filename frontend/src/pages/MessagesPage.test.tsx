import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MessagesPage } from './MessagesPage';

vi.mock('../components/messages/MessagesPanel', () => ({
  MessagesPanel: () => <div data-testid="messages-panel" />,
}));

describe('MessagesPage', () => {
  it('renders the Messages heading', () => {
    render(<MemoryRouter><MessagesPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /messages/i })).toBeInTheDocument();
  });

  it('renders the MessagesPanel', () => {
    render(<MemoryRouter><MessagesPage /></MemoryRouter>);
    expect(screen.getByTestId('messages-panel')).toBeInTheDocument();
  });
});
