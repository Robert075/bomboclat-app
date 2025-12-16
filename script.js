//import {getNutritionInfoHTML, getIngredientListWithMeasures, createCardHTML, saveFavorite, removeFavorite} from "./src/utils"

// --- REFERENES TO DOM ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const favoritesContainer = document.getElementById('favorites-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const categorySelect = document.getElementById('category-filter');
const customRecipesContainer = document.getElementById('custom-recipes-container');

// --- REFERENCES TO RECIPE MODAL ---
const modal = document.getElementById('recipe-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const modalImg = document.getElementById('modal-img');
const modalInstructions = document.getElementById('modal-instructions');
const modalIngredients = document.getElementById('modal-ingredients');
const modalFavBtn = document.getElementById('modal-fav-btn');
const nutritionPanel = document.getElementById('modal-nutrition');

// --- REFERENCES TO CUSTOM RECIPE FORM MODAL ---
const addRecipeBtn = document.getElementById('add-recipe-btn');
const addRecipeModal = document.getElementById('add-recipe-modal');
const closeAddModalBtn = document.getElementById('close-add-modal-btn');
const addRecipeForm = document.getElementById('add-recipe-form');

// --- KEYS ---
const NINJA_API_KEY = CONFIG.CALORIE_NINJA_API_KEY ?? "";
const STORAGE_KEY = CONFIG.STORAGE_KEY ?? "bomboclat";

// --- APP STATE ---
const STATE = {
    searchResults: [], // Recetas actuales de la búsqueda
    favorites: [],     // Recetas guardadas en favoritos
    shownCount: 0,
    itemsPerLoad: 6,
    currentRecipe: null
};

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // INITIALIZATION
    // ==========================================
    loadFromLocalStorage(); 
    createCategoryList();
});

// ==========================================
// 1. LOCAL-STORAGE AND DATA MANAGEMENT
// ==========================================
function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSaved = stored ? JSON.parse(stored) : [];
    // Split the recipes: With ID 'custom-' are different from the favorites
    STATE.customRecipes = allSaved.filter(r => String(r.idMeal).startsWith('custom-'));
    STATE.favorites = allSaved.filter(r => !String(r.idMeal).startsWith('custom-'));
    renderFavorites();
    renderCustomRecipes();
}

// Function to save custom recipes
function saveCustomRecipe(recipe) {
    STATE.customRecipes.push(recipe);
    updateLocalStorage();
    renderCustomRecipes();
    //alert('Recipe added to your list!');
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

// Unify local-storage save
function updateLocalStorage() {
    // Save both lists in the same space
    const allData = [...STATE.favorites, ...STATE.customRecipes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
}

function saveFavoriteAndUpdate(recipe) {
    // Avoid duplicates
    if (!saveFavorite(recipe, STATE.favorites)) {
        alert('Recipe already in favorites!');
        return;
    }
    updateLocalStorage();
    renderFavorites();
    // alert('Added to favorites!');
}

function removeFavoriteAndUpdate(idMeal) {
    STATE.favorites = removeFavorite(idMeal, STATE.favorites);
    updateLocalStorage(); 
    renderFavorites();
}

function removeCustomRecipe(idMeal) {
    STATE.customRecipes = STATE.customRecipes.filter(recipe => recipe.idMeal !== idMeal);
    updateLocalStorage();
    renderCustomRecipes();
}

// ==========================================
// 2. RENDER LOGIC
// ==========================================
// Creates the HTML for a card

function renderNextBatch(itemsPerLoad) {
    console.log(STATE.searchResults)
    const batch = STATE.searchResults.slice(STATE.shownCount, STATE.shownCount + itemsPerLoad);
    batch.forEach(meal => {
        const card = CreateFullCard(meal, 'result'); 
        resultsContainer.appendChild(card);
    });
    STATE.shownCount += batch.length;
    // "Load More" button display.
    loadMoreBtn.style.display = (STATE.shownCount < STATE.searchResults.length) ? 'inline-block' : 'none'; 
}
// Renders all favorite recipes
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
            break; // There are no more ingredients
        }
    }
    modalIngredients.appendChild(ul);
}

function closeModal() {
    modal.style.display = 'none';
    currentRecipe = null;
}

function displayNutritionInfo(fat, cholesterol, carbs, sugar) {
    nutritionPanel.innerHTML = getNutritionInfoHTML(fat, cholesterol, carbs, sugar);
}

async function createCategoryList() {
    const categories = await getCategoryList();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.strCategory;
        option.textContent = category.strCategory;
        categorySelect.appendChild(option);
    });
}

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
// 3. API AND SEARCH
// ==========================================

async function fetchRecipes(ingredient) {
    resultsContainer.innerHTML = '<p>Searching...</p>';
    loadMoreBtn.style.display = 'none';
    const category = categorySelect.value;
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
        const data = await response.json();
        resultsContainer.innerHTML = ''; // Clear Search message
        if (!data.meals) {
            resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}"</p>`;
            return;
        }
        data.meals = await getMealsFromCategory(data.meals, category);
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

