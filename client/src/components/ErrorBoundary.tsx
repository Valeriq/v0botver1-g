import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ErrorBoundary поймал ошибку:', error);
    console.error('Информация об ошибке:', errorInfo);
    
    // Логируем ошибку в localStorage для отладки
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(errorLog);
      localStorage.setItem('errorLogs', JSON.stringify(logs.slice(-10))); // Храним последние 10 ошибок
    } catch (e) {
      console.error('Не удалось сохранить лог ошибки:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#666',
          backgroundColor: '#fff',
          minHeight: '100vh',
        }}>
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#fff8f0',
          }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>
              Произошла ошибка
            </h1>
            <p style={{ marginBottom: '16px' }}>
              К сожалению, что-то пошло не так. Попробуйте обновить страницу.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
                  Показать детали ошибки (только для разработчика)
                </summary>
                <pre style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#333',
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Обновить страницу
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#1976d2',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Сбросить и на главную
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '24px', fontSize: '12px', color: '#999' }}>
                <p>💡 Совет для разработчика: Проверьте консоль браузера для деталей ошибки.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Хук для функциональных компонентов
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('❌ Ошибка в компоненте:', error);
    if (errorInfo) {
      console.error('Информация:', errorInfo);
    }
    
    // Здесь можно добавить отправку ошибок в сервис логирования
  };
}
