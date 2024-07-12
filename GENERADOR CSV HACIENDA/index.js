const ventasKeys = {
    forRowid: ["date", "classDoc", "typeDoc", "numRes", "numSerDoc", "numDoc", "numCtrlInt", "nit", "name", "vtasExct", "vtasNoSuj", "vtasGrabLoc", "debtFis", "vtasCta3NoDomic", "debtFiscVtaCta3", "totVtas", "dui", "numAnx"],
    text: ["Fecha", "Clase Doc.", "Tipo Doc.", "Núm. Res.", "Núm. Serie Doc.", "Núm. Doc.", "Núm. Ctrl. Int.", "NIT o NRC", "Nombre, Razón Social o Denominación", "Vtas. Excentas", "Vtas. No Sujetas", "Vtas. Grabadas Locales", "Débito Fiscal", "Vtas. Cta. 3os No Domic.", "Débt. Fisc. Vta. Cta. 3os", "Total de Vtas.", "DUI Cliente", "Núm. de Anx."]
};
const comprasKeys = {
    forRowid: ["date", "classDoc", "typeDoc", "numDoc", "nit", "nombPov", "CompsIntrExntNoSuj", "IntrnExntNoSuj", "ImprtExntNoSuj", "CompsIntrnGrav", "IntrnGravBienes", "ImprtGravBienes", "ImprtGravServcs", "CredtFisc", "totComps", "dui", "tipoOp", "clasif", "sector", "tipoCostGast", "numAnx"],
    text: ["Fecha", "Clase Doc.", "Tipo Doc.", "Num. Doc.", "NIT o NRC", "Nomb. Prov.", "Comps. Int. Excnt. No Suj.", "Intrn. Exnt. No Suj.", "Imprt. Exnt. No Suj.", "Comps. Intrn. Grav.", "Intrn. Grav. Bienes", "Imprt. Grav. Bienes", "Imprt. Grav. Servcs.", "Credt. Fisc.", "Tot. Comps.", "DUI", "Tipo Op.", "Clasif.", "Sector", "Tipo Cost/Gast", "Num. Anx."]
};
const retencionKeys = {
    forRowid: ["nit", "date", "typeDoc", "serie", "numDoc", "montSuj", "monRtcn", "dui", "numAnx"],
    text: ["NIT Agente", "Fecha Emisión", "Tipo Doc.", "Serie", "Núm. Doc.", "Monto Suj.", "Monto Rtcn. 1%", "DUI Agente", "Núm. de Anx."]
};
const percepcionKeys = {
    forRowid: ["nit", "date", "typeDoc", "serie", "numDoc", "montSuj", "monPercp", "dui", "numAnx"],
    text: ["NIT Agente", "Fecha Emisión", "Tipo Doc.", "Serie", "Núm. Doc.", "Monto Suj.", "Monto Percp. 1%", "DUI Agente", "Núm. de Anx."]
};

const pages = document.querySelectorAll(".page");

// HAMBURGER MENU

const smClearStoredData = document.getElementById("clear-stored-data");
smClearStoredData.addEventListener("click", () => {
    window.localStorage.removeItem("CSVnator");
    location.reload();
});

const smSeparator = document.getElementById("separator");
const spanSeparator = smSeparator.querySelector("span");
smSeparator.addEventListener("click", () => {

});



autoLoad();
checkAllRegex();

document.addEventListener("keyup", (k) => {
    autoSave();
    if (k.key == "Escape") {
        pages.forEach(page => {
            page.classList.remove("add-row");
            page.classList.remove("remove-row");
        });
    }
});

const ifJson = document.getElementById("ifJson");
ifJson.addEventListener("input", async (event) => {
    let currentpage = getCurrentPage();
    let lastrow = currentpage.querySelector(".row.last");

    let arr = await getJsonObj(event);
    console.log(arr);
    return;

});

function getJsonObj(e) {
    return new Promise((res, rej) => {
        let arr = [];
        const files = e.target.files;
        if (!files) return;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (evt) => {
                arr.push(JSON.parse(evt.target.result));
            }
            reader.readAsText(file);
        }
        res(arr);
    });
}


