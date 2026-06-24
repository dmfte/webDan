"use strict";

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "mi-prompt-itud";
const DEFAULT_CATEGORY = "Sin categoría";

// Tags used when starting a new prompt with default tags enabled.
const DEFAULT_TAGS = [
    {
        name: "prompt",
        depth: 0,
        content:
            "- Read all tags and understand how they relate to each other before starting to write.\n" +
            "- Follow the tags inside the 'task' tags in the order their IDs indicate. Don't start the next task before finishing up the current one.\n" +
            "- Ask me any questions you consider necessary."
    },
    { name: "stage", content: "", depth: 1 },
    { name: "context", content: "", depth: 2 },
    { name: "objective", content: "", depth: 2 },
    { name: "rol", content: "", depth: 2 },
    { name: "task", content: "", depth: 1 },
    { name: "build", content: "", depth: 2 },
    { name: "analyze", content: "", depth: 2 },
    { name: "write", content: "", depth: 2 },
    { name: "rules", content: "", depth: 1 },
    { name: "example", content: "", depth: 2 },
    { name: "style", content: "", depth: 2 },
    { name: "tone", content: "", depth: 2 }
];

// Tags used by the CREA template.
const CREA_TAGS = [
    { name: "contexto", content: "", depth: 0 },
    { name: "rol", content: "", depth: 0 },
    { name: "especificidad", content: "", depth: 0 },
    { name: "accion", content: "", depth: 0 }
];

// Valid template ids and their labels (shown in the Plantillas sub-menu).
const TEMPLATE_LABELS = { vacio: "Vacío", str: "STR", crea: "CREA" };

/** Returns a fresh tag list for the given template id. */
function getTemplateTags(template) {
    if (template === "crea") return JSON.parse(JSON.stringify(CREA_TAGS));
    if (template === "vacio") return [{ name: "nueva-etiqueta", content: "", depth: 0 }];
    return JSON.parse(JSON.stringify(DEFAULT_TAGS)); // "str"
}

// ============================================
// Default State
// ============================================

const defaultState = {
    config: {
        activeTab: "editor",
        sortOrder: "date-desc",
        viewMode: "todos",
        theme: "oscuro",
        template: "str",
        useCorrelativeId: true,
        useAutocompletado: true
    },
    editor: {
        tags: JSON.parse(JSON.stringify(DEFAULT_TAGS)),
        selectedTagIndex: 0,
        category: "",
        promptName: "",
        editingPromptId: null
    },
    prompts: [
        {
            id: "1",
            title: "Debug emocional para devs con deadline",
            date: "2026-01-19",
            category: "Humor",
            tags: [
                { name: "rol", content: "Eres mi terapeuta pero también mi linter." },
                { name: "acciones", content: "Si me quejo, responde \"warning: drama no tipado\"." }
            ]
        },
        {
            id: "2",
            title: "Plan semanal para shipping continuo",
            date: "2026-01-25",
            category: "Productividad",
            tags: [
                { name: "contexto", content: "Tengo 2 horas al día para avanzar." },
                { name: "acciones", content: "Divide tareas por impacto y bloquea distracciones." }
            ]
        },
        {
            id: "3",
            title: "Landing técnica para app SaaS",
            date: "2026-02-01",
            category: "Desarrollo",
            tags: [
                { name: "especificidad", content: "Beneficios claros, CTA único, tono experto." },
                { name: "acciones", content: "Propón estructura hero, prueba social y pricing." }
            ]
        }
    ],
    categories: ["Desarrollo", "Productividad", "Contenido", "Humor"],
    selectedPromptId: null
};

// ============================================
// State & Persistence
// ============================================

let state = loadState();

// Tracks the original category name for each textarea line so that
// renaming "Humor" → "Humo" → "" still knows the prompt belonged to "Humor".
// Only reset on full render (init, import, after deletion).
let categoryLineOrigins = [];

/** Loads state from localStorage, falling back to defaults. */
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error loading state:", e);
    }
    return JSON.parse(JSON.stringify(defaultState));
}

/** Persists the current state to localStorage. */
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error saving state:", e);
    }
}

// ============================================
// Utilities
// ============================================

/** Strips invalid characters from tag names (lowercase, alphanumeric, hyphens, underscores). */
function sanitizeTagName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 30);
}

/** Generates a unique ID using timestamp + random suffix. */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Escapes HTML entities to prevent XSS in dynamic content. */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/** Formats an array of tags into XML-like preview text, with indentation for nested tags. */
function formatPromptPreview(tags) {
    if (!tags.length) return "";

    const useIds = state.config.useCorrelativeId;

    // Count occurrences of each tag name to decide which need correlative IDs
    const nameCounts = {};
    if (useIds) {
        for (const tag of tags) {
            nameCounts[tag.name] = (nameCounts[tag.name] || 0) + 1;
        }
    }

    // Track the next ID to assign per tag name
    const nameNextId = {};

    const lines = [];
    const stack = [];
    const indent = (d) => "  ".repeat(d);

    for (const tag of tags) {
        const depth = tag.depth || 0;

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            const closed = stack.pop();
            lines.push(`${indent(closed.depth)}</${closed.name}>`);
        }

        let openTag = tag.name;
        if (useIds && nameCounts[tag.name] > 1) {
            nameNextId[tag.name] = (nameNextId[tag.name] || 0) + 1;
            openTag = `${tag.name} id="${nameNextId[tag.name]}"`;
        }

        lines.push(`${indent(depth)}<${openTag}>`);
        if (tag.content) {
            tag.content.split("\n").forEach(line => {
                lines.push(`${indent(depth)}${line}`);
            });
        }
        stack.push({ name: tag.name, depth });
    }

    while (stack.length > 0) {
        const closed = stack.pop();
        lines.push(`${indent(closed.depth)}</${closed.name}>`);
    }

    return lines.join("\n");
}

