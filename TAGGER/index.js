(function () {
    /* -------------------------------------------
       Storage & defaults
    ------------------------------------------- */
    const LS_KEY = 'dmfte_tagger';
    const DEFAULT_TAGS = [{
        tag: 'p',
        shortkey: 'p',
        classes: ''
    },
    {
        tag: 'h1',
        shortkey: '1',
        classes: ''
    },
    {
        tag: 'h2',
        shortkey: '2',
        classes: ''
    },
    {
        tag: 'h3',
        shortkey: '3',
        classes: ''
    },
    {
        tag: 'h4',
        shortkey: '4',
        classes: ''
    },
    {
        tag: 'h5',
        shortkey: '5',
        classes: ''
    },
    {
        tag: 'h6',
        shortkey: '6',
        classes: ''
    },
    {
        tag: 'strong',
        shortkey: 'b',
        classes: ''
    },
    {
        tag: 'em',
        shortkey: 'i',
        classes: ''
    },
    {
        tag: 'u',
        shortkey: 'u',
        classes: ''
    },
    {
        tag: 'del',
        shortkey: 's',
        classes: ''
    },
    {
        tag: 'ul',
        shortkey: 'n',
        classes: ''
    },
    {
        tag: 'ol',
        shortkey: 'o',
        classes: ''
    },
    {
        tag: 'li',
        shortkey: 'l',
        classes: ''
    },
    {
        tag: 'details',
        shortkey: 'd',
        classes: ''
    },
    {
        tag: 'sup',
        shortkey: '*',
        classes: ''
    }
    ];

    const DEFAULT_STATE = {
        rows: DEFAULT_TAGS,
        darkMode: true,
        applyAllTag: 'p',
        applyFirstLineTag: '',
        lessThanTag: '',
        lessThanNumber: '',
        allUppercaseTag: '',
        autoTagList: false,
        autoTagNumList: false,
        autoTagUrl: false
    };

    const dmToggle = document.getElementById('dm-toggle');
    const settingsTableEl = document.getElementById('settings-table');
    const settingsRowTemplate = document.getElementById('settings-table-row');
    const txtApplyAll = document.getElementById('txtApplyAll');
    const txtApply1stLine = document.getElementById('txtApply1stLine');
    const txtLessThanTag = document.getElementById('txtLessThan_tag');
    const txtLessThanNumber = document.getElementById('txtLessThan_number');
    const txtAllUppercase = document.getElementById('txtAllUppercase');
    const cbAutoTagList = document.getElementById('cbAutoTagList');
    const cbAutoTagNumList = document.getElementById('cbAutoTagNumList');
    const cbAutoTagUrl = document.getElementById('cbAutoTagUrl');

    let settings = getSettings();
    loadSettingsIntoUi(settings);

    function getSettings() {
        const LS = localStorage.getItem(LS_KEY);
        if (!LS) return {
            ...DEFAULT_STATE
        };
        try {
            const parsed = JSON.parse(LS);
            return {
                ...DEFAULT_STATE,
                ...parsed,
                rows: Array.isArray(parsed.rows) ? parsed.rows : DEFAULT_TAGS.slice()
            };
        } catch (error) {
            return {
                ...DEFAULT_STATE
            };
        }
    }

    function loadSettingsIntoUi(settings) {
        if (txtApplyAll) txtApplyAll.value = settings.applyAllTag;
        if (dmToggle) dmToggle.checked = settings.darkMode;
        if (txtApply1stLine) txtApply1stLine.value = settings.applyFirstLineTag || DEFAULT_STATE.applyFirstLineTag;
        if (txtLessThanTag) txtLessThanTag.value = settings.lessThanTag || DEFAULT_STATE.lessThanTag;
        if (txtLessThanNumber) txtLessThanNumber.value = `${settings.lessThanNumber ?? DEFAULT_STATE.lessThanNumber}`;
        if (txtAllUppercase) txtAllUppercase.value = settings.allUppercaseTag ?? DEFAULT_STATE.allUppercaseTag;
        if (cbAutoTagList) cbAutoTagList.checked = !!settings.autoTagList;
        if (cbAutoTagNumList) cbAutoTagNumList.checked = !!settings.autoTagNumList;
        if (cbAutoTagUrl) cbAutoTagUrl.checked = !!settings.autoTagUrl;

        // Fill settings table:
        if (!settingsTableEl || !settingsRowTemplate) return;

        settingsTableEl.querySelectorAll('.row').forEach(row => row.remove());
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 25; i++) {
            const rowData = settings.rows[i] || {};
            const clone = settingsRowTemplate.content.firstElementChild.cloneNode(true);
            const tagInput = clone.querySelector('.tag');
            const shortkeyInput = clone.querySelector('.shortkey');
            const classesInput = clone.querySelector('.classes');
            if (tagInput) tagInput.value = rowData.tag || '';
            if (shortkeyInput) shortkeyInput.value = rowData.shortkey || '';
            if (classesInput) classesInput.value = rowData.classes || '';
            fragment.appendChild(clone);
        }
        settingsTableEl.appendChild(fragment);
    };

    function saveSettings() {
        const rows = settingsTableEl ? Array.from(settingsTableEl.querySelectorAll('.row')).map(row => {
            const tagInput = row.querySelector('.tag');
            const shortkeyInput = row.querySelector('.shortkey');
            const classesInput = row.querySelector('.classes');

            return {
                tag: (tagInput && tagInput.value ? tagInput.value.trim() : ''),
                shortkey: (shortkeyInput && shortkeyInput.value ? shortkeyInput.value.trim().slice(0, 1) : ''),
                classes: (classesInput && classesInput.value ? classesInput.value.trim() : '')
            };
        }) : [];

        settings = {
            applyAllTag: txtApplyAll && txtApplyAll.value ? txtApplyAll.value.trim() : '',
            darkMode: !!(dmToggle && dmToggle.checked),
            applyFirstLineTag: txtApply1stLine && txtApply1stLine.value ? txtApply1stLine.value.trim() : '',
            lessThanTag: txtLessThanTag && txtLessThanTag.value ? txtLessThanTag.value.trim() : '',
            lessThanNumber: (() => {
                if (!txtLessThanNumber || !txtLessThanNumber.value) return '';
                const parsed = parseInt(txtLessThanNumber.value.trim(), 10);
                return Number.isNaN(parsed) ? '' : parsed;
            })(),
            allUppercaseTag: txtAllUppercase && txtAllUppercase.value ? txtAllUppercase.value.trim() : '',
            autoTagList: !!(cbAutoTagList && cbAutoTagList.checked),
            autoTagNumList: !!(cbAutoTagNumList && cbAutoTagNumList.checked),
            autoTagUrl: !!(cbAutoTagUrl && cbAutoTagUrl.checked),
            rows: Array.isArray(rows) ? rows : DEFAULT_TAGS.slice()
        };
        localStorage.setItem(LS_KEY, JSON.stringify(settings));
    }
    // LISTENERS
    txtApplyAll.addEventListener('input', saveSettings);
    txtApply1stLine.addEventListener('input', saveSettings);
    txtLessThanTag.addEventListener('input', saveSettings);
    txtLessThanNumber.addEventListener('input', saveSettings);
    txtAllUppercase.addEventListener('input', saveSettings);
    cbAutoTagList.addEventListener('input', saveSettings);
    cbAutoTagNumList.addEventListener('input', saveSettings);
    cbAutoTagUrl.addEventListener('input', saveSettings);
    dmToggle.addEventListener('input', saveSettings);

    document.body.addEventListener('keydown', onBodyKeydown);

    const debouncePopulateCtxmenu = debounceFx(populateCtxmenu, 1000);
    settingsTableEl.addEventListener('input', () => {
        saveSettings();
        debouncePopulateCtxmenu();
    });

    /* -------------------------------------------
       Setting contextual menu
    ------------------------------------------- */

    const ctxmenu = document.getElementById("ctxmenu");

    populateCtxmenu();

    // Listeners

    // For all buttons in the context menu
    ctxmenu.addEventListener('click', event => {
        const btn = event.target.closest('button');
        if (!btn) return;
        removeClassFromBlocks('sel');
        hiddenCtxmenu();
        window.getSelection().removeAllRanges();
    });

    // For buttons in the context menu that insert tags
    ctxmenu.addEventListener('click', event => {
        const btn = event.target.closest('.ctx-tags button');
        if (!btn) return;
        const tag = btn.dataset.tag;

        // Shift+click: wrap entire selection with single tag pair (no replace)
        if (event.shiftKey) {
            insertTags([{ tag, attributes: [] }], { replaceExisting: false, wrapAll: true });
        }
        // Alt/Option+click: show attribute popup
        else if (event.altKey) {
            showAttributePopup(tag);
        }
        // Normal click: replace existing tags
        else {
            insertTags([{ tag, attributes: [] }], { replaceExisting: true });
        }
    });

    // For custom functions
    let builtBlocks = [];

    const btnFootnote = ctxmenu.querySelector('#fx-footnote');
    btnFootnote.addEventListener('click', () => {
        const footnoteRef = window.getSelection().getRangeAt(0).toString().trim();
        insertFootnote(footnoteRef);
        hiddenCtxmenu();
        window.getSelection().removeAllRanges();
    });

    const btnDelete = ctxmenu.querySelector('#fx-delete');
    btnDelete.addEventListener('click', () => {
        deleteOuterTag();
        hiddenCtxmenu();
        window.getSelection().removeAllRanges();
        removeClassFromBlocks('sel');
        addClassToSelectedBlocks('modified');
    });

    // Functions
    function populateCtxmenu() {
        const arrTags = settings.rows || [];
        const tagsContainer = ctxmenu.querySelector('.ctx-tags')
        tagsContainer.innerHTML = '';
        arrTags.forEach(row => {
            if (!row || !row.tag) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.tag = row.tag;
            btn.dataset.shortkey = row.shortkey || '';
            btn.textContent = `${row.tag} (${row.shortkey || ''})`;
            tagsContainer.appendChild(btn);
        });
    }

    function showCtxmenu(event) {
        const bcr = ctxmenu.getBoundingClientRect();
        const ctxtmenuWidth = bcr.width;
        const ctxmenuHeight = bcr.height;
        // 23px is the shadow allowance
        const maxX = Math.min(event.clientX, window.innerWidth - ctxtmenuWidth - 23);
        const maxY = Math.min(event.clientY, window.innerHeight - ctxmenuHeight - 23);
        ctxmenu.style.inset = `${maxY}px auto auto ${maxX}px`;
        ctxmenu.classList.remove('hidden');
        document.body.addEventListener('keypress', onBodyKeypress);
        document.body.addEventListener('keydown', onBodyKeydown);
    }

    function hiddenCtxmenu() {
        ctxmenu.classList.add('hidden');
        document.body.removeEventListener('keypress', onBodyKeypress);
    }

    /* -------------------------------------------
       Attribute popup
    ------------------------------------------- */

    const attrPopup = document.getElementById('attr-popup');
    const attrFieldsContainer = attrPopup.querySelector('.attr-fields');
    const attrAddBtn = attrPopup.querySelector('.attr-add-btn');
    const attrApplyBtn = attrPopup.querySelector('.attr-apply-btn');
    const attrCancelBtn = attrPopup.querySelector('.attr-cancel-btn');
    const attrCloseBtn = attrPopup.querySelector('.attr-popup-close');

    let pendingAttrTag = null; // Store the tag waiting for attributes

    function createAttrRow() {
        const row = document.createElement('div');
        row.className = 'attr-row';
        row.innerHTML = `
            <input type="text" class="attr-name" placeholder="Attribute name" />
            <input type="text" class="attr-value" placeholder="Value" />
            <button type="button" class="attr-remove-btn" title="Remove">&times;</button>
        `;
        row.querySelector('.attr-remove-btn').addEventListener('click', () => {
            row.remove();
            // Ensure at least one row exists
            if (attrFieldsContainer.children.length === 0) {
                attrFieldsContainer.appendChild(createAttrRow());
            }
        });
        return row;
    }

    function showAttributePopup(tag) {
        pendingAttrTag = tag;
        attrFieldsContainer.innerHTML = '';
        attrFieldsContainer.appendChild(createAttrRow());
        attrPopup.classList.remove('hidden');
        hiddenCtxmenu();
        // Focus the first input
        const firstInput = attrFieldsContainer.querySelector('.attr-name');
        if (firstInput) firstInput.focus();
    }

    function hideAttributePopup() {
        attrPopup.classList.add('hidden');
        pendingAttrTag = null;
        window.getSelection().removeAllRanges();
        removeClassFromBlocks('sel');
        // Return focus to output-pane for continued keyboard navigation
        if (outputPane) outputPane.focus();
    }

    function applyAttributes() {
        if (!pendingAttrTag) return;

        const rows = attrFieldsContainer.querySelectorAll('.attr-row');
        const attributes = [];
        rows.forEach(row => {
            const nameInput = row.querySelector('.attr-name');
            const valueInput = row.querySelector('.attr-value');
            const attrName = nameInput.value.trim();
            const attrValue = valueInput.value.trim();
            if (attrName) {
                attributes.push({ attr: attrName, val: attrValue });
            }
        });

        insertTags([{ tag: pendingAttrTag, attributes }], { replaceExisting: true });
        hideAttributePopup();
    }

    attrAddBtn.addEventListener('click', () => {
        attrFieldsContainer.appendChild(createAttrRow());
        // Focus the new row's name input
        const newRow = attrFieldsContainer.lastElementChild;
        const nameInput = newRow.querySelector('.attr-name');
        if (nameInput) nameInput.focus();
    });

    attrApplyBtn.addEventListener('click', applyAttributes);
    attrCancelBtn.addEventListener('click', hideAttributePopup);
    attrCloseBtn.addEventListener('click', hideAttributePopup);

    // Handle Enter key in popup to apply, Escape to cancel
    attrPopup.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyAttributes();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            hideAttributePopup();
        }
    });


    function onBodyKeypress(event) {
        const key = event.key.toLowerCase();
        const tagObj = settings.rows.find(row => row.shortkey && row.shortkey.toLowerCase() === key);
        const tag = tagObj ? tagObj.tag : null;
        if (!tag) return;

        // Shift+key: wrap entire selection with single tag pair (no replace)
        if (event.shiftKey) {
            insertTags([{ tag, attributes: [] }], { replaceExisting: false, wrapAll: true });
        }
        // Alt/Option+key: show attribute popup
        else if (event.altKey) {
            event.preventDefault();
            showAttributePopup(tag);
            return; // Don't hide ctxmenu yet, popup will handle it
        }
        // Normal key: replace existing tags
        else {
            insertTags([{ tag, attributes: [] }], { replaceExisting: true });
        }

        hiddenCtxmenu();
        window.getSelection().removeAllRanges();
    }

    let focusedBlockIndex = null; // Track the currently focused block for keyboard navigation

    function onBodyKeydown(event) {
        const key = event.key;

        // Check if focus is inside output-pane
        const isInOutputPane = outputPane && (outputPane.contains(document.activeElement) || document.activeElement === outputPane);

        if (event.key === 'Escape') {
            removeClassFromBlocks('sel');
            removeClassFromBlocks('modified');
            removeClassFromBlocks('focused');
            hiddenCtxmenu();
            window.getSelection().removeAllRanges();
            sbo = null;
            focusedBlockIndex = null;
            return;
        }

        if (key === 'Delete' || key === 'Backspace') {
            // Execute when context menu is shown OR when navigating in output-pane with selection
            const hasSelection = sbo && sbo.blocks && sbo.blocks.length > 0;
            if (ctxmenu.classList.contains('hidden') && !(isInOutputPane && hasSelection)) return;

            removeClassFromBlocks('sel');
            addClassToSelectedBlocks('modified');
            deleteAllTags();
            hiddenCtxmenu();
            window.getSelection().removeAllRanges();
            sbo = null;
            return;
        }

        // Arrow key navigation (only when focus is in output-pane)
        if ((key === 'ArrowUp' || key === 'ArrowDown') && isInOutputPane) {
            event.preventDefault();
            handleArrowNavigation(key, event.shiftKey);
            return;
        }

        // Handle shortkeys when focus is in output-pane (even if ctxmenu is hidden)
        if (isInOutputPane && sbo && sbo.blocks && sbo.blocks.length > 0) {
            // Use event.code for Alt key combinations (Option+key produces special chars on macOS)
            // event.code gives us "KeyP" for the P key regardless of modifiers
            let pressedKey = event.key.toLowerCase();
            if (event.altKey && event.code && event.code.startsWith('Key')) {
                pressedKey = event.code.slice(3).toLowerCase(); // "KeyP" -> "p"
            } else if (event.altKey && event.code && event.code.startsWith('Digit')) {
                pressedKey = event.code.slice(5); // "Digit1" -> "1"
            }

            const tagObj = settings.rows.find(row => row.shortkey && row.shortkey.toLowerCase() === pressedKey);
            if (tagObj && tagObj.tag) {
                event.preventDefault();

                // Shift+key: wrap entire selection with single tag pair (no replace)
                if (event.shiftKey) {
                    insertTags([{ tag: tagObj.tag, attributes: [] }], { replaceExisting: false, wrapAll: true });
                }
                // Alt/Option+key: show attribute popup
                else if (event.altKey) {
                    showAttributePopup(tagObj.tag);
                    return;
                }
                // Normal key: replace existing tags
                else {
                    insertTags([{ tag: tagObj.tag, attributes: [] }], { replaceExisting: true });
                }

                hiddenCtxmenu();
                window.getSelection().removeAllRanges();
                return;
            }
        }
    }

    function handleArrowNavigation(key, isShift) {
        const allBlocks = Array.from(outputPane.querySelectorAll('.block'));
        if (allBlocks.length === 0) return;

        const isDown = key === 'ArrowDown';

        // If no selection and no focused block, start from beginning/end
        if (focusedBlockIndex === null && (!sbo || !sbo.blocks || sbo.blocks.length === 0)) {
            focusedBlockIndex = isDown ? 0 : allBlocks.length - 1;
            const startBlock = allBlocks[focusedBlockIndex];
            const startPos = parseInt(startBlock.dataset.position, 10);

            sbo = { blocks: [startPos], range: [] };
            removeClassFromBlocks('sel');
            removeClassFromBlocks('focused');
            addClassToSelectedBlocks('sel');
            startBlock.classList.add('focused');
            startBlock.scrollIntoView({ block: 'nearest' });
            return;
        }

        // If we have a selection but no focused index, derive it from selection
        if (focusedBlockIndex === null && sbo && sbo.blocks && sbo.blocks.length > 0) {
            // Use first or last selected block depending on direction
            const selectedPositions = sbo.blocks.slice().sort((a, b) => a - b);
            focusedBlockIndex = isDown ? selectedPositions[selectedPositions.length - 1] : selectedPositions[0];
            // Find the actual array index for this position
            focusedBlockIndex = allBlocks.findIndex(b => parseInt(b.dataset.position, 10) === focusedBlockIndex);
        }

        if (isShift) {
            // Shift+arrow: extend selection
            const selectedPositions = sbo.blocks.slice().sort((a, b) => a - b);
            const firstSelectedIdx = allBlocks.findIndex(b => parseInt(b.dataset.position, 10) === selectedPositions[0]);
            const lastSelectedIdx = allBlocks.findIndex(b => parseInt(b.dataset.position, 10) === selectedPositions[selectedPositions.length - 1]);

            let newBlockIdx;
            if (isDown) {
                // Add block after last selected
                newBlockIdx = lastSelectedIdx + 1;
                if (newBlockIdx >= allBlocks.length) return; // Already at end
            } else {
                // Add block before first selected
                newBlockIdx = firstSelectedIdx - 1;
                if (newBlockIdx < 0) return; // Already at start
            }

            const newBlock = allBlocks[newBlockIdx];
            const newPos = parseInt(newBlock.dataset.position, 10);

            if (!sbo.blocks.includes(newPos)) {
                sbo.blocks.push(newPos);
            }

            focusedBlockIndex = newBlockIdx;
            removeClassFromBlocks('sel');
            removeClassFromBlocks('focused');
            addClassToSelectedBlocks('sel');
            newBlock.classList.add('focused');
            newBlock.scrollIntoView({ block: 'nearest' });
        } else {
            // Regular arrow: move focus to single block
            let newIndex = focusedBlockIndex + (isDown ? 1 : -1);

            // Clamp to valid range
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= allBlocks.length) newIndex = allBlocks.length - 1;

            if (newIndex === focusedBlockIndex) return; // No movement

            focusedBlockIndex = newIndex;
            const newBlock = allBlocks[newIndex];
            const newPos = parseInt(newBlock.dataset.position, 10);

            sbo = { blocks: [newPos], range: [] };
            removeClassFromBlocks('sel');
            removeClassFromBlocks('focused');
            addClassToSelectedBlocks('sel');
            newBlock.classList.add('focused');
            newBlock.scrollIntoView({ block: 'nearest' });
        }
    }

    function insertFootnote(footnoteRef) {
        const regexpStr = '^<\\S+>' + footnoteRef + '\\s\\S+'  //  Matches a line that starts with '<ANY_TAG>ANY_NUMBER ANY_WORD', such as '<p>12 Author..'
        const regexpTagNumber = new RegExp(regexpStr);

        for (let i = builtBlocks.length - 1; i >= 0; i--) {
            const block = builtBlocks[i];

            if (regexpTagNumber.test(block.textContent)) {
                // If block that starts with the string selected as footnote reference is found
                // inserts link to the reference text
                const fnRefTags = [{
                    tag: 'sup',
                    attributes: []
                },
                {
                    tag: 'a',
                    attributes: [{
                        attr: 'id',
                        val: `fn-ref-${footnoteRef}`
                    },
                    {
                        attr: 'href',
                        val: `#fn-anch-${footnoteRef}`
                    }
                    ]
                }
                ];
                insertTags(fnRefTags, { replaceExisting: false });

                // Changing selected blocks object to the found block containing the footnote
                sbo = {
                    blocks: [block.dataset.position],
                    range: []
                }
                // deleteAllTags();
                deleteOuterTag();
                // First number as superindex
                const regexpStr = '^\(' + footnoteRef + '\)\\s\\S+'
                const regexpNumberSpaceNonspace = new RegExp(regexpStr);
                const numberPrefix = block.textContent.match(regexpNumberSpaceNonspace);
                const num = numberPrefix[1];
                block.textContent = block.textContent.replace(num, `<sup>${num}</sup>`);

                // Ending charcater ↩ as a link back to the footnote reference
                block.textContent = block.textContent + `<a href="#fn-ref-${footnoteRef}">&#8617;</a>`;

                // Enclosing div for the footnote
                const fnAnchorTags = [
                    {
                        tag: 'div',
                        attributes: [
                            {
                                attr: 'id',
                                val: `fn-anch-${footnoteRef}`
                            }
                        ]
                    }
                ]
                insertTags(fnAnchorTags, { replaceExisting: false });
            }
        }

    }


    /* -------------------------------------------
       Creating blocks in the output pane
    ------------------------------------------- */

    let sbo; // Selected Blocks Object. Will be filled on mouseup event of the outputPane

    const inputPane = document.querySelector('textarea#plain');
    const outputPane = document.getElementById('output-pane');
    const controlsPane = document.getElementById('controls-pane');
    let inputArray = [];

    function regenerateOutput() {
        outputPane.innerHTML = '';
        inputArray = getTextArray();
        builtBlocks = [];
        focusedBlockIndex = null; // Reset keyboard navigation state
        sbo = null;
        inputArray.forEach((text, idx) => {
            const block = document.createElement('div');
            block.classList.add('block');
            block.setAttribute('data-position', idx);
            let tag = '';
            let prependTag = '';
            let appendTag = '';
            let attributes = '';

            //  Applies the tag to all text blocks
            if (settings.applyAllTag != '') tag = settings.applyAllTag;

            //  Applies tag to the 1st line
            if (idx == 0 && settings.applyFirstLineTag != '') tag = settings.applyFirstLineTag;

            //  Applies tag... if it is less than...
            if (settings.lessThanTag != '' && settings.lessThanNumber != '') {
                text = text.replace(/\s{2,}/g, ' '); //  Eliminates consecutive blank spaces
                let numberofWords = text.split(' ').length;
                if (numberofWords <= settings.lessThanNumber) {
                    tag = settings.lessThanTag;
                }
            }
            //  Applies tag to an all uppercase line
            if (settings.allUppercaseTag != '' && text.toUpperCase() == text) {
                tag = settings.allUppercaseTag;
            }

            // Check for unordered list items (starting with - or *)
            if (settings.autoTagList) {
                if (text.match(/^[-*]\s/)) {
                    text = text.replace(/^[-*]\s/, '');
                    tag = 'li'
                    const prevBlock = idx > 0 ? inputArray[idx - 1] : null;
                    const nextBlock = idx < inputArray.length - 1 ? inputArray[idx + 1] : null;
                    //  If the previous item is NOT part of a list, this is the first item
                    if (!prevBlock || !prevBlock.match(/^[-*]\s/)) prependTag = '<ul>';
                    //  If the next item is NOT part of a list, this is the last item
                    if (!nextBlock || !nextBlock.match(/^[-*]\s/)) appendTag = '</ul>'
                }
            }

            // Check for ordered list items (starting with 1- or 1. )
            if (settings.autoTagNumList) {
                if (text.match(/^\d[\.\-\)]\s/)) {
                    text = text.replace(/^\d[\.\-]\s/, '');
                    tag = 'li'
                    const prevBlock = idx > 0 ? inputArray[idx - 1] : null;
                    const nextBlock = idx < inputArray.length - 1 ? inputArray[idx + 1] : null;
                    //  If the previous item is NOT part of a list, this is the first item
                    if (!prevBlock || !prevBlock.match(/^\d[\.\-]\s/)) prependTag = '<ol>';
                    //  If the next item is NOT part of a list, this is the last item
                    if (!nextBlock || !nextBlock.match(/^\d[\.\-]\s/)) appendTag = '</ol>'
                }
            }

            // Inserts <a> tag if any text inside a block mathes an URL format.
            if (settings.autoTagUrl) {
                const urlRegex = /\b((https?:\/\/|www\.)[^\s<>"]+?)(?=[.,!?;:)]?(?:\s|$))/g;
                text = text.replace(urlRegex, (match, url) => {
                    return `<a href="${url}">${url}</a>`;
                });
            }
            if (tag != '') {
                block.innerText = `${prependTag}<${tag}>${text}</${tag}>${appendTag}`;
            } else {
                block.innerText = text;
            }
            builtBlocks.push(block);
            outputPane.appendChild(block);
        });
    }

    inputPane.addEventListener('input', regenerateOutput);
    controlsPane.addEventListener('input', regenerateOutput);

    //   LISTENERS
    // outputPane.addEventListener('mousedown', removeSelClass);
    outputPane.addEventListener('mouseup', onOutputPaneMouseup);

    //   FUNCTIONS

    function getTextArray() {
        const split = inputPane.value.split('\n');
        const clean = split.map(line => line.trim()).filter(line => line.length > 0);
        return clean;
    }

    function onOutputPaneMouseup(event) {
        if (!event.target.classList.contains('block')) {
            hiddenCtxmenu();
            window.getSelection().removeAllRanges();
            removeClassFromBlocks('sel');
            removeClassFromBlocks('focused');
            focusedBlockIndex = null;
            return;
        }
        sbo = getSelectedBlocksObj(event);
        if (!sbo) return;

        // Update focusedBlockIndex based on clicked block
        const clickedBlock = event.target.closest('.block');
        if (clickedBlock) {
            const allBlocks = Array.from(outputPane.querySelectorAll('.block'));
            focusedBlockIndex = allBlocks.indexOf(clickedBlock);
        }

        removeClassFromBlocks('sel');
        removeClassFromBlocks('focused');
        addClassToSelectedBlocks('sel');
        if (clickedBlock) clickedBlock.classList.add('focused');
        removeClassFromBlocks('modified');
        showCtxmenu(event);
    }

    function getSelectedBlocksObj(mouseupEvent) {
        // blocks: array of numbers corresponding to the block's attribute 'position'
        // range: if the seleciton spans only one block, this is the [startOffset, endOffset]
        const result = {
            blocks: [],
            range: []
        };
        if (!outputPane) return null;

        const fallbackBlock = mouseupEvent ? mouseupEvent.target.closest('.block') : null;
        if (!fallbackBlock) return null;

        const selection = window.getSelection();

        // Selection API has nothing or no ranges (likely plain click); fall back to the clicked block
        if (selection == null || selection.rangeCount === 0) {
            const pos = parseInt(fallbackBlock.dataset.position, 10);
            if (!Number.isNaN(pos)) result.blocks.push(pos);
            return result;
        }

        const range = selection.getRangeAt(0);
        const startNode = range.startContainer.nodeType === Node.TEXT_NODE ?
            range.startContainer.parentElement :
            range.startContainer;
        const endNode = range.endContainer.nodeType === Node.TEXT_NODE ?
            range.endContainer.parentElement :
            range.endContainer;
        const startBlock = startNode && startNode.closest ? startNode.closest('.block') : fallbackBlock;
        const endBlock = endNode && endNode.closest ? endNode.closest('.block') : startBlock;

        // Caret-only selection (collapsed); return the single block index
        // if (selection.isCollapsed) {
        //     if (startBlock && startBlock.dataset.position) {
        //         startBlock.classList.add('sel');
        //         const pos = parseInt(startBlock.dataset.position, 10);
        //         result.blocks.push(pos);
        //     }
        //     return result;
        // }

        // Could not resolve selection anchors to blocks; use the block from the event target
        // if (!startBlock || !endBlock) {
        //     if (startBlock && startBlock.dataset.position) {
        //         const pos = parseInt(startBlock.dataset.position, 10);
        //         if (!Number.isNaN(pos)) result.blocks.push(pos);
        //     }
        //     return result;
        // }

        const pushBlockPosition = block => {
            const pos = parseInt(block.dataset.position, 10);
            if (Number.isNaN(pos)) return null;
            if (!result.blocks.includes(pos)) result.blocks.push(pos);
        };

        // Selection spans within one block; capture its index and intra-block range, if any
        if (startBlock === endBlock) {
            pushBlockPosition(startBlock);
            startBlock.classList.add('sel');
            // This happens when a triple-click is done to select the whole text line:
            if (range.startOffset == 0 && range.endOffset == 1) return result;
            // This happens when a click does not select any text (not dragged):
            if (range.startOffset == range.endOffset) return result;
            // This happens when there is selected text:
            result.range.push(range.startOffset, range.endOffset);
            return result;
        } else {
            // This is when the selection spans multiple blocks
            const allBlocks = Array.from(outputPane.querySelectorAll('.block'));
            const startIndex = allBlocks.indexOf(startBlock);
            const endIndex = allBlocks.indexOf(endBlock);

            // Safety: bounds not found among pane blocks
            if (startIndex === -1 || endIndex === -1) {
                return null;
            }

            const [first, last] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
            for (let i = first; i <= last; i++) {
                pushBlockPosition(allBlocks[i]);
            }

            window.getSelection().removeAllRanges();
            return result;
        }
    }

    function removeClassFromBlocks(classStr) {
        const arrBlocks = outputPane.querySelectorAll('.block');
        arrBlocks.forEach(block => {
            block.classList.remove(classStr);
        });
    }

    function addClassToSelectedBlocks(classStr = '') {
        const { blocks } = sbo;
        blocks.forEach(position => {
            const block = outputPane.querySelector(`[data-position='${position}']`);
            block.classList.add(classStr);
        });
    }

    /* -------------------------------------------
       Functions to manipulate tags
    ------------------------------------------- */

    // Strips all existing tags from a block's text content
    function stripAllTags(text) {
        return text.replace(/<[^>]+>/g, '');
    }

    // Applies an array of tags (with attributes) to the current selection.
    // Array use case: <sup><a>footnote link</a></sup>
    // Tags are nested in the order they appear in the array.
    // Options:
    //   - replaceExisting: if true, strips all existing tags before applying new ones (default: true)
    //   - wrapAll: if true, wraps the entire multi-block selection with a single tag pair (default: false)
    function insertTags(tagConfigs = [], options = {}) {
        const { replaceExisting = true, wrapAll = false } = options;
        if (!sbo || !Array.isArray(tagConfigs) || !tagConfigs.length) return;

        const normalizedTags = tagConfigs.map(config => {
            if (!config || typeof config.tag !== 'string') return null;
            const tagName = config.tag.trim();
            if (!tagName) return null;
            const attributes = Array.isArray(config.attributes) ? config.attributes
                .map(attribute => {
                    if (!attribute || typeof attribute.attr !== 'string') return null;
                    const attrName = attribute.attr.trim();
                    if (!attrName) return null;
                    const attrValue = attribute.val != null ? String(attribute.val) : '';
                    return `${attrName}="${attrValue}"`;
                })
                .filter(Boolean) : [];
            return {
                tag: tagName,
                attributes
            };
        }).filter(Boolean);

        if (!normalizedTags.length) return;

        const {
            blocks,
            range
        } = sbo;
        if (!Array.isArray(blocks) || !blocks.length) return;

        // Check if we have ul or ol tag
        const listTag = normalizedTags.find(t => t.tag === 'ul' || t.tag === 'ol');

        const wrapWithTags = (content, tagsToUse = normalizedTags) => {
            let wrapped = content;
            for (let i = tagsToUse.length - 1; i >= 0; i--) {
                const {
                    tag,
                    attributes
                } = tagsToUse[i];
                const attrString = attributes.length ? ` ${attributes.join(' ')}` : '';
                wrapped = `<${tag}${attrString}>${wrapped}</${tag}>`;
            }
            return wrapped;
        };

        // Case: multiple blocks are selected
        if (!range || range.length === 0) {
            // wrapAll mode: wrap entire selection with single opening/closing tag pair
            if (wrapAll && blocks.length > 0) {
                blocks.forEach((position, idx) => {
                    const block = outputPane.querySelector(`[data-position='${position}']`);
                    if (!block) return;

                    let content = block.innerText;
                    // Note: wrapAll does NOT replace existing tags

                    if (idx === 0) {
                        // Add opening tags to first block
                        let openingTags = '';
                        for (const { tag, attributes } of normalizedTags) {
                            const attrString = attributes.length ? ` ${attributes.join(' ')}` : '';
                            openingTags += `<${tag}${attrString}>`;
                        }
                        content = openingTags + content;
                    }

                    if (idx === blocks.length - 1) {
                        // Add closing tags to last block (in reverse order)
                        let closingTags = '';
                        for (let i = normalizedTags.length - 1; i >= 0; i--) {
                            closingTags += `</${normalizedTags[i].tag}>`;
                        }
                        content = content + closingTags;
                    }

                    block.innerText = content;
                });
                addClassToSelectedBlocks('modified');
                return;
            }

            // Special handling for ul/ol tags
            if (listTag) {
                const listTagName = listTag.tag;
                const listAttrString = listTag.attributes.length ? ` ${listTag.attributes.join(' ')}` : '';
                // Filter out ul/ol from tags to apply to each block
                const otherTags = normalizedTags.filter(t => t.tag !== 'ul' && t.tag !== 'ol');

                blocks.forEach((position, idx) => {
                    const block = outputPane.querySelector(`[data-position='${position}']`);
                    if (!block) return;

                    let content = block.innerText;
                    // Strip existing tags if replaceExisting is true
                    if (replaceExisting) {
                        content = stripAllTags(content);
                    }

                    // Wrap with <li> and other tags (not ul/ol)
                    const liTag = { tag: 'li', attributes: [] };
                    const tagsForBlock = [liTag, ...otherTags];
                    content = wrapWithTags(content, tagsForBlock);

                    // Add opening list tag to first block
                    if (idx === 0) {
                        content = `<${listTagName}${listAttrString}>` + content;
                    }

                    // Add closing list tag to last block
                    if (idx === blocks.length - 1) {
                        content = content + `</${listTagName}>`;
                    }

                    block.innerText = content;
                });
                addClassToSelectedBlocks('modified');
            } else {
                // Normal behavior for non-list tags or single block
                blocks.forEach(position => {
                    const block = outputPane.querySelector(`[data-position='${position}']`);
                    if (!block) return;
                    let content = block.innerText;
                    // Strip existing tags if replaceExisting is true
                    if (replaceExisting) {
                        content = stripAllTags(content);
                    }
                    block.innerText = wrapWithTags(content);
                    addClassToSelectedBlocks('modified');
                });
            }
            return;
        }

        // Case by discrimination: text is selected within a single block. 'blocks' const should have only one number
        const block = outputPane.querySelector(`[data-position='${blocks[0]}']`);
        if (!block) return;
        let text = block.innerText;

        // For partial text selection within a block, replaceExisting strips all tags first
        if (replaceExisting) {
            text = stripAllTags(text);
        }

        const startOffset = range[0];
        const endOffset = range[1];
        const before = text.slice(0, startOffset);
        const selected = text.slice(startOffset, endOffset);
        const after = text.slice(endOffset);
        block.innerText = `${before}${wrapWithTags(selected)}${after}`;
        addClassToSelectedBlocks('modified');
    }

    function deleteAllTags() {
        const { blocks } = sbo;
        blocks.forEach(position => {
            const block = outputPane.querySelector(`[data-position='${position}']`);
            if (!block) return;
            const text = block.innerText;
            const cleanText = text.replace(/<[^>]+>/g, '');  // Removes all opening and closing tag without removing the enclosed text
            block.innerText = cleanText;
        });
    }

    function deleteOuterTag() {
        const {
            blocks
        } = sbo;

        blocks.forEach(position => {
            const block = outputPane.querySelector(`[data-position='${position}']`);
            if (!block) return;
            const text = block.innerText;

            const openingTagMatch = text.match(/<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/);
            if (!openingTagMatch) return;
            const fullOpenTag = openingTagMatch[0];
            const tagName = openingTagMatch[1];
            const firstOpenStart = openingTagMatch.index || 0;
            const firstOpenEnd = firstOpenStart + fullOpenTag.length;
            const tagScanRegex = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
            tagScanRegex.lastIndex = firstOpenEnd;
            let depth = 1;
            let closingTagStart = -1;
            let closingTagEnd = -1;
            let tagMatch;
            while ((tagMatch = tagScanRegex.exec(text))) {
                const token = tagMatch[0];
                const isClosing = token.startsWith(`</`);
                if (!isClosing) {
                    depth += 1;
                    continue;
                }
                depth -= 1;
                if (depth === 0) {
                    closingTagStart = tagMatch.index;
                    closingTagEnd = tagScanRegex.lastIndex;
                    break;
                }
            }
            if (closingTagStart === -1 || closingTagEnd === -1) return;
            const before = text.slice(0, firstOpenStart);
            const inner = text.slice(firstOpenEnd, closingTagStart);
            const after = text.slice(closingTagEnd);
            block.innerText = `${before}${inner}${after}`;
        });
    }

    //  COPY BUTTON
    const btnCopy = document.getElementById('copyAll');
    btnCopy.addEventListener('click', () => {
        const combinedText = builtBlocks.map(block => block.textContent || '').join('\n');

        if (typeof navigator !== 'undefined' &&
            navigator.clipboard &&
            navigator.clipboard.writeText) {
            navigator.clipboard.writeText(combinedText).catch(() => {
                copyFallback(combinedText);
            });
        } else {
            copyFallback(combinedText);
        }
    });

    // Fallback when the Clipboard API is not available.
    function copyFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
})();
