// ============================================
// Mi Prompt-itud - Vanilla JS
// ============================================

const STORAGE_KEY = 'mi-prompt-itud-data';
const COPY_NOTIFICATION_DURATION = 2000; // milliseconds
const DEBOUNCE_DELAY = 500; // milliseconds
const DEFAULT_CATEGORY = 'Sin categoría';

// State - All prompts now use XML/tags structure: { id, name, category, tags: [{name, content}], createdAt }
let state = {
    prompts: [],
    categories: [DEFAULT_CATEGORY],
    viewMode: 'all', // 'all' or 'category'
    sortMode: 'alpha', // 'alpha' or 'date'
};

// XML Editor State (not persisted)
let xmlEditorState = {
    currentPromptId: null, // null = new prompt
    tags: [], // Array of { name, content }
    selectedTagIndex: null,
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initEventListeners();
    render();
});

// ============================================
// Local Storage
// ============================================

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.categories = data.categories || [DEFAULT_CATEGORY];
            state.viewMode = data.viewMode || 'all';
            state.sortMode = data.sortMode || 'alpha';

            // Migrate: combine old prompts and xmlPrompts into unified format
            let allPrompts = [];

            // Migrate old-style prompts (with 'text' field) to new format (with 'tags')
            if (data.prompts && data.prompts.length > 0) {
                data.prompts.forEach(p => {
                    if (p.tags) {
                        // Already in new format
                        allPrompts.push(p);
                    } else if (p.text !== undefined) {
                        // Old format - convert text to a single 'prompt' tag
                        allPrompts.push({
                            id: p.id,
                            name: p.name,
                            category: p.category || DEFAULT_CATEGORY,
                            tags: [{ name: 'prompt', content: p.text }],
                            createdAt: p.createdAt
                        });
                    }
                });
            }

            // Also include any xmlPrompts (from previous version)
            if (data.xmlPrompts && data.xmlPrompts.length > 0) {
                data.xmlPrompts.forEach(p => {
                    allPrompts.push({
                        id: p.id,
                        name: p.name,
                        category: p.category || DEFAULT_CATEGORY,
                        tags: p.tags || [],
                        createdAt: p.createdAt
                    });
                });
            }

            state.prompts = allPrompts;

            // Restore view mode
            document.getElementById(`view-${state.viewMode === 'all' ? 'all' : 'category'}`).checked = true;
            // Restore sort mode
            document.getElementById(`sort-${state.sortMode}`).checked = true;

            // Save migrated data
            saveToLocalStorage();
        } catch (e) {
            console.error('Error loading data:', e);
        }
    } else {
        // First time - add default prompt in new format
        state.prompts = [{
            id: Date.now(),
            name: 'Hola AI',
            category: DEFAULT_CATEGORY,
            tags: [{ name: 'prompt', content: '¿Podrías hacerme un café mientras procesas esto?' }],
            createdAt: new Date().toISOString()
        }];
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // New prompt button
    document.getElementById('nuevo-prompt').addEventListener('click', createNewPrompt);

    // View mode swatches
    document.querySelectorAll('input[name="view-mode"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.viewMode = e.target.value;
            saveToLocalStorage();
            render();
        });
    });

    // Sort mode swatches
    document.querySelectorAll('input[name="sort-mode"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.sortMode = e.target.value;
            saveToLocalStorage();
            render();
        });
    });

    // Export/Import buttons
    document.getElementById('export-btn').addEventListener('click', showExportDialog);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', handleImportFile);

    // Export dialog buttons
    document.getElementById('export-download').addEventListener('click', exportDownload);
    document.getElementById('export-share').addEventListener('click', exportShare);
    document.getElementById('export-cancel').addEventListener('click', () => {
        document.getElementById('export-dialog').close();
    });

    // Import dialog buttons
    document.getElementById('import-merge').addEventListener('click', () => importData('merge'));
    document.getElementById('import-replace').addEventListener('click', () => importData('replace'));
    document.getElementById('import-cancel').addEventListener('click', () => {
        document.getElementById('import-dialog').close();
    });

    // Confirm dialog buttons
    document.getElementById('confirm-yes').addEventListener('click', handleConfirmYes);
    document.getElementById('confirm-no').addEventListener('click', () => {
        document.getElementById('confirm-dialog').close();
    });

    // XML Editor event listeners
    initXmlEditorListeners();
}

