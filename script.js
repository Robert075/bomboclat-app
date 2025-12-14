document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const favoritesContainer = document.getElementById('favorites-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const categorySelect = document.getElementById('category-filter');
    const customRecipesContainer = document.getElementById('custom-recipes-container');

    // -- REFERENCIAS MODAL ---
    const modal = document.getElementById('recipe-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-img');
    const modalInstructions = document.getElementById('modal-instructions');
    const modalIngredients = document.getElementById('modal-ingredients');
    const modalFavBtn = document.getElementById('modal-fav-btn');
    const nutritionPanel = document.getElementById('modal-nutrition');

    const NINJA_API_KEY = CONFIG.CALORIE_NINJA_API_KEY;

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
        const allSaved = stored ? JSON.parse(stored) : [];

        // Separamos las recetas: Las que tienen ID 'custom-' van a un lado, las otras a favoritos
        STATE.customRecipes = allSaved.filter(r => String(r.idMeal).startsWith('custom-'));
        STATE.favorites = allSaved.filter(r => !String(r.idMeal).startsWith('custom-'));

        renderFavorites();
        renderCustomRecipes(); // <--- Pintamos la nueva sección
    }

    // Función específica para guardar recetas propias
    function saveCustomRecipe(recipe) {
        STATE.customRecipes.push(recipe);
        updateLocalStorage();
        renderCustomRecipes();
        alert('Recipe added to your list!');
    }

    function renderCustomRecipes() {
        customRecipesContainer.innerHTML = '';
        
        if (STATE.customRecipes.length === 0) {
            customRecipesContainer.innerHTML = '<p>You haven\'t added any recipes yet.</p>';
            return;
        }

        STATE.customRecipes.forEach(meal => {
            // Usamos 'favorite' como tipo para tener el botón de borrar
            const card = CreateFullCard(meal, 'custom'); 
            customRecipesContainer.appendChild(card);
        });
    }

    // Unificamos el guardado en LocalStorage
    function updateLocalStorage() {
        // Guardamos AMBAS listas juntas en el mismo "cajón" del navegador para simplificar
        const allData = [...STATE.favorites, ...STATE.customRecipes];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
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
        updateLocalStorage(); 
        renderFavorites();
    }

    function removeCustomRecipe(idMeal) {
        STATE.customRecipes = STATE.customRecipes.filter(recipe => recipe.idMeal !== idMeal);
        updateLocalStorage();
        renderCustomRecipes();
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
       const batch = STATE.searchResults.slice(STATE.shownCount, STATE.shownCount + STATE.itemsPerLoad);

        batch.forEach(meal => {
            const card = CreateFullCard(meal, 'result'); 
            resultsContainer.appendChild(card);
        });

        STATE.shownCount += batch.length;

        // Manejo del botón "Ver más"
        loadMoreBtn.style.display = (STATE.shownCount < STATE.searchResults.length) ? 'inline-block' : 'none'; 
    }

    // Pinta la lista de favoritos
    function renderFavorites() {
        favoritesContainer.innerHTML = ''; // Clean the container

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

    function displayNutritionInfo(fat, cholesterol, carbs, sugar) {
        console.log("In nutrition thing")
        nutritionPanel.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:var(--primary-color); border-bottom:1px solid #ddd;">Total Nutrition</h4>
            <div class="nutrition-item">
                <strong><i class="fas fa-bacon"></i> Total Fat:</strong>
                <span>${fat.toFixed(1)}g</span>
            </div>
            <div class="nutrition-item">
                <strong><i class="fas fa-heartbeat"></i> Cholesterol:</strong>
                <span>${cholesterol.toFixed(1)}mg</span>
            </div>
            <div class="nutrition-item">
                <strong><i class="fas fa-bread-slice"></i> Carbs:</strong>
                <span>${carbs.toFixed(1)}g</span>
            </div>
            <div class="nutrition-item">
                <strong><i class="fas fa-candy-cane"></i> Sugar:</strong>
                <span>${sugar.toFixed(1)}g</span>
            </div>
        `
    }

    // ==========================================
    // 3. API Y BÚSQUEDA
    // ==========================================

    async function fetchRecipes(ingredient) {
        resultsContainer.innerHTML = '<p>Searching...</p>';
        loadMoreBtn.style.display = 'none';
        const category = categorySelect.value;
        
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
            const data = await response.json();
            resultsContainer.innerHTML = ''; // Limpiar mensaje de carga

            if (!data.meals) {
                resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}"</p>`;
                return;
            }

            if (category !== 'All Categories') {
                let mealsLookup = data.meals.map(async (meal) => {
                    try {
                        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
                        const newData = await response.json();
                        const fullMeal = newData.meals[0];
                        return fullMeal.strCategory === category ? fullMeal : null;
                    } catch (error) {
                        console.error("Error: ", error);
                    }
                });
                const results = await Promise.all(mealsLookup);
                let filteredMeals = []
                for (meal of results) {
                    if (!meal) {
                        continue;
                    }
                    filteredMeals.push(meal);
                }
                data.meals = filteredMeals;
            }
            console.log(data.meals)
            
            if (data.meals.length === 0) {
                resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}" in category ${category}</p>`;
                return;
            }

            STATE.searchResults = data.meals;
            STATE.shownCount = 0;
            renderNextBatch(STATE.itemsPerLoad);
        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = '<p>Error connecting to the API.</p>';
        }
    }

    async function openRecipeDetails(id) {
        // 1. VERIFICAR SI ES UNA RECETA PROPIA
        if (String(id).startsWith('custom-')) {
            const localRecipe = STATE.customRecipes.find(r => r.idMeal === id);
            if (localRecipe) {
                currentRecipe = localRecipe;
                populateModal(localRecipe);
                modal.style.display = 'flex';
                
                // Ajustar el botón de favorito del modal para permitir borrarla
                const icon = modalFavBtn.querySelector('i');
                modalFavBtn.classList.add('active'); // Siempre activa porque es nuestra
                toogleHeartIcon(icon, 'active');
            }
            return;
        }

        // 2. SI NO ES PROPIA, BUSCAMOS EN LA API
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            const data = await response.json();
            const recipe = data.meals[0];

            if (recipe) {
                currentRecipe = recipe;
                populateModal(recipe);
                modal.style.display = 'flex';

                const ingredientQuery = getIngredientListWithMeasures(recipe).join(' ');
                console.log("Nutrition List: ", ingredientQuery)

                if (NINJA_API_KEY && ingredientQuery) {
                    try {
                        const {totalFat, totalCholesterol, totalCarbs, totalSugar} = await getNutrition(ingredientQuery);
                        console.log(totalFat, totalCholesterol, totalCarbs, totalSugar);
                        displayNutritionInfo(totalFat, totalCholesterol, totalCarbs, totalSugar);
                    } catch (error) {
                        console.log("Error: ", error)
                        nutritionPanel.innerHTML = '<p style="text-align:center;">Nutrition info not available</p>'
                    }
                } else if (!NINJA_API_KEY) {
                    console.log("hola");
                    nutritionPanel.innerHTML = '<p style="color:red; text-align:center;"> API key missing</p>';
                } else {
                    console.log("adios")
                    nutritionPanel.innerHTML = '<p style="text-align:center;"> No ingredients found</p>';
                }
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        }
    }

    function getIngredientListWithMeasures(recipe) {
        let ingredientWithMeasures = []
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`]
            const measure = recipe[`strMeasure${i}`]
            if (ingredient && ingredient.trim !== "") {
                const cleanMeasure = measure ? measure.trim() : '';
                const cleanIngredient = ingredient.trim();
                ingredientWithMeasures.push(`${cleanMeasure} ${cleanIngredient}`);
            } else {
                break; 
            }
        }
        return ingredientWithMeasures;
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

    async function getNutrition(query) {
        
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`https://api.api-ninjas.com/v1/nutrition?query=${encodedQuery}`, {
                method: "GET",
                headers: { 'X-Api-Key': NINJA_API_KEY }
            });
            if (!response.ok) throw new Error('Network error...');

            const data = await response.json();

            if (data && data.length > 0) {
                let totalFat = 0;
                let totalCholesterol = 0;
                let totalCarbs = 0;
                let totalSugar = 0;

                // Add the total values from ingredients
                data.forEach(item => {
                    totalFat += item.fat_total_g ?? 0;
                    totalCholesterol += item.cholesterol_mg ?? 0;
                    totalCarbs += item.carbohydrates_total_g ?? 0;
                    totalSugar += item.sugar_g ?? 0;
                });
                console.log(totalFat, totalCholesterol, totalCarbs, totalSugar);
                return {totalFat, totalCholesterol, totalCarbs, totalSugar};
            } else {
                throw new Error("No ingredients found...")
            }
        } catch (error) {
            console.error(error);
            throw new Error("Error loading nutrition...")
        }
    }


    // ==========================================
    // 4. EVENT LISTENER (INTERACCIÓN)
    // ==========================================

    customRecipesContainer.addEventListener('click', (e) => {
        // Verificamos si lo que se clickeó es el botón "Remove"
        if (e.target.classList.contains('card-fav-btn')) {
            const id = e.target.getAttribute('data-id');
            
            // Preguntamos al usuario para confirmar (opcional, pero recomendado)
            if (confirm('Are you sure you want to delete this recipe?')) {
                removeCustomRecipe(id);
            }
        }
    });
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
    // 5. INITIALIZATION
    // ==========================================
    loadFavorites(); 
    createCategoryList();

    // ==========================================
    // LOGIC FOR ADDING CUSTOM RECIPES
    // ==========================================

    const addRecipeBtn = document.getElementById('add-recipe-btn');
    const addRecipeModal = document.getElementById('add-recipe-modal');
    const closeAddModalBtn = document.getElementById('close-add-modal-btn');
    const addRecipeForm = document.getElementById('add-recipe-form');

    // Abrir modal
    addRecipeBtn.addEventListener('click', () => {
        addRecipeModal.style.display = 'flex';
    });

    // Cerrar modal
    closeAddModalBtn.addEventListener('click', () => {
        addRecipeModal.style.display = 'none';
    });

    // Manejar el envío del formulario
    addRecipeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('custom-title').value;
        const imgUrl = document.getElementById('custom-img').value;
        const instructions = document.getElementById('custom-instructions').value;
        const ingredientsText = document.getElementById('custom-ingredients').value;

        // Crear objeto de receta compatible con la estructura de la API
        // Generamos un ID único usando Date.now()
        const newRecipe = {
            idMeal: `custom-${Date.now()}`, 
            strMeal: title,
            strMealThumb: imgUrl || 'https://via.placeholder.com/300?text=No+Image', // Default img
            strInstructions: instructions,
            strCategory: 'Custom'
        };

        // Procesar ingredientes (dividir por líneas) para que encajen en strIngredient1, etc.
        const lines = ingredientsText.split('\n');
        lines.forEach((line, index) => {
            if (index < 20 && line.trim() !== '') {
                newRecipe[`strIngredient${index + 1}`] = line.trim();
                newRecipe[`strMeasure${index + 1}`] = ''; // Dejamos la medida vacía o incluida en el ingrediente
            }
        });

        // Guardar en favoritos
        saveCustomRecipe(newRecipe);
        
        // Limpiar y cerrar
        addRecipeForm.reset();
        addRecipeModal.style.display = 'none';
        
        // Hacer scroll hacia favoritos para ver el resultado
        favoritesContainer.scrollIntoView({ behavior: 'smooth' });
    });

    // Cerrar modal si se hace click fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === addRecipeModal) {
            addRecipeModal.style.display = 'none';
        }
    });
});



