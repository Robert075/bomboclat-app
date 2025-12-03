document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const favoritesContainer = document.getElementById('favorites-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // --- ESTADO DE LA APLICACIÓN ---
    const STATE = {
        searchResults: [], // Recetas actuales de la búsqueda
        favorites: [],     // Recetas guardadas en favoritos
        shownCount: 0,
        itemsPerLoad: 6
    };

    const STORAGE_KEY = 'bomboclat_favorites_v1';

    // ==========================================
    // 1. GESTIÓN DE LOCALSTORAGE Y DATOS
    // ==========================================

    function loadFavorites() {
        const stored = localStorage.getItem(STORAGE_KEY);
        STATE.favorites = stored ? JSON.parse(stored) : [];
        renderFavorites(); // Pintar al cargar la página
    }

    function saveFavorite(recipe) {
        // Evitar duplicados
        if (STATE.favorites.some(fav => fav.idMeal === recipe.idMeal)) {
            alert('Recipe already in favorites!');
            return;
        }
        STATE.favorites.push(recipe);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.favorites));
        renderFavorites();
        // alert('Added to favorites!');
    }

    function removeFavorite(idMeal) {
        STATE.favorites = STATE.favorites.filter(recipe => recipe.idMeal !== idMeal);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.favorites));
        renderFavorites();
    }

    // ==========================================
    // 2. LÓGICA DE RENDERIZADO (PINTAR EN PANTALLA)
    // ==========================================

    // Genera el HTML de una tarjeta
    function createCardHTML(meal, type) {
        // 'type' puede ser 'result' (con botón Add) o 'favorite' (con botón Remove)
        const btnText = type === 'result' ? 'Add to favourites' : 'Remove';
        const btnClass = type === 'result' ? 'add-btn' : 'remove-btn';
        
        return `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="card-info">
                <h3>${meal.strMeal}</h3>
                <button class="${btnClass}" data-id="${meal.idMeal}">${btnText}</button>
            </div>
        `;
    }

    // Pinta los resultados de búsqueda
    function renderNextBatch() {
        const batch = STATE.searchResults.slice(STATE.shownCount, STATE.shownCount + STATE.itemsPerLoad);
        
        batch.forEach(meal => {
            const card = document.createElement('div');
            card.classList.add('recipe-card');
            card.innerHTML = createCardHTML(meal, 'result');
            resultsContainer.appendChild(card);
        });

        STATE.shownCount += batch.length;

        // Manejo del botón "Ver más"
        loadMoreBtn.style.display = (STATE.shownCount < STATE.searchResults.length) ? 'inline-block' : 'none';
    }

    // Pinta la lista de favoritos
    function renderFavorites() {
        favoritesContainer.innerHTML = ''; // Limpiar contenedor

        if (STATE.favorites.length === 0) {
            favoritesContainer.innerHTML = '<p>No favourites yet... Add some recipes!</p>';
            return;
        }

        STATE.favorites.forEach(meal => {
            const card = document.createElement('div');
            card.classList.add('recipe-card');
            card.innerHTML = createCardHTML(meal, 'favorite');
            favoritesContainer.appendChild(card);
        });
    }

    // ==========================================
    // 3. API Y BÚSQUEDA
    // ==========================================

    async function fetchRecipes(ingredient) {
        resultsContainer.innerHTML = '<p>Searching...</p>';
        loadMoreBtn.style.display = 'none';
        
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
            const data = await response.json();

            resultsContainer.innerHTML = ''; // Limpiar mensaje de carga

            if (data.meals) {
                STATE.searchResults = data.meals;
                STATE.shownCount = 0;
                renderNextBatch();
            } else {
                resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}"</p>`;
            }

        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = '<p>Error connecting to the API.</p>';
        }
    }

    // ==========================================
    // 4. EVENT LISTENER (INTERACCIÓN)
    // ==========================================

    // Formulario de Búsqueda
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const ingredient = searchInput.value.trim();
        if (ingredient) {
            fetchRecipes(ingredient);
        } else {
            alert('Please enter an ingredient');
        }
    });

    // Botón "Cargar más"
    loadMoreBtn.addEventListener('click', renderNextBatch);

    // DELEGACIÓN DE EVENTOS: Clics en Resultados (Botón Añadir)
    resultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-btn')) {
            const id = e.target.getAttribute('data-id');
            const mealData = STATE.searchResults.find(meal => meal.idMeal === id);
            if (mealData) {
                saveFavorite(mealData);
            }
        }
    });

    // DELEGACIÓN DE EVENTOS: Clics en Favoritos (Botón Eliminar)
    favoritesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const id = e.target.getAttribute('data-id');
            removeFavorite(id);
        }
    });

    // ==========================================
    // 5. INICIALIZACIÓN
    // ==========================================
    loadFavorites(); // Cargar favoritos al arrancar
});