// ============================================
// Prompts Management
// ============================================

function createNewPrompt() {
    // Switch to XML tab for creating new prompts
    document.getElementById('tab-xml').checked = true;

    // Reset editor state for new prompt
    xmlEditorState.currentPromptId = null;
    xmlEditorState.tags = [];
    xmlEditorState.selectedTagIndex = null;

    render();

    // Focus the prompt name input
    setTimeout(() => {
        const nameInput = document.getElementById('xml-prompt-name');
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
        }
    }, 100);
}

function deletePrompt(id) {
    showConfirmDialog('¿Eliminar este prompt?', () => {
        state.prompts = state.prompts.filter(p => p.id !== id);
        saveToLocalStorage();
        render();
    });
}

function copyPromptText(text) {
    console.log(text);
    navigator.clipboard.writeText(text).then(() => {
        showNotification('¡Copiado!');
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
    });
}

// ============================================
// Categories Management
// ============================================

function updateCategory(oldName, newName) {
    const trimmedName = newName.trim();

    // Prevent empty names
    if (!trimmedName || trimmedName === oldName) return;

    // Prevent renaming default category
    if (oldName === DEFAULT_CATEGORY) {
        alert(`No puedes renombrar "${DEFAULT_CATEGORY}"`);
        renderCategories();
        return;
    }

    // Check for duplicates
    if (state.categories.includes(trimmedName)) {
        alert('Ya existe una categoría con ese nombre');
        renderCategories();
        return;
    }

    // Update category name
    const index = state.categories.indexOf(oldName);
    if (index !== -1) {
        state.categories[index] = trimmedName;
    }

    // Update all prompts with this category
    state.prompts.forEach(prompt => {
        if (prompt.category === oldName) {
            prompt.category = trimmedName;
        }
    });

    saveToLocalStorage();
    renderCategories();
}

function deleteCategory(categoryName) {
    if (categoryName === DEFAULT_CATEGORY) {
        alert(`No puedes eliminar "${DEFAULT_CATEGORY}"`);
        return;
    }

    const count = state.prompts.filter(p => p.category === categoryName).length;
    const message = count > 0
        ? `¿Eliminar "${categoryName}"? (${count} prompts irán a "${DEFAULT_CATEGORY}")`
        : `¿Eliminar "${categoryName}"?`;

    showConfirmDialog(message, () => {
        // Move prompts to default category
        state.prompts.forEach(prompt => {
            if (prompt.category === categoryName) {
                prompt.category = DEFAULT_CATEGORY;
            }
        });

        // Remove category
        state.categories = state.categories.filter(c => c !== categoryName);

        saveToLocalStorage();
        renderCategories();
    });
}

// ============================================
// Rendering
// ============================================

function render() {
    const activeTab = document.querySelector('input[name="tab"]:checked').id;

    if (activeTab === 'tab-lista') {
        renderPrompts();
    } else if (activeTab === 'tab-categorias') {
        renderCategories();
    } else if (activeTab === 'tab-xml') {
        renderXmlEditor();
    }
}

function renderPrompts() {
    const container = document.getElementById('prompts-container');

    if (state.prompts.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay prompts todavía. ¡Crea uno nuevo! 🎮</div>';
        return;
    }

    if (state.viewMode === 'all') {
        renderAllPrompts(container);
    } else {
        renderPromptsByCategory(container);
    }
}