/** Returns today's date as YYYY-MM-DD. */
function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the caret position { top, left, height } relative to field.parentElement,
 * or null when the selection is unavailable or outside the field.
 * Used by both the block-cursor and the suggestion chip.
 */
function getCaretCoords(field) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    if (!field.contains(range.startContainer)) return null;

    const r = range.cloneRange();
    r.collapse(true);
    let caretRect = r.getBoundingClientRect();

    if (!caretRect.height) {
        const fieldRect = field.getBoundingClientRect();
        const style     = getComputedStyle(field);
        // lineHeight in px: getComputedStyle returns "normal" when not set, so fall back
        // to fontSize * 1.2 in that case.
        const lineH   = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.2) || 20;
        const padTop  = parseFloat(style.paddingTop);
        const padLeft = parseFloat(style.paddingLeft);

        // Strategy 1: measure the character immediately before the caret.
        if (range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
            const testRange = document.createRange();
            testRange.setStart(range.startContainer, range.startOffset - 1);
            testRange.setEnd(range.startContainer, range.startOffset);
            const testRect = testRange.getBoundingClientRect();
            if (testRect.height) {
                caretRect = { top: testRect.bottom, left: fieldRect.left + padLeft, height: testRect.height };
            }
        }

        // Strategy 2: count \n characters before the caret to derive the visual line.
        if (!caretRect.height && range.startContainer.nodeType === Node.TEXT_NODE) {
            const pre = document.createRange();
            pre.selectNodeContents(field);
            pre.setEnd(range.startContainer, range.startOffset);
            const linesBefore = (pre.toString().match(/\n/g) || []).length;
            caretRect = { top: fieldRect.top + padTop + linesBefore * lineH, left: fieldRect.left + padLeft, height: lineH };
        }

        // Final fallback: top-left of field.
        if (!caretRect.height) {
            caretRect = { top: fieldRect.top + padTop, left: fieldRect.left + padLeft, height: lineH };
        }
    }

    const containerRect = field.parentElement.getBoundingClientRect();
    return {
        top:    caretRect.top    - containerRect.top,
        left:   caretRect.left   - containerRect.left,
        height: caretRect.height
    };
}

// ============================================
// Popup System
// ============================================

