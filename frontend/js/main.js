const BASE_URL = "http://localhost:5000";

// ===================== REGISTER =========================
async function registerUser(event) {
  event.preventDefault();
  console.log("registerUser() triggered");

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const role = "user";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Registration failed.");
    }

    alert("Registration successful!");
    window.location.href = "index.html";
  } catch (err) {
    console.error("Error during registration:", err);
    alert("Registration failed: " + (err.message || "Unknown error"));
  }
}

// ===================== LOGIN =========================
async function loginUser(event) {
  event.preventDefault();
  console.log("loginUser() triggered");

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Login failed.");
    }

    alert("Login successful!");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed: " + (err.message || "Unknown error"));
  }
}

// ===================== LOGOUT =========================
function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// ===================== LOAD BUGS =========================
async function loadBugs() {
  const bugListContainer = document.getElementById("bugListContainer");
  if (!bugListContainer) return;
  bugListContainer.innerHTML = "<p class='text-center'>Loading bugs…</p>";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/bugs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to fetch bugs");
    }

    const bugs = data;
    if (bugs.length === 0) {
      bugListContainer.innerHTML = "<p class='text-center'>No bugs reported yet.</p>";
      return;
    }

    bugListContainer.innerHTML = "";
    bugs.forEach((bug) => {
      // Only allow status dropdown if user is admin or bug.assignee matches current user:
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const canChangeStatus =
        currentUser.role === "admin" ||
        (bug.assignee && bug.assignee._id === currentUser._id);

      // Create card
      const card = document.createElement("div");
      card.className = "card mb-3";

      // Status dropdown (if allowed)
      let statusDropdown = bug.status;
      if (canChangeStatus) {
        statusDropdown = `
          <select class="form-select form-select-sm" 
                  onchange="updateBugStatus('${bug._id}', this.value)">
            <option ${bug.status === "Open" ? "selected" : ""}>Open</option>
            <option ${bug.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option ${bug.status === "Resolved" ? "selected" : ""}>Resolved</option>
            <option ${bug.status === "Closed" ? "selected" : ""}>Closed</option>
          </select>
        `;
      }

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${bug.title}</h5>
          <p class="card-text">${bug.description}</p>
          <p><strong>Project:</strong> ${bug.project?.name || "N/A"}</p>
          <p><strong>Status:</strong> ${statusDropdown}</p>
          <p><strong>Priority:</strong> ${bug.priority}</p>
          <p><strong>Reported by:</strong> ${bug.reportedBy?.name || "Unknown"}</p>
          <p><small class="text-muted">Created at: ${new Date(
            bug.createdAt
          ).toLocaleString()}</small></p>
        </div>
      `;

      bugListContainer.appendChild(card);
    });
  } catch (err) {
    bugListContainer.innerHTML = `<p class="text-center text-danger">Error loading bugs: ${err.message}</p>`;
  }
}

// ===================== UPDATE BUG STATUS =========================
async function updateBugStatus(bugId, newStatus) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/bugs/${bugId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to update bug status");
    }
    // Refresh bug list
    loadBugs();
  } catch (err) {
    console.error("Error updating bug status:", err);
    alert("Could not update status: " + (err.message || "Unknown error"));
  }
}

// ===================== CHECK USER ROLE =========================
function checkUserRole() {
  const navCreateProject = document.getElementById("navCreateProject");
  const navManageProjects = document.getElementById("navManageProjects");
  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.role === "admin") {
    if (navCreateProject) navCreateProject.style.display = "block";
    if (navManageProjects) navManageProjects.style.display = "block";
  } else {
    if (navCreateProject) navCreateProject.style.display = "none";
    if (navManageProjects) navManageProjects.style.display = "none";
  }
}

// ===================== LOAD PROJECTS =========================
async function loadProjects() {
  const projectListContainer = document.getElementById("projectListContainer");
  if (!projectListContainer) return;
  projectListContainer.innerHTML = "<p class='text-center'>Loading projects…</p>";

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to fetch projects");
    }

    const projects = data;
    if (projects.length === 0) {
      projectListContainer.innerHTML = "<p class='text-center'>No projects found.</p>";
      return;
    }

    projectListContainer.innerHTML = "";
    projects.forEach((proj) => {
      const card = document.createElement("div");
      card.className = "card mb-3";

      card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 class="card-title">${proj.name}</h5>
            <p class="card-text">${proj.description}</p>
            <p><small>Created by: ${proj.createdBy?.name || "Unknown"}</small></p>
          </div>
          <div>
            <button class="btn btn-sm btn-primary me-2" onclick="populateProjectEditForm('${proj._id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProject('${proj._id}')">Delete</button>
          </div>
        </div>
      `;

      projectListContainer.appendChild(card);
    });
  } catch (err) {
    projectListContainer.innerHTML = `<p class="text-center text-danger">Error loading projects: ${err.message}</p>`;
  }
}