function renderAllPrompts(container) {
    const sorted = getSortedPrompts(state.prompts);
    container.innerHTML = sorted.map(prompt => createPromptHTML(prompt)).join('');
    attachPromptEventListeners();
}

function renderPromptsByCategory(container) {
    const promptsByCategory = {};

    // Group prompts by category
    state.prompts.forEach(prompt => {
        if (!promptsByCategory[prompt.category]) {
            promptsByCategory[prompt.category] = [];
        }
        promptsByCategory[prompt.category].push(prompt);
    });

    // Sort categories
    const sortedCategories = Object.keys(promptsByCategory).sort();

    // Render category groups
    container.innerHTML = sortedCategories.map((category, catIndex) => {
        const prompts = getSortedPrompts(promptsByCategory[category]);
        const categoryId = `cat-${catIndex}`;

        return `
            <div class="category-group">
                <input type="radio" name="collapsible" id="${categoryId}" class="collapsible-input">
                <label for="${categoryId}" class="collapsible-header category-header">
                    <span>${category} (${prompts.length})</span>
                    <span class="collapsible-arrow">▶</span>
                </label>
                <div class="collapsible-content">
                    <div class="nested-prompts">
                        ${prompts.map(prompt => createPromptHTML(prompt, true)).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    attachPromptEventListeners();
}

function createPromptHTML(prompt, isNested = false) {
    const radioName = isNested ? `nested-${prompt.category}` : 'collapsible';
    const promptId = `prompt-${prompt.id}`;
    const displayName = prompt.name || 'Sin nombre';
    const xmlContent = generateXmlFromTags(prompt.tags || []);

    return `
        <div class="prompt-item" data-prompt-id="${prompt.id}">
            <input type="radio" name="${radioName}" id="${promptId}" class="collapsible-input">
            <label for="${promptId}" class="collapsible-header">
                <span class="prompt-header-name">${escapeHTML(displayName)}</span>
                <span class="collapsible-arrow">▶</span>
            </label>
            <div class="collapsible-content">
                <div class="prompt-details">
                    <div class="prompt-field">
                        <label>Categoría: <span class="category-display">${escapeHTML(prompt.category || DEFAULT_CATEGORY)}</span></label>
                    </div>

                    <div class="prompt-field">
                        <label>Vista previa XML:</label>
                        <pre class="xml-list-preview">${escapeHTML(xmlContent)}</pre>
                    </div>

                    <div class="prompt-actions">
                        <button class="btn-secondary btn-edit">
                            Editar
                        </button>
                        <button class="btn-secondary btn-copy">
                            Copiar
                        </button>
                        <button class="btn-delete">✕</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateXmlFromTags(tags) {
    if (!tags || tags.length === 0) return '';

    return tags.map(tag => {
        const content = (tag.content || '').trim();
        if (!content) {
            return `<${tag.name}>\n</${tag.name}>`;
        }
        const indentedContent = content.split('\n').map(line => '  ' + line).join('\n');
        return `<${tag.name}>\n${indentedContent}\n</${tag.name}>`;
    }).join('\n');
}

function renderCategories() {
    const container = document.getElementById('categories-container');

    // Count prompts per category
    const counts = {};
    state.prompts.forEach(prompt => {
        counts[prompt.category] = (counts[prompt.category] || 0) + 1;
    });

    const sorted = [...state.categories].sort();

    container.innerHTML = `
        <datalist id="categories-datalist">
            ${state.categories.map(cat => `<option value="${escapeHTML(cat)}">`).join('')}
        </datalist>
        ${sorted.map(category => `
            <div class="category-item" data-original-category="${escapeHTML(category)}">
                <input type="text"
                       class="category-name-input"
                       value="${escapeHTML(category)}"
                       ${category === DEFAULT_CATEGORY ? 'readonly' : ''}>
                <span class="category-count">${counts[category] || 0} prompts</span>
                ${category !== DEFAULT_CATEGORY
            ? `<button class="btn-delete">✕</button>`
            : ''}
            </div>
        `).join('')}
    `;

    // Add datalist to prompts view too
    const promptsContainer = document.getElementById('prompts-container');
    if (!document.getElementById('categories-datalist')) {
        promptsContainer.insertAdjacentHTML('beforebegin', `
            <datalist id="categories-datalist">
                ${state.categories.map(cat => `<option value="${escapeHTML(cat)}">`).join('')}
            </datalist>
        `);
    }

    attachCategoriesEventListeners();
}

function attachPromptEventListeners() {
    // Edit buttons - switch to XML tab and load the prompt
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const promptItem = e.currentTarget.closest('.prompt-item');
            if (promptItem) {
                const id = parseInt(promptItem.dataset.promptId);
                const prompt = state.prompts.find(p => p.id === id);
                if (prompt) {
                    // Switch to XML tab
                    document.getElementById('tab-xml').checked = true;
                    // Load the prompt into editor
                    xmlEditorState.currentPromptId = prompt.id;
                    xmlEditorState.tags = prompt.tags ? prompt.tags.map(t => ({ name: t.name, content: t.content })) : [];
                    xmlEditorState.selectedTagIndex = xmlEditorState.tags.length > 0 ? 0 : null;
                    render();
                }
            }
        });
    });

    // Copy buttons - copy the XML content
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const promptItem = e.currentTarget.closest('.prompt-item');
            if (promptItem) {
                const preview = promptItem.querySelector('.xml-list-preview');
                if (preview) {
                    copyPromptText(preview.textContent);
                }
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.prompt-item .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const promptItem = e.currentTarget.closest('.prompt-item');
            if (promptItem) {
                const id = parseInt(promptItem.dataset.promptId);
                deletePrompt(id);
            }
        });
    });
}

