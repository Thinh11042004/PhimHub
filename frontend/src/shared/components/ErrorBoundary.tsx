import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-sm font-medium mb-2">
              Có lỗi xảy ra khi tải nội dung
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="text-red-500 text-xs hover:text-red-700 underline"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
