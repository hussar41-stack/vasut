import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navbar brand', () => {
  render(<App />);
  const linkElement = screen.getByText(/TransportHU/i);
  expect(linkElement).toBeInTheDocument();
});
