//  Overlays
// const modalOverlay = document.querySelector(".modal-overlay");
const navOverlay = document.querySelector(".nav-overlay");

// NAVIGATION BAR
const arrNavTabs = document.querySelectorAll(".nav-menu .container-menu li");
const navHamb = document.querySelector(".nav-hamb");
const navSubmenu = document.querySelector(".nav-hamb .nav-submenu");

arrNavTabs.forEach((li, i) => {
  li.addEventListener("click", function () {
    document.body.setAttribute("class", li.dataset.tab);
  });
});
navHamb.addEventListener("click", function () {
  toggleNavSubmenu();
});

const modcontentSeparatorChar = document.getElementById("modcontentSeparatorChar");
const modcontentCleartabs = document.getElementById("modcontentCleartabs");
const modcontentClearDefaultVals = document.getElementById("modcontentClearDefaultVals");
const modcontentClearStoredData = document.getElementById("modcontentClearStoredData");
navSubmenu.addEventListener("click", evt => {
  let params = {};
  switch (evt.target.id) {
    case "separator":
      modcontentSeparatorChar.querySelector("#itSeparatorChar").value = CSVnator.separator;
      params = {
        title: "Caracter separador",
        content: modcontentSeparatorChar,
        okEnabled: false
      }
      break;
    case "clear-data":
      modcontentCleartabs.querySelectorAll("[type='radio']").forEach(rbtn => {
        rbtn.checked = false;
      });
      params = {
        title: "Limpiar datos",
        content: modcontentCleartabs,
        okEnabled: false
      }
      break;
    case "clear-default":
      modcontentClearDefaultVals.querySelectorAll("[type='radio']").forEach(rbtn => {
        rbtn.checked = false;
      });
      params = {
        title: "Limpiar valores por defecto.",
        content: modcontentClearDefaultVals,
        okEnabled: false
      }
      break;
    case "clear-stored-data":
      params = {
        title: "Limpiar datos guardados.",
        content: modcontentClearStoredData,
        okEnabled: true
      }
      break;
    default:
      break;
  }
  showDialog(dialog, params);
});

//  Body keys listener.
document.addEventListener("keyup", (k) => {
  if (k.key == "Escape") {
    if (navHamb.classList.contains("active")) {
      toggleNavSubmenu();
    }
    // if (modalOverlay.classList.contains("active")) {
    //   hideActiveModal();
    // }
  }
});

function toggleNavSubmenu() {
  navOverlay.classList.toggle("active");
  navHamb.classList.toggle("active");
  navSubmenu.classList.toggle("active");
}
//  ------

//  MODALS
const dialog = document.querySelector("dialog");

dialog.addEventListener("click", evt => {  //  Dialog element should be covered with a div so this triggers when clicking on the backdrop.
  if (evt.target.tagName === "DIALOG") {
    dialog.close();
  }
});

function getRbCheckedValue(arrRadBtns) {
  let value = "";
  for (let i = 0; i < arrRadBtns.length; i++) {
    if (arrRadBtns[i].checked) {
      value = arrRadBtns[i].value;
      break;
    }
    else {
      value = undefined;
    }
  }
  return value;
}

function onModalOkBtnClick(element) { //  This button already closes the modal.
  let thisDialog = element.closest("dialog");
  switch (thisDialog.querySelector(".modal-content").id) {
    //  TO CLEAR TABS.
    case "modcontentCleartabs":
      let arrRbClearTab = thisDialog.querySelectorAll("input[type='radio']");
      let rbtnClearTabValue = getRbCheckedValue(arrRbClearTab);
      switch (rbtnClearTabValue) {
        case "delete_all_tabs":
          let allTabs = document.querySelectorAll(".container-tab");
          allTabs.forEach(tab => {
            clearTab(tab);
            autoSave();
          });
          break;
        case "delete_current_tab":
          let tab = getCurrentTab();
          clearTab(tab);
          autoSave();
          break;
        default:
          break;
      }
      break;
    //  TO CHANGE THE SEPARATOR CHARACTER FOR THE CSV FILE.
    case "modcontentSeparatorChar":
      let itSeparatorChar = thisDialog.querySelector("input[type='text']");
      spanSeparator.innerText = itSeparatorChar.value;
      autoSave();
    //  TO CLEAR DEFAULT VALUES
    case "modcontentClearDefaultVals":
      let arrRbClearDef = thisDialog.querySelectorAll("input[type='radio']");
      let rbtnClearDefValue = getRbCheckedValue(arrRbClearDef);
      switch (rbtnClearDefValue) {
        case "delete_all_defs":
          let allTabs = document.querySelectorAll(".container-tab");
          allTabs.forEach(tab => {
            clearDefaultValues(tab);
          });
          autoSave();
          break;
        case "delete_current_def":
          let tab = getCurrentTab();
          clearDefaultValues(tab);
          autoSave();
          break;
        default:
          break;
      }
      break;
    // TO DELTE STORED VALUES.
    case "modcontentClearStoredData":
      window.localStorage.removeItem("CSVnator");
      location.reload();
      break;
    default:
      break;
  }
}