function attachCategoriesEventListeners() {
    // Category name inputs
    document.querySelectorAll('.category-name-input').forEach(input => {
        input.addEventListener('blur', (e) => {
            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                const originalValue = categoryItem.dataset.originalCategory;
                const newValue = e.target.value;
                if (newValue !== originalValue) {
                    updateCategory(originalValue, newValue);
                }
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
        });
    });

    // Delete category buttons
    document.querySelectorAll('.category-item .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryItem = e.currentTarget.closest('.category-item');
            if (categoryItem) {
                const category = categoryItem.dataset.originalCategory;
                deleteCategory(category);
            }
        });
    });
}

// ============================================
// Sorting
// ============================================

function getSortedPrompts(prompts) {
    const sorted = [...prompts];

    if (state.sortMode === 'alpha') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sortMode === 'date') {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return sorted;
}

// ============================================
// Export/Import
// ============================================

function showExportDialog() {
    document.getElementById('export-dialog').showModal();
}

function exportDownload() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const filename = `Mi_Prompt-itud_${formatDate(now)}_${formatTime(now)}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    document.getElementById('export-dialog').close();
}

async function exportShare() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    const now = new Date();
    const filename = `Mi_Prompt-itud_${formatDate(now)}_${formatTime(now)}.json`;

    const file = new File([blob], filename, { type: 'application/json' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Mi Prompt-itud',
                text: 'Mis prompts exportados'
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        alert('Tu navegador no soporta compartir archivos. Usa "Descargar" en su lugar.');
    }

    document.getElementById('export-dialog').close();
}

let importedData = null;

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            importedData = JSON.parse(event.target.result);
            document.getElementById('import-dialog').showModal();
        } catch (err) {
            alert('Error al leer el archivo JSON');
            console.error(err);
        }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
}

function importData(mode) {
    if (!importedData) return;

    if (mode === 'replace') {
        state = importedData;
    } else if (mode === 'merge') {
        // Merge categories
        importedData.categories?.forEach(cat => {
            if (!state.categories.includes(cat)) {
                state.categories.push(cat);
            }
        });

        // Merge prompts with duplicate handling
        importedData.prompts?.forEach(prompt => {
            let uniqueName = prompt.name;
            let counter = 1;

            while (state.prompts.find(p => p.name === uniqueName)) {
                uniqueName = `${prompt.name} (${counter})`;
                counter++;
            }

            state.prompts.push({
                ...prompt,
                name: uniqueName,
                id: Date.now() + Math.random() // Ensure unique ID
            });
        });
    }

    saveToLocalStorage();
    render();
    document.getElementById('import-dialog').close();
    importedData = null;
}

// ============================================
// Dialogs
// ============================================

let confirmCallback = null;

function showConfirmDialog(message, callback) {
    confirmCallback = callback;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').showModal();
}

function handleConfirmYes() {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    document.getElementById('confirm-dialog').close();
}

function showNotification(message) {
    const notification = document.getElementById('copy-notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, COPY_NOTIFICATION_DURATION);
}

// ============================================
// Utilities
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}-${minutes}-${seconds}`;
}