function autoSave() {
    let objCSVnator = {};
    let objPages = {};
    pages.forEach(page => {
        // Default values.
        let inputsDef = page.querySelectorAll(".default-values input");
        let objDefs = {};
        objPages[page.id] = {};
        inputsDef.forEach(idef => {
            objDefs[idef.getAttribute("def-rowid")] = idef.value;
        });
        objPages[page.id].defs = objDefs;
        // Values.
        let rows = page.querySelectorAll(".row:not(.default");
        let arrVals = [];

        rows.forEach((row, i) => {
            if (i !== 0 && areAllInputsEmpty(row)) return;
            if (row.classList.contains("last")) return;
            let inputsVals = row.querySelectorAll("input");
            let objVals = {};
            inputsVals.forEach(ival => {
                objVals[ival.getAttribute("row-id")] = ival.value;
            });
            arrVals.push(objVals);
        });
        objPages[page.id].values = arrVals;
    });

    objCSVnator = {
        pages: objPages,
        // CSV separator character.
        separator: spanSeparator.innerText
    }
    let json = JSON.stringify(objCSVnator);
    window.localStorage.setItem("CSVnator", json);
}

function defaultToArrayOfRows(arrayrows) {
    let page = arrayrows[0].closest(".page");
    for (let j = 0; j < arrayrows.length; j++) {
        const row = arrayrows[j];
        let inputs = row.querySelectorAll("input");
        for (let k = 0; k < inputs.length; k++) {
            const input = inputs[k];
            let defInput = page.querySelector(`[def-rowid=${input.getAttribute("row-id")}]`);
            input.value = defInput.value;
        }
    }
}

function autoLoad() {
    const csvNator = window.localStorage.getItem("CSVnator");
    if (!csvNator) {
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            let arrayrows = page.querySelectorAll(".rowgrid.values");
            defaultToArrayOfRows(arrayrows);
        }
        autoSave();
        return;
    }
    const obj = JSON.parse(csvNator);
    spanSeparator.innerText = obj.separator;
    for (const page in obj.pages) {
        const objPage = obj.pages[page];
        const tab = document.getElementById(page);
        // Defaults.
        const secdef = tab.querySelector(".section-defaults");
        for (const def in objPage.defs) {
            if (Object.hasOwnProperty.call(objPage.defs, def)) {
                const objDefaults = objPage.defs;
                const input = secdef.querySelector(`[def-rowid=${[def]}]`);
                input.value = objDefaults[def];
            }
        }
        // Values.
        let secval = tab.querySelector(".section-values");
        let firstRow = secval.querySelector(".row.first");
        let lastRow = secval.querySelector(".row.last");
        secval.innerHTML = "";
        secval.appendChild(firstRow);
        secval.appendChild(lastRow);
        let lastUsedRow = firstRow;
        const rowsObj = objPage.values;
        for (let i = 0; i < rowsObj.length; i++) {
            const ro = rowsObj[i];
            if (i > 0) {
                let increasedParent = onBtnAddRow(lastUsedRow);
                let newArrRows = increasedParent.querySelectorAll(".row:not(.first):not(.last)");
                let newLastRow = newArrRows[newArrRows.length - 1];
                lastUsedRow = newLastRow;
            }
            for (const key in ro) {
                if (Object.hasOwnProperty.call(ro, key)) {
                    const value = ro[key];
                    const input = lastUsedRow.querySelector(`[row-id=${key}]`);
                    input.value = value;
                }
            }
        }
    }
}



// ADD/REMOVE ROWS BEHAVIOR
const btnToggleAdd = document.getElementById("btnToggleAdd");
const btnToggleRemove = document.getElementById("btnToggleRemove");

const arrPages = document.querySelectorAll(".page");

btnToggleAdd.addEventListener("click", () => {
    arrPages.forEach(page => {
        page.classList.remove("remove-row");
        page.classList.toggle("add-row");
    });
});
btnToggleRemove.addEventListener("click", () => {
    arrPages.forEach(page => {
        page.classList.remove("add-row");
        page.classList.toggle("remove-row");
    });
});