function clearDefaultValues(tab) {
  let defaultRow = tab.querySelector(".row.default");
  clearRow(defaultRow);
}

function showDialog(dialog, params) {
  dialog.querySelector(".title").innerText = params.title;
  dialog.querySelector("form .body").appendChild(params.content);
  if (!params.okEnabled) dialog.querySelector("#btnOk").disabled = true;
  dialog.showModal();
}

dialog.addEventListener("close", evt => {

  dialog.querySelector(".title").innerHTML = "";
  dialog.querySelector(".body").innerHTML = "";
});

function enableBtnOk(element) {
  let dialog = element.closest("dialog");
  let btnOk = dialog.querySelector("#btnOk");
  switch (element.type) {
    case "text":
      if (element.value.length > 0) {
        btnOk.disabled = false;
      } else {
        btnOk.disabled = true;
      }
      break;
    case "radio":
      btnOk.disabled = false;
      break;
    default:
      break;
  }
}
//  ------

//  LOAD STORED VALUES
const spanSeparator = document.getElementById("spanSeparator");
var CSVnator = {};

if (window.localStorage.getItem("CSVnator") !== null) {
  CSVnator = JSON.parse(window.localStorage.getItem("CSVnator"));
  spanSeparator.innerText = CSVnator.separator;
  (CSVnator.values).forEach(objTabs => {
    let tab = document.getElementById(objTabs.id);
    let amountRows = objTabs.values.length - 2; //  Row with default input values and one blank row  already exist.
    let containerRows = tab.querySelector(".container-rows");
    for (let i = 0; i < amountRows; i++) {
      addBlankRowAtEnd(containerRows);
    }
    objTabs.values.forEach(row => {
      row.forEach(objInput => {
        document.getElementById(objInput.id).value = objInput.value;
      });
    });
    let defDate = tab.querySelector(".row.default .first");
    if (defDate.value.length > 0) {
      let lastDateInput = tab.querySelector(".row:last-of-type .first");
      makeButton(lastDateInput);
    }
  });
  validateInputsRegexp();
} else {
  console.log("No values stored");
}

//  STORE VALUES

function autoSave() {
  CSVnator.separator = spanSeparator.innerText;
  CSVnator.values = getArrTabs();
  window.localStorage.setItem("CSVnator", JSON.stringify(CSVnator));
}

function getArrTabs() {
  let arrTabs = document.querySelectorAll(".container-tab");
  return Array.from(arrTabs, tab => {
    return {
      id: tab.id,
      values: getArrValuesPerTab(tab)
    }
  });
}

function getArrValuesPerTab(tab) {
  let arrRows = tab.querySelectorAll(".row:not(.labels)");
  return Array.from(arrRows, row => {
    return getArrValuesPerRow(row);
  });
}

function getArrValuesPerRow(row) {
  let arrInputs = row.querySelectorAll("input");
  return Array.from(arrInputs, input => {
    return {
      id: input.id,
      value: input.value
    }
  });
}
//  ------

// CLEAR VALUES

function clearTab(tab) {
  let arrRows = tab.querySelectorAll(".row:not(.default):not(.labels)");
  for (let i = 1; i < arrRows.length; i++) {
    removeRow(arrRows[i]);
  }
  clearRow(arrRows[0]);
  arrRows[0].classList.remove("active");
  let lastDateInput = arrRows[0].querySelector("input.first");
  unmakeButton(lastDateInput);
  lastDateInput.focus();
}

function removeRow(row) {
  let parent = row.parentElement;
  parent.removeChild(row);
}
function clearRow(row) {
  let arrInputs = row.querySelectorAll("input");
  arrInputs.forEach(input => {
    input.value = "";
    input.classList.remove("wrong");
  });
}
//  ------

