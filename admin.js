let currentData = {};
let activeTargetInputId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndLoad();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

// Friendly labels for text keys
const KEY_LABELS = {
  "phone": "Телефон компании",
  "whatsapp": "Ссылка на WhatsApp",
  "instagram": "Ссылка на Instagram",
  "showroom_hours": "Часы работы шоурума (кратко)",
  "showroom_hours_detail": "Часы работы шоурума (подробно)",
  "hero.title": "Заголовок hero-секции",
  "hero.subtitle": "Подзаголовок hero-секции",
  "studio_description": "Основной текст-описание студии",
  "buttons.view_catalog": "Кнопка: Смотреть каталог",
  "buttons.order_samples": "Кнопка: Заказать каталог материалов",
  "buttons.order_project": "Кнопка: Заказать проект",
  "stats.years_num": "Статистика 1 (Число)",
  "stats.years_label": "Статистика 1 (Подпись)",
  "stats.residences_num": "Статистика 2 (Число)",
  "stats.residences_label": "Статистика 2 (Подпись)",
  "stats.warranty_num": "Статистика 3 (Число)",
  "stats.warranty_label": "Статистика 3 (Подпись)"
};

function flattenObject(obj, prefix = '') {
  let result = {};
  for (let key in obj) {
    if (key === 'catalog') continue; // Handle catalog separately
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], prefix + key + '.'));
    } else {
      result[prefix + key] = obj[key];
    }
  }
  return result;
}

function unflattenObject(flatObj) {
  let result = {};
  for (let key in flatObj) {
    let parts = key.split('.');
    let curr = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = flatObj[key];
  }
  return result;
}

// Tab Switching
function switchTab(tabName) {
  document.getElementById('tab-btn-text').classList.toggle('active', tabName === 'text');
  document.getElementById('tab-btn-catalog').classList.toggle('active', tabName === 'catalog');

  document.getElementById('tab-content-text').style.display = tabName === 'text' ? 'block' : 'none';
  document.getElementById('tab-content-catalog').style.display = tabName === 'catalog' ? 'block' : 'none';
}

async function checkAuthAndLoad() {
  try {
    const res = await fetch('/api/content/');
    if (res.status === 200) {
      currentData = await res.json();
      if (!Array.isArray(currentData.catalog)) {
        currentData.catalog = [];
      }
      showAdminView();
    } else {
      showLoginView();
    }
  } catch (err) {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('admin-container').style.display = 'none';
}

function showAdminView() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-container').style.display = 'block';
  renderTextFields(currentData);
  renderCatalogList(currentData.catalog);
}

