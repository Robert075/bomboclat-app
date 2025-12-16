function getNutritionInfoHTML(fat, cholesterol, carbs, sugar) {
   return `
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
    `; 
}


function createCardHTML(meal, type) {
    // 'type' can be either 'result' (with Add button) or 'favvorite' (with Remove button)
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

// The function returns a list of ingredients with measures
// eg. ["200gr dried pasta", "200ml water"]
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

function saveFavorite(recipe, favoriteList) {
  if (favoriteList.some(fav => fav.idMeal === recipe.idMeal)) {
    return false;
  }
  favoriteList.push(recipe);
  return true;
}

function removeFavorite(idMeal, favoriteList) {
  favoriteList = favoriteList.filter(fav => fav.idMeal !== idMeal);
  return favoriteList;
}

module.exports = {
  getNutritionInfoHTML, 
  createCardHTML, 
  getIngredientListWithMeasures,
  saveFavorite,
  removeFavorite
};
