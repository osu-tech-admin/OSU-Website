/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App.jsx'
import "vite/modulepreload-polyfill";

const root = document.getElementById('root')

render(() => <App />, root)
