// AutoDialog — shared modal dialog module.
//
// REQUIRED HTML (once per page):
// ─────────────────────────────────────────────────────────────────────────────
//  <dialog class="dialog-shell">
//      <div class="dialog-container">
//          <div class="diag-header">
//              <div class="diag-title"></div>
//              <div class="diag-close"> <!-- X button --> </div>
//          </div>
//          <div class="diag-body"></div>
//          <div class="diag-footer">
//              <button class="diag-btn diag-cancel">Cancelar</button>
//              <button class="diag-btn diag-ok">OK</button>
//          </div>
//      </div>
//  </dialog>
//
// CONTENT SLOTS (one per dialog use case, hidden by default via .for-dialog CSS):
// ─────────────────────────────────────────────────────────────────────────────
//  <div class="for-dialog" id="my-content">
//      <!-- anything -->
//  </div>
//
// USAGE:
// ─────────────────────────────────────────────────────────────────────────────
//  AutoDialog.open({
//      content: document.getElementById('my-content'),  // element reference
//      title:   'Dialog title',
//      onOk:    () => { /* confirm logic */ },
//      onCancel: () => { /* dismiss logic */ }           // optional
//  });
//
//  AutoDialog.close();  // close programmatically
//
// NOTES:
//  - content is moved into .diag-body on open, restored to <body> on close.
//  - onOk / onCancel are cleared after each call — safe to reuse with new fns.
//  - Closes on: OK button, Cancel button, X button, backdrop click, Escape key.

const AutoDialog = (() => {
    const shell = document.querySelector('dialog.dialog-shell');
    if (!shell) return {};

    const titleEl = shell.querySelector('.diag-title');
    const closeBtn = shell.querySelector('.diag-close');
    const body = shell.querySelector('.diag-body');
    const okBtn = shell.querySelector('.diag-ok');
    const cancelBtn = shell.querySelector('.diag-cancel');

    let activeContent = null;

    // Runs on both dialog.close() and Escape key
    shell.addEventListener('close', () => {
        if (activeContent) {
            activeContent.style.display = '';
            document.body.appendChild(activeContent);
            activeContent = null;
        }
        okBtn.onclick = null;
        cancelBtn.onclick = null;
    });

    // Close on backdrop click
    shell.addEventListener('click', (e) => {
        const r = shell.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right ||
            e.clientY < r.top || e.clientY > r.bottom) {
            shell.close();
        }
    });

    closeBtn.addEventListener('click', () => shell.close());

    function open({ content, title = '', onOk, onCancel } = {}) {
        content.style.display = 'block';
        body.appendChild(content);
        titleEl.textContent = title;
        okBtn.onclick = () => { onOk?.(); shell.close(); };
        cancelBtn.onclick = () => { onCancel?.(); shell.close(); };

        shell.showModal();
    }

    return { open, close: () => shell.close() };
})();
