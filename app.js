// ===== Основное приложение =====
document.addEventListener('DOMContentLoaded', () => {
  // Состояние
  let products = JSON.parse(localStorage.getItem('products')) || [];
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  let recipes = [];
  let autocompleteItems = [];

  // DOM Elements
  const productInput = document.getElementById('productInput');
  const productChips = document.getElementById('productChips');
  const autocompleteList = document.getElementById('autocompleteList');
  const searchBtn = document.getElementById('searchBtn');
  const productCountEl = document.getElementById('productCount');
  const resultsSection = document.getElementById('resultsSection');
  const recipesGrid = document.getElementById('recipesGrid');
  const resultsCountEl = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');
  const timeFilter = document.getElementById('timeFilter');
  const difficultyFilter = document.getElementById('difficultyFilter');

  // Modal Elements
  const addProductsModal = document.getElementById('addProductsModal');
  const recipeModal = document.getElementById('recipeModal');
  const addProductsBtn = document.getElementById('addProductsBtn');
  const addMoreBtn = document.getElementById('addMoreBtn');
  const addProductBtn = document.getElementById('addProductBtn');
  const bulkInput = document.getElementById('bulkInput');
  const addBulkBtn = document.getElementById('addBulkBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const availableIngredients = document.getElementById('availableIngredients');
  const allIngredients = document.getElementById('allIngredients');
  const recipeSteps = document.getElementById('recipeSteps');

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  let selectedRecipe = null;
  let activeIndex = -1;

  // ===== Тема =====
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  });

  // Загрузка рецептов
  fetch('recipes.json')
    .then(response => response.json())
    .then(data => {
      recipes = data;
      // Собираем уникальные продукты для автозаполнения (без дублей)
      const allIngredients = new Set();
      recipes.forEach(r => {
        r.ingredients.forEach(ing => {
          // Нормализуем: "яйцо" → "яйца", "чеснок (зубчик)" → "чеснок"
          const base = ing.split('(')[0].trim().toLowerCase();
          allIngredients.add(base);
        });
      });
      autocompleteItems = Array.from(allIngredients).sort();
      updateProductCount();
    })
    .catch(err => {
      console.warn('Не удалось загрузить recipes.json:', err);
      // Для демо — подкинем пару рецептов
      recipes = [
        {
          id: 1,
          title: "Яичница с помидорами",
          time: 15,
          servings: 2,
          difficulty: "easy",
          ingredients: ["яйца", "помидор", "масло", "соль"],
          steps: [
            "Нарежьте помидор кружочками.",
            "Разогрейте сковороду, добавьте масло.",
            "Выложите помидоры, слегка обжарьте.",
            "Разбейте яйца поверх помидоров, посолите.",
            "Готовьте под крышкой 5–7 минут."
          ]
        }
      ];
      autocompleteItems = ["яйца", "помидор", "масло", "соль", "сыр", "молоко", "лук", "чеснок"];
      updateProductCount();
    });

  // ===== Функции =====
  function updateProductCount() {
    productCountEl.textContent = products.length;
    searchBtn.disabled = products.length < 2;
  }

  function renderChips() {
    productChips.innerHTML = '';
    products.forEach((product, index) => {
      const chip = document.createElement('div');
      chip.className = 'product-chip';
      chip.innerHTML = `
        ${product}
        <button class="remove-btn" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      `;
      productChips.appendChild(chip);
    });

    // Добавляем обработчики удаления
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.closest('button').dataset.index;
        removeProduct(index);
      });
    });
  }

  function addProduct(product) {
    const clean = product.trim().toLowerCase();
    if (clean && !products.includes(clean)) {
      products.push(clean);
      localStorage.setItem('products', JSON.stringify(products));
      renderChips();
      updateProductCount();
      productInput.value = '';
      hideAutocomplete();
    }
  }

  function removeProduct(index) {
    products.splice(index, 1);
    localStorage.setItem('products', JSON.stringify(products));
    renderChips();
    updateProductCount();
  }

  function showAutocomplete() {
    const query = productInput.value.toLowerCase().trim();
    if (!query) {
      hideAutocomplete();
      return;
    }

    const matches = autocompleteItems.filter(item =>
      item.includes(query)
    ).slice(0, 6);

    if (matches.length === 0) {
      hideAutocomplete();
      return;
    }

    autocompleteList.innerHTML = '';
    autocompleteList.style.display = 'block';

    matches.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `<i class="fas fa-utensils"></i> ${item}`;
      div.addEventListener('click', () => {
        addProduct(item);
        productInput.focus();
      });
      autocompleteList.appendChild(div);
    });
  }

  function hideAutocomplete() {
    autocompleteList.style.display = 'none';
    activeIndex = -1;
  }

  function handleAutocompleteKeys(e) {
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    const isAutocompleteVisible = autocompleteList.style.display === 'block';

    // Если автокомплит скрыт — Enter добавляет текущий ввод
    if (e.key === 'Enter' && !isAutocompleteVisible) {
      e.preventDefault();
      addProduct(productInput.value);
      return;
    }

    // Если автокомплит виден — работаем с навигацией
    if (!items.length || !isAutocompleteVisible) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActiveItem(items, activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActiveItem(items, activeIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        items[activeIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      }
    } else if (e.key === 'Escape') {
      hideAutocomplete();
    }
  }

  function setActiveItem(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }

  function searchRecipes() {
    if (products.length < 2) return;

    const filtered = recipes.filter(recipe => {
      const matches = recipe.ingredients.filter(ing => 
        products.some(p => 
          ing.toLowerCase().includes(p) || p.includes(ing.toLowerCase())
        )
      );
      return matches.length >= Math.min(2, products.length);
    }).sort((a, b) => {
      const matchA = getMatchCount(a);
      const matchB = getMatchCount(b);
      return matchB - matchA;
    });

    renderResults(filtered);
  }

  function getMatchCount(recipe) {
    return recipe.ingredients.filter(ing => 
      products.some(p => 
        ing.toLowerCase().includes(p) || p.includes(ing.toLowerCase())
      )
    ).length;
  }

  function renderResults(recipeList) {
    const time = timeFilter.value ? parseInt(timeFilter.value) : Infinity;
    const difficulty = difficultyFilter.value;

    const filtered = recipeList.filter(r => {
      if (r.time > time) return false;
      if (difficulty && r.difficulty !== difficulty) return false;
      return true;
    });

    resultsCountEl.textContent = filtered.length;
    
    if (filtered.length === 0) {
      resultsSection.classList.add('hidden');
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      resultsSection.classList.remove('hidden');

      recipesGrid.innerHTML = '';
      filtered.forEach((recipe, i) => {
        setTimeout(() => {
          const card = createRecipeCard(recipe);
          recipesGrid.appendChild(card);
        }, i * 100);
      });
    }
  }

  function createRecipeCard(recipe) {
    const matchCount = getMatchCount(recipe);
    const matchPercent = Math.round((matchCount / products.length) * 100);

    const card = document.createElement('div');
    card.className = 'recipe-card animate__animated animate__fadeInUp';
    card.innerHTML = `
      <div class="recipe-image">🖼️ ${recipe.title}</div>
      <div class="recipe-content">
        <h3 class="recipe-title">${recipe.title}</h3>
        <div class="recipe-meta">
          <span><i class="far fa-clock"></i> ${recipe.time} мин</span>
          <span><i class="fas fa-user"></i> ${recipe.servings} порц.</span>
          <span><i class="fas fa-fire" 
                style="color: ${recipe.difficulty === 'easy' ? '#4CAF50' : recipe.difficulty === 'medium' ? '#FF9800' : '#F44336'}">
            </i></span>
        </div>
        <div class="recipe-ingredients">
          <h4>Ингредиенты:</h4>
          <div class="ingredients-list">
            ${recipe.ingredients.slice(0, 4).map(ing => 
              `<span class="ingredient-tag">${ing}</span>`
            ).join('')}
            ${recipe.ingredients.length > 4 ? `<span class="ingredient-tag">+${recipe.ingredients.length - 4}</span>` : ''}
          </div>
        </div>
        <div class="match-info">
          <div class="match-label">
            <span>Совпадений: ${matchCount} из ${products.length}</span>
            <span>${matchPercent}%</span>
          </div>
          <div class="match-bar">
            <div class="match-fill" style="width: 0%"></div>
          </div>
        </div>
        <button class="btn btn-recipe" data-id="${recipe.id}">
          📖 Посмотреть рецепт
        </button>
      </div>
    `;

    // Анимация заполнения шкалы после рендера
    setTimeout(() => {
      const fill = card.querySelector('.match-fill');
      fill.style.width = `${matchPercent}%`;
    }, 100);

    // Обработчик кнопки
    card.querySelector('.btn-recipe').addEventListener('click', () => {
      showRecipeModal(recipe);
    });

    return card;
  }

  function showRecipeModal(recipe) {
    selectedRecipe = recipe;
    
    modalTitle.textContent = recipe.title;
    
    const difficultyText = {
      easy: 'лёгкая',
      medium: 'средняя',
      hard: 'сложная'
    };
    modalMeta.innerHTML = `
      <i class="far fa-clock"></i> ${recipe.time} мин | 
      <i class="fas fa-user"></i> ${recipe.servings} порц. | 
      Сложность: <span style="color: ${
        recipe.difficulty === 'easy' ? '#4CAF50' : 
        recipe.difficulty === 'medium' ? '#FF9800' : '#F44336'
      }">${difficultyText[recipe.difficulty]}</span>
    `;

    // Ингредиенты
    const available = recipe.ingredients.filter(ing => 
      products.some(p => 
        ing.toLowerCase().includes(p) || p.includes(ing.toLowerCase())
      )
    );
    const missing = recipe.ingredients.filter(ing => !available.includes(ing));

    availableIngredients.innerHTML = available.length 
      ? available.map(i => `<li>✅ ${i}</li>`).join('')
      : '<li class="text-gray-500">—</li>';

    allIngredients.innerHTML = recipe.ingredients.map(i => `<li>• ${i}</li>`).join('');

    // Шаги
    recipeSteps.innerHTML = recipe.steps.map((step, i) => 
      `<li>${step}</li>`
    ).join('');

    // Избранное
    const isFavorite = favorites.includes(recipe.id);
    favoriteBtn.innerHTML = `
      <i class="fas fa-heart${isFavorite ? '' : '-o'} mr-2"></i>
      <span>${isFavorite ? 'В избранном' : 'В избранное'}</span>
    `;
    favoriteBtn.className = `btn ${isFavorite ? 'btn-primary' : 'btn-outline'} flex-1`;
    favoriteBtn.onclick = toggleFavorite;

    recipeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function toggleFavorite() {
    if (!selectedRecipe) return;
    
    const id = selectedRecipe.id;
    const index = favorites.indexOf(id);
    if (index === -1) {
      favorites.push(id);
    } else {
      favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showRecipeModal(selectedRecipe); // обновляем кнопку
  }

  function closeModal() {
    addProductsModal.classList.add('hidden');
    recipeModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ===== Обработчики событий =====
  productInput.addEventListener('input', showAutocomplete);
  productInput.addEventListener('focus', showAutocomplete);
  productInput.addEventListener('keydown', handleAutocompleteKeys);
  document.addEventListener('click', (e) => {
    if (!productInput.contains(e.target) && !autocompleteList.contains(e.target)) {
      hideAutocomplete();
    }
  });

  // ✅ Новый обработчик Enter (если автокомплит скрыт)
  productInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && autocompleteList.style.display !== 'block') {
      e.preventDefault();
      addProduct(productInput.value);
    }
  });

  addProductBtn.addEventListener('click', () => {
    addProduct(productInput.value);
  });

  searchBtn.addEventListener('click', searchRecipes);
  addProductsBtn.addEventListener('click', () => {
    addProductsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  addMoreBtn.addEventListener('click', () => {
    addProductsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  addBulkBtn.addEventListener('click', () => {
    const items = bulkInput.value
      .toLowerCase()
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s && !products.includes(s));
    
    products = [...products, ...items];
    localStorage.setItem('products', JSON.stringify(products));
    renderChips();
    updateProductCount();
    bulkInput.value = '';
    closeModal();
  });

  // Закрытие модалок
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Фильтры
  timeFilter.addEventListener('change', () => {
    const currentResults = Array.from(recipesGrid.children).map(el => {
      const id = parseInt(el.querySelector('.btn-recipe').dataset.id);
      return recipes.find(r => r.id === id);
    });
    renderResults(currentResults);
  });

  difficultyFilter.addEventListener('change', () => {
    const currentResults = Array.from(recipesGrid.children).map(el => {
      const id = parseInt(el.querySelector('.btn-recipe').dataset.id);
      return recipes.find(r => r.id === id);
    });
    renderResults(currentResults);
  });

  // Инициализация
  renderChips();
  updateProductCount();
});