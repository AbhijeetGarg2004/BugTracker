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

  // Default role as 'user' for now
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

    // Store token/user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirect to dashboard
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
  window.location.href = "index.html"; // Redirect to login page
}

// ===================== LOAD BUGS =========================
async function loadBugs() {
  const bugListContainer = document.getElementById("bugListContainer");
  if (!bugListContainer) return; // in case this runs on a non-dashboard page
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

    // Create bug cards dynamically
    bugListContainer.innerHTML = "";
    bugs.forEach((bug) => {
      const bugCard = document.createElement("div");
      bugCard.className = "card mb-3";

      bugCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${bug.title}</h5>
          <p class="card-text">${bug.description}</p>
          <p><strong>Project:</strong> ${bug.project?.name || "N/A"}</p>
          <p><strong>Status:</strong> ${bug.status}</p>
          <p><strong>Priority:</strong> ${bug.priority}</p>
          <p><strong>Reported by:</strong> ${bug.reportedBy?.name || "Unknown"}</p>
          <p><small class="text-muted">Created at: ${new Date(bug.createdAt).toLocaleString()}</small></p>
        </div>
      `;

      bugListContainer.appendChild(bugCard);
    });
  } catch (err) {
    bugListContainer.innerHTML = `<p class="text-center text-danger">Error loading bugs: ${err.message}</p>`;
  }
}

// ===================== CHECK USER ROLE =========================
function checkUserRole() {
  const navCreateProject = document.getElementById("navCreateProject");
  if (!navCreateProject) return;

  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.role === "admin") {
    navCreateProject.style.display = "block";
  } else {
    navCreateProject.style.display = "none";
  }
}

// ===================== POPULATE BUG FORM OPTIONS =========================
async function populateBugFormOptions() {
  try {
    const token = localStorage.getItem("token");

    // Fetch Projects
    const projectRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const projectData = await projectRes.json();
    if (!projectRes.ok) {
      throw new Error(projectData.message || projectData.error || "Failed to fetch projects");
    }

    const projectSelect = document.getElementById("bugProject");
    projectSelect.innerHTML = "<option value=''>Select a project…</option>";
    projectData.forEach((project) => {
      const option = document.createElement("option");
      option.value = project._id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });

    // No assignee field any more
  } catch (error) {
    console.error("Error populating form options:", error);
  }
}

// ===================== REPORT BUG =========================
async function reportBug(e) {
  e.preventDefault();

  const title = document.getElementById("bugTitle").value;
  const description = document.getElementById("bugDescription").value;
  const priority = document.getElementById("bugPriority").value;
  const project = document.getElementById("bugProject").value;
  // no assignedTo

  const user = JSON.parse(localStorage.getItem("user"));
  const bugData = {
    title,
    description,
    priority,
    project,
    reportedBy: user._id,
  };

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/bugs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bugData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to report bug");
    }

    alert("Bug reported successfully!");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Bug reporting error:", err);
    alert("Failed to report bug: " + (err.message || "Unknown error"));
  }
}

// ===================== CREATE PROJECT =========================
async function createProject(event) {
  event.preventDefault();

  const projectName = document.getElementById("projectName").value;
  const projectDescription = document.getElementById("projectDescription").value;

  const projectData = {
    name: projectName,
    description: projectDescription,
  };

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Project creation failed.");
    }

    alert("Project created successfully!");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Create project error:", err);
    alert("Project creation failed: " + (err.message || "Unknown error"));
  }
}

// ===================== POPULATE PROJECT MEMBERS =========================
async function populateProjectMembers() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const users = await res.json();
    if (!res.ok) {
      throw new Error(users.message || users.error || "Failed to fetch users");
    }

    const select = document.getElementById("projectMembers");
    if (!select) return;
    select.innerHTML = "";

    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = user._id;
      option.textContent = user.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

// ===================== INITIALIZE =========================
window.onload = () => {
  checkUserRole();
  loadBugs();

  if (window.location.pathname.includes("report-bug.html")) {
    populateBugFormOptions();
  }

  if (window.location.pathname.includes("create-project.html")) {
    populateProjectMembers();
  }
};
