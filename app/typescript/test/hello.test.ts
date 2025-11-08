import { expect, test, describe, it } from 'vitest';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

test('hello world test', () => {
  document.body.innerHTML = '<button type="button">Click me</button>';
  const button = screen.getByText('Click me');
  userEvent.click(button);
  expect(button).toBeInTheDocument();
});