function onBtnAddRow(btn) {
    let thisrow = btn.closest(".row");
    let parent = thisrow.closest(".section-values");
    let newrow = thisrow.cloneNode(true);
    newrow.classList.remove("first");
    let arrRows = parent.querySelectorAll(".row");
    let newArrRows = [];
    for (let i = 0; i < arrRows.length; i++) {
        const row = arrRows[i];
        newArrRows.push(row);
        if (row == thisrow) newArrRows.push(newrow);
        if (i == arrRows.length - 1) {
            parent.innerHTML = "";
            newArrRows.forEach(nar => {
                parent.appendChild(nar);
                if (nar == newrow) applyDefaultValues(nar);
            });
        }
    }
    checkAllRegex();
    autoSave();
    return parent;
}

function onBtnRemoveRow(btn) {
    let thisrow = btn.closest(".row");
    let parent = thisrow.closest(".section-values");
    let allrows = parent.querySelectorAll(".row");
    let newrowsarray = [];
    for (let i = 0; i < allrows.length; i++) {
        const currentrow = allrows[i];
        if (thisrow == currentrow) continue;
        newrowsarray.push(currentrow);
        if (i == allrows.length - 1) {
            parent.innerHTML = "";
            newrowsarray.forEach(row => {
                parent.appendChild(row);
            });
        }
    }
    autoSave();
}

function applyDefaultValues(row) {
    let page = row.closest(".page");
    let inputs = row.querySelectorAll("input");
    inputs.forEach(input => {
        const defInput = page.querySelector(`[def-rowid=${input.getAttribute("row-id")}]`);
        input.value = defInput.value;
    });
}

function areAllInputsEmpty(rowElement) {
    arrInputs = rowElement.querySelectorAll(".rowgrid.values input");
    let allempty = true;
    for (let i = 0; i < arrInputs.length; i++) {
        const input = arrInputs[i];
        if (input.value.length !== 0) {
            allempty = false;
            break;
        }
    }
    return allempty;
}



function twoDecimals(floatNum) {
    let num = (Math.round(floatNum * 100) / 100).toString(); //  Reducing to a maximum of 2 decimals.
    if (/^\d+$/.test(num)) { //  0
        return num + ".00";
    } else if (/^\d+\.\d$/.test(num)) { //  0.0
        return num + "0";
    } else { //  0.00
        return "" + num;
    }
}

function checkAllRegex() {
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let inputs = page.querySelector(".section-values").querySelectorAll("input");
        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];
            let rowValues = input.closest(".rowgrid.values")
            let regex = new RegExp(input.dataset.regex);

            if (input.value.length == 0) {
                // If input is empty.
                input.classList.remove("wrong");
                input.classList.add("empty");
            } else {
                // If input is not empty.
                input.classList.remove("empty");
                if (regex.test(input.value)) {
                    //Date
                    if (input.getAttribute("placeholder") == "DD/MM/YYYY") {
                        // If input is a date, check if it is a valid date and valid year.
                        if (!isValidDateFormat(input.value)) {
                            input.classList.add("wrong");
                            continue;
                        }
                    }

                    // If input is not empty and corrctly formated.
                    input.classList.remove("wrong");
                } else {
                    // If input is not empty but wrongly formated.
                    input.classList.add("wrong");
                }

                // if it is not empty, regarless of whether is correctly formated or not.
                if (input.classList.contains("dui" || input.classList.contains("nit"))) {
                    // If input is not empty, correctly formated, but it is either a NIT or DUI input.
                    let otherone = (input.classList.contains("dui")) ? rowValues.querySelector(".nit") : rowValues.querySelector(".dui");
                    if (input.value.length > 0 && otherone.value.length > 0) {
                        input.classList.add("wrong");
                        otherone.classList.add("wrong");
                        continue;
                    }
                }
            }
        }
    }
}


