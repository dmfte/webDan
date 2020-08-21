var heads = document.querySelectorAll(".accordion .header");

heads.forEach(head => {
  head.addEventListener("click", function() {
    var bodyId = head.dataset.targetId;
    var body = document.getElementById(bodyId);

    if (head.classList.contains("active")) { //IF ALREADY EXPANDED, COLLAPSE BODY
      head.classList.remove("active");
      head.lastChild.classList.remove("active");
      body.style.maxHeight = 0;
    } else { //IF ALREADY COLLAPSED...
      // EXPAND BODY AND...
      head.classList.add("active");
      head.lastChild.classList.add("active");
      body.style.maxHeight = body.scrollHeight + "px";
       // COLLAPSE ALL OTHERS
      var otherBodies = document.querySelectorAll(".accordion .body:not(#" + bodyId + ")");
      otherBodies.forEach(body => {
        var header = document.querySelector("[data-target-id=" + body.id + "]");
        header.classList.remove("active");
        header.lastChild.classList.remove("active");
        body.style.maxHeight = 0;
      });
    }
  });
});

//
// var btnPlus = document.querySelector(".btn-plus");
// btnPlus.addEventListener("click", function(){
//   var allDiv = document.querySelectorAll(".div");
//   allDiv.forEach(div => {
//     var strng = "calc(" + getComputedStyle(div).getPropertyValue("font-size") + " + 4px";
//     div.style.fontSize = strng;
//   });
// });
