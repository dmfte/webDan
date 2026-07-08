# Pictures Per Page - UI Purpose And Behavior

## Purpose

Pictures Per Page is a small web app for arranging one or more picture files into printable pages and exporting the result as a PDF.

The user should be able to:

1. Add picture files from their computer.
2. Choose page and layout settings.
3. See the generated pages in a preview workspace.
4. Navigate through all generated pages when they do not fit on screen.
5. Export the generated pages as a PDF file.

The app name must remain **Pictures Per Page**. The UI text is in Spanish.

## Main Workflow

1. The user opens the app.
2. The user adds one or more image files through the upload area.
3. The app stores the selected images in memory and shows that pictures were selected.
4. The user adjusts page settings:
   - Page size.
   - Margins.
   - Pictures per page.
   - Gap between pictures.
   - Maximum visible pages per scroll.
5. The app calculates how many pages are needed.
6. The app places the pictures in a grid-like layout on each page.
7. The app renders all resulting pages in the preview workspace.
8. The user can move through the page previews with the navigation controls or by scrolling.
9. The user clicks **Exportar PDF** to download the final PDF.

## Page Sizes

The app currently offers these page sizes:

- **Carta**: 8.5 x 11 inches. This is the default.
- **Oficio**: 8.5 x 13 inches.

Implementation should convert these sizes to the unit required by the preview and PDF engine. If using PDF points, 1 inch equals 72 points.

## Layout Rules

The app should place pictures in a grid-like array inside each page's printable area.

The printable area is calculated from:

- Page size.
- Top margin.
- Right margin.
- Bottom margin.
- Left margin.
- Gap between pictures.
- Pictures per page.

The app should add as many pages as needed to accommodate all selected pictures.

Example:

- 17 pictures selected.
- 6 pictures per page.
- Result: 3 pages.
  - Page 1: 6 pictures.
  - Page 2: 6 pictures.
  - Page 3: 5 pictures.

Pictures should fit inside their grid cells without being cropped unless a future setting explicitly allows cropping. A safe default is `object-fit: contain` behavior.

## Actionable Elements

### File Input

Element:

- `#pictureFiles`

Visible area:

- `.drop-zone`
- `.drop-label`

Text:

- "Suelta tus fotos aquí"
- "o elige fotos"

Purpose:

Allows the user to select one or more picture files from their device.

Expected behavior:

- Accept multiple files.
- Accept image files only.
- Load selected images into app state.
- Ignore non-image files if they somehow appear.
- Update the selected pictures area.
- Recalculate and re-render pages after files are added.

Drag-and-drop behavior:

- The `.drop-zone` should also accept files dropped onto it.
- On drag over, visually indicate that files can be dropped.
- On drop, load all image files.

### Selected Pictures Area

Element:

- `.picture-tray`

Current text:

- "Aún no has seleccionado fotos."

Purpose:

Shows the current image selection state.

Expected behavior:

- Before files are selected, show the empty message.
- After files are selected, show useful feedback such as:
  - Number of pictures selected.
  - Small thumbnails, if implemented.
  - File names, if thumbnails are not implemented.
- If removal controls are added, each picture should have a way to remove it from the layout.

### Settings Toggle For Mobile

Element:

- `#settingsToggle`

Related elements:

- `.panel-open`
- `.panel-close`
- `.controls-panel`

Purpose:

Opens and closes the settings panel on small screens.

Current implementation:

- This is CSS-only.
- The stylesheet uses `.app-shell:has(.panel-toggle:checked) .controls-panel`.

Expected behavior:

- Do not replace this with JavaScript unless there is a strong reason.
- The "Configuración" label opens the panel.
- The "Cerrar" label closes the panel.

### Export PDF Button

Element:

- `#exportPdf`

Text:

- "Exportar PDF"

Purpose:

Downloads the generated pages as a PDF file.

Expected behavior:

- If no pictures are selected, the button should either be disabled or show a friendly message.
- If pictures are selected, generate a PDF using the same layout shown in the preview.
- Include all pages.
- Preserve page size, margins, gaps, and picture placement.
- Download the file with a clear filename, such as `pictures-per-page.pdf`.
- While exporting, show a loading state if export takes noticeable time.

### Page Size Select

Element:

- `#pageSize`

Options:

- `letter`: Carta - 8.5 x 11 pulg.
- `officio`: Oficio - 8.5 x 13 pulg.

Purpose:

Controls the physical size of each generated page.

Expected behavior:

- Default to `letter`.
- Changing the value should recalculate the layout.
- Changing the value should update both preview pages and exported PDF dimensions.

### Margin Inputs

Elements:

