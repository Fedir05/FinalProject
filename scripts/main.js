const STORAGE_KEY = "todoApp:state:v1";
const defaultState = { lists: [], activeListId: null, filter: "all" };

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultState };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.lists)) parsed.lists = [];
    if (!("filter" in parsed)) parsed.filter = "all";
    return parsed;
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

let state = loadState();

const el = {
  newListName: document.getElementById("newListName"),
  addListBtn: document.getElementById("addListBtn"),
  lists: document.getElementById("lists"),
  deleteListBtn: document.getElementById("deleteListBtn"),

  activeListTitle: document.getElementById("activeListTitle"),
  newItemText: document.getElementById("newItemText"),
  addItemBtn: document.getElementById("addItemBtn"),
  items: document.getElementById("items"),
  filterBtns: Array.from(document.querySelectorAll(".filter-btn")),
  leftCount: document.getElementById("leftCount"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),
};

function getActiveList() {
  return state.lists.find(l => l.id === state.activeListId) || null;
}

function applyFilter(items) {
  switch (state.filter) {
    case "active": return items.filter(i => !i.done);
    case "done": return items.filter(i => i.done);
    default: return items;
  }
}

function renderLists() {
  el.lists.innerHTML = "";
  if (state.lists.length === 0) {
    const p = document.createElement("p");
    p.className = "no-lists";
    p.textContent = "There is no list yet.";
    el.lists.appendChild(p);
  } else {
    state.lists.forEach(list => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "list-btn" + (state.activeListId === list.id ? " active" : "");
      btn.textContent = list.name;
      btn.addEventListener("click", () => {
        state.activeListId = list.id;
        saveState();
        renderAll();
      });
      el.lists.appendChild(btn);
    });
  }
  el.deleteListBtn.disabled = state.activeListId === null;
}

function renderHeader() {
  const list = getActiveList();
  if (!list) {
    el.activeListTitle.textContent = "No list selected";
    el.newItemText.disabled = true;
    el.addItemBtn.disabled = true;
  } else {
    el.activeListTitle.textContent = list.name;
    el.newItemText.disabled = false;
    el.addItemBtn.disabled = false;
  }
}

function renderFilters() {
  el.filterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === state.filter));
}

function renderItems() {
  const list = getActiveList();
  el.items.innerHTML = "";
  if (!list) {
    el.leftCount.textContent = "0 left";
    el.clearCompletedBtn.disabled = true;
    return;
  }
  const itemsToShow = applyFilter(list.items);
  if (itemsToShow.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    const span = document.createElement("span");
    span.className = "text";
    span.style.color = "var(--muted)";
    span.textContent = state.filter === "done" ? "No completed tasks" : "No tasks yet";
    li.appendChild(span);
    el.items.appendChild(li);
  } else {
    itemsToShow.forEach(item => {
      const li = document.createElement("li");
      li.className = "item";

      const left = document.createElement("div");
      left.className = "item-left";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!item.done;
      checkbox.addEventListener("change", () => {
        item.done = checkbox.checked;
        saveState();
        renderItems();
      });

      const text = document.createElement("span");
      text.className = "text" + (item.done ? " done" : "");
      text.textContent = item.text;

      left.appendChild(checkbox);
      left.appendChild(text);

      const delBtn = document.createElement("button");
      delBtn.textContent = "✕";
      delBtn.setAttribute("aria-label", "Delete task");
      delBtn.addEventListener("click", () => {
        const idx = list.items.findIndex(i => i.id === item.id);
        if (idx > -1) {
          list.items.splice(idx, 1);
          saveState();
          renderItems();
        }
      });

      li.appendChild(left);
      li.appendChild(delBtn);
      el.items.appendChild(li);
    });
  }
  const leftCount = list.items.filter(i => !i.done).length;
  el.leftCount.textContent = leftCount + " left";
  const hasCompleted = list.items.some(i => i.done);
  el.clearCompletedBtn.disabled = !hasCompleted;
}

function renderAll() { renderLists(); renderHeader(); renderFilters(); renderItems(); }

el.addListBtn.addEventListener("click", () => {
  const name = el.newListName.value.trim();
  if (!name) return;
  const newList = { id: uid(), name, items: [] };
  state.lists.push(newList);
  state.activeListId = newList.id;
  saveState();
  el.newListName.value = "";
  renderAll();
});

el.newListName.addEventListener("keydown", (e) => { if (e.key === "Enter") el.addListBtn.click(); });

el.deleteListBtn.addEventListener("click", () => {
  if (state.activeListId === null) return;
  const list = getActiveList();
  const ok = confirm(`Delete list "${list?.name ?? ""}" and all its tasks?`);
  if (!ok) return;
  const idx = state.lists.findIndex(l => l.id === state.activeListId);
  if (idx > -1) state.lists.splice(idx, 1);
  state.activeListId = state.lists[0]?.id ?? null;
  saveState();
  renderAll();
});

el.addItemBtn.addEventListener("click", () => {
  const list = getActiveList();
  if (!list) return;
  const text = el.newItemText.value.trim();
  if (!text) return;
  list.items.push({ id: uid(), text, done: false });
  saveState();
  el.newItemText.value = "";
  renderItems();
});

el.newItemText.addEventListener("keydown", (e) => { if (e.key === "Enter") el.addItemBtn.click(); });

el.filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    if (state.filter === f) return;
    state.filter = f;
    saveState();
    renderFilters();
    renderItems();
  });
});

el.clearCompletedBtn.addEventListener("click", () => {
  const list = getActiveList();
  if (!list) return;
  list.items = list.items.filter(i => !i.done);
  saveState();
  renderItems();
});

renderAll();
