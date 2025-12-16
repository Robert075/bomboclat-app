const {
  getIngredientListWithMeasures, 
  getNutritionInfoHTML, 
  createCardHTML,
  saveFavorite,
  removeFavorite
} = require("../src/utils");

const recipe = {
      "idMeal": "52772",
      "strMeal": "Teriyaki Chicken Casserole",
      "strCategory": "Chicken",
      "strMealThumb": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      "strIngredient1": "soy sauce",
      "strIngredient2": "water",
      "strIngredient3": "brown sugar",
      "strIngredient4": "ground ginger",
      "strIngredient5": "minced garlic",
      "strIngredient6": "cornstarch",
      "strIngredient7": "chicken breasts",
      "strIngredient8": "stir-fry vegetables",
      "strIngredient9": "brown rice",
      "strIngredient10": "",
      "strIngredient11": "",
      "strIngredient12": "",
      "strIngredient13": "",
      "strIngredient14": "",
      "strIngredient15": "",
      "strIngredient16": null,
      "strIngredient17": null,
      "strIngredient18": null,
      "strIngredient19": null,
      "strIngredient20": null,
      "strMeasure1": "3/4 cup",
      "strMeasure2": "1/2 cup",
      "strMeasure3": "1/4 cup",
      "strMeasure4": "1/2 teaspoon",
      "strMeasure5": "1/2 teaspoon",
      "strMeasure6": "4 Tablespoons",
      "strMeasure7": "2",
      "strMeasure8": "1 (12 oz.)",
      "strMeasure9": "3 cups",
      "strMeasure10": "",
      "strMeasure11": "",
      "strMeasure12": "",
      "strMeasure13": "",
      "strMeasure14": "",
      "strMeasure15": "",
      "strMeasure16": null,
      "strMeasure17": null,
      "strMeasure18": null,
      "strMeasure19": null,
      "strMeasure20": null,
    };

test("Recipe object is correctly processed to extract ingredients and measures", () => {
  const expected = ["3/4 cup soy sauce", "1/2 cup water", "1/4 cup brown sugar", "1/2 teaspoon ground ginger", "1/2 teaspoon minced garlic", "4 Tablespoons cornstarch", "2 chicken breasts", "1 (12 oz.) stir-fry vegetables", "3 cups brown rice"];
  const result = getIngredientListWithMeasures(recipe);
  expect(result).toStrictEqual(expected);
});

test("Nutrition information is correctly created", () => {
  const expected = `
        <h4 style="margin:0 0 10px 0; color:var(--primary-color); border-bottom:1px solid #ddd;">Total Nutrition</h4>
        <div class="nutrition-item">
            <strong><i class="fas fa-bacon"></i> Total Fat:</strong>
            <span>12.6g</span>
        </div>
        <div class="nutrition-item">
            <strong><i class="fas fa-heartbeat"></i> Cholesterol:</strong>
            <span>700.0mg</span>
        </div>
        <div class="nutrition-item">
            <strong><i class="fas fa-bread-slice"></i> Carbs:</strong>
            <span>300.0g</span>
        </div>
        <div class="nutrition-item">
            <strong><i class="fas fa-candy-cane"></i> Sugar:</strong>
            <span>20.0g</span>
        </div>
    `; 
  const result = getNutritionInfoHTML(12.6, 700, 300, 20);
  expect(result).toBe(expected);
});

test("Recipe cards are correctly created", () => {
  const expected = `
        <img src="https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg" alt="Teriyaki Chicken Casserole">
        <div class="card-info">
            <h3>Teriyaki Chicken Casserole</h3>
            <button class="card-fav-btn" data-id="52772">Add to favourites</button>
        </div>
    `;
  const result = createCardHTML(recipe, "result");
  expect(result).toBe(expected);
});

test("Recipes can be added to favourites", () => {
  const favouriteList = [];
  expect(saveFavorite(recipe, favouriteList)).toBe(true);
  expect(favouriteList.length).toStrictEqual(1);
});

test("Recipes can be deleted from favourites", () => {
  let favouriteList = [recipe];
  favouriteList = removeFavorite(recipe.idMeal, favouriteList);
  expect(favouriteList.length).toStrictEqual(0);
});

test("Recipes can be added and deleted in the same run", () => {
  let favouriteList = [];
  expect(favouriteList.length).toStrictEqual(0);
  expect(saveFavorite(recipe, favouriteList)).toBe(true);
  expect(favouriteList.length).toStrictEqual(1);
  favouriteList = removeFavorite(recipe.idMeal, favouriteList);
  expect(favouriteList.length).toStrictEqual(0);
})

test("The same recipe cannot be twice in the favourite list", () => {
  let favouriteList = [];
  expect(favouriteList.length).toStrictEqual(0);
  expect(saveFavorite(recipe, favouriteList)).toBe(true);
  expect(saveFavorite(recipe, favouriteList)).toBe(false);
})