// INPUT ELEMENT BEHAVIOR
function onInputInput(e) {
  if (checkRegex(e)) {
    e.classList.remove("wrong");
  } else {
    e.classList.add("wrong");
  }
  if (e.value.length == 0 && !e.classList.contains("addend")) e.classList.remove("wrong");
  let row = e.closest(".row"); //  Input's parent.
  let containerTab = row.closest(".container-tab");

  // Hide/unhide the rest of inputs    
  if (e.classList.contains("first")) {
    let parent = row.parentElement;
    let rn = rowNumber(row);
    if (rn.i == rn.l - 1 && e.value.length > 0) { // If the current row is the last one and input is not empty.
      setDefaultValues(row);
      // Show rest of inputs.
      row.classList.add("active");
      // Add next blank row.
      addBlankRowAtEnd(parent);
    }
    if (rn.i == rn.l - 2 && e.value.length == 0) { // If the current row is the one before the last one and input is empty.
      if (areInputsEmpty(row)) { // If the rest of inputs are empty.
        // Hide rest of inputs.
        row.classList.remove("active");
        if (rn.last.querySelector("input.first").classList.contains("btn")) { //  If the last Date was a button.
          makeButton(e);
          //  Focus on preious (two before last one) first-input field.
          rn.arr[rn.l - 3].querySelector("input.first").focus();
        }
        parent.removeChild(rn.last);
      }
    }
  }

  //  Check if it is a Date field.
  if (e.classList.contains("date") && checkRegex(e)) {
    if (validateDateFormat(e.value)) {
      e.classList.remove("wrong");
    } else {
      e.classList.add("wrong");
    }
  }

  // If it is a dolar amount whehter taxable or not.
  if (e.classList.contains("addend") && checkRegex(e)) {
    if (e.classList.contains("taxable")) {
      let taxOn = row.querySelector("." + e.dataset.taxOn);
      let arrNodeTaxable = row.querySelectorAll("[data-tax-on='" + e.dataset.taxOn + "'");
      let arrTaxable = Array.prototype.slice.call(arrNodeTaxable).map(taxable => {
        return taxable.value.length > 0 ? taxable.value : 0;
      });
      let totTaxable = arrTaxable.reduce((tot, taxable) => {
        return parseFloat(tot) + parseFloat(taxable);
      });
      taxOn.value = getTax(totTaxable, taxOn.dataset.perct);
    }

    let totInput = row.querySelector(".total");
    totInput.value = getTotal(e);
    totInput.classList.remove("wrong");
    e.classList.remove("wrong");
  }
  // Currency fields should not be empty.
  if ((e.classList.contains("addend") || e.classList.contains("total")) && e.value.length == 0) e.classList.add("wrong");

  //  If this is the first input of the .default row, a new row  should be added with a button for first input.
  if (row.classList.contains("default") && e.classList.contains("first")) {
    let container = row.closest(".container-rows");
    let lastRow = container.querySelector(".row:not(.default):not(.labels):last-of-type");
    let lastFirst = lastRow.querySelector("input.first");
    if (e.value.length > 0) {
      makeButton(lastFirst);
    } else {
      unmakeButton(lastFirst);
    }
  }


  // ------ VENTAS ------
  if (containerTab.id == "container-ventas") {
    let VtasClassDoc, vtasNumDoc, vtasTotInput, vtasNumCtrlInt, vtasNumRes;
    let allInput = row.querySelectorAll("input");
    for (let i = 0; i < allInput.length; i++) {
      const input = allInput[i];
      if (input.id.includes("vtas_numRes")) vtasNumRes = input;
      if (input.id.includes("vtas_numCtrlInt")) vtasNumCtrlInt = input;
      if (input.id.includes("vtas_classDoc")) VtasClassDoc = input;
      if (input.id.includes("vtas_numDoc")) vtasNumDoc = input;
      if (input.id.includes("vtas_totVtas")) vtasTotInput = input;
    }


    // Si Numero Resolucion contiene "dte" (Dcumento Tributario Electronico) Numero Ctrl Interno debe estar vacio.
    if (e == vtasNumCtrlInt || e == vtasNumRes) {
      if (vtasNumRes.value.match(/^(dte)/i) !== null && vtasNumCtrlInt.value.length !== 0) {
        vtasNumCtrlInt.classList.add("wrong");
      } else {
        vtasNumCtrlInt.classList.remove("wrong");
        if (checkRegex(vtasNumCtrlInt)) vtasNumCtrlInt.classList.remove("wrong");
      }
    }

    // Si Clase Documento es 2, Numero Ctrl Interno debe ser igual a Numero Documento.
    if (e == VtasClassDoc || e == vtasNumDoc || e == vtasNumCtrlInt) {
      if (VtasClassDoc.value == "2" && vtasNumDoc.value !== vtasNumCtrlInt.value) {
        vtasNumCtrlInt.classList.add("wrong");
      } else {
        vtasNumCtrlInt.classList.remove("wrong");
        if (checkRegex(vtasNumCtrlInt)) vtasNumCtrlInt.classList.remove("wrong");
      }
    }
    if (e == vtasNumDoc && VtasClassDoc.value == "2") {
      vtasNumCtrlInt.value = e.value;
      vtasNumCtrlInt.classList.remove("wrong");
    }

    // ------ COMPRAS ------
    let compClasDoc;
  }

  autoSave();
}

