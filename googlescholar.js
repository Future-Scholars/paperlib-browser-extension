function appendAddButton() {
  document.querySelectorAll(".gs_or").forEach(function (element) {
    const oButton = document.createElement("a");
    oButton.href = "#";
    oButton.innerHTML = "+ Add to Paperlib";
    element
      .querySelector(".gs_ri")
      .querySelector(".gs_fl")
      .appendChild(oButton);

    oButton.addEventListener("click", function (e) {
      e.preventDefault();
      oButton.innerHTML = "Processing...";
      chrome.runtime.sendMessage(
        {
          action: "add",
          document: element.outerHTML,
        },
        function (response) {
          oButton.innerHTML = response.response;
        }
      );
    });
  });
}

appendAddButton();