async function handleLogin(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('login-error');
  errorDiv.style.display = 'none';

  const loginUser = document.getElementById('login-user').value.trim();
  const loginPass = document.getElementById('login-pass').value.trim();

  try {
    const res = await fetch('/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginUser, password: loginPass })
    });

    if (res.ok) {
      checkAuthAndLoad();
    } else {
      errorDiv.textContent = 'Неверный логин или пароль';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Ошибка соединения с сервером';
    errorDiv.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout/', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  showLoginView();
}

// 1. TEXT FIELDS RENDERER
function renderTextFields(data) {
  const form = document.getElementById('content-form');
  form.innerHTML = '';

  const flatData = flattenObject(data);

  for (let key in flatData) {
    const value = flatData[key];
    const labelText = KEY_LABELS[key] || key;

    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.innerHTML = `<strong>${labelText}</strong> <span style="color:#94a3b8; font-weight:normal; font-size:0.8rem;">(${key})</span>`;

    let input;
    const inputId = 'field-' + key.replace(/\./g, '-');

    if (typeof value === 'string' && (value.length > 50 || value.includes('<') || value.includes('\n'))) {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }

    input.className = 'form-input';
    input.id = inputId;
    input.name = key;
    input.setAttribute('data-key', key);
    input.value = value !== undefined ? value : '';

    group.appendChild(label);

    // If field is image/media URL, add upload button
    if (key.includes('img') || key.includes('photo') || key.includes('video') || key.includes('url')) {
      const inputWrap = document.createElement('div');
      inputWrap.className = 'input-with-upload';
      inputWrap.appendChild(input);

      const uploadBtn = document.createElement('button');
      uploadBtn.type = 'button';
      uploadBtn.className = 'btn btn-secondary btn-sm';
      uploadBtn.textContent = '📁 Загрузить';
      uploadBtn.onclick = () => triggerFileUpload(inputId);

      inputWrap.appendChild(uploadBtn);
      group.appendChild(inputWrap);
    } else {
      group.appendChild(input);
    }

    form.appendChild(group);
  }
}

// 2. CATALOG LIST RENDERER
function renderCatalogList(catalog) {
  const container = document.getElementById('catalog-list-container');
  if (!container) return;

  if (!catalog || catalog.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 3rem; background: #fff; border-radius: 8px;">Каталог пуст. Нажмите "+ Добавить новый товар".</div>';
    return;
  }

  container.innerHTML = catalog.map((item, index) => `
    <div class="catalog-item-row">
      <img src="${item.img || './assets/logo.jpg'}" class="catalog-thumb" alt="${item.title}">
      <div class="catalog-info">
        <h4>${item.title} <span style="font-size:0.8rem; color:#64748b; font-weight:normal;">(${item.id})</span></h4>
        <p>${item.specs ? item.specs.substring(0, 70) + '...' : ''}</p>
        <span class="catalog-badge">${item.category_label || item.category}</span>
        <span style="font-weight: 700; color: #2563eb; margin-left: 0.75rem;">${item.price}</span>
      </div>
      <div class="catalog-actions">
        <button class="btn btn-secondary btn-sm" onclick="openCatalogModal(${index})">✏️ Редактировать</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCatalogItem(${index})">🗑️ Удалить</button>
      </div>
    </div>
  `).join('');
}

// 3. CATALOG MODAL ACTIONS
function openCatalogModal(index = -1) {
  document.getElementById('item-index').value = index;
  const modal = document.getElementById('catalog-modal');
  const title = document.getElementById('modal-catalog-title');

  if (index >= 0 && currentData.catalog[index]) {
    title.textContent = 'Редактировать товар';
    const item = currentData.catalog[index];
    document.getElementById('item-id').value = item.id || '';
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-category').value = item.category || 'living';
    document.getElementById('item-category-label').value = item.category_label || '';
    document.getElementById('item-badge').value = item.badge || '';
    document.getElementById('item-price').value = item.price || '';
    document.getElementById('item-specs').value = item.specs || '';
    document.getElementById('item-img').value = item.img || '';
  } else {
    title.textContent = 'Добавить новый товар';
    document.getElementById('catalog-item-form').reset();
    document.getElementById('item-index').value = -1;
    document.getElementById('item-id').value = 'item_' + Date.now().toString().slice(-6);
  }

  modal.classList.add('active');
}

function closeCatalogModal() {
  document.getElementById('catalog-modal').classList.remove('active');
}

function saveCatalogItem(e) {
  e.preventDefault();
  const index = parseInt(document.getElementById('item-index').value);

  const newItem = {
    id: document.getElementById('item-id').value.trim(),
    title: document.getElementById('item-title').value.trim(),
    category: document.getElementById('item-category').value,
    category_label: document.getElementById('item-category-label').value.trim() || document.getElementById('item-category').options[document.getElementById('item-category').selectedIndex].text,
    badge: document.getElementById('item-badge').value.trim(),
    price: document.getElementById('item-price').value.trim(),
    specs: document.getElementById('item-specs').value.trim(),
    img: document.getElementById('item-img').value.trim()
  };

  if (index >= 0 && currentData.catalog[index]) {
    currentData.catalog[index] = newItem;
  } else {
    currentData.catalog.push(newItem);
  }

  renderCatalogList(currentData.catalog);
  closeCatalogModal();
  submitContentForm();
}

function deleteCatalogItem(index) {
  if (index >= 0 && currentData.catalog[index]) {
    const itemTitle = currentData.catalog[index].title;
    if (confirm(`Вы действительно хотите удалить товар "${itemTitle}"?`)) {
      currentData.catalog.splice(index, 1);
      renderCatalogList(currentData.catalog);
      submitContentForm();
    }
  }
}

// 4. FILE UPLOAD HANDLING
function triggerFileUpload(targetInputId) {
  activeTargetInputId = targetInputId;
  const fileInput = document.getElementById('global-file-input');
  fileInput.value = '';
  fileInput.click();
}

async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file || !activeTargetInputId) return;

  const targetInput = document.getElementById(activeTargetInputId);
  if (!targetInput) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    showToast('Загрузка файла...');
    const res = await fetch('/api/upload/', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok && data.url) {
      targetInput.value = data.url;
      showToast('Файл успешно загружен!');
    } else {
      alert('Ошибка при загрузке файла: ' + (data.detail || 'Неизвестная ошибка'));
    }
  } catch (err) {
    alert('Ошибка сети при загрузке файла');
  }
}

// 5. GLOBAL SAVE TO BACKEND
async function submitContentForm() {
  const form = document.getElementById('content-form');
  const inputs = form.querySelectorAll('[data-key]');
  let flatObj = {};

  inputs.forEach(input => {
    const key = input.getAttribute('data-key');
    flatObj[key] = input.value;
  });

  const textData = unflattenObject(flatObj);

  // Combine text fields with catalog array
  currentData = {
    ...textData,
    catalog: currentData.catalog || []
  };

  try {
    const res = await fetch('/api/content/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });

    if (res.ok) {
      showToast('Изменения успешно сохранены!');
    } else if (res.status === 401) {
      showLoginView();
    } else {
      alert('Ошибка при сохранении данных');
    }
  } catch (err) {
    alert('Ошибка сети при сохранении');
  }
}

function showToast(msg) {
  const toast = document.getElementById('admin-toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