function isValidDateFormat(txt) { //  Provided it is in the format "dd/mm/yyyy".
    let regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(txt)) return false;
    let arr = txt.match(regex);
    let [, day, month, year] = arr;
    let dd = parseInt(day);
    let mm = parseInt(month);
    let yyyy = parseInt(year);
    let arrMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //  Days of each month.
    if (isLeapYear(yyyy)) {
        arrMonths[1] = 29;
    }
    if (yyyy < 1) {
        // Invalid year.
        return false;
    }
    if (mm < 1 || mm > 12) {
        // Invalid month.
        return false;
    }
    if (dd < 1 || dd > arrMonths[mm - 1]) {
        // Invalid date-
        return false;
    }
    return true;
}

function isLeapYear(intYear) {
    if (!Number.isInteger(intYear)) return false;
    if (intYear % 4 !== 0) return false;
    if (intYear % 100 == 0) {
        if (intYear % 400 == 0) return true;
        return false;
    }
    return true;
}


// ON INPUT OF ALL <input>

function onInputInput(input) {
    let page = input.closest(".page");
    let row = input.closest(".row");
    let regex = new RegExp(input.dataset.regex);
    let rowValues = row.querySelector(".rowgrid.values");

    // Last row will be partially hidden until the first input is filled.
    if (row.classList.contains("last")) {
        let valuesRow = row.querySelector(".rowgrid.values");
        let firstinput = valuesRow.firstElementChild;
        if (firstinput.value.length !== 0) {
            row.classList.remove("last");
            onBtnAddRow(valuesRow);
            let lastrow = row.nextElementSibling;
            lastrow.classList.add("last");
            firstinput.focus();
        }
    }
    if (row.classList.contains("default")) {
        let hiddenRow = page.querySelector(".row.last");
        let hiddenInput = hiddenRow.querySelector(`[row-id=${input.getAttribute("def-rowid")}]`);
        hiddenInput.value = input.value;

    }


    if (regex.test(input.value) || input.value.length == 0) {
        startCalculations(input).then((input) => {
            calculateTaxes(input).then((input) => {
                getTotal(input).then((input) => {
                    checkAllRegex();
                })
            });
        });
    }

    if (input.getAttribute("row-id") == "date") {
        let regexDd = /^\d{2}$/;
        let regexMm = new RegExp(/^\d{2}\/\d{2}$/);
        if (regexDd.test(input.value)) input.value += "/";
        if (regexMm.test(input.value)) input.value += "/";
    }

    checkAllRegex();


}


function startCalculations(input) {
    return new Promise((res, re) => {
        res(input);
    });
}

function calculateTaxes(input) {
    return new Promise((res, rej) => {
        if (input.classList.contains("taxable")) {
            let taxonid = input.dataset.taxOn;
            let rowvalues = input.closest(".rowgrid.values");
            let arrTaxables = rowvalues.querySelectorAll(`[data-tax-on=${taxonid}]`);
            let taxon = rowvalues.querySelector(`[row-id=${taxonid}]`);
            let tax = parseFloat(taxon.dataset.perct);
            let sumTax = 0;
            for (let i = 0; i < arrTaxables.length; i++) {
                console.log("here");
                const taxable = arrTaxables[i];
                if (taxable.value.length == 0) {
                    console.log("skipped");
                    continue;
                }
                sumTax += parseFloat(taxable.value) * (tax / 100);
            }
            taxon.value = twoDecimals(sumTax);
        }
        res(input);
    });
}

function getTotal(input) {
    return new Promise((res, rej) => {
        if (input.classList.contains("addend")) {
            let rowvalues = input.closest(".rowgrid");
            let totalInput = rowvalues.querySelector(".total");
            let arrAddends = rowvalues.querySelectorAll(".addend");
            let sum = 0;
            for (let i = 0; i < arrAddends.length; i++) {
                const addend = arrAddends[i];
                if (addend.value.length > 0) {
                    sum += parseFloat(twoDecimals(addend.value));
                }
                if (i == arrAddends.length - 1) totalInput.value = twoDecimals(sum);
            }
        }
        res(input);
    });
}

