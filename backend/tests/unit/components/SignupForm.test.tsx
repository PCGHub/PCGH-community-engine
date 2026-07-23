/** @jest-environment jsdom */
/**
 * Component tests for SignupForm (EWP-011). Mocks
 * app/services/auth/auth-service and app/config/supabase-browser
 * entirely -- zero real network, zero Supabase dependency. Proves:
 * the form calls the shared operations correctly, renders the right
 * UI per outcome, and that the username-availability debounce/blur/
 * stale-response/unmount behavior in useUsernameAvailability is
 * correct.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignupForm } from '../../../app/components/SignupForm';
import * as authService from '../../../app/services/auth/auth-service';

jest.mock('../../../app/config/supabase-browser', () => ({
  getSupabaseBrowserClient: () => ({}),
}));

jest.mock('../../../app/services/auth/auth-service', () => ({
  ...jest.requireActual('../../../app/services/auth/auth-service'),
  performSignup: jest.fn(),
  checkUsernameAvailability: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockedPerformSignup = authService.performSignup as jest.Mock;
const mockedCheckUsernameAvailability = authService.checkUsernameAvailability as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderForm() {
  return render(<SignupForm />);
}

describe('SignupForm', () => {
  it('calls performSignup with the entered fields and redirects to /community on a real session', async () => {
    mockedPerformSignup.mockResolvedValue({ status: 'signed_in' });
    renderForm();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(mockedPerformSignup).toHaveBeenCalledWith(
      {},
      { email: 'alice@example.test', password: 'Password123!', username: 'alice' },
    );
    expect(mockPush).toHaveBeenCalledWith('/community');
  });

  it('shows a neutral confirmation-required state without redirecting when no session is returned', async () => {
    mockedPerformSignup.mockResolvedValue({ status: 'confirmation_required' });
    renderForm();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays the mapped error message and does not redirect on failure', async () => {
    mockedPerformSignup.mockResolvedValue({ status: 'error', message: 'That username is already taken or invalid. Please choose another.' });
    renderForm();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(screen.getByText(/already taken or invalid/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  describe('username availability', () => {
    it('debounces typing into exactly one availability check for the final value', async () => {
      mockedCheckUsernameAvailability.mockResolvedValue('available');
      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'a' } });
      fireEvent.change(usernameField, { target: { value: 'al' } });
      fireEvent.change(usernameField, { target: { value: 'ali' } });
      fireEvent.change(usernameField, { target: { value: 'alice' } });

      expect(mockedCheckUsernameAvailability).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      expect(mockedCheckUsernameAvailability).toHaveBeenCalledTimes(1);
      expect(mockedCheckUsernameAvailability).toHaveBeenCalledWith({}, 'alice');
    });

    it('blur before the debounce elapses triggers exactly one immediate call, with no later duplicate', async () => {
      mockedCheckUsernameAvailability.mockResolvedValue('available');
      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'alice' } });

      await act(async () => {
        fireEvent.blur(usernameField);
      });

      expect(mockedCheckUsernameAvailability).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      // The original debounce timer must have been cancelled by blur --
      // no second call fires once it would otherwise have elapsed.
      expect(mockedCheckUsernameAvailability).toHaveBeenCalledTimes(1);
    });

    it('discards a stale response from an older username when a newer check has already superseded it', async () => {
      let resolveFirst!: (value: string) => void;
      let resolveSecond!: (value: string) => void;
      mockedCheckUsernameAvailability
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'alice' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      fireEvent.change(usernameField, { target: { value: 'alice2' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      expect(mockedCheckUsernameAvailability).toHaveBeenCalledTimes(2);

      // Resolve the NEWER check first, then the OLDER (stale) one --
      // resolution order is deliberately inverted from initiation order.
      await act(async () => {
        resolveSecond('available');
      });
      await act(async () => {
        resolveFirst('taken');
      });

      expect(screen.getByText('Username available')).toBeInTheDocument();
      expect(screen.queryByText('Username already taken')).not.toBeInTheDocument();
    });

    it('prevents a stale in-flight result from being rendered when the input is invalidated before it resolves', async () => {
      let resolveCheck!: (value: string) => void;
      mockedCheckUsernameAvailability.mockImplementationOnce(
        () => new Promise((resolve) => { resolveCheck = resolve; }),
      );

      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'alice' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      expect(screen.getByText('Checking availability...')).toBeInTheDocument();

      // Invalidate before the in-flight request resolves.
      fireEvent.change(usernameField, { target: { value: '' } });

      await act(async () => {
        resolveCheck('taken');
      });

      expect(screen.queryByText('Username already taken')).not.toBeInTheDocument();
    });

    it('exits "checking" safely when the availability check throws or rejects, rather than hanging forever', async () => {
      mockedCheckUsernameAvailability.mockImplementationOnce(
        () => Promise.reject(new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')),
      );

      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'alice' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      expect(screen.queryByText('Checking availability...')).not.toBeInTheDocument();
      expect(screen.queryByText('Username available')).not.toBeInTheDocument();
      expect(screen.queryByText('Username already taken')).not.toBeInTheDocument();
    });

    it('does not call the RPC for locally invalid input', async () => {
      renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: '   ' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      expect(mockedCheckUsernameAvailability).not.toHaveBeenCalled();
    });

    it('does not update state after unmount when a check resolves late', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let resolveCheck!: (value: string) => void;
      mockedCheckUsernameAvailability.mockImplementationOnce(
        () => new Promise((resolve) => { resolveCheck = resolve; }),
      );

      const { unmount } = renderForm();
      const usernameField = screen.getByLabelText('Username');

      fireEvent.change(usernameField, { target: { value: 'alice' } });
      await act(async () => {
        jest.advanceTimersByTime(450);
      });

      unmount();

      await act(async () => {
        resolveCheck('available');
      });

      const stateUpdateWarning = consoleErrorSpy.mock.calls.some((call) =>
        String(call[0]).includes("Can't perform a React state update on an unmounted component"),
      );
      expect(stateUpdateWarning).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });
});