function rowNumber(row) { //  Returns data about the row, including an array of all .row objects except .default and .labels.
  let parent = row.parentElement;
  let arrRows = parent.querySelectorAll(".row:not(.default):not(.labels)");
  return {
    i: Array.prototype.slice.call(arrRows).indexOf(row),
    l: arrRows.length,
    arr: arrRows,
    last: arrRows[arrRows.length - 1]
  };
}

function makeButton(inputElement) {
  inputElement.classList.add("btn");
  inputElement.classList.remove("wrong");
  inputElement.value = "▾";
  inputElement.style.fontSize = "1.4rem";
  inputElement.addEventListener("click", addDefaultDate);
}

function unmakeButton(inputElement) {
  inputElement.classList.remove("btn");
  inputElement.value = "";
  inputElement.style.fontSize = "0.7rem";
  inputElement.removeEventListener("click", addDefaultDate);
}

function addDefaultDate(evt) {
  let input = evt.target;
  let row = input.closest(".row");
  let parent = row.parentElement;
  addBlankRowAtEnd(parent, addDefaultDate);
  row.classList.add("active");
  unmakeButton(input);
  setDefaultValues(row);
  validateInputsRegexp(row);
  autoSave();
}

function addBlankRowAtEnd(parent, dateListener) {
  let row = parent.querySelector(".row:last-of-type");
  row.classList.add("active");
  let cloneRow = row.cloneNode(true);
  cloneRow.classList.remove("active");
  cloneRow.dataset.rowNum = parseInt(cloneRow.dataset.rowNum) + 1;
  cloneRow.querySelectorAll("input").forEach((input) => {
    input.classList.remove("wrong");
    input.id = "" + cloneRow.dataset.rowNum + "-" + input.id.split("-")[1]; //  New ID will be new row number plus same part after the underscore.
    if (input.value !== "▾") { //  If it doesn{t have the button due to a default date.
      input.value = "";
    }
  });
  if (dateListener !== null) {
    cloneRow.querySelector(".first").addEventListener("click", dateListener);
  }
  parent.appendChild(cloneRow);
}

function getTax(num, intPerct) {
  let tax = parseInt(intPerct) / 100;
  return twoDecimals(num * tax);
}

function getTotal(e) {
  let tot = 0;
  let parentRow = e.closest(".row");
  let arrAddends = parentRow.querySelectorAll(".addend");
  arrAddends.forEach(addend => {
    if (checkRegex(addend) && addend.value.length > 0) {
      tot += parseFloat(twoDecimals(addend.value));
    }
  });
  return twoDecimals(tot);
}

function areInputsEmpty(row) {
  let arrInputs = row.querySelectorAll("input");
  let allEmpty = 0;
  arrInputs.forEach(input => {
    if (input.value.length > 0) {
      allEmpty++;
    }
  });
  if (allEmpty > 0) {
    return false;
  } else {
    return true;
  }
}

function setDefaultValues(row) {
  let parent = row.parentElement;
  let defaultInputs = parent.querySelectorAll(".row.default input");
  for (let i = 0; i < defaultInputs.length; i++) {
    let defaultInput = defaultInputs[i];
    let input = row.querySelectorAll("input")[i];
    if (defaultInput.value.length > 0) { //  If there's any corresponding default value.
      input.value = defaultInput.value;
    }
  }
}

function validateInputsRegexp() {
  let tabs = document.querySelectorAll(".container-tab");
  tabs.forEach(tab => {
    let rows = tab.querySelectorAll(".row:not(.default):not(.labels)");
    rows.forEach(row => {
      let inputs = row.querySelectorAll("input");
      inputs.forEach(input => {
        if (!input.classList.contains("btn")) {
          if (input.classList.contains("date")) {
            if (validateDateFormat(input.value) || input.value.length == 0 || input.value == "▾") {
              input.classList.remove("wrong");
            } else {
              input.classList.add("wrong");
            }
          } else {
            checkRegex(input);
          }
        }
      });
      //  DUI and NIT have to be mutually exclusive.
      let nit = row.querySelector(".nit");
      let dui = row.querySelector(".dui");
      if (nit.value.length > 0 && dui.value.length > 0) {
        nit.classList.add("wrong");
        dui.classList.add("wrong");
      }
    });
  });
}