const popup = {
    overlay: null,
    title: null,
    content: null,
    actions: null,

    /** Caches DOM references and sets up close-on-overlay-click and Escape key. */
    init() {
        this.overlay = document.getElementById("popup-overlay");
        this.title = document.getElementById("popup-title");
        this.content = document.getElementById("popup-content");
        this.actions = document.getElementById("popup-actions");

        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.overlay.classList.contains("is-visible")) {
                this.close();
            }
        });
    },

    /** Displays a popup with a title, HTML content, and action buttons. */
    show(options) {
        this.title.textContent = options.title || "";
        this.content.innerHTML = options.content || "";
        this.actions.innerHTML = "";

        if (options.buttons) {
            options.buttons.forEach((btn) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `btn ${btn.class || ""}`;
                button.textContent = btn.text;
                button.addEventListener("click", () => {
                    if (btn.action) btn.action();
                    if (btn.close !== false) this.close();
                });
                this.actions.appendChild(button);
            });
        }

        this.overlay.classList.add("is-visible");

        if (options.focusInput) {
            setTimeout(() => {
                const input = this.content.querySelector("input");
                if (input) { input.focus(); input.select(); }
            }, 50);
        }
    },

    close() {
        this.overlay.classList.remove("is-visible");
    },

    /** Shows a confirmation dialog with Cancel and Confirm buttons. */
    confirm(title, message, onConfirm) {
        this.show({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                { text: "Cancelar", class: "" },
                { text: "Confirmar", class: "btn-danger", action: onConfirm }
            ]
        });
    },

    /** Shows a dialog to rename a tag. Supports Enter key to save. */
    editTag(currentName, onSave) {
        this.show({
            title: "Editar etiqueta",
            content: `
                <label>Nombre de la etiqueta (minúsculas, sin espacios):</label>
                <input type="text" id="popup-tag-input" value="${currentName}" maxlength="30">
            `,
            buttons: [
                { text: "Cancelar", class: "" },
                {
                    text: "Guardar",
                    class: "btn-primary",
                    action: () => {
                        const input = document.getElementById("popup-tag-input");
                        const newName = sanitizeTagName(input.value);
                        if (newName) {
                            onSave(newName);
                            setTimeout(() => document.getElementById("contenido-etiqueta")?.focus(), 0);
                        }
                    }
                }
            ],
            focusInput: true
        });

        const input = document.getElementById("popup-tag-input");
        input.addEventListener("input", () => {
            input.value = sanitizeTagName(input.value);
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const newName = sanitizeTagName(input.value);
                if (newName) {
                    onSave(newName);
                    this.close();
                    document.getElementById("contenido-etiqueta")?.focus();
                }
            }
        });
    },

    /** Shows export options (download, share if supported). */
    exportOptions(jsonData) {
        const canShare = navigator.share && navigator.canShare;
        const buttons = [
            {
                text: "Descargar",
                class: "btn-primary",
                action: () => {
                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `mi-prompt-itud-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showEditorFeedback("Datos exportados");
                }
            }
        ];

        if (canShare) {
            buttons.push({
                text: "Compartir",
                class: "",
                action: async () => {
                    try {
                        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
                        const file = new File([blob], "mi-prompt-itud.json", { type: "application/json" });
                        await navigator.share({ files: [file], title: "Mi Prompt-itud" });
                    } catch (e) {
                        console.error("Error sharing:", e);
                    }
                }
            });
        }

        buttons.push({ text: "Cancelar", class: "" });

        this.show({
            title: "Exportar JSON",
            content: "<p>Elige cómo exportar tus datos:</p>",
            buttons
        });
    }
};

// ============================================
// Editor: Tag Management
// ============================================

/** Renders the tag radio buttons in the sidebar and updates content/preview. */
function renderTags() {
    const tagList = document.getElementById("tag-list");
    tagList.innerHTML = "";

    const useIds = state.config.useCorrelativeId;
    const nameCounts = {};
    const nameNextId = {};
    if (useIds) {
        for (const t of state.editor.tags) {
            nameCounts[t.name] = (nameCounts[t.name] || 0) + 1;
        }
    }

    state.editor.tags.forEach((tag, index) => {
        const depth = tag.depth || 0;

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "tag-activa";
        input.id = `tag-${index}`;
        input.className = "tag-choice";
        input.checked = index === state.editor.selectedTagIndex;

        let idAttr = "";
        if (useIds && nameCounts[tag.name] > 1) {
            nameNextId[tag.name] = (nameNextId[tag.name] || 0) + 1;
            idAttr = ` id="${nameNextId[tag.name]}"`;
        }

        const label = document.createElement("label");
        label.setAttribute("for", `tag-${index}`);
        label.textContent = `<${tag.name}${idAttr}>`;
        if (depth > 0) {
            label.style.marginLeft = `${depth * 1.2}rem`;
        }

        input.addEventListener("change", () => {
            state.editor.selectedTagIndex = index;
            updateEditorContent();
            saveState();
        });

        tagList.appendChild(input);
        tagList.appendChild(label);
    });

    updateEditorContent();
    updatePreview();
}

/** Syncs the content editor with the currently selected tag. */
function updateEditorContent() {
    const selectedTag = state.editor.tags[state.editor.selectedTagIndex];
    const labelContenido = document.getElementById("label-contenido");
    const field = document.getElementById("contenido-etiqueta");

    if (selectedTag) {
        labelContenido.textContent = `<${selectedTag.name}>`;
        field.textContent = selectedTag.content;
    } else {
        labelContenido.textContent = "<etiqueta>";
        field.textContent = "";
    }
}

/** Regenerates the XML preview from all tags. */
function updatePreview() {
    document.getElementById("prompt-preview").textContent = formatPromptPreview(state.editor.tags);
}

/** Creates a new tag with a unique name and opens the rename popup. */
function createTag() {
    let newName = "nueva-etiqueta";
    let counter = 1;
    while (state.editor.tags.some(t => t.name === newName)) {
        newName = `nueva-etiqueta-${counter}`;
        counter++;
    }

    const insertAt = state.editor.selectedTagIndex + 1;
    const siblingDepth = state.editor.tags[state.editor.selectedTagIndex]?.depth || 0;
    state.editor.tags.splice(insertAt, 0, { name: newName, content: "", depth: siblingDepth });
    state.editor.selectedTagIndex = insertAt;
    saveState();
    renderTags();

    // Auto-open rename popup with text pre-selected
    popup.editTag(newName, (savedName) => {
        const tag = state.editor.tags[state.editor.selectedTagIndex];
        if (tag && savedName && savedName !== tag.name) {
            tag.name = savedName;
            saveState();
            renderTags();
        }
    });
}

/** Opens the rename popup for the currently selected tag. */
function editSelectedTag() {
    const selectedTag = state.editor.tags[state.editor.selectedTagIndex];
    if (!selectedTag) return;

    popup.editTag(selectedTag.name, (newName) => {
        if (newName && newName !== selectedTag.name) {
            selectedTag.name = newName;
            saveState();
            renderTags();
        }
    });
}

/** Removes the selected tag (minimum 1 tag must remain). */
function deleteSelectedTag() {
    if (state.editor.tags.length <= 1) return;

    state.editor.tags.splice(state.editor.selectedTagIndex, 1);
    state.editor.selectedTagIndex = Math.min(state.editor.selectedTagIndex, state.editor.tags.length - 1);
    saveState();
    renderTags();
}

/** Swaps the selected tag with the one above it. */
function moveTagUp() {
    const idx = state.editor.selectedTagIndex;
    if (idx <= 0) return;

    [state.editor.tags[idx - 1], state.editor.tags[idx]] = [state.editor.tags[idx], state.editor.tags[idx - 1]];
    state.editor.selectedTagIndex = idx - 1;
    saveState();
    renderTags();
}

/** Swaps the selected tag with the one below it. */
function moveTagDown() {
    const idx = state.editor.selectedTagIndex;
    if (idx >= state.editor.tags.length - 1) return;

    [state.editor.tags[idx], state.editor.tags[idx + 1]] = [state.editor.tags[idx + 1], state.editor.tags[idx]];
    state.editor.selectedTagIndex = idx + 1;
    saveState();
    renderTags();
}

/** Increases nesting depth of the selected tag (and its children). */
function nestTagIn() {
    const idx = state.editor.selectedTagIndex;
    const tag = state.editor.tags[idx];
    if (!tag || idx === 0) return;

    const depth = tag.depth || 0;
    const prevDepth = state.editor.tags[idx - 1].depth || 0;
    if (depth >= prevDepth + 1) return;

    tag.depth = depth + 1;
    for (let i = idx + 1; i < state.editor.tags.length; i++) {
        const childDepth = state.editor.tags[i].depth || 0;
        if (childDepth <= depth) break;
        state.editor.tags[i].depth = childDepth + 1;
    }

    saveState();
    renderTags();
}

/** Decreases nesting depth of the selected tag (and its children). */
function nestTagOut() {
    const idx = state.editor.selectedTagIndex;
    const tag = state.editor.tags[idx];
    if (!tag) return;

    const depth = tag.depth || 0;
    if (depth <= 0) return;

    tag.depth = depth - 1;
    for (let i = idx + 1; i < state.editor.tags.length; i++) {
        const childDepth = state.editor.tags[i].depth || 0;
        if (childDepth <= depth) break;
        state.editor.tags[i].depth = childDepth - 1;
    }

    saveState();
    renderTags();
}

// ============================================
// Editor: Save, Clear, Copy, Import/Export
// ============================================

/** Briefly shows a status message in the panel-preview header. */
function showEditorFeedback(message) {
    const el = document.getElementById("editor-feedback");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("is-visible"), 2500);
}

/** Saves or updates a prompt with current editor tags, name, and category. */
function savePrompt() {
    const categoriaNueva = document.getElementById("categoria-nueva").value.trim();
    const categoriaExistente = document.getElementById("categoria-existente").value;
    const category = categoriaNueva || categoriaExistente;
    const title = document.getElementById("prompt-nombre").value.trim() || "Prompt sin título";

    // Register new category if typed manually
    if (categoriaNueva && !state.categories.includes(categoriaNueva)) {
        state.categories.push(categoriaNueva);
        updateCategorySelect();
        renderCategoriesEditor();
    }

    if (state.editor.editingPromptId) {
        const existingPrompt = state.prompts.find(p => p.id === state.editor.editingPromptId);
        if (existingPrompt) {
            existingPrompt.title = title;
            existingPrompt.category = category;
            existingPrompt.tags = JSON.parse(JSON.stringify(state.editor.tags));
            existingPrompt.updatedAt = Date.now();
        }
        showEditorFeedback("Prompt actualizado");
    } else {
        const newId = generateId();
        state.prompts.unshift({
            id: newId,
            title,
            date: getCurrentDate(),
            category,
            tags: JSON.parse(JSON.stringify(state.editor.tags)),
            createdAt: Date.now()
        });
        state.editor.editingPromptId = newId;
        showEditorFeedback("Prompt guardado");
    }

    document.getElementById("categoria-nueva").value = "";
    saveState();
    renderPromptsList();
    updateEditorUI();
}

/** Resets the editor. Uses default tags or a single blank tag based on config. */
function clearEditor() {
    state.editor.tags = getTemplateTags(state.config.template);
    state.editor.selectedTagIndex = 0;
    state.editor.promptName = "";
    state.editor.editingPromptId = null;

    document.getElementById("prompt-nombre").value = "";
    document.getElementById("categoria-nueva").value = "";

    saveState();
    renderTags();
    updateEditorUI();
}

/** Toggles the save button text between "Guardar" and "Actualizar". */
function updateEditorUI() {
    const saveBtn = document.querySelector(".btn-save-editor");
    saveBtn.textContent = state.editor.editingPromptId ? "Actualizar" : "Guardar";
}

/** Copies the full XML prompt to the clipboard. */
function copyEditorPrompt() {
    const text = formatPromptPreview(state.editor.tags);
    navigator.clipboard.writeText(text).catch(e => console.error("Error copying:", e));
}

/** Bundles all app data and opens the export popup. */
function exportData() {
    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        config: state.config,
        editor: state.editor,
        prompts: state.prompts,
        categories: state.categories
    };
    popup.exportOptions(data);
}

/** Triggers the hidden file input for JSON import. */
function importData() {
    document.getElementById("import-file").click();
}

/** Reads a JSON file and merges it into the current state. */
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.prompts) state.prompts = data.prompts;
            if (data.categories) state.categories = data.categories;
            if (data.editor) state.editor = data.editor;
            if (data.config) state.config = data.config;

            saveState();
            updateCategorySelect();
            renderCategoriesEditor();
            renderTags();
            renderPromptsList();
            applySavedConfig();
            showEditorFeedback("Datos importados");
        } catch (err) {
            console.error("Error importing:", err);
            alert("Error al importar el archivo. Verifica que sea un JSON válido.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

// ============================================
// Prompts Tab: List Rendering
// ============================================

/** Re-renders both the "all" and "by category" prompt views. */
function renderPromptsList() {
    renderPromptsAll();
    renderPromptsByCategory();
}

/** Returns prompts sorted by the user's chosen order (A-Z or date). */
function getSortedPrompts() {
    const prompts = [...state.prompts];
    const order = state.config.sortOrder;

    prompts.sort((a, b) => {
        switch (order) {
            case "az-asc": return a.title.localeCompare(b.title);
            case "az-desc": return b.title.localeCompare(a.title);
            case "date-asc": return a.date.localeCompare(b.date);
            case "date-desc":
            default: return b.date.localeCompare(a.date);
        }
    });

    return prompts;
}

/** Renders the flat "all prompts" accordion list. */
function renderPromptsAll() {
    const container = document.getElementById("prompts-list-todos");
    const prompts = getSortedPrompts();

    if (prompts.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay prompts guardados</div>';
        return;
    }

    container.innerHTML = prompts.map((prompt) => `
        <article class="prompt-item">
            <input type="radio" name="prompt-seleccionado" id="prompt-${prompt.id}"
                   class="accordion-input" ${prompt.id === state.selectedPromptId ? "checked" : ""}>
            <label for="prompt-${prompt.id}" class="accordion-label" tabindex="0">
                <span>${escapeHtml(prompt.title)}</span>
                <small>${prompt.date}</small>
            </label>
            <div class="accordion-body">
                <p class="meta-line">Categoría: ${escapeHtml(prompt.category)}</p>
                <pre>${escapeHtml(formatPromptPreview(prompt.tags))}</pre>
            </div>
        </article>
    `).join("");

    container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener("change", () => {
            state.selectedPromptId = input.id.replace("prompt-", "");
            syncPromptSelection();
            saveState();
        });
    });
}

/** Renders prompts grouped under collapsible category headers. */
function renderPromptsByCategory() {
    const container = document.getElementById("prompts-list-categorias");
    const prompts = getSortedPrompts();
    const byCategory = {};

    prompts.forEach(prompt => {
        if (!byCategory[prompt.category]) byCategory[prompt.category] = [];
        byCategory[prompt.category].push(prompt);
    });

    if (Object.keys(byCategory).length === 0) {
        container.innerHTML = '<div class="empty-state">No hay prompts guardados</div>';
        return;
    }

    container.innerHTML = Object.entries(byCategory).map(([category, categoryPrompts]) => `
        <section class="category-item">
            <input type="checkbox" id="cat-${sanitizeTagName(category)}" class="accordion-input category-input">
            <label for="cat-${sanitizeTagName(category)}" class="category-label" tabindex="0">${escapeHtml(category)}</label>
            <div class="category-body">
                ${categoryPrompts.map(prompt => `
                    <article class="prompt-item">
                        <input type="radio" name="prompt-seleccionado-cat" id="prompt-cat-${prompt.id}"
                               class="accordion-input" ${prompt.id === state.selectedPromptId ? "checked" : ""}>
                        <label for="prompt-cat-${prompt.id}" class="accordion-label" tabindex="0">
                            <span>${escapeHtml(prompt.title)}</span>
                            <small>${prompt.date}</small>
                        </label>
                        <div class="accordion-body">
                            <pre>${escapeHtml(formatPromptPreview(prompt.tags))}</pre>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `).join("");

    container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener("change", () => {
            state.selectedPromptId = input.id.replace("prompt-cat-", "");
            syncPromptSelection();
            saveState();
        });
    });
}

/** Keeps the selected prompt radio in sync across both views. */
function syncPromptSelection() {
    document.querySelectorAll('input[name="prompt-seleccionado"]').forEach(input => {
        input.checked = input.id === `prompt-${state.selectedPromptId}`;
    });
    document.querySelectorAll('input[name="prompt-seleccionado-cat"]').forEach(input => {
        input.checked = input.id === `prompt-cat-${state.selectedPromptId}`;
    });
}

// ============================================
// Prompts Tab: Actions
// ============================================

/** Returns the prompt object matching the current selection, or undefined. */
function getSelectedPrompt() {
    return state.prompts.find(p => p.id === state.selectedPromptId);
}

/** Copies the selected prompt's XML to the clipboard. */
function copySelectedPrompt() {
    const prompt = getSelectedPrompt();
    if (!prompt) return;
    navigator.clipboard.writeText(formatPromptPreview(prompt.tags)).catch(e => console.error("Error copying:", e));
}

/** Loads the selected prompt into the editor for editing. */
function editSelectedPrompt() {
    const prompt = getSelectedPrompt();
    if (!prompt) return;

    state.editor.tags = JSON.parse(JSON.stringify(prompt.tags));
    state.editor.selectedTagIndex = 0;
    state.editor.promptName = prompt.title;
    state.editor.editingPromptId = prompt.id;

    // Switch to the Editor tab
    document.getElementById("tab-editor").checked = true;
    document.getElementById("prompt-nombre").value = prompt.title;
    document.getElementById("categoria-nueva").value = "";

    const selectElement = document.getElementById("categoria-existente");
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value === prompt.category) {
            selectElement.selectedIndex = i;
            break;
        }
    }

    saveState();
    renderTags();
    updateEditorUI();
}