// DOWNLOAD CSV

const btnDownloadCsv = document.getElementById("btnDownloadCsv");
btnDownloadCsv.addEventListener("click", generateCSV);

function getCurrentPage() {
    let checkedtab = document.querySelector("#nav-top .menu-items input[name=cbgTabs]:checked");
    let currentpage = document.getElementById(checkedtab.getAttribute("for-tab"));
    return currentpage;
}

function generateCSV() {
    if (window.localStorage.getItem("CSVnator") == null) return;
    let currentpage = getCurrentPage();
    let arrRows = currentpage.querySelectorAll(".section-values .row:not(.last)");
    let arrText = [];
    for (let i = 0; i < arrRows.length; i++) {
        const row = arrRows[i];
        if (areAllInputsEmpty(row)) continue;
        const arrInputs = row.querySelectorAll(".rowgrid.values input");
        let line = "";
        for (let j = 0; j < arrInputs.length; j++) {
            const input = arrInputs[j];
            line += input.value + spanSeparator.innerText;
        }
        arrText.push(line);
    }
    let str = arrText.join("\n");
    let blob = new Blob([str], {
        type: "text/csv"
    });
    let url = window.URL.createObjectURL(blob);
    let tabname = "" + currentpage.id.charAt(0).toUpperCase() + currentpage.id.slice(1);
    let filename = addTimestamp(tabname);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function addTimestamp(name) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day} ${hours}${minutes}${seconds}`;

    return `${name} - ${timestamp}`;
}

// DIALOGS

const bodyDiagInfo = document.getElementById("diagInfo");
const topbarBtnInfo = document.getElementById("topbarBtnInfo");

const diagInfo = new AutoDialog({
    dialog: bodyDiagInfo,
    title: "Info",
    trigger: topbarBtnInfo,
    ok: false,
    cancel: false
})

const bodyDiagContactme = document.getElementById("diagContactme");
const topbarBtnContactme = document.getElementById("topbarBtnContactme");
const diagContactme = new AutoDialog({
    dialog: bodyDiagContactme,
    title: "Contactarme",
    trigger: topbarBtnContactme,
    ok: false,
    cancel: false
})
topbarBtnContactme.addEventListener("click", () => {
    let body = bodyDiagContactme.querySelector(".body");
    let sel = window.getSelection();
    let range = new Range();
    range.selectNodeContents(body);
    sel.removeAllRanges();
    sel.addRange(range);
})

const bodyDiagSeparator = document.getElementById("diagSeparator");
const itDiagSeparator = bodyDiagSeparator.querySelector(".body input");
itDiagSeparator.value = spanSeparator.innerText;
const separator = document.getElementById("separator");
const diagSeparator = new AutoDialog({
    dialog: bodyDiagSeparator,
    title: "Caracter separador",
    trigger: separator
});

diagSeparator.onOk(() => {
    spanSeparator.innerText = itDiagSeparator.value;
    autoSave();
});

const bodyDiagClearData = document.getElementById("diagClearData");
const spDiagClear = bodyDiagClearData.querySelector(".body span");
const clearData = document.getElementById("clear-data");
clearData.addEventListener("click", () => {
    let currentpage = getCurrentPage();
    let pageid = currentpage.id;
    pagename = pageid.charAt(0).toUpperCase() + pageid.slice(1);
    spDiagClear.innerText = pagename;
});
const diagClearData = new AutoDialog({
    dialog: bodyDiagClearData,
    title: "Limpiar datios",
    trigger: clearData
});
diagClearData.onOk(() => {
    let currentpage = getCurrentPage();
    let section = currentpage.querySelector(".section-values");
    let arrRows = section.querySelectorAll(".row:not(.first):not(.last)");
    arrRows.forEach(row => {
        section.removeChild(row);
    });
    let first = section.querySelector(".row.first");
    let last = section.querySelector(".row.last");
    defaultToArrayOfRows([first, last]);
    checkAllRegex();
    first.querySelector(".rowgrid.values input:first-of-type").focus();
    autoSave();
});