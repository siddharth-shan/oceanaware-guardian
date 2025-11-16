import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Specialized Error Boundary for React Hooks Violations
 * Catches hooks-related errors and provides a safe fallback UI
 */
class HooksErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a hooks-related error
    const isHooksError = error.message && (
      error.message.includes('rendered more hooks') ||
      error.message.includes('rendered fewer hooks') ||
      error.message.includes('different order') ||
      error.message.includes('hooks can only be called') ||
      error.message.includes('Invalid hook call')
    );

    return { 
      hasError: true,
      isHooksError 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HooksErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log specific hooks errors for debugging
    if (error.message && error.message.includes('hooks')) {
      console.error('🪝 HOOKS ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, isHooksError, retryCount } = this.state;
      const { fallbackComponent: FallbackComponent, showDetails = true } = this.props;

      // Use custom fallback component if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} retry={this.handleRetry} />;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                {isHooksError ? 'Component Loading Error' : 'Something went wrong'}
              </h2>
              <p className="text-red-700 mb-4">
                {isHooksError 
                  ? 'There was an issue loading this section. This is a known issue we\'re working to resolve.'
                  : 'An unexpected error occurred while loading this content.'
                }
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= 3}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {retryCount >= 3 ? 'Max retries reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
                </span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>

            {showDetails && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded border text-xs text-red-800 font-mono overflow-auto max-h-32">
                  <div className="font-bold mb-1">Error:</div>
                  <div className="mb-2">{error.message}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mb-1">Component Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="mt-6 text-xs text-red-600">
              <p>If this problem persists, please refresh the page or try again later.</p>
              {isHooksError && (
                <p className="mt-1 font-medium">
                  Error ID: HOOKS-{Date.now().toString().slice(-6)}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-Order Component wrapper for easier usage
 */
export const withHooksErrorBoundary = (Component, options = {}) => {
  return function WrappedComponent(props) {
    return (
      <HooksErrorBoundary {...options}>
        <Component {...props} />
      </HooksErrorBoundary>
    );
  };
};

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    console.error('useErrorHandler caught error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

export default HooksErrorBoundary;