/** Asks for confirmation then deletes the selected prompt. */
function deleteSelectedPrompt() {
    const prompt = getSelectedPrompt();
    if (!prompt) return;

    popup.confirm(
        "Eliminar prompt",
        `¿Estás seguro de que quieres eliminar "${prompt.title}"?`,
        () => {
            state.prompts = state.prompts.filter(p => p.id !== state.selectedPromptId);
            state.selectedPromptId = null;
            saveState();
            renderPromptsList();
        }
    );
}

/** Updates sort order and re-renders. */
function setSortOrder(order) {
    state.config.sortOrder = order;
    saveState();
    renderPromptsList();
    updateSortButtons();
}

/** Highlights the active sort button. */
function updateSortButtons() {
    document.querySelectorAll(".btn-sort").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.sort === state.config.sortOrder);
    });
}

// ============================================
// Categories Management
// ============================================

/** Updates the <select> dropdown in the editor with current categories. */
function updateCategorySelect() {
    const select = document.getElementById("categoria-existente");
    select.innerHTML = state.categories.map(cat => `<option>${escapeHtml(cat)}</option>`).join("");
}

/** Populates the categories textarea and resets line origin tracking. */
function renderCategoriesEditor() {
    const textarea = document.getElementById("categories-editor");
    textarea.value = state.categories.join("\n");
    categoryLineOrigins = [...state.categories];
}

