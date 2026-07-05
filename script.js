const grid = document.querySelector("#project-grid");
const featuredRoot = document.querySelector("#featured-project");
const dialog = document.querySelector("#project-dialog");
const feedbackRoot = document.querySelector("#feedback-summary");
const dialogContent = document.querySelector("#dialog-content");
const closeDialogButton = document.querySelector(".dialog-close");
const filterButtons = [...document.querySelectorAll(".filter-button")];
let lastFocusedElement = null;

function projectMatchesFilter(project, filter) {
  if (filter === "all") return true;
  if (filter === "linked") return project.links.length > 0;
  if (filter === "featured") return Boolean(project.featured);
  if (filter === "soon") return project.tags.includes("בקרוב");
  return true;
}

function renderVisual(project) {
  if (project.visual.kind === "image") {
    return `
      <figure class="project-image">
        <img src="${project.visual.src}" alt="${project.visual.alt}" loading="lazy">
      </figure>
    `;
  }

  return `
    <div class="project-poster" aria-hidden="true">
      <span dir="ltr">${project.visual.label}</span>
    </div>
  `;
}

function renderTags(tags) {
  return tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function renderProjectLinks(project, compact = false) {
  if (!project.links.length) {
    return compact ? "" : `<p class="no-links">קישור לתוצר יתווסף בהמשך.</p>`;
  }

  const links = compact ? project.links.slice(0, 1) : project.links;
  return links.map((link, index) => `
    <a class="project-link ${index === 0 ? "primary" : ""}" href="${link.href}" target="_blank" rel="noopener">
      ${link.label}
    </a>
  `).join("");
}

function renderProjectCard(project) {
  const linkCount = project.links.length;
  return `
    <article class="project-card ${project.featured ? "is-featured" : ""}" data-project="${project.id}">
      ${renderVisual(project)}
      <div class="card-body">
        <p class="project-type">${project.type}</p>
        <h3>${project.title}</h3>
        <p class="owner">${project.owner}</p>
        <p class="summary">${project.summary}</p>
        <div class="tags" aria-label="תגיות">${renderTags(project.tags)}</div>
      </div>
      <div class="card-actions">
        <button class="details-button" type="button" data-open="${project.id}">פרטים</button>
        ${renderProjectLinks(project, true)}
        ${linkCount > 1 ? `<span class="link-count">${linkCount} קישורים</span>` : ""}
      </div>
    </article>
  `;
}

function renderProjects(filter = "all") {
  const projects = showcase.projects.filter((project) => projectMatchesFilter(project, filter));
  grid.innerHTML = projects.map(renderProjectCard).join("");
  grid.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openProject(button.dataset.open, button));
  });
}

function renderFeaturedProject() {
  const project = showcase.projects.find((item) => item.featured);
  featuredRoot.innerHTML = `
    <article class="featured-card">
      <div>
        ${renderVisual(project)}
      </div>
      <div>
        <p class="project-type">${project.type}</p>
        <h3>${project.title}</h3>
        <p class="owner">${project.owner}</p>
        <p>${project.summary}</p>
        <div class="featured-actions">
          ${renderProjectLinks(project, true)}
          <button class="details-button" type="button" data-open="${project.id}">פירוט הפרויקט</button>
        </div>
      </div>
      <div class="feature-blocks">
        ${project.featureBlocks.map((block) => `
          <section>
            <h4>${block.heading}</h4>
            <p>${block.text}</p>
          </section>
        `).join("")}
      </div>
    </article>
  `;
  featuredRoot.querySelector("[data-open]").addEventListener("click", (event) => {
    openProject(project.id, event.currentTarget);
  });
}


function renderFeedbackSummary() {
  if (!feedbackRoot || !showcase.feedback) return;
  const feedback = showcase.feedback;
  feedbackRoot.innerHTML = `
    <article class="feedback-card">
      <div class="feedback-intro">
        <h3>${feedback.headline}</h3>
        <p>${feedback.intro}</p>
      </div>
      <div class="metric-grid" aria-label="מדדי משוב מרכזיים">
        ${feedback.metrics.map((metric) => `
          <div class="metric-card">
            <strong>${metric.value}</strong>
            <span>${metric.label}</span>
          </div>
        `).join("")}
      </div>
      <div class="insight-grid">
        ${feedback.insights.map((insight) => `
          <section class="insight-card">
            <h4>${insight.title}</h4>
            <p>${insight.text}</p>
          </section>
        `).join("")}
      </div>
      <section class="recommendations">
        <h4>המלצות להמשך</h4>
        <ul>
          ${feedback.recommendations.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>
    </article>
  `;
}
function openProject(projectId, trigger) {
  const project = showcase.projects.find((item) => item.id === projectId);
  if (!project) return;

  lastFocusedElement = trigger;
  dialogContent.innerHTML = `
    <article class="dialog-project">
      ${renderVisual(project)}
      <p class="project-type">${project.type}</p>
      <h2 id="dialog-title">${project.title}</h2>
      <p class="owner">${project.owner}</p>
      <p class="summary">${project.summary}</p>
      <div class="tags">${renderTags(project.tags)}</div>
      <ul class="detail-list">
        ${project.details.map((detail) => `<li>${detail}</li>`).join("")}
      </ul>
      <div class="dialog-links" aria-label="קישורי תוצר">
        <h3>קישורי התוצר</h3>
        <div>${renderProjectLinks(project)}</div>
      </div>
    </article>
  `;

  dialog.showModal();
  closeDialogButton.focus();
}

function closeDialog() {
  dialog.close();
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderProjects(button.dataset.filter);
  });
});

closeDialogButton.addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    closeDialog();
  }
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog();
});

renderProjects();
renderFeaturedProject();

renderFeedbackSummary();
