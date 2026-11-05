import { fireEvent, render, screen } from '@testing-library/react-native';

import { BackendStatusCard } from '@/components/backend-status-card';

describe('<BackendStatusCard />', () => {
  it('shows the online state', async () => {
    await render(<BackendStatusCard status="online" />);
    expect(screen.getByText('Backend: Online')).toBeTruthy();
  });

  it('explains how to configure the app when unconfigured', async () => {
    await render(<BackendStatusCard status="unconfigured" />);
    expect(screen.getByText(/\.env\.example/)).toBeTruthy();
  });

  it('offers a retry when offline', async () => {
    const onRetry = jest.fn();
    await render(<BackendStatusCard status="offline" onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not offer a retry while online', async () => {
    await render(<BackendStatusCard status="online" onRetry={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});
