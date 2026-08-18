import React from "react";

/**
 * BJPJMQ preview wrapper.
 *
 * The real deliverables live at:
 *   /app/apps_script/Code.gs
 *   /app/apps_script/Index.html
 *
 * For preview in the Emergent environment (no Google Apps Script runtime),
 * we serve /preview.html (a copy of Index.html + mock-gas.js providing a
 * localStorage-backed google.script.run stand-in).
 */
function App() {
  return (
    <iframe
      title="BJPJMQ Preview"
      src="/preview.html"
      data-testid="bjpjmq-preview-frame"
      style={{
        border: 0,
        width: "100vw",
        height: "100vh",
        display: "block",
      }}
    />
  );
}

export default App;
