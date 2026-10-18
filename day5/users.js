const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

let users = [];

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No users match your filter.";
    usersList.appendChild(emptyMessage);
    return;
  }

  for (const user of list) {
    const listItem = document.createElement("li");

    const name = document.createElement("h3");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    listItem.append(name, email, city, company);
    usersList.appendChild(listItem);
  }
}

async function loadUsers() {
  loadButton.disabled = true;
  statusMessage.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    users = await response.json();

    const searchTerm = filterInput.value.trim().toLowerCase();
    const filteredUsers = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    );

    renderUsers(filteredUsers);
    statusMessage.textContent = `Loaded ${users.length} users.`;
  } catch (error) {
    users = [];
    usersList.replaceChildren();
    statusMessage.textContent =
      "Unable to load users. Please check your connection and try again.";
    console.error("Error loading users:", error);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  const searchTerm = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm)
  );

  renderUsers(filteredUsers);

  if (users.length > 0) {
    statusMessage.textContent = filteredUsers.length === 0
      ? "No users match your filter."
      : `Showing ${filteredUsers.length} of ${users.length} users.`;
  }
});
