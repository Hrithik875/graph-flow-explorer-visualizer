
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set up some global styles for better scrolling behavior 
const style = document.createElement('style');
style.innerHTML = `
  html, body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #111827;
  }
  #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
