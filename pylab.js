/* pylab.js: run the Data path's Python cells in the reader's own browser.
   Python (Pyodide) is fetched only when a reader first presses Run, from a
   pinned version, and the loader script is integrity-checked. Code runs on
   the reader's machine; nothing they type is sent anywhere.
   Page setup: <main data-py-packages="numpy pandas"> and cells like
   <div class="cell"><textarea>code</textarea></div>                     */
(function () {
  'use strict';
  var VERSION = '314.0.7';
  var BASE = 'https://cdn.jsdelivr.net/pyodide/v' + VERSION + '/full/';
  var SRI = 'sha384-hYKrcQ7FiKU7f1c92md9N2eh7BoBVX4CPkNDfQyyVclsjZevvDOBUkajGcYk1EF8';
  var DATA = [['data/penguins.csv', 'penguins.csv']];

  var ready = null;   // one shared promise: Python + packages + data

  var HELPER = [
    'import ast, sys, io, json, base64, traceback, os',
    'os.environ.setdefault("MPLBACKEND", "AGG")',
    'def _pylab_run(src):',
    '    out = io.StringIO(); imgs = []; err = None',
    '    old = sys.stdout, sys.stderr',
    '    sys.stdout = sys.stderr = out',
    '    try:',
    '        tree = ast.parse(src, "<cell>", "exec")',
    '        last = None',
    '        if tree.body and isinstance(tree.body[-1], ast.Expr):',
    '            last = ast.Expression(tree.body.pop().value)',
    '        g = globals()',
    '        exec(compile(tree, "<cell>", "exec"), g)',
    '        if last is not None:',
    '            v = eval(compile(last, "<cell>", "eval"), g)',
    '            if v is not None:',
    '                scalar = type(v).__module__ == "numpy" and getattr(v, "shape", None) == ()',
    '                print(v if scalar else repr(v))',
    '    except Exception as e:',
    '        lines = traceback.format_exception_only(type(e), e)',
    '        err = "".join(lines).strip()',
    '        if isinstance(e, NameError):',
    '            err += "\\nTip: run the cells above this one first, in order."',
    '    finally:',
    '        sys.stdout, sys.stderr = old',
    '    if "matplotlib.pyplot" in sys.modules:',
    '        plt = sys.modules["matplotlib.pyplot"]',
    '        for n in plt.get_fignums():',
    '            b = io.BytesIO()',
    '            plt.figure(n).savefig(b, format="png", dpi=110, bbox_inches="tight")',
    '            imgs.append(base64.b64encode(b.getvalue()).decode())',
    '        plt.close("all")',
    '    return json.dumps({"out": out.getvalue(), "err": err, "imgs": imgs})'
  ].join('\n');

  function loadScript() {
    return new Promise(function (ok, fail) {
      if (window.loadPyodide) return ok();
      var s = document.createElement('script');
      s.src = BASE + 'pyodide.js';
      s.integrity = SRI;
      s.crossOrigin = 'anonymous';
      s.onload = ok;
      s.onerror = function () { fail(new Error('script')); };
      document.head.appendChild(s);
    });
  }

  function boot(setStatus) {
    if (ready) return ready;
    var main = document.querySelector('[data-py-packages]');
    var pkgs = main ? main.getAttribute('data-py-packages').split(/\s+/).filter(Boolean) : [];
    ready = (async function () {
      setStatus('Fetching Python. The first time takes a little while…');
      await loadScript();
      var py = await window.loadPyodide({ indexURL: BASE });
      if (pkgs.length) {
        setStatus('Loading ' + pkgs.join(', ') + '…');
        await py.loadPackage(pkgs, { messageCallback: function () {} });
      }
      for (var i = 0; i < DATA.length; i++) {
        var r = await fetch(DATA[i][0]);
        if (!r.ok) throw new Error('data');
        py.FS.writeFile(DATA[i][1], new Uint8Array(await r.arrayBuffer()));
      }
      py.runPython(HELPER);
      return py;
    })();
    ready.catch(function () { ready = null; });   // allow a retry
    return ready;
  }

  function setup(cell) {
    var ta = cell.querySelector('textarea');
    if (!ta || cell.querySelector('.cell-bar')) return;
    var original = ta.value;
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocorrect', 'off');
    function fit() { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
    ta.addEventListener('input', fit);

    var bar = document.createElement('div'); bar.className = 'cell-bar';
    var run = document.createElement('button'); run.type = 'button'; run.className = 'run'; run.textContent = 'Run';
    var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'reset'; reset.textContent = 'Reset';
    var status = document.createElement('span'); status.className = 'status'; status.setAttribute('aria-live', 'polite');
    bar.appendChild(run); bar.appendChild(reset); bar.appendChild(status);
    var out = document.createElement('pre'); out.className = 'out'; out.hidden = true;
    var figs = document.createElement('div'); figs.className = 'figs';
    cell.appendChild(bar); cell.appendChild(out); cell.appendChild(figs);

    function say(t) { status.textContent = t; }

    async function go() {
      run.disabled = true;
      try {
        var py = await boot(say);
        say('Running…');
        var res = JSON.parse(py.globals.get('_pylab_run')(ta.value));
        var text = res.out || '';
        if (res.err) text += (text ? '\n' : '') + res.err;
        out.textContent = text || '(no output: add print() or end with a name to see its value)';
        out.classList.toggle('bad', !!res.err);
        out.hidden = false;
        figs.innerHTML = '';
        (res.imgs || []).forEach(function (b64) {
          var im = new Image(); im.alt = 'Chart drawn by the code above'; im.src = 'data:image/png;base64,' + b64;
          figs.appendChild(im);
        });
        say(res.err ? 'Error: read the last line' : 'Done');
      } catch (e) {
        say('');
        out.textContent = "Couldn't start Python in this browser. Are you offline? You can still run every cell on your own machine: see the box at the end of this page.";
        out.classList.add('bad'); out.hidden = false;
      } finally {
        run.disabled = false;
      }
    }
    run.addEventListener('click', go);
    reset.addEventListener('click', function () { ta.value = original; fit(); out.hidden = true; figs.innerHTML = ''; say(''); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(); }
    });
    fit();
  }

  function init() { document.querySelectorAll('.cell').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
