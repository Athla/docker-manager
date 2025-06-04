import Dashboard from './components/Dashboard';
import { ToastProvider } from './contexts/ToatsContext';

function App() {
  return (
    <ToastProvider>
      <Dashboard />;
    </ToastProvider>
  )
}

export default App;
