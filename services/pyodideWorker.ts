export const PYODIDE_WORKER_CODE = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;

async function loadPyodideAndPackages() {
  try {
    self.postMessage({ type: 'status', message: 'Loading Pyodide core...' });
    pyodide = await loadPyodide();
    
    self.postMessage({ type: 'status', message: 'Loading scientific packages (numpy, matplotlib, scipy)...' });
    await pyodide.loadPackage(["numpy", "matplotlib", "scipy"]);
    
    // Setup matplotlib backend to Agg (non-interactive) and define capture helper
    await pyodide.runPythonAsync(\`
      import matplotlib
      matplotlib.use("Agg")
      import matplotlib.pyplot as plt
      import io
      import base64

      def _capture_plot_if_exists():
          if len(plt.get_fignums()) > 0:
              buf = io.BytesIO()
              plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
              buf.seek(0)
              img_base64 = base64.b64encode(buf.read()).decode('utf-8')
              plt.close('all') # Clear figures for next run
              return f"data:image/png;base64,{img_base64}"
          return None
    \`);

    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: 'Failed to load Pyodide: ' + error.message });
  }
}

self.onmessage = async (event) => {
  const { type, code } = event.data;

  if (type === 'init') {
    await loadPyodideAndPackages();
  }

  if (type === 'run') {
    if (!pyodide) {
      self.postMessage({ type: 'error', error: 'Pyodide not initialized. Please reset environment.' });
      return;
    }

    try {
      // Capture stdout
      let stdoutBuffer = [];
      pyodide.setStdout({ batched: (text) => stdoutBuffer.push(text) });
      pyodide.setStderr({ batched: (text) => stdoutBuffer.push('ERR: ' + text) });

      // Run the code
      await pyodide.runPythonAsync(code);
      
      // Check for plots using the helper function
      const image = await pyodide.runPythonAsync("_capture_plot_if_exists()");

      self.postMessage({ type: 'results', output: stdoutBuffer.join('\\n'), image });
    } catch (error) {
      let errorMsg = error.message;
      // Clean up internal Pyodide stack traces for cleaner student feedback
      if (errorMsg.includes("Traceback")) {
          const lines = errorMsg.split('\\n');
          const cleanLines = lines.filter(line => 
              !line.includes('/lib/python') && 
              !line.includes('_pyodide')
          );
          errorMsg = cleanLines.join('\\n').trim();
      }
      self.postMessage({ type: 'error', error: errorMsg });
    }
  }
};
`;