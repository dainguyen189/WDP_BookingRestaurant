import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<pre style="color:red;font-size:16px">${msg}\n${src}:${line}\n${err?.stack}</pre>`;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
