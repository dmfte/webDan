setNavBarHeight();

document.querySelector("#btnPlus").addEventListener("click", function(){
    increaseFont(".changeFont");
    setNavBarHeight();
});
document.querySelector("#btnLess").addEventListener("click", function(){
   decreaseFont(".changeFont")
   setNavBarHeight();
});

document.querySelector("#collapseNone").addEventListener("click", function(){
  var obj = document.querySelectorAll(".collapse");
  for (var i = 0; i < obj.length; i++) {
    obj[i].setAttribute("class", "collapse show");
  }
});
document.querySelector("#collapseAll").addEventListener("click", function(){
  var obj = document.querySelectorAll(".collapse");
  for (var i = 0; i < obj.length; i++) {
    obj[i].setAttribute("class", "collapse");
  }
});


function setNavBarHeight(){
    var ht = "" +document.querySelector(".navbar").offsetHeight+ "px";
    document.querySelector(".divHeight").style.height = ht;
}

function decreaseFont (selectorName){
  var obj = document.querySelectorAll(selectorName);
  if (obj.length === 1) {
    var strng = "calc(" +getComputedStyle(obj[0]).getPropertyValue("font-size")+ " - 4px)";
    obj[0].style.fontSize = strng;
  } else if (obj.length > 1) {
    for (var i = 0; i < obj.length; i++) {
      var strng = "calc(" +getComputedStyle(obj[i]).getPropertyValue("font-size")+ " - 4px)";
      obj[i].style.fontSize = strng;
    }
  }
}

function increaseFont (selectorName) {
  var obj = document.querySelectorAll(selectorName);
  if (obj.length === 1) {
    var strng = "calc(" +getComputedStyle(obj[0]).getPropertyValue("font-size")+ " + 4px)";
    obj[0].style.fontSize = strng;
  } else if (obj.length > 1) {
    for (var i = 0; i < obj.length; i++) {
      var strng = "calc(" +getComputedStyle(obj[i]).getPropertyValue("font-size")+ " + 4px)";
      obj[i].style.fontSize = strng;
    }
  }
}

function expandAll(){
  var obj = querySelectorAll("collapse");
  for (var i = 0; i < obj.length; i++) {
    obj[i].setAttribute("class", "collapse show");
  }
}
function expandNone(){
  var obj = querySelectorAll("collapse");
  for (var i = 0; i < obj.length; i++) {
    obj[i].setAttribute("class", "collapse");
  }
}


var linkEdit = document.querySelector("#linkEdit");
linkEdit.addEventListener("click", function(){
  setNavBarHeight();
});

// Section to edit the Outline
var txtSubt = document.querySelector("#txtSubt");
var txtCont = document.querySelector("#txtCont");
var txtModalLink = document.querySelector("#txtModalLink");
var txtModalCont = document.querySelector("#txtModalCont");

var btnAddCard = document.querySelector("#btnAddCard");
var btnCreaModal = document.querySelector("#btnCreaModal");
var btnAddModal = document.querySelector("#btnAddModal");
var btnOk = document.querySelector("#btnComplete");

var selStart;
var selEnd;
var strToAdd = "<div class='accordion' id='idAccordion'>";

var counterCard = 1;
var counterModal = 1;

btnCreaModal.addEventListener("click", function() {
    txtCont.focus();
    selStart = txtCont.selectionStart;
    selEnd = txtCont.selectionEnd;
    txtModalLink.value = window.getSelection();
    txtModalCont.focus();
});

btnAddModal.addEventListener("click", function() {
    txtCont.focus();
    selStart = txtCont.selectionStart;
    selEnd = txtCont.selectionEnd;
    var str = txtCont.value.slice(0, selStart) + "<a href='' data-toggle='modal' data-target='#modal" + counterModal + "'>" + txtModalLink.value + "</a>" + txtCont.value.slice(selEnd);
    txtCont.value = str;
    txtModalLink.value = "";
    txtModalCont.value = "";
});

btnAddCard.addEventListener("click", function() {
    var codeModalLink = "<div class='modal fade' id='modal" + counterModal + "' tabindex='-1' role='dialog' aria-labelledby='modalLabel" + counterModal + "' aria-hidden='true'><div class='modal-dialog' role='document'><div class='modal-content'><div class='modal-header'><h2 class='modal-title changeFont' id='modalLabel" + counterModal + "'>" + txtModalLink.value + "</h2><button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>";
    var codeModalBody = "<div class='modal-body changeFont'>" + txtModalCont.value + "</div></div></div></div>";
    var codeCardTitle = "<div class='card'><div class='headStyle' id='heading" + counterCard + "'><button class='btn btn-link btn-lg col-12 changeFont' type='button' data-toggle='collapse' data-target='#collapse" + counterCard + "' aria-expanded='false' aria-controls='collapse" + counterCard + "'>" + txtSubt.value + "</button></div>";
    var codeCardBody = "<div id='collapse" + counterCard + "' class='collapse' aria-labelledby='heading" + counterCard + "' data-parent='#idAccordion'><div class='card-body changeFont'>" + txtCont.value + "</div></div></div>";

    strToAdd = strToAdd + codeModalLink + codeModalBody + codeCardTitle + codeCardBody;
    counterModal++;
    counterCard++;
    clearAll();
});

btnOk.addEventListener("click", function() {
    var divOutline = document.querySelector("#outline");
    var finalStr = strToAdd + "</div>"
    divOutline.innerHTML = finalStr;
    document.querySelector("#toCopy").value = strToAdd;
    clearAll();
});

function clearAll(){
  txtSubt.value = "";
  txtSubt.focus();
  txtCont.value = "";
  txtModalLink.value = "";
  txtModalCont.value = "";
}
