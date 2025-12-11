document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const favoritesContainer = document.getElementById('favorites-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const categorySelect = document.getElementById('category-filter');

    // -- REFERENCIAS MODAL ---
    const modal = document.getElementById('recipe-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-img');
    const modalInstructions = document.getElementById('modal-instructions');
    const modalIngredients = document.getElementById('modal-ingredients');
    const modalFavBtn = document.getElementById('modal-fav-btn');

    // --- ESTADO DE LA APLICACIÓN ---
    const STATE = {
        searchResults: [], // Recetas actuales de la búsqueda
        favorites: [],     // Recetas guardadas en favoritos
        shownCount: 0,
        itemsPerLoad: 6,
        currentRecipe: null
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
        const btnClass = 'card-fav-btn';
        
        return `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="card-info">
                <h3>${meal.strMeal}</h3>
                <button class="${btnClass}" data-id="${meal.idMeal}">${btnText}</button>
            </div>
        `;
    }

    async function renderNextBatch(itemsToLoad) {

        let loadedCount = 0;
        const batch = STATE.searchResults.slice(STATE.shownCount, STATE.shownCount + itemsToLoad);
        STATE.shownCount += batch.length;

        const processingPromises = batch.map(async (meal) => {
            if (categorySelect.value !== 'All Categories') {
                try {
                    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                    const data = await response.json();
                    const fullMeal = data.meals[0];

                    if (fullMeal.strCategory === categorySelect.value) {
                        meal = fullMeal; // Usamos la info completa
                        const card = CreateFullCard(meal, 'result'); 
                        resultsContainer.appendChild(card);
                        return 1;
                    } 
                } catch (error) {
                    console.error("Error verificando categoría:", error);
                }
            } else {
                    const card = CreateFullCard(meal, 'result'); 
                    resultsContainer.appendChild(card);
                    return 1;
            }
            return 0;
        });

        const results = await Promise.all(processingPromises);

        loadedCount = results.reduce((a, b) => a + b, 0);

        // Recursive call if we still need more items
        if (loadedCount < itemsToLoad && STATE.shownCount < STATE.searchResults.length) {
            const remaining = itemsToLoad - loadedCount;
            await renderNextBatch(remaining);
        }

        // Update the Load More button visibility
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
            const card = CreateFullCard(meal, 'favorite');
            favoritesContainer.appendChild(card);
        });
    }

    function CreateFullCard(meal, type) {
        const card = document.createElement('div');
        card.onclick = (e) => { 
            if (e.target.closest('.card-fav-btn')) {
                return; // prevent the modal to be opened when the fav button is clicked
            }
            openRecipeDetails(meal.idMeal);
        }
        card.classList.add('recipe-card');
        card.innerHTML = createCardHTML(meal, type);
        return card;
    }

    function populateModal(recipe) {
        modalTitle.textContent = recipe.strMeal;
        modalImg.src = recipe.strMealThumb;
        modalInstructions.textContent = recipe.strInstructions;
        const icon = modalFavBtn.querySelector('i');

        if (STATE.favorites.some(fav => fav.idMeal === recipe.idMeal)) {
            modalFavBtn.classList.add('active');
            toogleHeartIcon(icon, 'active');
        } else {
            modalFavBtn.classList.remove('active');
            toogleHeartIcon(icon, 'inactive');
        }

        modalIngredients.innerHTML = '';
        const ul = document.createElement('ul');

        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];

            if (ingredient && ingredient.trim() !== "") {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${ingredient}</strong> - ${measure}`;
                ul.appendChild(li);
            } else {
                break; // No hay más ingredientes
            }
        }
        modalIngredients.appendChild(ul);
    }

    function closeModal() {
        modal.style.display = 'none';
        currentRecipe = null;
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
                renderNextBatch(STATE.itemsPerLoad);
            } else {
                resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}"</p>`;
            }

        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = '<p>Error connecting to the API.</p>';
        }
    }

    async function openRecipeDetails(id) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            const data = await response.json();
            const recipe = data.meals[0];

            if (recipe) {
                currentRecipe = recipe;
                populateModal(recipe);
                modal.style.display = 'flex'; // Mostrar el modal
            }
        } catch (error) {
            console.error("Error fetching details:", error);
            //alert("No se pudieron cargar los detalles.");
        }
    }

    async function createCategoryList() {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/categories.php`);
            const data = await response.json();
            if (data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.strCategory;
                    option.textContent = category.strCategory;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
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
    loadMoreBtn.addEventListener('click', () => renderNextBatch(STATE.itemsPerLoad));

    // DELEGACIÓN DE EVENTOS: Clics en Resultados (Botón Añadir)
    resultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-fav-btn')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const mealData = STATE.searchResults.find(meal => meal.idMeal === id);
            if (mealData) {
                saveFavorite(mealData);
            }
        }
    });

    // DELEGACIÓN DE EVENTOS: Clics en Favoritos (Botón Eliminar)
    favoritesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-fav-btn')) {
            const id = e.target.getAttribute('data-id');
            removeFavorite(id);
        }
    });

    // Botón para cerrar la ventana modal
    closeModalBtn.addEventListener('click', closeModal);

    // Botón de favoritos del modal
    modalFavBtn.addEventListener('click', () => {
        if (!currentRecipe) {
            return;
        }

        // Toogle visual
        const icon = modalFavBtn.querySelector('i');
        modalFavBtn.classList.toggle('active');

        if (modalFavBtn.classList.contains('active')) {
            toogleHeartIcon(icon, 'active');
            saveFavorite(currentRecipe);
        } else {
            toogleHeartIcon(icon, 'inactive');
            removeFavorite(currentRecipe.idMeal);
        }
    });

    function toogleHeartIcon(icon, mode) {
        if (mode === 'active') {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else if (mode === 'inactive') {
            icon.classList.remove('fas');
            icon.classList.add('far');
        } else {
            throw `Unrecognized toogle mode for heart icon: ${mode}`;
        }
    }

    // ==========================================
    // 5. INICIALIZACIÓN
    // ==========================================
    loadFavorites(); // Cargar favoritos al arrancar
    createCategoryList(); // Cargar categorías al inicio
});



