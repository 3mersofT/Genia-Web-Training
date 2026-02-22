/**
 * Unit Tests for ImageWithCaption Component
 * Tests component rendering, caption display, and accessibility
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageWithCaption from '../ImageWithCaption';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          return React.forwardRef(({ children, ...props }: any, ref: any) =>
            React.createElement(prop as string, { ...props, ref }, children)
          );
        },
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock yet-another-react-lightbox
jest.mock('yet-another-react-lightbox', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ZoomIn: () => <div data-testid="zoom-icon">ZoomIn</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  X: () => <div data-testid="close-icon">X</div>,
}));

// Mock IntersectionObserver
beforeEach(() => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver as any;
});

describe('ImageWithCaption Component', () => {
  it('should render with image URL and alt text', () => {
    render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image description"
        priority={true}
      />
    );

    const image = screen.getByAltText('Test image description');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should display caption below image', () => {
    render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image"
        caption="This is a test caption"
        priority={true}
      />
    );

    const caption = screen.getByText('This is a test caption');
    expect(caption).toBeInTheDocument();
  });

  it('should not display caption when not provided', () => {
    const { container } = render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const captionElements = container.querySelectorAll('p');
    expect(captionElements.length).toBe(0);
  });

  it('should have alt text in image element', () => {
    render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Accessible image description"
        priority={true}
      />
    );

    const image = screen.getByAltText('Accessible image description');
    expect(image).toHaveAttribute('alt', 'Accessible image description');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
        priority={true}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should use default width and height when not provided', () => {
    render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('width', '800');
    expect(image).toHaveAttribute('height', '600');
  });

  it('should use custom width and height when provided', () => {
    render(
      <ImageWithCaption
        url="https://example.com/image.jpg"
        alt="Test image"
        width={1200}
        height={900}
        priority={true}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toHaveAttribute('width', '1200');
    expect(image).toHaveAttribute('height', '900');
  });
});
