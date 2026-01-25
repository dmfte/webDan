// ============================================
// Mi Prompt-itud - Vanilla JS
// ============================================

const STORAGE_KEY = 'mi-prompt-itud-data';
const COPY_NOTIFICATION_DURATION = 2000; // milliseconds
const DEBOUNCE_DELAY = 500; // milliseconds
const DEFAULT_CATEGORY = 'Sin categoría';

// State
let state = {
    prompts: [],
    categories: [DEFAULT_CATEGORY],
    viewMode: 'all', // 'all' or 'category'
    sortMode: 'alpha', // 'alpha' or 'date'
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
            state.prompts = data.prompts || [];
            state.categories = data.categories || [DEFAULT_CATEGORY];
            state.viewMode = data.viewMode || 'all';
            state.sortMode = data.sortMode || 'alpha';

            // Restore view mode
            document.getElementById(`view-${state.viewMode === 'all' ? 'all' : 'category'}`).checked = true;
            // Restore sort mode
            document.getElementById(`sort-${state.sortMode}`).checked = true;
        } catch (e) {
            console.error('Error loading data:', e);
        }
    } else {
        // First time - add default prompt
        state.prompts = [{
            id: Date.now(),
            name: 'Hola AI',
            category: DEFAULT_CATEGORY,
            text: '¿Podrías hacerme un café mientras procesas esto? ☕',
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
}

// ============================================
// Prompts Management
// ============================================

function createNewPrompt() {
    const viewAllRadio = document.getElementById('view-all');
    viewAllRadio.checked = true;
    state.viewMode = 'all';
    document.getElementById("tab-lista").click();
    
    const newPrompt = {
        id: Date.now(),
        name: '',
        category: '',
        text: '',
        createdAt: new Date().toISOString()
    };

    state.prompts.unshift(newPrompt);
    saveToLocalStorage();
    render();

    // Expand the new prompt and focus the name input
    setTimeout(() => {
        const promptRadio = document.getElementById(`prompt-${newPrompt.id}`);
        if (promptRadio) {
            promptRadio.checked = true;

            // Focus the name input for this specific prompt
            const promptItem = document.querySelector(`.prompt-item[data-prompt-id="${newPrompt.id}"]`);
            if (promptItem) {
                const nameInput = promptItem.querySelector('.input-name');
                if (nameInput) {
                    nameInput.focus();
                }
            }
        }
    }, 100);
}

function savePromptChanges(promptItem) {
    const id = parseInt(promptItem.dataset.promptId);
    const prompt = state.prompts.find(p => p.id === id);
    if (!prompt) return;

    // Get values directly from inputs using class selectors
    const nameInput = promptItem.querySelector('.input-name');
    const categoryInput = promptItem.querySelector('.input-category');
    const textInput = promptItem.querySelector('.input-text');

    if (!nameInput || !categoryInput || !textInput) return;

    const name = nameInput.value.trim();
    const category = categoryInput.value.trim() || DEFAULT_CATEGORY;
    const text = textInput.value;

    // Safeguard for empty prompts
    if (!text.trim()) {
        alert('El prompt no puede estar vacío');
        return;
    }

    // Handle name uniqueness
    if (!name) {
        prompt.name = '';
    } else {
        // Check for duplicate names
        const duplicate = state.prompts.find(p => p.id !== id && p.name === name);
        if (duplicate) {
            // Find a unique name by adding (1), (2), etc.
            let counter = 1;
            let uniqueName = `${name} (${counter})`;
            while (state.prompts.find(p => p.name === uniqueName)) {
                counter++;
                uniqueName = `${name} (${counter})`;
            }
            prompt.name = uniqueName;
            nameInput.value = uniqueName;
        } else {
            prompt.name = name;
        }
    }

    // Update category
    prompt.category = category;
    if (!state.categories.includes(category)) {
        state.categories.push(category);
    }

    // Update text
    prompt.text = text;

    saveToLocalStorage();

    // Update header to reflect final saved name
    const headerSpan = promptItem.querySelector('.prompt-header-name');
    if (headerSpan) {
        headerSpan.textContent = prompt.name || 'Sin nombre';
    }
    showNotification('¡Guardado!');
}

function updatePrompt(promptItem, field, value) {
    const id = parseInt(promptItem.dataset.promptId);
    const prompt = state.prompts.find(p => p.id === id);
    if (!prompt) return;

    // Handle name uniqueness
    if (field === 'name') {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            prompt.name = '';
            saveToLocalStorage();
            return;
        }

        // Check for duplicate names
        const duplicate = state.prompts.find(p => p.id !== id && p.name === trimmedValue);
        if (duplicate) {
            // Find a unique name by adding (1), (2), etc.
            let counter = 1;
            let uniqueName = `${trimmedValue} (${counter})`;
            while (state.prompts.find(p => p.name === uniqueName)) {
                counter++;
                uniqueName = `${trimmedValue} (${counter})`;
            }
            prompt.name = uniqueName;
        } else {
            prompt.name = trimmedValue;
        }
    } else if (field === 'category') {
        const trimmedValue = value.trim() || DEFAULT_CATEGORY;
        prompt.category = trimmedValue;

        // Add new category if it doesn't exist
        if (!state.categories.includes(trimmedValue)) {
            state.categories.push(trimmedValue);
        }
    } else if (field === 'text') {
        prompt.text = value;
    }

    saveToLocalStorage();
    render();
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
                        <label>Nombre:</label>
                        <input type="text"
                               class="input-name"
                               value="${escapeHTML(prompt.name)}"
                               placeholder="Nombre del prompt">
                    </div>

                    <div class="prompt-field">
                        <label>Categoría:</label>
                        <input type="text"
                               class="input-category"
                               list="categories-datalist"
                               value="${escapeHTML(prompt.category)}"
                               placeholder="Categoría">
                    </div>

                    <div class="prompt-field">
                        <label>Prompt:</label>
                        <textarea class="input-text"
                                  placeholder="Escribe tu prompt aquí...">${escapeHTML(prompt.text)}</textarea>
                    </div>

                    <div class="prompt-actions">
                        <button class="btn-primary btn-save">
                            Guardar
                        </button>
                        <button class="btn-secondary btn-copy">
                            📋 Copiar
                        </button>
                        <button class="btn-delete">✕</button>
                    </div>
                </div>
            </div>
        </div>
    `;
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
    // Update header text in real-time as user types the name
    document.querySelectorAll('.input-name').forEach(input => {
        input.addEventListener('input', (e) => {
            const promptItem = e.target.closest('.prompt-item');
            if (promptItem) {
                const headerSpan = promptItem.querySelector('.prompt-header-name');
                if (headerSpan) {
                    headerSpan.textContent = e.target.value.trim() || 'Sin nombre';
                }
            }
        });
    });

    // Save buttons
    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const promptItem = e.currentTarget.closest('.prompt-item');
            if (promptItem) {
                savePromptChanges(promptItem);
            }
        });
    });

    // Copy buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const promptItem = e.currentTarget.closest('.prompt-item');
            if (promptItem) {
                const textInput = promptItem.querySelector('.input-text');
                if (textInput) {
                    copyPromptText(textInput.value);
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

// Re-render when switching tabs
document.querySelectorAll('input[name="tab"]').forEach(input => {
    input.addEventListener('change', render);
});