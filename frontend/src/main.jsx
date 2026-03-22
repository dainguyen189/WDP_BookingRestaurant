import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

axios.defaults.withCredentials = true;

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<pre style="color:red;font-size:16px">${msg}\n${src}:${line}\n${err?.stack}</pre>`;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
