import { expect, test, describe, it, beforeEach } from 'vitest';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

beforeEach((contextFn) => {
  console.log(contextFn.name);
})

describe('some basic tets', () => {
  describe('something more specific', () => {
    it.todo('add tests here');
  });

  it('hello world test', () => {
    document.body.innerHTML = '<button type="button">Click me</button>';
    const button = screen.getByText('Click me');
    userEvent.click(button);
    expect(button).toBeInTheDocument();
  });
  
  it('button is clickable and changes text', async () => {
    document.body.innerHTML = '<button type="button" id="btn">Click me</button>';
    const button = screen.getByText('Click me');
    button.addEventListener('click', () => {
      button.textContent = 'Clicked!';
    });
    await userEvent.click(button);
    expect(button.textContent).toBe('Clicked!');
  });
  
  it('button is not found if text does not match', () => {
    document.body.innerHTML = '<button type="button">Hello</button>';
    expect(() => screen.getByText('Click me')).toThrow();
  });
  
  it('renders multiple buttons', () => {
    document.body.innerHTML = `
      <button type="button">First</button>
      <button type="button">Second</button>
    `;
    const firstButton = screen.getByText('First');
    const secondButton = screen.getByText('Second');
    expect(firstButton).not.toBeNull();
    expect(secondButton).not.toBeNull();
  });
})