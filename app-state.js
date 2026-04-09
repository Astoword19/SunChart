(() => {
  const STORAGE_KEY = "astro-form-state-v1";

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getControlValue(el) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked;
    return el.value;
  }

  function setControlValue(el, value) {
    if (value === undefined) return;
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = !!value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function stateKeyFor(el) {
    if (!el.id && !el.name) return null;
    return `${location.pathname}::${el.id || `${el.name}:${el.type}:${el.value}`}`;
  }

  function attachPersistence() {
    const state = loadState();
    const controls = document.querySelectorAll("input, select, textarea");

    controls.forEach((el) => {
      const key = stateKeyFor(el);
      if (!key) return;
      setControlValue(el, state[key]);
    });

    controls.forEach((el) => {
      const key = stateKeyFor(el);
      if (!key) return;

      const handler = () => {
        const nextState = loadState();
        nextState[key] = getControlValue(el);
        saveState(nextState);
      };
      el.addEventListener("input", handler);
      el.addEventListener("change", handler);
    });
  }

  function attachTxtDownloadButton() {
    const copyBtn = document.getElementById("copyBtn");
    const output = document.getElementById("output");
    if (!copyBtn || !output) return;
    if (document.getElementById("downloadTxtBtn")) return;

    const head = copyBtn.closest(".out-head");
    if (head) {
      head.style.display = "flex";
    }

    const btn = document.createElement("button");
    btn.id = "downloadTxtBtn";
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "↓ Скачать TXT";
    btn.addEventListener("click", () => {
      const text = output.value || "";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const page = (location.pathname.split("/").pop() || "result").replace(".html", "");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `${page}-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
    copyBtn.insertAdjacentElement("afterend", btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    attachPersistence();
    attachTxtDownloadButton();
  });
})();
