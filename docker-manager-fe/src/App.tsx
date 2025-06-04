import Dashboard from './components/Dashboard';
import { ToastProviuder as ToastProvider } from './contexts/ToatsContext';

function App() {
  return (
    <ToastProvider>
      <Dashboard />;
    </ToastProvider>
  )
}

export default App;