function checkRegex(e) {
  if (e.dataset.regex !== undefined) {
    regex = new RegExp(e.dataset.regex);
    if (regex.test(e.value) || e.value.length == 0) {
      // e.classList.remove("wrong");
      return true;
    } else {
      // e.classList.add("wrong");
      return false;
    }
  } else {
    // e.classList.remove("wrong");
    return true;
  }
}

function validateDateFormat(txt) { //  Provided it is in the format "dd/mm/yyyy".
  // if (!/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) {
  //   return false;
  // } else {
  let arrDate = txt.split("/");
  let dd = parseInt(arrDate[0]);
  let mm = parseInt(arrDate[1]);
  let yyyy = parseInt(arrDate[2]);
  let arrMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //  Days of each month.
  if (isLeapYear(yyyy)) {
    arrMonths[1] = 29;
  }
  if (yyyy < 1) {
    // Invalid year.
    return false;
  } else {
    // Valid year.
    if (mm < 1 || mm > 12) {
      // Invalid month.
      return false;
    } else {
      // Valid month.
      if (dd < 1 || dd > arrMonths[mm - 1]) {
        // Invalid date-
        return false;
      } else {
        // Valid date.
        return true;
      }
    }
  }
  // }
}

function isLeapYear(intYear) {
  let leap = null;
  if (intYear % 4 === 0) {
    if (intYear % 100 === 0) {
      if (intYear % 400 === 0) {
        leap = true;
      } else {
        leap = false;
      }
    } else {
      leap = true;
    }
  } else {
    leap = false;
  }
  return leap;
}

function onDateKeyup(event) { //  Automatically converts text to the format dd/mm/yyyy
  let txt = event.target.value;
  if (event.keyCode !== 8) { //  If it is not backspace.
    if (/^(\d{2})$/m.test(txt)) {
      event.target.value = txt + "/";
    }
    if (/^(\d{2})\/(\d{2})$/.test(txt)) {
      event.target.value = txt + "/"
    }
  }
}

function preventAlphabetKeydown(event) {
  if (/^[a-zA-Z ]$/.test(event.key) && event.ctrlKey == false) {
    event.preventDefault();
  }
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
// ------

function getCurrentTab() {
  let tabName = `container-${document.body.classList}`;
  return document.querySelector(`#${tabName}`);
}
//  GENERATE CSV FILE
function generateCSV() {
  let tabName = document.body.classList[0];
  //  Get the array of data from the current tab.
  let arrRows = [];
  CSVnator.values.forEach(objTabs => {
    if (objTabs.id == "container-" + tabName) {
      arrRows = objTabs.values.slice(1).slice(0, -1); //  The first position corresponds to the Default Values, not needes for the CSV file. The last position is always an empty row.
    }
  });
  //  Make the array of data a string chain.
  let completeStr = arrRows.map(row => {
    return row.map(input => {
      return input.value;
    }).join(spanSeparator.innerText);
  }).join("\n");

  //  Create the CSV file with the string chain.
  let csvFile = null;
  if (csvFile !== null) window.URL.revokeObjectURL(csvFile);
  let data = new Blob([completeStr], {
    type: "text/csv"
  });
  csvFile = window.URL.createObjectURL(data);

  //  Get the first part of the file name.
  let docFileName = "";
  console.log(tabName);
  switch (tabName) {
    case "ventas":
      docFileName = "Detalle de Ventas "
      break;
    case "compras":
      docFileName = "Detalle de Compras ";
      break;
    case "retencion":
      docFileName = "Detalle de Retencion ";
      break;
    default:
      break;
  }
  //  Complete the file name with the timestamp.
  let fileName = addTimestamp(docFileName);
  //  Create a ghost "a" element to click to download the file.
  let a = document.createElement("a");
  a.href = csvFile;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function addTimestamp(txt) {
  let t = new Date();
  let year = t.getFullYear();
  let month = addZerosFirst(t.getMonth(), 2);
  let date = addZerosFirst(t.getDay(), 2);
  let hours = addZerosFirst(t.getHours(), 2);
  let minutes = addZerosFirst(t.getMinutes(), 2);
  let seconds = addZerosFirst(t.getSeconds(), 2);
  let timeStamp = year + "-" + month + "-" + date + " " + hours + "\:" + minutes + "\:" + seconds;
  return txt + timeStamp;
}

function addZerosFirst(txtNum, intOfDigits) {
  let difference = intOfDigits - txtNum.length;
  for (var i = 0; i < difference; i++) {
    txtNum = "0" + txtNum;
  }
  return txtNum;
}