- `#marginTop`
- `#marginRight`
- `#marginBottom`
- `#marginLeft`

Purpose:

Controls the blank space around the printable content area.

Expected behavior:

- Each margin is independent.
- Values should not be negative.
- Current UI values are decimal numbers and should be treated as inches unless the implementation explicitly changes the labels and behavior.
- Changing any margin should recalculate the layout.
- The preview should visually reflect the margins.
- The exported PDF should use the same margins.

### Pictures Per Page Input

Element:

- `#picturesPerPage`

Purpose:

Controls how many pictures are placed on each page.

Expected behavior:

- Minimum value: 1.
- Whole numbers only.
- Changing the value should recalculate:
  - Grid shape.
  - Number of pages.
  - Picture placement.
- The app should prevent invalid values such as 0, negative numbers, empty strings, and decimals.

### Gap Between Pictures Input

Element:

- `#pictureGap`

Purpose:

Controls spacing between picture cells.

Expected behavior:

- Value should not be negative.
- Current UI values are decimal numbers and should be treated as inches unless the implementation explicitly changes the labels and behavior.
- Changing the value should recalculate picture placement.
- The preview and PDF should match.

### Maximum Pages Per Scroll Select

Element:

- `#pagesPerScroll`

Preview toolbar select:

- The preview toolbar also contains a select with the same purpose, but it currently has no ID.

Purpose:

Controls how many page previews should be visible as the maximum group per scroll/navigation step.

Expected behavior:

- Options:
  - 1 page.
  - 2 pages.
  - 3 pages.
  - 4 pages.
- Default: 2 pages.
- This setting is for preview navigation only.
- It does not change the PDF output.
- The controls panel select and preview toolbar select should stay in sync.
- If useful, add an ID to the preview toolbar select, for example `#previewPagesPerScroll`.

### Previous Pages Button

Element:

- Preview toolbar button with `aria-label="Páginas anteriores"`.

Current text:

- "Anterior"

Purpose:

Moves the page preview workspace to the previous group of pages.

Expected behavior:

- Scroll or navigate backward by the selected maximum pages per scroll.
- Disable the button when the first page group is visible.
- This affects preview navigation only.

### Next Pages Button

Element:

- Preview toolbar button with `aria-label="Páginas siguientes"`.

Current text:

- "Siguiente"

Purpose:

Moves the page preview workspace to the next group of pages.

Expected behavior:

- Scroll or navigate forward by the selected maximum pages per scroll.
- Disable the button when the last page group is visible.
- This affects preview navigation only.

### Page Strip

Element:

- `.page-strip`

Purpose:

Displays all generated pages in the same workspace.

Expected behavior:

- Render one page preview for each generated page.
- Allow horizontal scrolling when pages do not fit.
- Page previews should reflect:
  - Page size.
  - Margins.
  - Picture grid.
  - Gaps.
  - Actual selected images.
- Existing placeholder page markup should be replaced or updated dynamically by JavaScript.

### Page Preview

Elements:

- `.paper-sheet`
- `.page-label`
- `.printable-area`
- `.picture-grid`

Purpose:

Represents one printable page.

Expected behavior:

- `.paper-sheet` should represent the full paper.
- `.page-label` should show the page number, such as "Página 1".
- `.printable-area` should represent the page area inside the margins.
- `.picture-grid` should contain the pictures for that page.
- Empty slots on the final page may remain blank if the last page has fewer pictures than the selected pictures per page.

## Suggested App State

An implementation can use a state object like this:

```js
const state = {
    files: [],
    settings: {
        pageSize: "letter",
        margins: {
            top: 0.5,
            right: 0.5,
            bottom: 0.5,
            left: 0.5
        },
        picturesPerPage: 6,
        gap: 0.15,
        pagesPerScroll: 2
    },
    pages: []
};
```

Each file entry can include:

```js
{
    id: "unique-id",
    file,
    name: file.name,
    url: URL.createObjectURL(file),
    width,
    height
}
```

Each generated page can include:

```js
{
    pageNumber: 1,
    pictures: [
        {
            fileId: "unique-id",
            slotIndex: 0,
            x,
            y,
            width,
            height
        }
    ]
}
```

## Implementation Notes

- Keep the preview and PDF layout calculations based on the same source data.
- Avoid one layout algorithm for screen and another for PDF, because they can drift.
- Revoke object URLs when pictures are removed or when the app no longer needs them.
- Validate user inputs before rendering.
- Use friendly empty, error, and loading states.
- The current HTML and CSS are design-only. `index.js` is expected to provide behavior.
- Do not change the app name from **Pictures Per Page**.
