document.addEventListener('DOMContentLoaded', () => {
	const resultsContainer = document.getElementById('results-container');
	const favoritesContainer = document.getElementById('favorites-container');

	if (!resultsContainer || !favoritesContainer) return;

	function hasNoFavoritesPlaceholder() {
		const p = favoritesContainer.querySelector('p');
		return p && /no favourites yet/i.test(p.textContent);
	}

	function removeNoFavoritesPlaceholder() {
		if (hasNoFavoritesPlaceholder()) favoritesContainer.innerHTML = '';
	}

	function isAlreadyFavorited(title) {
		return Array.from(favoritesContainer.querySelectorAll('.recipe-card h3'))
			.some(h => h.textContent.trim() === title.trim());
	}

	function createFavoriteCard(card) {
		const title = card.querySelector('h3')?.textContent || '';
		if (!title) return;
		if (isAlreadyFavorited(title)) return;

		removeNoFavoritesPlaceholder();

		const fav = document.createElement('div');
		fav.className = 'recipe-card';

		const titleEl = document.createElement('h3');
		titleEl.textContent = title;
		fav.appendChild(titleEl);

		// copy relevant paragraphs (ingredients, category, time)
		card.querySelectorAll('p').forEach(p => {
			const clone = p.cloneNode(true);
			fav.appendChild(clone);
		});

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.textContent = 'Remove';
		removeBtn.addEventListener('click', () => {
			fav.remove();
			if (!favoritesContainer.querySelector('.favorite-item')) {
				favoritesContainer.innerHTML = '<p>No favourites yet... Add some recipes!</p>';
			}
		});

		fav.appendChild(removeBtn);
		favoritesContainer.appendChild(fav);
	}

	// wire up existing recipe cards' buttons
	resultsContainer.querySelectorAll('.recipe-card button').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			const card = btn.closest('.recipe-card');
			if (card) createFavoriteCard(card);
		});
	});

	// Recipe fetch logic

	const searchForm = document.getElementById('search-form');
	const searchInput = document.getElementById('search-input');
	const loadMoreBtn = document.getElementById('load-more-btn');

	// In order to "paginate" results, we need the following variables
	let storedMeals = []; 
	let shownCount = 0;
	const ITEMS_PER_LOAD = 6;

	
	searchForm.addEventListener('submit', (event) => {
		event.preventDefault();
		const ingredient = searchInput.value.trim();
		if (ingredient) {
			getRecipes(ingredient);
		} else {
			alert('Please, type an ingredient...');
		}
	});

	loadMoreBtn.addEventListener('click', () => {
		showNextBatch();
	});

	async function getRecipes(ingredient) {
		resultsContainer.innerHTML = '<p>Searching...</p>';
		loadMoreBtn.style.display = 'none'; // Hide the 'show more' button
		storedMeals = [];
		shownCount = 0;

		try {
			const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
			const data = await response.json();

			if (data.meals) {
				storedMeals = data.meals;
				resultsContainer.innerHTML = '';
				showNextBatch();
			} else {
				resultsContainer.innerHTML = `<p>No recipe found for "${ingredient}"`;
			}

		} catch (error) {
			console.log('Error: ', error);
			resultsContainer.innerHTML = '<p>There was an error while trying to connect to the API</p>'
		}
	}


	function showNextBatch() {
		const nextBatch = storedMeals.slice(shownCount, shownCount + ITEMS_PER_LOAD);
		nextBatch.forEach(meal => {
			const card = document.createElement('div');
			card.classList.add('recipe-card');
			card.innerHTML = `
				<img src="${meal.strMealThumb}" alt="${meal.strMeal}">
				<div class="card-info">
					<h3>${meal.strMeal}</h3>
					<button>Add to favourites</button>
				</div>
			`;
			resultsContainer.appendChild(card);
		});
		shownCount += nextBatch.length;
		if (shownCount < storedMeals.length) {
			loadMoreBtn.style.display = 'inline-block';
		} else {
			loadMoreBtn.style.display = 'none';
		}
	}
	
});

// Search bar functionality



