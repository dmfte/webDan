// ACCORDION SECTION STARTS
// Accordio functions
function accordion(thisHeader) {
    if (thisHeader.classList.contains("active")) {
      collapse(thisHeader);
    } else {
      var otherExpanded = document.querySelectorAll(".head-outer:not(" + thisHeader.id + ")");
      otherExpanded.forEach(head => {
        collapse(head);
      });
      expand(thisHeader);
    }
  }
  function expand(header) {
    var accordion = header.closest(".accordion");
    var body = accordion.querySelector(".accordion-body");
    header.classList.add("active");
    body.style.maxHeight = body.scrollHeight + "px";
  }
  function collapse(header) {
    var accordion = header.closest(".accordion");
    var body = accordion.querySelector(".accordion-body");
    header.classList.remove("active");
    body.style.maxHeight = 0;
  }
  // ACCORDION SECTION ENDS
  // ADD ACCORDION DYNAMICALLY STARTS
  const btnAccordionAdd = document.querySelector(".btn-add");  // CLICK TO ADD ACCORDION.
  const btnAccordionRemove = document.querySelector(".btn-remove");
  const overlayBtnRemove = document.querySelector("#overlay-btn-remove");
  btnAccordionAdd.addEventListener("click", function(){
     var txtTitle = document.querySelector(".container-add .title").innerHTML;
     var txtBody = document.querySelector(".container-add .content").innerText;
     addAccordion(txtTitle, txtBody);
   });
  btnAccordionRemove.addEventListener("click", async function(){
     const subMenu = document.querySelector(".sub-menu");
     if (subMenu.classList.contains("active")) {  // MEANS SUB-MENU IS SHOWN.
      subMenu.classList.remove("active");
      subMenu.style.maxHeight = "0px";
      overlayBtnRemove.style.transform = "scale(0)";
     } else {  // MEANS SUB-MENU IS HIDDEN.
      subMenu.classList.add("active");
      var list = listAndReasignId(".head-outer");
      await list.then(async (arrXY)=>{  // USE THE RESOLVED RETURN VALUE OF ListAndReasignId().
        if(arrXY.length > 0){
          var ulElement = fillSubMenu(arrXY);
          await ulElement.then(ul => {  // USE THE RESOLVED RETURN VALUE OFfillSubMenu().
            subMenu.innerHTML = "";
            subMenu.appendChild(ul);
          });
          subMenu.style.maxHeight = subMenu.scrollHeight + "px";
          overlayBtnRemove.style.transform = "scale(1)";
        }
      });
     }
   });
   overlayBtnRemove.addEventListener("click", function(){
    btnAccordionRemove.click();
   })
  // Functions
  async function addAccordion(title, body){
    const scriptAccordion = document.querySelector("[type='text/html-accordion']");
    const newDiv = document.createElement("div");
    newDiv.innerHTML = scriptAccordion.innerHTML;
    const newDivParent =document.querySelector("." + scriptAccordion.dataset.parent);
    var ulElement = document.createElement("ul");
    newDiv.classList.add(scriptAccordion.dataset.class);
    newDiv.querySelector("h1").innerHTML = title;
    await body.split(/\n/g).forEach(line => {  //SPLIT BODY CONTENT FOR EACH return-line
      var li = document.createElement("li");
      li.innerText = line;
      ulElement.appendChild(li);
    });
    newDiv.querySelector(".body-text").appendChild(ulElement);
    newDivParent.appendChild(newDiv);
    listAndReasignId(".head-outer");
  }
  async function listAndReasignId(className){
    var arrXY = [];
    var allHeaders = document.querySelectorAll(className);
    // console.log(allHeaders);
    await allHeaders.forEach((elem, i) => {
      var newId = "head" + (i+1);
      // console.log(newId);
      // console.log(elem);
      elem.id = newId;
      arrXY.push([newId, elem.querySelector("h1").innerHTML]);
      
    });
    return arrXY;
  }
  async function fillSubMenu(arrXY){
    const ulElement = document.createElement("ul");
    await arrXY.forEach(async (xy) => {  //[head1, header-title]
      const li = document.createElement("li");
      li.addEventListener("click", function(){
        const head = document.getElementById(xy[0]);
        const divToRemove = head.closest(".accordion");
        const divToRemoveParent = divToRemove.closest(".container-accordion");
        divToRemoveParent.removeChild(divToRemove);
        listAndReasignId(".head-outer");
        const btn = document.querySelector(".btn-remove").click();  // CLICK BUTTON AGAIN TO CLOSE SUB-MENU.
      })
      li.innerHTML = xy[1];
      const header = document.getElementById(xy[0]);
      await li.addEventListener("mouseenter", function(){
        if(header !== null){  // IT CAN BE null WHEN HIGHLIGHTED HEADER IS CLICKED, REMOVED, AND ANIMATION IS STILL IN PROGRESS.
          header.querySelector(".head-inner").classList.add("targetted");
        }
      });
      li.addEventListener("mouseleave", function(){
        if(header !== null){
          header.querySelector(".head-inner").classList.remove("targetted");
        }
      });
      ulElement.appendChild(li);
    });
    return ulElement;
  }
  function removeAccordion(id){
    const header = document.getElementById(id);
    const parentToRemove = header.closest(".accordion");
    const container = header.closest(".container-accordion");
    container.removeChild(parentToRemove);
    listAndReasignId(".head-outer");
  }
  // ADD ACCORDION DYNAMICALLY ENDS
  // GET ACCORDION HTML CODE STARTS
  const btnCopyCode = document.querySelector(".btn-copy-code");
  const txtCode = document.querySelector(".txt-code");
  btnCopyCode.addEventListener("click", function() {
    var code = "<div class='container-accordion'>" +document.querySelector(".container-accordion").innerHTML+ "</div>";
    txtCode.value = code;
  });
  // GET ACCORDION HTML CODE ENDS
