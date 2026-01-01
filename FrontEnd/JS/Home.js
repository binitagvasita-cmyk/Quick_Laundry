// Global theme state (in-memory, no localStorage)
window.appTheme = {
  current: "light",
  toggle: function () {
    this.current = this.current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.current);
  },
  set: function (theme) {
    this.current = theme;
    document.documentElement.setAttribute("data-theme", theme);
  },
  get: function () {
    return this.current;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // Load Header
  fetch("Header.html")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((data) => {
      const headerElement = document.getElementById("header");
      if (headerElement) {
        headerElement.innerHTML = data;

        // Initialize header after DOM is inserted
        const script = document.createElement("script");
        script.src = "JS/header.js";
        script.onload = () => console.log("Header loaded successfully");
        script.onerror = () => console.error("Failed to load header.js");
        document.body.appendChild(script);
      }
    })
    .catch((error) => console.error("Error loading header:", error));

  // Load Sidebar
  fetch("Sidebar.html")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then((data) => {
      const sidebarElement = document.getElementById("sidebar");
      if (sidebarElement) {
        sidebarElement.innerHTML = data;

        // Initialize sidebar after DOM is inserted
        const script = document.createElement("script");
        script.src = "JS/Sidebar.js";
        script.onload = () => console.log("Sidebar loaded successfully");
        script.onerror = () => console.error("Failed to load Sidebar.js");
        document.body.appendChild(script);
      }
    })
    .catch((error) => console.error("Error loading sidebar:", error));
});