/**
 * Handles live editing of the categories textarea.
 * - Non-blank lines become the new categories list.
 * - If a line's text differs from its origin, it's a rename → update prompts.
 * - If a line goes blank, the original category is deleted → move prompts to "Sin categoría".
 * - If lines are removed entirely (fewer than before), same deletion logic applies.
 */
function handleCategoriesInput() {
    const textarea = document.getElementById("categories-editor");
    const lines = textarea.value.split("\n");

    const newCategories = [];
    const newOrigins = [];
    let hadDeletion = false;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        if (trimmed.length > 0) {
            newCategories.push(trimmed);
            const origin = i < categoryLineOrigins.length ? categoryLineOrigins[i] : trimmed;
            newOrigins.push(origin);

            // Rename: line text differs from its tracked origin
            if (origin !== trimmed) {
                for (const prompt of state.prompts) {
                    if (prompt.category === origin) prompt.category = trimmed;
                }
                newOrigins[newOrigins.length - 1] = trimmed;
            }
        } else if (i < categoryLineOrigins.length && categoryLineOrigins[i]) {
            // Blank line where a category used to be → deletion
            const deletedCat = categoryLineOrigins[i];
            for (const prompt of state.prompts) {
                if (prompt.category === deletedCat) prompt.category = DEFAULT_CATEGORY;
            }
            hadDeletion = true;
        }
    }

    // Lines removed entirely (user deleted lines at the end)
    for (let i = lines.length; i < categoryLineOrigins.length; i++) {
        if (categoryLineOrigins[i]) {
            const deletedCat = categoryLineOrigins[i];
            for (const prompt of state.prompts) {
                if (prompt.category === deletedCat) prompt.category = DEFAULT_CATEGORY;
            }
            hadDeletion = true;
        }
    }

    // Ensure fallback category exists after any deletion
    if (hadDeletion && !newCategories.includes(DEFAULT_CATEGORY)) {
        newCategories.push(DEFAULT_CATEGORY);
        newOrigins.push(DEFAULT_CATEGORY);
    }

    state.categories = newCategories;
    categoryLineOrigins = newOrigins;
    saveState();
    updateCategorySelect();
    renderPromptsList();

    // Re-sync textarea if "Sin categoría" was auto-added
    if (hadDeletion) {
        const pos = textarea.selectionStart;
        textarea.value = newCategories.join("\n");
        textarea.selectionStart = textarea.selectionEnd = Math.min(pos, textarea.value.length);
    }
}

