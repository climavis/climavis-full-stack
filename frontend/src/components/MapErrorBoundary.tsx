import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Map component crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 text-sm">
          <p className="font-medium mb-1">No se pudo cargar el mapa interactivo.</p>
          <p className="text-muted-foreground">{this.state.message || 'Revisa la conexión o los permisos de red.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
