import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import process from 'process';
import { Buffer } from 'buffer';

window.process = process;   // make the global
window.Buffer  = Buffer;

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
