import { expect, test } from 'vitest';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

test('hello world test', () => {
  document.body.innerHTML = '<button>Click me</button>';
  const button = screen.getByText('Click me');
  userEvent.click(button);
  expect(button).toBeInTheDocument();
});