// ============================================
// Config: Save & Restore
// ============================================

/** Syncs the Plantillas sub-menu (label + active option) with the saved template. */
function updatePlantillaUI() {
    const current = document.getElementById("config-plantilla-current");
    if (current) current.textContent = TEMPLATE_LABELS[state.config.template] || TEMPLATE_LABELS.str;
    document.querySelectorAll(".config-plantilla-option").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.template === state.config.template);
    });
}

/** Restores UI controls (theme, tab, view mode, sort, template) from saved state. */
function applySavedConfig() {
    document.getElementById(state.config.theme === "claro" ? "tema-claro" : "tema-oscuro").checked = true;
    document.getElementById(state.config.activeTab === "prompts" ? "tab-prompts" : "tab-editor").checked = true;
    document.getElementById(state.config.viewMode === "categorias" ? "vista-categorias" : "vista-todos").checked = true;

    // Migrate old state that used the former startWithDefaultTags/startWithCrea booleans
    if (state.config.template === undefined) {
        const legacy = state.config.startWithDefaultTags ?? state.config.startWithCrea ?? true;
        state.config.template = legacy ? "str" : "vacio";
    }
    updatePlantillaUI();

    if (state.config.useCorrelativeId === undefined) {
        state.config.useCorrelativeId = true;
    }
    document.getElementById("config-id-correlativo").checked = state.config.useCorrelativeId;

    if (state.config.useAutocompletado === undefined) {
        state.config.useAutocompletado = true;
    }
    document.getElementById("config-autocompletado").checked = state.config.useAutocompletado;

    updateSortButtons();
}

/** Attaches change listeners to CSS-only controls so their state persists. */
function saveConfigOnChange() {
    document.querySelectorAll('input[name="tema"]').forEach(input => {
        input.addEventListener("change", () => {
            state.config.theme = input.id.replace("tema-", "");
            saveState();
        });
    });

    document.querySelectorAll('input[name="main-tab"]').forEach(input => {
        input.addEventListener("change", () => {
            state.config.activeTab = input.id.replace("tab-", "");
            saveState();
        });
    });

    document.querySelectorAll('input[name="vista-prompts"]').forEach(input => {
        input.addEventListener("change", () => {
            state.config.viewMode = input.id.replace("vista-", "");
            saveState();
        });
    });
}

// ============================================
// Autocomplete (suggestion chip)
// ============================================

