const projects = window.projects;
const timeline = window.timeline;
const skillGroups = window.skillGroups;

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Navbar — one requestAnimationFrame-throttled scroll listener.
const header = $('#site-header');
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => { header.classList.toggle('scrolled', window.scrollY > 24); scrollTicking = false; });
    scrollTicking = true;
  }
}, { passive: true });
const menu = $('#mobile-menu');
$('.menu-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const open = menu.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
});
$$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => menu.classList.remove('open')));
$('#back-to-top').addEventListener('click', () => $('#top').scrollIntoView({ behavior: 'smooth' }));

// Hero — reveal the title with CSS staggered animation. No animation loop.
const heroTitle = $('#hero-title');
const heroObserver = new IntersectionObserver(([entry]) => {
  heroTitle.classList.toggle('reveal', entry.isIntersecting);
}, { threshold: .2 });
heroObserver.observe(heroTitle);

// Dialog helpers — media is injected only when requested and cleared on close.
const showreelDialog = $('#showreel-dialog');
let dialogOpener;
const focusableSelector = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
function trapDialogFocus(dialog, event) {
  if (event.key !== 'Tab') return;
  const focusable = $$(focusableSelector, dialog).filter((element) => !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function openDialog(dialog, opener) {
  dialogOpener = opener;
  dialog.showModal();
  $('.dialog-close', dialog).focus();
}
$$('dialog').forEach((dialog) => {
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); return; }
    trapDialogFocus(dialog, event);
  });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('close', () => { if (dialogOpener) dialogOpener.focus(); dialogOpener = null; });
});
$$('[data-showreel]').forEach((button) => button.addEventListener('click', () => {
  $('#video-frame').innerHTML = '<iframe src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1" title="Aster Studio showreel" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  openDialog(showreelDialog, button);
}));
showreelDialog.addEventListener('close', () => { $('#video-frame').replaceChildren(); });

// Gallery — bento cards, category filters, and keyboard-accessible lightbox.
const grid = $('#project-grid');
projects.forEach((project, index) => {
  const card = document.createElement('button');
  card.className = `project-card ${project.size}`;
  card.type = 'button';
  card.dataset.category = project.category;
  card.dataset.index = index;
  card.setAttribute('aria-label', `View ${project.title}`);
  card.innerHTML = `<img src="${project.image}" alt="${project.title}" width="1200" height="900" loading="lazy"><span class="project-overlay"><strong>${project.title}</strong><small>${project.category} / ${project.year}</small></span>`;
  grid.append(card);
});
$$('.filter-button').forEach((filter) => filter.addEventListener('click', () => {
  $$('.filter-button').forEach((button) => button.classList.remove('active'));
  filter.classList.add('active');
  const category = filter.dataset.filter;
  $$('.project-card').forEach((card) => card.classList.toggle('hidden', category !== 'all' && card.dataset.category !== category));
}));
const galleryDialog = $('#gallery-dialog');
const galleryImageContainer = $('#gallery-image-container');
let currentProject = 0;
function showProject(index) {
  currentProject = (index + projects.length) % projects.length;
  const project = projects[currentProject];
  let galleryImage = $('#gallery-image', galleryImageContainer);
  if (!galleryImage) {
    galleryImage = document.createElement('img');
    galleryImage.id = 'gallery-image';
    galleryImage.width = 1200;
    galleryImage.height = 900;
    galleryImage.loading = 'lazy';
    galleryImageContainer.append(galleryImage);
  }
  galleryImage.src = project.image;
  galleryImage.alt = project.title;
  $('#gallery-title').textContent = project.title;
  $('#gallery-category').textContent = `${project.category} / ${project.year}`;
  $('#gallery-index').textContent = `${String(currentProject + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
}
function openGallery(index) { showProject(index); openDialog(galleryDialog, grid.querySelector(`[data-index="${index}"]`)); }
grid.addEventListener('click', (event) => { const card = event.target.closest('.project-card'); if (card) openGallery(Number(card.dataset.index)); });
$('#gallery-prev').addEventListener('click', () => showProject(currentProject - 1));
$('#gallery-next').addEventListener('click', () => showProject(currentProject + 1));
galleryDialog.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') showProject(currentProject - 1); if (event.key === 'ArrowRight') showProject(currentProject + 1); });
$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
galleryDialog.addEventListener('close', () => galleryImageContainer.replaceChildren());
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));

// Timeline — one observer handles sections, timeline nodes, and the drawn line.
const timelineList = $('#timeline-list');
timeline.forEach((item, index) => {
  const node = document.createElement('article');
  node.className = 'timeline-item';
  node.style.transitionDelay = `${index * .08}s`;
  node.innerHTML = `<span class="timeline-dot"></span><span class="timeline-year">${item.year}</span><h3>${item.title}</h3><span class="timeline-context">${item.context}</span><p>${item.description}</p><div class="timeline-skills">${item.skills.map((skill) => `<span>${skill}</span>`).join('')}</div>`;
  timelineList.append(node);
});
const skillsList = $('#skills-list');
skillGroups.forEach((group) => { const element = document.createElement('div'); element.className = 'skill-group'; element.innerHTML = `<h3>${group.name}</h3><div>${group.skills.map((skill) => `<span class="skill-pill">${skill}</span>`).join('')}</div>`; skillsList.append(element); });
const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible', 'visible'); if (entry.target.classList.contains('timeline-item')) $('.timeline-line').classList.add('drawn'); revealObserver.unobserve(entry.target); } }), { threshold: .15 });
$$('.reveal-section, .timeline-item').forEach((element) => revealObserver.observe(element));

// Contact — native form POST remains the lowest-resource fallback.
// TODO: replace the Formspree endpoint in index.html before publishing.
