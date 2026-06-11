function toggleTheme() {
  const body = document.body;
  const btn = document.querySelector('.theme-toggle');
  
  body.classList.toggle('dark');
  
  if (body.classList.contains('dark')) {
    btn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    btn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

// apply saved theme on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  document.querySelector('.theme-toggle').textContent = '☀️';
}