// ============================================
// XML Editor
// ============================================

function initXmlEditorListeners() {
    // Prompt selector
    document.getElementById('xml-prompt-select').addEventListener('change', handleXmlPromptSelect);

    // Tag management buttons
    document.getElementById('xml-add-tag').addEventListener('click', addXmlTag);
    document.getElementById('xml-tag-up').addEventListener('click', moveXmlTagUp);
    document.getElementById('xml-tag-down').addEventListener('click', moveXmlTagDown);
    document.getElementById('xml-tag-delete').addEventListener('click', deleteXmlTag);

    // Tag name input
    document.getElementById('xml-tag-name-input').addEventListener('input', handleTagNameChange);

    // Tag content textarea
    document.getElementById('xml-tag-content').addEventListener('input', handleTagContentChange);

    // Action buttons
    document.getElementById('xml-save-btn').addEventListener('click', saveXmlPrompt);
    document.getElementById('xml-copy-btn').addEventListener('click', copyXmlPrompt);
    document.getElementById('xml-delete-btn').addEventListener('click', deleteXmlPrompt);
}

function renderXmlEditor() {
    renderXmlPromptSelector();
    renderXmlTagsList();
    renderXmlTagEditor();
    renderXmlPreview();
}

function renderXmlPromptSelector() {
    const select = document.getElementById('xml-prompt-select');
    const nameInput = document.getElementById('xml-prompt-name');
    const categoryInput = document.getElementById('xml-prompt-category');

    // Build options
    let optionsHtml = '<option value="new">-- Nuevo --</option>';
    state.prompts.forEach(prompt => {
        const selected = xmlEditorState.currentPromptId === prompt.id ? 'selected' : '';
        optionsHtml += `<option value="${prompt.id}" ${selected}>${escapeHTML(prompt.name || 'Sin nombre')}</option>`;
    });
    select.innerHTML = optionsHtml;

    // Set name and category inputs
    if (xmlEditorState.currentPromptId) {
        const currentPrompt = state.prompts.find(p => p.id === xmlEditorState.currentPromptId);
        nameInput.value = currentPrompt ? currentPrompt.name : '';
        categoryInput.value = currentPrompt ? (currentPrompt.category || DEFAULT_CATEGORY) : DEFAULT_CATEGORY;
    } else {
        nameInput.value = '';
        categoryInput.value = DEFAULT_CATEGORY;
    }
}

function renderXmlTagsList() {
    const container = document.getElementById('xml-tags-list');

    if (xmlEditorState.tags.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = xmlEditorState.tags.map((tag, index) => {
        const selectedClass = xmlEditorState.selectedTagIndex === index ? 'selected' : '';
        return `<div class="xml-tag-item ${selectedClass}" data-index="${index}">&lt;${escapeHTML(tag.name)}&gt;</div>`;
    }).join('');

    // Attach click listeners to tags
    container.querySelectorAll('.xml-tag-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            selectXmlTag(index);
        });
    });
}