async function getMealsFromCategory(meals, category) {
    if (category === 'All Categories') {
        return meals;
    }
    let mealsLookup = meals.map(async (meal) => {
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
    for (let meal of results) {
        if (!meal) {
            continue;
        }
        filteredMeals.push(meal);
    }
    return filteredMeals;

}

async function openRecipeDetails(id) {
    // 1. IS A CUSTOM RECIPE
    if (String(id).startsWith('custom-')) {
        const localRecipe = STATE.customRecipes.find(r => r.idMeal === id);
        if (localRecipe) {
            currentRecipe = localRecipe;
            populateModal(localRecipe);
            modal.style.display = 'flex';
            
            /*const icon = modalFavBtn.querySelector('i');
            modalFavBtn.classList.add('active'); // Siempre activa porque es nuestra
            toogleHeartIcon(icon, 'active');*/
        }
        return;
    }
    // 2. IS NOT A CUSTOM RECIPE
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
                nutritionPanel.innerHTML = '<p style="color:red; text-align:center;"> API key missing</p>';
            } else {
                nutritionPanel.innerHTML = '<p style="text-align:center;"> No ingredients found</p>';
            }
        }
    } catch (error) {
        console.error("Error fetching details:", error);
    }
}

async function getCategoryList() {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/categories.php`);
        const data = await response.json();
        return data.categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Gets the nutrition from all ingredients, added up by categories
async function getNutrition(ingredients) {
    try {
        const encodedQuery = encodeURIComponent(ingredients);
        const response = await fetch(`https://api.api-ninjas.com/v1/nutrition?query=${encodedQuery}`, {
            method: "GET",
            headers: { 'X-Api-Key': NINJA_API_KEY }
        });
        console.log("Nutrition response: ", response)
        //if (!response.ok) throw new Error('Network error...');
        const data = await response.json();
        console.log("Nutrition body: ", data)
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
    if (e.target.classList.contains('card-fav-btn')) {
        const id = e.target.getAttribute('data-id');
        removeCustomRecipe(id);
    }
});


searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ingredient = searchInput.value.trim();
    if (ingredient) {
        fetchRecipes(ingredient);
    } else {
        alert('Please enter an ingredient');
    }
});


loadMoreBtn.addEventListener('click', () => renderNextBatch(STATE.itemsPerLoad));

// Add to favorites
resultsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('card-fav-btn')) {
        e.preventDefault();
        const id = e.target.getAttribute('data-id');
        const mealData = STATE.searchResults.find(meal => meal.idMeal === id);
        if (mealData) {
            saveFavoriteAndUpdate(mealData);
        }
    }
});

// Remove from favorites
favoritesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('card-fav-btn')) {
        const id = e.target.getAttribute('data-id');
        removeFavoriteAndUpdate(id);
    }
});

// Clsoe modal window
closeModalBtn.addEventListener('click', closeModal);

// Favorite button inside the modal
modalFavBtn.addEventListener('click', () => {
    if (!currentRecipe) {
        return;
    }
    // Toogle visual
    const icon = modalFavBtn.querySelector('i');
    modalFavBtn.classList.toggle('active');
    if (modalFavBtn.classList.contains('active')) {
        toogleHeartIcon(icon, 'active');
        saveFavoriteAndUpdate(currentRecipe);
    } else {
        toogleHeartIcon(icon, 'inactive');
        removeFavoriteAndUpdate(currentRecipe.idMeal);
    }
});

// Open custom recipe form
addRecipeBtn.addEventListener('click', () => {
    addRecipeModal.style.display = 'flex';
});

// Close custom recipe form
closeAddModalBtn.addEventListener('click', () => {
    addRecipeModal.style.display = 'none';
});

// Manage form submit
addRecipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('custom-title').value;
    const imgUrl = document.getElementById('custom-img').value;
    const instructions = document.getElementById('custom-instructions').value;
    const ingredientsText = document.getElementById('custom-ingredients').value;
    // Create a recipe object compatible with the api structure
    // The id uses Date.now()
    const newRecipe = {
        idMeal: `custom-${Date.now()}`, 
        strMeal: title,
        strMealThumb: imgUrl || 'https://worldfoodtour.co.uk/wp-content/uploads/2013/06/neptune-placeholder-48.jpg', // Default img
        strInstructions: instructions,
        strCategory: 'Custom'
    };
    // Procesar ingredientes (dividir por líneas) para que encajen en strIngredient1, etc.
    // Process ingredients so -
    const lines = ingredientsText.split('\n');
    lines.forEach((line, index) => {
        if (index < 20 && line.trim() !== '') {
            newRecipe[`strIngredient${index + 1}`] = line.trim();
            newRecipe[`strMeasure${index + 1}`] = ''; // Dejamos la medida vacía o incluida en el ingrediente
        }
    });
    // Save in state
    saveCustomRecipe(newRecipe);
    
    // Clean and close
    addRecipeForm.reset();
    addRecipeModal.style.display = 'none';
    
    // Scroll down to favorites to see the result
    favoritesContainer.scrollIntoView({ behavior: 'smooth' });
});

window.addEventListener('click', (e) => {
    if (e.target === addRecipeModal) {
        addRecipeModal.style.display = 'none';
    }
});