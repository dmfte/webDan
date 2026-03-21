"use strict";

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "mi-prompt-itud";
const DEFAULT_CATEGORY = "Sin categoría";

// Cloudflare Worker URL for AI assistant proxy
const AI_API_URL = "https://mi-prompt-itud-api.dmfte-dev.workers.dev";

// ============================================
// Default State
// ============================================

const defaultState = {
    config: {
        activeTab: "editor",
        sortOrder: "date-desc",
        viewMode: "todos",
        theme: "oscuro",
        startWithCrea: true
    },
    editor: {
        tags: [
            { name: "contexto", content: "Estoy creando una app estática para organizar prompts en formato XML." },
            { name: "rol", content: "Eres un coach de productividad que habla como si estuviera compilando ideas en tiempo real." },
            { name: "especificidad", content: "Responde con pasos accionables, tono claro, y una lista final de errores comunes." },
            { name: "acciones", content: "1) Analiza mi objetivo. 2) Sugiere un plan de 7 días. 3) Incluye una rutina de revisión rápida diaria." }
        ],
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

/** Formats an array of tags into XML-like preview text. */
function formatPromptPreview(tags) {
    return tags.map(tag => `<${tag.name}>\n${tag.content}\n</${tag.name}>`).join("\n");
}

/** Returns today's date as YYYY-MM-DD. */
function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
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

    state.editor.tags.forEach((tag, index) => {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "tag-activa";
        input.id = `tag-${index}`;
        input.className = "tag-choice";
        input.checked = index === state.editor.selectedTagIndex;

        const label = document.createElement("label");
        label.setAttribute("for", `tag-${index}`);
        label.textContent = `<${tag.name}>`;

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

    state.editor.tags.push({ name: newName, content: "" });
    state.editor.selectedTagIndex = state.editor.tags.length - 1;
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

/** Resets the editor. Uses CREA tags or a single blank tag based on config. */
function clearEditor() {
    if (state.config.startWithCrea) {
        state.editor.tags = [
            { name: "contexto", content: "" },
            { name: "rol", content: "" },
            { name: "especificidad", content: "" },
            { name: "acciones", content: "" }
        ];
    } else {
        state.editor.tags = [{ name: "nueva-etiqueta", content: "" }];
    }
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

/** Restores UI controls (theme, tab, view mode, sort, CREA toggle) from saved state. */
function applySavedConfig() {
    document.getElementById(state.config.theme === "claro" ? "tema-claro" : "tema-oscuro").checked = true;
    document.getElementById(state.config.activeTab === "prompts" ? "tab-prompts" : "tab-editor").checked = true;
    document.getElementById(state.config.viewMode === "categorias" ? "vista-categorias" : "vista-todos").checked = true;

    // Migrate old state that may lack startWithCrea
    if (state.config.startWithCrea === undefined) state.config.startWithCrea = true;
    document.getElementById("config-crea").checked = state.config.startWithCrea;

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
// AI Assistant
// ============================================

/** Enables/disables the AI send button based on whether any option is checked. */
function updateAiButtonState() {
    const checkboxes = document.querySelectorAll(".ai-option");
    const sendBtn = document.querySelector(".btn-ai-send");
    sendBtn.disabled = !Array.from(checkboxes).some(cb => cb.checked);
}

/** Updates the AI status message (normal or error style). */
function setAiStatus(message, isError = false) {
    const status = document.getElementById("ai-status");
    status.textContent = message;
    status.style.color = isError ? "var(--danger)" : "var(--muted)";
}

/** Extracts XML-like tags from a plain-text response. */
function parseXmlTags(text) {
    const tags = [];
    const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        tags.push({ name: match[1].toLowerCase(), content: match[2].trim() });
    }
    return tags;
}

/** Sends the current prompt to the Cloudflare Worker and applies the AI response. */
async function sendToAI() {
    const sendBtn = document.querySelector(".btn-ai-send");
    const currentPrompt = formatPromptPreview(state.editor.tags);

    if (!currentPrompt.trim()) {
        setAiStatus("El prompt está vacío", true);
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Procesando...";
    setAiStatus("Enviando a Claude...");

    try {
        const response = await fetch(AI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: currentPrompt,
                options: {
                    crea: document.getElementById("ai-crea").checked,
                    example: document.getElementById("ai-example").checked,
                    econTokens: document.getElementById("ai-econ-tokens").checked,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const details = errorData.details ? `: ${errorData.details}` : "";
            throw new Error((errorData.error || `Error ${response.status}`) + details);
        }

        const data = await response.json();
        if (!data.result) throw new Error("Respuesta vacía del servidor");

        const parsedTags = parseXmlTags(data.result);
        if (parsedTags.length === 0) throw new Error("No se pudieron extraer etiquetas de la respuesta");

        state.editor.tags = parsedTags;
        state.editor.selectedTagIndex = 0;
        saveState();
        renderTags();
        setAiStatus(`Prompt optimizado con ${parsedTags.length} etiquetas`);

    } catch (error) {
        console.error("AI Error:", error);
        setAiStatus(`Error: ${error.message}`, true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Enviar";
        updateAiButtonState();
    }
}

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
        if (document.activeElement !== field) {
            cursorEl.hidden = true;
            return;
        }
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) { cursorEl.hidden = true; return; }

        const range = sel.getRangeAt(0);
        if (!field.contains(range.startContainer)) { cursorEl.hidden = true; return; }

        const r = range.cloneRange();
        r.collapse(true);
        let caretRect = r.getBoundingClientRect();

        // Fallback when rect is zero (caret after newline, start of empty line, empty field)
        if (!caretRect.height) {
            const fieldRect = field.getBoundingClientRect();
            const style = getComputedStyle(field);
            // If caret is after a newline, get the rect of the newline char and place
            // the cursor on the line below it (handles trailing \n and empty mid-lines).
            if (range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
                const testRange = document.createRange();
                testRange.setStart(range.startContainer, range.startOffset - 1);
                testRange.setEnd(range.startContainer, range.startOffset);
                const testRect = testRange.getBoundingClientRect();
                if (testRect.height) {
                    caretRect = {
                        top: testRect.bottom,
                        left: fieldRect.left + parseFloat(style.paddingLeft),
                        height: testRect.height
                    };
                }
            }
            // Final fallback: top-left of field (empty field or unresolvable position)
            if (!caretRect.height) {
                caretRect = {
                    top: fieldRect.top + parseFloat(style.paddingTop),
                    left: fieldRect.left + parseFloat(style.paddingLeft),
                    height: parseFloat(style.fontSize) * parseFloat(style.lineHeight) || 20
                };
            }
        }

        const containerRect = field.parentElement.getBoundingClientRect();
        cursorEl.hidden = false;
        cursorEl.style.top  = (caretRect.top  - containerRect.top)  + "px";
        cursorEl.style.left = (caretRect.left - containerRect.left) + "px";
        cursorEl.style.height = caretRect.height + "px";
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

    // Enter: insert a literal \n by rewriting textContent so the field always stays
    // as a single text node. range.insertNode splits text nodes, leaving the caret
    // in an empty sibling at offset 0 where positionCursor's look-back can't help.
    field.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);

            // Measure offsets in the whole textContent before touching the DOM
            const preStart = document.createRange();
            preStart.selectNodeContents(field);
            preStart.setEnd(range.startContainer, range.startOffset);
            const startOff = preStart.toString().length;

            let endOff = startOff;
            if (!range.collapsed) {
                const preEnd = document.createRange();
                preEnd.selectNodeContents(field);
                preEnd.setEnd(range.endContainer, range.endOffset);
                endOff = preEnd.toString().length;
            }

            // Replace selection (if any) with a single \n, keeping one text node
            const old = field.textContent;
            field.textContent = old.slice(0, startOff) + "\n" + old.slice(endOff);

            // Place caret right after the inserted \n
            const textNode = field.firstChild;
            if (textNode) {
                const r = document.createRange();
                r.setStart(textNode, startOff + 1);
                r.collapse(true);
                sel.removeAllRanges();
                sel.addRange(r);
            }

            field.dispatchEvent(new InputEvent("input", { bubbles: true }));
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

        // Measure caret offset (character count from field start) before touching the DOM
        const sel = window.getSelection();
        let caretOffset = 0;
        if (sel && sel.rangeCount && field.contains(sel.getRangeAt(0).startContainer)) {
            const pre = document.createRange();
            pre.selectNodeContents(field);
            pre.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
            caretOffset = pre.toString().length;
        }

        field.textContent = field.innerText;

        // Restore caret to the same character offset
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
    initContentEditable(contentField);

    contentField.addEventListener("input", () => {
        const selectedTag = state.editor.tags[state.editor.selectedTagIndex];
        if (selectedTag) {
            selectedTag.content = contentField.textContent;
            updatePreview();
            saveState();
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

    document.getElementById("config-crea").addEventListener("change", (e) => {
        state.config.startWithCrea = e.target.checked;
        saveState();
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

    // --- AI event listeners ---
    document.querySelectorAll(".ai-option").forEach(cb => cb.addEventListener("change", updateAiButtonState));
    document.querySelector(".btn-ai-send").addEventListener("click", sendToAI);
    updateAiButtonState();
}

document.addEventListener("DOMContentLoaded", init);