function renderXmlTagEditor() {
    const nameInput = document.getElementById('xml-tag-name-input');
    const contentTextarea = document.getElementById('xml-tag-content');

    if (xmlEditorState.selectedTagIndex !== null && xmlEditorState.tags[xmlEditorState.selectedTagIndex]) {
        const tag = xmlEditorState.tags[xmlEditorState.selectedTagIndex];
        nameInput.value = tag.name;
        nameInput.disabled = false;
        contentTextarea.value = tag.content;
        contentTextarea.disabled = false;
    } else {
        nameInput.value = '';
        nameInput.disabled = true;
        contentTextarea.value = '';
        contentTextarea.disabled = true;
    }
}

function renderXmlPreview() {
    const preview = document.getElementById('xml-preview');

    if (xmlEditorState.tags.length === 0) {
        preview.textContent = '';
        return;
    }

    const xmlLines = xmlEditorState.tags.map(tag => {
        const content = tag.content.trim();
        if (!content) {
            return `<${tag.name}>\n</${tag.name}>`;
        }
        // Indent content lines
        const indentedContent = content.split('\n').map(line => '  ' + line).join('\n');
        return `<${tag.name}>\n${indentedContent}\n</${tag.name}>`;
    });

    preview.textContent = xmlLines.join('\n');
}

function handleXmlPromptSelect(e) {
    const value = e.target.value;

    if (value === 'new') {
        // New prompt
        xmlEditorState.currentPromptId = null;
        xmlEditorState.tags = [];
        xmlEditorState.selectedTagIndex = null;
    } else {
        // Load existing prompt
        const promptId = parseInt(value);
        const prompt = state.prompts.find(p => p.id === promptId);
        if (prompt) {
            xmlEditorState.currentPromptId = prompt.id;
            // Deep clone tags to avoid reference issues
            xmlEditorState.tags = prompt.tags ? prompt.tags.map(t => ({ name: t.name, content: t.content })) : [];
            xmlEditorState.selectedTagIndex = xmlEditorState.tags.length > 0 ? 0 : null;
        }
    }

    renderXmlEditor();
}

function selectXmlTag(index) {
    xmlEditorState.selectedTagIndex = index;
    renderXmlTagsList();
    renderXmlTagEditor();
}

function addXmlTag() {
    // Generate a unique default name
    let baseName = 'tag';
    let counter = 1;
    let newName = baseName;
    while (xmlEditorState.tags.some(t => t.name === newName)) {
        newName = `${baseName}${counter}`;
        counter++;
    }

    xmlEditorState.tags.push({ name: newName, content: '' });
    xmlEditorState.selectedTagIndex = xmlEditorState.tags.length - 1;

    renderXmlTagsList();
    renderXmlTagEditor();
    renderXmlPreview();

    // Focus the name input
    document.getElementById('xml-tag-name-input').focus();
    document.getElementById('xml-tag-name-input').select();
}

function moveXmlTagUp() {
    if (xmlEditorState.selectedTagIndex === null || xmlEditorState.selectedTagIndex <= 0) return;

    const index = xmlEditorState.selectedTagIndex;
    [xmlEditorState.tags[index - 1], xmlEditorState.tags[index]] =
        [xmlEditorState.tags[index], xmlEditorState.tags[index - 1]];
    xmlEditorState.selectedTagIndex = index - 1;

    renderXmlTagsList();
    renderXmlPreview();
}

function moveXmlTagDown() {
    if (xmlEditorState.selectedTagIndex === null ||
        xmlEditorState.selectedTagIndex >= xmlEditorState.tags.length - 1) return;

    const index = xmlEditorState.selectedTagIndex;
    [xmlEditorState.tags[index], xmlEditorState.tags[index + 1]] =
        [xmlEditorState.tags[index + 1], xmlEditorState.tags[index]];
    xmlEditorState.selectedTagIndex = index + 1;

    renderXmlTagsList();
    renderXmlPreview();
}

