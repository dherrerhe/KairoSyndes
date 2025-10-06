import 'reactflow/dist/style.css';
import logo from './logo.svg';
import './App.css';
import PrimerComponente from './components/PrimerComponente';
import { SegundoComponente } from './components/SegundoComponente';
import FlowComponent from './components/FlowComponent';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <PrimerComponente />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <SegundoComponente />
      </header>
      <div>
        <h1>React Flow — Nodos personalizados</h1>
        <p>Ejemplo: edita el texto dentro del nodo y conéctalos.</p>
        <FlowComponent />
      </div>
    </div>
    
  );
}

export default App;
