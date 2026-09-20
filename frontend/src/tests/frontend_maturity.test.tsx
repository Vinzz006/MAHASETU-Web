import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EmptyState } from '../components/EmptyState';
import { registrationSchema } from '../schemas/validation';

describe('Frontend Engineering Foundations & Components', () => {
  it('LanguageSwitcher toggles language and updates text', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('मराठी');

    // Click to toggle to Marathi
    fireEvent.click(button);
    expect(button.textContent).toContain('English');
  });

  it('ErrorBoundary captures rendering errors and renders resilient fallback', () => {
    // Suppress console.error during deliberate throw test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowErrorComponent = () => {
      throw new Error('Simulated Component Crash');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('EmptyState renders title, description, and responds to action', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Applications Found"
        description="Browse available schemes in the citizen catalog."
        actionText="Explore Services"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Applications Found')).toBeInTheDocument();
    expect(screen.getByText('Browse available schemes in the citizen catalog.')).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: 'Explore Services' });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('registrationSchema enforces password complexity and 10-digit mobile number', () => {
    // Invalid password (no uppercase or special character)
    const invalidData = {
      name: 'Test Citizen',
      mobile: '12345', // invalid
      email: 'invalid-email',
      password: 'weak'
    };
    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    // Valid data
    const validData = {
      name: 'Valid Citizen',
      mobile: '9876543210',
      email: 'citizen@mahasetu.gov.in',
      password: 'ValidPassword123!'
    };
    const validResult = registrationSchema.safeParse(validData);
    expect(validResult.success).toBe(true);
  });
});
