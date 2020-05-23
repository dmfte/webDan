setNavBarHeight();

document.querySelector("#btnPlus").addEventListener("click", function(){
    increaseFont(".navbar-brand");
    increaseFont("#btnPlus");
    increaseFont("#btnLess");

    increaseFont(".modal-body");
    increaseFont("h2");
    increaseFont("p");
    setNavBarHeight();
});
document.querySelector("#btnLess").addEventListener("click", function(){
   decreaseFont(".navbar-brand");
   decreaseFont("#btnPlus");
   decreaseFont("#btnLess");

   decreaseFont(".modal-body");
   decreaseFont("h2");
   decreaseFont("p");
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
    var ht = "" +document.querySelector("#navbar1").offsetHeight+ "px";
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
