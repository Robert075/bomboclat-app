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
});

