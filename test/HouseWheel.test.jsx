import { render, fireEvent } from '@testing-library/react';
import HouseWheel from '../src/components/HouseWheel';

describe('HouseWheel', () => {
  it('renders four houses', () => {
    const { container } = render(<HouseWheel value="" onChange={() => {}} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4);
  });

  it('calls onChange when a house is clicked', () => {
    const handle = vi.fn();
    const { container } = render(<HouseWheel value="" onChange={handle} />);
    const paths = container.querySelectorAll('path');
    fireEvent.click(paths[0]);
    expect(handle).toHaveBeenCalledWith('gryffondor');
  });
});