const autocomplete = (() => {
    let chipEl, hintEl, field;
    let currentSuggestion = null;
    let debounceTimer     = null;
    let controller        = null;
    let getContext        = null;

    // Set this to your deployed worker URL after `wrangler deploy`.
    // While null the hardcoded stub is used instead.
    const WORKER_URL = 'https://mi-prompt-itude-predictive-worker.dmfte-dev.workers.dev';

    const DEBOUNCE_MS = 350;
    const MIN_LENGTH  = 20;
    const CURSOR_GAP  = 12;

    function init(fieldEl, chipElement, hintElement, contextFn) {
        field      = fieldEl;
        chipEl     = chipElement;
        hintEl     = hintElement;
        getContext = contextFn;
    }

    function onInput() {
        clearTimeout(debounceTimer);
        hide();

        const text = field.textContent;
        if (text.length < MIN_LENGTH) return;
        if (!/[\w\s.,?!:\n]$/.test(text)) return;

        debounceTimer = setTimeout(dispatch, DEBOUNCE_MS);
    }

    async function dispatch() {
        if (controller) controller.abort();
        controller = new AbortController();
        try {
            const suggestion = await fetchSuggestion(controller.signal);
            if (suggestion) show(suggestion);
        } catch (e) {
            if (e.name !== "AbortError") console.error("Autocomplete error:", e);
        } finally {
            controller = null;
        }
    }

    async function fetchSuggestion(signal) {
        if (!WORKER_URL) {
            await new Promise(r => setTimeout(r, 300));
            if (signal.aborted) return null;
            return "incluyendo pasos específicos y resultados esperados";
        }

        const { text, tagName } = getContext();
        const res = await fetch(WORKER_URL, {
            method:  'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text, tagName })
        });
        if (!res.ok) throw new Error(`Worker ${res.status}`);
        const data = await res.json();
        return data.suggestion || null;
    }

    function show(text) {
        currentSuggestion  = text;
        chipEl.textContent = text;

        const coords = getCaretCoords(field);
        if (!coords) { hide(); return; }

        const containerWidth = field.parentElement.offsetWidth;
        const fieldPadLeft   = parseFloat(getComputedStyle(field).paddingLeft) || 12;
        const inlineLeft     = coords.left + CURSOR_GAP;
        const inlineWidth    = containerWidth - inlineLeft - 8;

        // Measure the suggestion's natural (unconstrained) pixel width
        chipEl.style.maxWidth   = "none";
        chipEl.style.visibility = "hidden";
        chipEl.hidden = false;
        const naturalWidth = chipEl.scrollWidth;
        chipEl.hidden = true;
        chipEl.style.visibility = "";

        const fitsInline = naturalWidth <= inlineWidth;

        chipEl.style.top      = fitsInline ? coords.top + "px"
                                           : (coords.top + coords.height + 2) + "px";
        chipEl.style.left     = fitsInline ? inlineLeft + "px"
                                           : fieldPadLeft + "px";
        chipEl.style.maxWidth = fitsInline ? inlineWidth + "px"
                                           : (containerWidth - fieldPadLeft - 8) + "px";

        chipEl.hidden = false;
        hintEl.hidden = false;
    }

    function hide() {
        currentSuggestion = null;
        chipEl.hidden     = true;
        hintEl.hidden     = true;
    }

    function accept() {
        if (!currentSuggestion) return false;
        document.execCommand("insertText", false, currentSuggestion);
        hide();
        return true;
    }

    function dismiss() { hide(); }

    return { init, onInput, accept, dismiss };
})();

// ============================================
// Contenteditable: plain-text enforcement & block cursor
// ============================================

/**
 * Sets up the contenteditable field so that:
 * - Pasted/dropped content is always stripped to plain text.
 * - Enter inserts a literal newline instead of creating block elements.
 * - Any HTML nodes that slip in are immediately replaced with plain text.
 * - A blinking block cursor tracks the real caret position.
 */
function initContentEditable(field) {
    // --- Block cursor ---
    const cursorEl = document.createElement("div");
    cursorEl.className = "block-cursor";
    cursorEl.hidden = true;
    field.parentElement.appendChild(cursorEl);

    function positionCursor() {
        if (document.activeElement !== field) { cursorEl.hidden = true; return; }
        const coords = getCaretCoords(field);
        if (!coords) { cursorEl.hidden = true; return; }
        cursorEl.hidden = false;
        cursorEl.style.top    = coords.top    + "px";
        cursorEl.style.left   = coords.left   + "px";
        cursorEl.style.height = coords.height + "px";
    }

    document.addEventListener("selectionchange", positionCursor);
    field.addEventListener("focus", positionCursor);
    field.addEventListener("blur",  () => { cursorEl.hidden = true; });
    field.addEventListener("scroll", positionCursor);

    // --- Plain text only ---

    // Paste: strip formatting, insert as plain text
    field.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text/plain");
        document.execCommand("insertText", false, text);
    });

    // Enter: insert a literal \n via execCommand so the existing text node is
    // extended in-place — no textContent rewrite, no manual caret placement,
    // no manual input dispatch. The browser handles all of that correctly.
    // With contenteditable="plaintext-only" (set in init) this is guaranteed
    // to stay a plain text node; the sanitizer below is a fallback for browsers
    // that don't support plaintext-only (Firefox etc.).
    field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            document.execCommand("insertText", false, "\n");
        }
    });

    // Drop: strip formatting
    field.addEventListener("drop", (e) => {
        e.preventDefault();
        const text = e.dataTransfer.getData("text/plain");
        document.execCommand("insertText", false, text);
    });

    // Defensive sanitizer: if any non-text node sneaks in, flatten to innerText
    field.addEventListener("input", () => {
        const hasNonText = [...field.childNodes].some(n => n.nodeType !== Node.TEXT_NODE);
        if (!hasNonText) return;

        const sel = window.getSelection();
        let caretOffset = -1;

        if (sel && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            if (field.contains(range.startContainer)) {
                // range.toString() ignores the \n that innerText adds between block
                // elements (e.g. <div> wrappers Chrome creates after a bare \n),
                // so the old caretOffset landed on the previous visual line.
                // Insert a sentinel at the caret so its position survives flattening.
                const marker = document.createTextNode('');
                const r = range.cloneRange();
                r.collapse(true);
                r.insertNode(marker);
                const flat = field.innerText;
                caretOffset = flat.indexOf('');
                marker.remove();
                field.textContent = flat.replace('', '');
            }
        }

        if (caretOffset < 0) {
            field.textContent = field.innerText;
            return;
        }

        const textNode = field.firstChild;
        if (textNode) {
            const r = document.createRange();
            r.setStart(textNode, Math.min(caretOffset, textNode.length));
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
        }
    });
}

