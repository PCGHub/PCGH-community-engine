/** @jest-environment jsdom */
/**
 * Component tests for LoginForm (EWP-011). Mocks
 * app/services/auth/auth-service and app/config/supabase-browser --
 * zero real network, zero Supabase dependency.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '../../../app/components/LoginForm';
import * as authService from '../../../app/services/auth/auth-service';

jest.mock('../../../app/config/supabase-browser', () => ({
  getSupabaseBrowserClient: () => ({}),
}));

jest.mock('../../../app/services/auth/auth-service', () => ({
  ...jest.requireActual('../../../app/services/auth/auth-service'),
  performLogin: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockedPerformLogin = authService.performLogin as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginForm', () => {
  it('calls performLogin with the entered credentials and redirects to /community on success', async () => {
    mockedPerformLogin.mockResolvedValue({ status: 'signed_in' });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });

    expect(mockedPerformLogin).toHaveBeenCalledWith({}, { email: 'alice@example.test', password: 'Password123!' });
    expect(mockPush).toHaveBeenCalledWith('/community');
  });

  it('displays the mapped error message and does not redirect on failure', async () => {
    mockedPerformLogin.mockResolvedValue({ status: 'error', message: 'Incorrect email or password.' });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });

    expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
