import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ShieldAlert, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error
      const isNetworkBlocked =
        error?.name === 'NetworkBlockedError' ||
        error?.message?.includes('SUPABASE_CONFIG_MISSING') ||
        error?.message?.includes('NETWORK_BLOCKED') ||
        error?.message?.includes('supabaseUrl is required') ||
        error?.message?.includes('Failed to fetch')

      if (isNetworkBlocked) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-white">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 border-2 border-orange-200">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <ShieldAlert className="h-20 w-20 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold mb-3 text-gray-900">הגישה לאתר נחסמה</h1>
                <p className="text-lg text-gray-600 mb-6">
                  נראה שיש חסימה של VPN, Firewall או אנטי-וירוס
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">למה זה קורה?</h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        <span>
                          תוכנת <strong>FortiClient</strong>, VPN או Firewall חוסמים את הגישה לשרתי
                          האתר
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        <span>תוכנת אנטי-וירוס או הגנת רשת חוסמת חיבורים מסוימים</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        <span>חומת אש ארגונית מגבילה גישה לשירותים חיצוניים</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Wifi className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">איך לפתור?</h3>
                    <ol className="text-sm text-gray-700 space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">1.</span>
                        <span>נתק זמנית את ה-VPN (FortiClient או אחר)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">2.</span>
                        <span>השבת זמנית את תוכנת האנטי-וירוס/הגנת הרשת</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">3.</span>
                        <span>
                          אם אתם ברשת ארגונית, צרו קשר עם מנהל המערכת להוספת האתר לרשימת
                          החריגים
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">4.</span>
                        <span>לחצו על &quot;נסה שוב&quot; למטה</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                  נסה שוב
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                >
                  חזור לדף הבית
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  אם הבעיה נמשכת, צרו קשר בוואטסאפ:{' '}
                  <a href="https://wa.me/972586412420" className="text-blue-600 underline">
                    0586412420
                  </a>
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 p-4 bg-gray-50 rounded text-xs">
                  <summary className="cursor-pointer font-semibold">פרטי שגיאה (למפתחים)</summary>
                  <pre className="mt-2 overflow-auto">{error?.message}</pre>
                  <pre className="mt-2 overflow-auto">{error?.stack}</pre>
                </details>
              )}
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-white">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold mb-2">שגיאה</h1>
              <p className="text-gray-600 mb-6">שגיאה התרחשה בדפדפן</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                נסה שוב
              </button>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 p-4 bg-gray-50 rounded text-xs text-left">
                  <summary className="cursor-pointer font-semibold">פרטי שגיאה (למפתחים)</summary>
                  <pre className="mt-2 overflow-auto">{error?.message}</pre>
                  <pre className="mt-2 overflow-auto">{error?.stack}</pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
