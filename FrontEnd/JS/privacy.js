const toggleBtn = document.getElementById("themeToggle");

toggleBtn.addEventListener("click", () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");

  if (currentTheme === "light") {
    html.setAttribute("data-theme", "dark");
    toggleBtn.textContent = "☀️";
  } else {
    html.setAttribute("data-theme", "light");
    toggleBtn.textContent = "🌙";
  }
});