// ===================== CREATE PROJECT =========================
async function createProject(event) {
  event.preventDefault();

  const projectName = document.getElementById("projectName").value;
  const projectDescription = document.getElementById("projectDescription").value;

  if (!projectName || !projectDescription) {
    alert("Name and description required.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: projectName, description: projectDescription, members: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Project creation failed.");
    }
    alert("Project created successfully!");
    window.location.href = "project-list.html";
  } catch (err) {
    console.error("Create project error:", err);
    alert("Project creation failed: " + (err.message || "Unknown error"));
  }
}

// ===================== POPULATE PROJECT EDIT FORM =========================
async function populateProjectEditForm(projectId) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Failed to fetch projects");

    // Find the project in the returned list
    const proj = data.find((p) => p._id === projectId);
    if (!proj) {
      alert("Project not found");
      return;
    }

    // Prompt for new name/description (simple approach)
    const newName = prompt("New project name:", proj.name);
    const newDesc = prompt("New description:", proj.description);
    if (newName === null || newDesc === null) return; // user cancelled

    // Call updateProject
    await updateProject(projectId, newName, newDesc);
  } catch (err) {
    console.error("Error fetching project for edit:", err);
    alert("Could not load project");
  }
}

// ===================== UPDATE PROJECT =========================
async function updateProject(projectId, name, description) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, members: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Project update failed.");
    }
    alert("Project updated!");
    loadProjects();
  } catch (err) {
    console.error("Update project error:", err);
    alert("Project update failed: " + (err.message || "Unknown error"));
  }
}

// ===================== DELETE PROJECT =========================
async function deleteProject(projectId) {
  if (!confirm("Are you sure you want to delete this project?")) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Project deletion failed.");
    }
    alert("Project deleted!");
    loadProjects();
  } catch (err) {
    console.error("Delete project error:", err);
    alert("Project deletion failed: " + (err.message || "Unknown error"));
  }
}

// ===================== INITIALIZE PAGE LOGIC =========================
window.onload = () => {
  checkUserRole();
  loadBugs();

  if (window.location.pathname.includes("report-bug.html")) {
    populateBugFormOptions();
  }

  if (window.location.pathname.includes("create-project.html")) {
    populateProjectMembers();
  }

  if (window.location.pathname.includes("project-list.html")) {
    loadProjects();
  }
};


// ===================== POPULATE PROJECT DROPDOWN IN BUG FORM =========================
async function populateBugFormOptions() {
  const projectSelect = document.getElementById("bugProject");
  if (!projectSelect) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to fetch projects");
    }

    projectSelect.innerHTML = ""; // clear any previous options
    data.forEach((proj) => {
      const option = document.createElement("option");
      option.value = proj._id;
      option.textContent = proj.name;
      projectSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to populate project dropdown:", err);
    alert("Could not load projects for bug form.");
  }
}


async function reportBug(event) {
  event.preventDefault();

  const title = document.getElementById("bugTitle").value;
  const description = document.getElementById("bugDescription").value;
  const priority = document.getElementById("bugPriority").value;
  const project = document.getElementById("bugProject").value;
  const token = localStorage.getItem("token");

  if (!project) {
    alert("Please select a project.");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/bugs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, priority, project }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Bug submission failed.");
    }

    alert("Bug reported successfully!");
    window.location.href = "dashboard.html"; // or any desired redirect
  } catch (err) {
    console.error("Bug submission error:", err);
    alert("Failed to report bug: " + (err.message || "Unknown error"));
  }
}