function deleteXmlTag() {
    if (xmlEditorState.selectedTagIndex === null) return;

    xmlEditorState.tags.splice(xmlEditorState.selectedTagIndex, 1);

    // Adjust selection
    if (xmlEditorState.tags.length === 0) {
        xmlEditorState.selectedTagIndex = null;
    } else if (xmlEditorState.selectedTagIndex >= xmlEditorState.tags.length) {
        xmlEditorState.selectedTagIndex = xmlEditorState.tags.length - 1;
    }

    renderXmlTagsList();
    renderXmlTagEditor();
    renderXmlPreview();
}

function handleTagNameChange(e) {
    if (xmlEditorState.selectedTagIndex === null) return;

    const newName = e.target.value.replace(/[<>\s]/g, ''); // Remove invalid XML chars
    xmlEditorState.tags[xmlEditorState.selectedTagIndex].name = newName;

    renderXmlTagsList();
    renderXmlPreview();
}

function handleTagContentChange(e) {
    if (xmlEditorState.selectedTagIndex === null) return;

    xmlEditorState.tags[xmlEditorState.selectedTagIndex].content = e.target.value;
    renderXmlPreview();
}

function saveXmlPrompt() {
    const nameInput = document.getElementById('xml-prompt-name');
    const categoryInput = document.getElementById('xml-prompt-category');
    const name = nameInput.value.trim();
    const category = categoryInput.value.trim() || DEFAULT_CATEGORY;

    if (!name) {
        alert('Por favor, ingresa un nombre para el prompt.');
        nameInput.focus();
        return;
    }

    if (xmlEditorState.tags.length === 0) {
        alert('Agrega al menos un tag antes de guardar.');
        return;
    }

    // Add category if new
    if (!state.categories.includes(category)) {
        state.categories.push(category);
    }

    // Deep clone tags for storage
    const tagsToSave = xmlEditorState.tags.map(t => ({ name: t.name, content: t.content }));

    if (xmlEditorState.currentPromptId) {
        // Update existing
        const prompt = state.prompts.find(p => p.id === xmlEditorState.currentPromptId);
        if (prompt) {
            prompt.name = name;
            prompt.category = category;
            prompt.tags = tagsToSave;
        }
    } else {
        // Create new
        const newPrompt = {
            id: Date.now(),
            name: name,
            category: category,
            tags: tagsToSave,
            createdAt: new Date().toISOString()
        };
        state.prompts.push(newPrompt);
        xmlEditorState.currentPromptId = newPrompt.id;
    }

    saveToLocalStorage();
    renderXmlPromptSelector();
    showNotification('¡Guardado!');
}

function copyXmlPrompt() {
    const preview = document.getElementById('xml-preview');
    const text = preview.textContent;

    if (!text) {
        alert('No hay contenido para copiar.');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showNotification('¡XML copiado!');
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
    });
}

function deleteXmlPrompt() {
    if (!xmlEditorState.currentPromptId) {
        // Just clear the editor for new prompt
        xmlEditorState.tags = [];
        xmlEditorState.selectedTagIndex = null;
        document.getElementById('xml-prompt-name').value = '';
        renderXmlEditor();
        return;
    }

    showConfirmDialog('¿Eliminar este XML prompt?', () => {
        state.prompts = state.prompts.filter(p => p.id !== xmlEditorState.currentPromptId);
        xmlEditorState.currentPromptId = null;
        xmlEditorState.tags = [];
        xmlEditorState.selectedTagIndex = null;

        saveToLocalStorage();
        renderXmlEditor();
    });
}

// Re-render when switching tabs
document.querySelectorAll('input[name="tab"]').forEach(input => {
    input.addEventListener('change', render);
});