// ============================================
// Initialization
// ============================================

function init() {
    popup.init();

    // Migrate legacy state missing newer fields
    if (state.editor.editingPromptId === undefined) {
        state.editor.editingPromptId = null;
        state.editor.promptName = "";
    }
    state.editor.tags.forEach(t => { if (t.depth === undefined) t.depth = 0; });

    // Initial render
    renderTags();
    renderPromptsList();
    updateCategorySelect();
    renderCategoriesEditor();
    applySavedConfig();
    saveConfigOnChange();
    updateEditorUI();

    if (state.editor.promptName) {
        document.getElementById("prompt-nombre").value = state.editor.promptName;
    }

    // --- Editor event listeners ---
    const contentField = document.getElementById("contenido-etiqueta");

    // Upgrade to plaintext-only if the browser supports it (Chrome 94+, Safari 16.4+).
    // This prevents the browser from normalizing \n-terminated content into <div> blocks,
    // which caused the caret to jump back to the previous line after pressing Enter.
    // Falls back to contenteditable="true" (with the sanitizer) on Firefox etc.
    contentField.contentEditable = 'plaintext-only';
    if (contentField.contentEditable !== 'plaintext-only') {
        contentField.contentEditable = 'true';
    }

    initContentEditable(contentField);

    autocomplete.init(
        contentField,
        document.getElementById("suggestion-chip"),
        document.getElementById("suggestion-hint"),
        () => ({
            text:    contentField.textContent,
            tagName: state.editor.tags[state.editor.selectedTagIndex]?.name || "tag"
        })
    );

    contentField.addEventListener("input", () => {
        const selectedTag = state.editor.tags[state.editor.selectedTagIndex];
        if (selectedTag) {
            selectedTag.content = contentField.textContent;
            updatePreview();
            saveState();
        }
        if (state.config.useAutocompletado) autocomplete.onInput();
    });

    contentField.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            if (autocomplete.accept()) e.preventDefault();
        } else if (!["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) {
            autocomplete.dismiss();
        }
    });

    document.getElementById("prompt-nombre").addEventListener("input", (e) => {
        state.editor.promptName = e.target.value;
        saveState();
    });

    document.querySelector(".btn-create-tag").addEventListener("click", createTag);
    document.querySelector(".btn-edit-tag").addEventListener("click", editSelectedTag);
    document.querySelector(".btn-delete-tag").addEventListener("click", deleteSelectedTag);
    document.querySelector(".btn-move-up").addEventListener("click", moveTagUp);
    document.querySelector(".btn-move-down").addEventListener("click", moveTagDown);
    document.querySelector(".btn-nest-out").addEventListener("click", nestTagOut);
    document.querySelector(".btn-nest-in").addEventListener("click", nestTagIn);

    document.querySelector(".btn-save-editor").addEventListener("click", savePrompt);
    document.querySelector(".btn-new-editor").addEventListener("click", clearEditor);
    document.querySelector(".btn-copy-editor").addEventListener("click", copyEditorPrompt);
    document.querySelector(".btn-export-editor").addEventListener("click", exportData);
    document.querySelector(".btn-import-editor").addEventListener("click", importData);
    document.getElementById("import-file").addEventListener("change", handleImport);

    // --- Prompts tab event listeners ---
    document.querySelector(".btn-copy-prompts").addEventListener("click", copySelectedPrompt);
    document.querySelector(".btn-edit-prompts").addEventListener("click", editSelectedPrompt);
    document.querySelector(".btn-delete-prompts").addEventListener("click", deleteSelectedPrompt);

    document.querySelectorAll(".btn-sort").forEach(btn => {
        btn.addEventListener("click", () => setSortOrder(btn.dataset.sort));
    });

    document.getElementById("categories-editor").addEventListener("input", handleCategoriesInput);

    // --- Config menu event listeners ---
    const configToggle = document.querySelector(".btn-config-toggle");
    const configDropdown = document.querySelector(".config-dropdown");

    configToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        configDropdown.classList.toggle("is-open");
    });

    // Prevent clicks inside the dropdown from closing it
    configDropdown.addEventListener("click", (e) => e.stopPropagation());

    // Close dropdown when clicking anywhere else
    document.addEventListener("click", () => configDropdown.classList.remove("is-open"));

    document.querySelectorAll(".config-plantilla-option").forEach((btn) => {
        btn.addEventListener("click", () => {
            state.config.template = btn.dataset.template;
            updatePlantillaUI();
            saveState();
        });
    });

    document.getElementById("config-id-correlativo").addEventListener("change", (e) => {
        state.config.useCorrelativeId = e.target.checked;
        saveState();
        updatePreview();
    });

    document.getElementById("config-autocompletado").addEventListener("change", (e) => {
        state.config.useAutocompletado = e.target.checked;
        saveState();
        if (!e.target.checked) autocomplete.dismiss();
    });

    document.querySelector(".btn-reset-storage").addEventListener("click", () => {
        configDropdown.classList.remove("is-open");
        localStorage.removeItem(STORAGE_KEY);
        popup.show({
            title: "Datos borrados",
            content: "<p>Información de la página ha sido borrada del navegador. Para volver a crearla, vuelva a cargar la página.</p>",
            buttons: [
                { text: "Cancelar", class: "" },
                { text: "Refrescar", class: "btn-primary", action: () => location.reload(), close: false }
            ]
        });
    });
}

document.addEventListener("DOMContentLoaded", init);
