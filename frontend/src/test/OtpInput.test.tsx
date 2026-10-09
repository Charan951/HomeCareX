import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from '../components/auth/OtpInput';

// Controlled test wrapper to simulate parent state synchronization
const ControlledOtpInput: React.FC<{
  initialValue?: string;
  onComplete?: (val: string) => void;
  disabled?: boolean;
}> = ({ initialValue = '', onComplete, disabled = false }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <span data-testid="otp-value">{value}</span>
      <OtpInput
        value={value}
        onChange={setValue}
        onComplete={onComplete}
        disabled={disabled}
      />
    </div>
  );
};

function getOtpInput(digitNumber: number): HTMLInputElement {
  return screen.getByLabelText(`OTP digit ${digitNumber}`) as HTMLInputElement;
}

describe('OtpInput Component - Backspace and UX Behavior', () => {
  it('renders all 6 OTP input boxes with accessible labels and attributes', () => {
    render(<ControlledOtpInput />);
    for (let i = 1; i <= 6; i++) {
      const input = getOtpInput(i);
      expect(input).toBeDefined();
      expect(input.getAttribute('inputmode')).toBe('numeric');
      expect(input.getAttribute('maxlength')).toBe('1');
      expect(input.getAttribute('aria-label')).toBe(`OTP digit ${i}`);
    }
  });

  // Test 1: Filled current input + Backspace
  it('Test 1: removes current digit and keeps focus on current input when backspace is pressed on a filled box', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput initialValue="123456" />);

    const box4 = getOtpInput(4);
    expect(box4.value).toBe('4');

    await user.click(box4);
    expect(document.activeElement).toBe(box4);

    await user.keyboard('{Backspace}');

    // Box 4 is cleared, focus remains on box 4
    expect(box4.value).toBe('');
    expect(document.activeElement).toBe(box4);

    // Box 3 and Box 5 are not modified
    expect(getOtpInput(3).value).toBe('3');
    expect(getOtpInput(5).value).toBe('5');
  });

  // Test 2: Empty current input + Backspace
  it('Test 2: clears previous digit and moves focus to previous input when backspace is pressed on an empty box', async () => {
    const user = userEvent.setup();
    // Box 4 is empty, Box 3 has digit '3'
    render(<ControlledOtpInput initialValue="123" />);

    const box3 = getOtpInput(3);
    const box4 = getOtpInput(4);
    expect(box3.value).toBe('3');
    expect(box4.value).toBe('');

    await user.click(box4);
    expect(document.activeElement).toBe(box4);

    await user.keyboard('{Backspace}');

    // Previous box (box 3) cleared and focused
    expect(box3.value).toBe('');
    expect(document.activeElement).toBe(box3);
    // Box 4 remains empty
    expect(box4.value).toBe('');
  });

  // Test 3: First input + Backspace
  it('Test 3: does not crash or move focus outside on empty first box', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput initialValue="" />);

    const box1 = getOtpInput(1);
    await user.click(box1);
    expect(document.activeElement).toBe(box1);

    await user.keyboard('{Backspace}');

    expect(box1.value).toBe('');
    expect(document.activeElement).toBe(box1);
  });

  // Test 4: Multiple Backspaces
  it('Test 4: sequentially deletes one digit per Backspace from 123456 down to empty', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput initialValue="123456" />);

    const box6 = getOtpInput(6);
    await user.click(box6);
    expect(document.activeElement).toBe(box6);

    // 1st Backspace: box 6 has '6' -> clears box 6, stays on box 6
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('12345');
    expect(document.activeElement).toBe(box6);
    expect(box6.value).toBe('');

    // 2nd Backspace: box 6 is empty -> clears box 5, moves to box 5
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('1234');
    const box5 = getOtpInput(5);
    expect(document.activeElement).toBe(box5);
    expect(box5.value).toBe('');

    // 3rd Backspace: box 5 is empty -> clears box 4, moves to box 4
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('123');
    const box4 = getOtpInput(4);
    expect(document.activeElement).toBe(box4);
    expect(box4.value).toBe('');

    // 4th Backspace: box 4 is empty -> clears box 3, moves to box 3
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('12');
    const box3 = getOtpInput(3);
    expect(document.activeElement).toBe(box3);
    expect(box3.value).toBe('');

    // 5th Backspace: box 3 is empty -> clears box 2, moves to box 2
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('1');
    const box2 = getOtpInput(2);
    expect(document.activeElement).toBe(box2);
    expect(box2.value).toBe('');

    // 6th Backspace: box 2 is empty -> clears box 1, moves to box 1
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('');
    const box1 = getOtpInput(1);
    expect(document.activeElement).toBe(box1);
    expect(box1.value).toBe('');
  });

  // Test 5: Backspace must delete only one digit per key press
  it('Test 5: deletes only one digit per single Backspace key press', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput initialValue="1234" />);

    // Focus on box 5 (which is empty)
    const box5 = getOtpInput(5);
    await user.click(box5);

    // One backspace: must delete only box 4 ('4'), not box 3 ('3')
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('123');
    expect(getOtpInput(3).value).toBe('3');
    expect(getOtpInput(4).value).toBe('');
    expect(document.activeElement).toBe(getOtpInput(4));
  });

  // Test 6: Paste 123456 then Backspace repeatedly
  it('Test 6: handles paste and subsequent repeated Backspace actions correctly', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();
    render(<ControlledOtpInput onComplete={handleComplete} />);

    const box1 = getOtpInput(1);
    await user.click(box1);

    await user.paste('123456');

    expect(screen.getByTestId('otp-value').textContent).toBe('123456');
    expect(handleComplete).toHaveBeenCalledWith('123456');
    // Focus should be on last box
    const box6 = getOtpInput(6);
    expect(document.activeElement).toBe(box6);

    // 1st backspace -> clears box 6, stays on box 6
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('12345');
    expect(document.activeElement).toBe(box6);

    // 2nd backspace -> clears box 5, moves to box 5
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('otp-value').textContent).toBe('1234');
    expect(document.activeElement).toBe(getOtpInput(5));
  });

  // Test 7: Letters and special characters rejection
  it('Test 7: rejects letters, spaces, and special characters', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput />);

    const box1 = getOtpInput(1);
    await user.click(box1);

    await user.keyboard('a');
    expect(box1.value).toBe('');

    await user.keyboard('!');
    expect(box1.value).toBe('');

    await user.keyboard(' ');
    expect(box1.value).toBe('');

    // Typing a valid digit works and advances
    await user.keyboard('7');
    expect(box1.value).toBe('7');
    expect(document.activeElement).toBe(getOtpInput(2));
  });

  // Auto-advance and digit replacement
  it('auto-advances across inputs when typing digits and allows replacing a digit', async () => {
    const user = userEvent.setup();
    render(<ControlledOtpInput />);

    const box1 = getOtpInput(1);
    await user.click(box1);

    await user.keyboard('1234');
    expect(screen.getByTestId('otp-value').textContent).toBe('1234');
    expect(document.activeElement).toBe(getOtpInput(5));

    // Click back to box 2 and replace digit '2' with '9'
    const box2 = getOtpInput(2);
    await user.click(box2);
    await user.keyboard('9');

    expect(box2.value).toBe('9');
    expect(document.activeElement).toBe(getOtpInput(3));
  });
});
