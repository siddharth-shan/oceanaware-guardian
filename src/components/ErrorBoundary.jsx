import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to help with debugging
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🔍 Error details:', errorInfo);
    console.error('📍 Component stack:', errorInfo.componentStack);
    
    // Store error details in state for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-red-500 text-xl">⚠️</div>
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          </div>
          
          <div className="text-red-700 mb-4">
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
          </div>
          
          {this.state.errorInfo && (
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer font-medium mb-2">Technical Details</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-40 bg-red-100 p-2 rounded">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;