import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const environment = process.env.REACT_APP_ENVIRONMENT || "development";
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello World! I am in {environment}.</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
