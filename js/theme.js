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

function submitFeedback() {
  const text = document.getElementById('feedback-text').value.trim();
  const msg = document.getElementById('feedback-msg');

  if (!text) {
    msg.textContent = 'Please write something first.';
    msg.style.color = '#cc0000';
    return;
  }

  // for now just show a thank you message
  // later you can connect this to Firebase or EmailJS
  document.getElementById('feedback-text').value = '';
  msg.textContent = 'Thanks for your feedback!';
  msg.style.color = '#0F6E56';

  setTimeout(function() {
    msg.textContent = '';
  }, 3000);
}
function toggleMenu() {
  const menu = document.getElementById('nav-menu');
  menu.classList.toggle('hidden');
}

// close menu when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('nav-menu');
  const hamburger = document.querySelector('.hamburger');
  if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.classList.add('hidden');
  }
});