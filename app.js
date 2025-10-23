// Los países están definidos en countries.js

class CoinCollectionApp {
    constructor() {
        this.items = [];
        this.currentScreen = 'main';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.populateCountrySelect();
        this.renderMainScreen();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('addItemBtn').addEventListener('click', () => this.showScreen('add'));
        document.getElementById('searchImageBtn').addEventListener('click', () => this.searchByImage());
        document.getElementById('continentsBtn').addEventListener('click', () => this.showContinents());

        // Botones de navegación
        document.getElementById('backFromAdd').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('backFromCountry').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('backFromContinents').addEventListener('click', () => this.showScreen('main'));
        document.getElementById('backFromEdit').addEventListener('click', () => this.showScreen('country'));

        // Formulario agregar
        document.getElementById('addForm').addEventListener('submit', (e) => this.handleAddItem(e));
        document.getElementById('photoPreviewFront').addEventListener('click', () => this.selectPhoto('front'));
        document.getElementById('photoPreviewBack').addEventListener('click', () => this.selectPhoto('back'));
        document.getElementById('photoInputFront').addEventListener('change', (e) => this.handlePhotoSelect(e, 'front'));
        document.getElementById('photoInputBack').addEventListener('change', (e) => this.handlePhotoSelect(e, 'back'));
        
        // Formulario editar
        document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditItem(e));
        document.getElementById('editPhotoPreviewFront').addEventListener('click', () => this.selectPhoto('front', 'edit'));
        document.getElementById('editPhotoPreviewBack').addEventListener('click', () => this.selectPhoto('back', 'edit'));
        document.getElementById('editPhotoInputFront').addEventListener('change', (e) => this.handlePhotoSelect(e, 'front', 'edit'));
        document.getElementById('editPhotoInputBack').addEventListener('change', (e) => this.handlePhotoSelect(e, 'back', 'edit'));
        document.getElementById('deleteItemBtn').addEventListener('click', () => this.deleteItem());
    }

    showScreen(screenName) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen, .main-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Mostrar pantalla seleccionada
        if (screenName === 'main') {
            document.getElementById('mainScreen').classList.remove('hidden');
            this.renderMainScreen();
        } else {
            document.getElementById(screenName + 'Screen').classList.remove('hidden');
        }

        this.currentScreen = screenName;
    }

    renderMainScreen() {
        const countriesGrid = document.getElementById('countriesGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.items.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Contar items por país
        const countryCount = {};
        this.items.forEach(item => {
            countryCount[item.countryCode] = (countryCount[item.countryCode] || 0) + 1;
        });

        // Renderizar banderas
        countriesGrid.innerHTML = '';
        Object.keys(countryCount).forEach(countryCode => {
            const country = COUNTRIES[countryCode];
            if (country) {
                const flagElement = document.createElement('div');
                flagElement.className = 'country-flag';
                flagElement.innerHTML = `
                    <div class="flag-emoji">
                        <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" 
                             alt="${country.name}" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                             style="width: 40px; height: auto; border-radius: 4px;">
                        <span style="display: none; font-size: 2.5rem;">${country.flag}</span>
                    </div>
                    <div class="country-name">${country.name}</div>
                    <div class="count">${countryCount[countryCode]}</div>
                `;
                flagElement.addEventListener('click', () => this.showCountryItems(countryCode));
                countriesGrid.appendChild(flagElement);
            }
        });
    }

    showCountryItems(countryCode) {
        const country = COUNTRIES[countryCode];
        const countryItems = this.items.filter(item => item.countryCode === countryCode);

        document.getElementById('countryTitle').textContent = country.name;
        
        const itemsList = document.getElementById('itemsList');
        itemsList.innerHTML = '';

        countryItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            itemCard.innerHTML = `
                <img src="${item.photoFront || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik00MCA0MEw0MCA0MEw0MCA0MEw0MCA0MFoiIGZpbGw9IiNDQ0MiLz4KPC9zdmc+'}" alt="${item.denomination}" class="item-photo">
                <div class="item-info">
                    <h3>${item.denomination}</h3>
                    <p><strong>Tipo:</strong> ${item.type}</p>
                    <p><strong>Año:</strong> ${item.year}</p>
                    <p><strong>Estado:</strong> ${item.condition}</p>
                    ${item.value ? `<p><strong>Valor:</strong> $${item.value}</p>` : ''}
                    ${item.catalogLink ? `<p><strong>Catálogo:</strong> <a href="${item.catalogLink}" target="_blank" rel="noopener">Ver enlace</a></p>` : ''}
                </div>
                <button class="btn btn-secondary edit-btn" onclick="app.editItem(${item.id})">Editar</button>
            `;
            itemsList.appendChild(itemCard);
        });

        this.showScreen('country');
    }

    showContinents() {
        const continentsList = document.getElementById('continentsList');
        continentsList.innerHTML = '';

        // Agrupar países por continente
        const continents = {};
        this.items.forEach(item => {
            const country = COUNTRIES[item.countryCode];
            if (country) {
                if (!continents[country.continent]) {
                    continents[country.continent] = new Set();
                }
                continents[country.continent].add(item.countryCode);
            }
        });

        // Renderizar continentes
        Object.keys(continents).forEach(continentName => {
            const section = document.createElement('div');
            section.className = 'continent-section';
            
            const countriesHtml = Array.from(continents[continentName])
                .map(countryCode => {
                    const country = COUNTRIES[countryCode];
                    const count = this.items.filter(item => item.countryCode === countryCode).length;
                    return `<div class="country-flag" onclick="app.showCountryItems('${countryCode}'); app.showScreen('country');">
                        <div class="flag-emoji">
                            <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" 
                                 alt="${country.name}" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                 style="width: 40px; height: auto; border-radius: 4px;">
                            <span style="display: none; font-size: 2.5rem;">${country.flag}</span>
                        </div>
                        <div class="country-name">${country.name}</div>
                        <div class="count">${count}</div>
                    </div>`;
                }).join('');

            section.innerHTML = `
                <h3>${continentName}</h3>
                <div class="continent-countries">${countriesHtml}</div>
            `;
            
            continentsList.appendChild(section);
        });

        this.showScreen('continents');
    }

    populateCountrySelect() {
        const select = document.getElementById('country');
        Object.keys(COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${COUNTRIES[code].flag} ${COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }

    selectPhoto(side, mode = 'add') {
        const prefix = mode === 'edit' ? 'edit' : '';
        document.getElementById(`${prefix}photoInput${side === 'front' ? 'Front' : 'Back'}`).click();
    }

    handlePhotoSelect(event, side, mode = 'add') {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const prefix = mode === 'edit' ? 'edit' : '';
                const preview = document.getElementById(`${prefix}photoPreview${side === 'front' ? 'Front' : 'Back'}`);
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.dataset.photo = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    editItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        this.currentEditingItem = item;
        
        // Poblar lista de países primero
        this.populateEditCountrySelect();
        
        // Poblar formulario de edición
        document.getElementById('editItemType').value = item.type;
        document.getElementById('editCountry').value = item.countryCode;
        document.getElementById('editDenomination').value = item.denomination;
        document.getElementById('editYear').value = item.year;
        document.getElementById('editCondition').value = item.condition;
        document.getElementById('editValue').value = item.value || '';
        document.getElementById('editNotes').value = item.notes || '';
        document.getElementById('editCatalogLink').value = item.catalogLink || '';
        
        // Mostrar fotos existentes
        const frontPreview = document.getElementById('editPhotoPreviewFront');
        const backPreview = document.getElementById('editPhotoPreviewBack');
        
        if (item.photoFront) {
            frontPreview.innerHTML = `<img src="${item.photoFront}" alt="Anverso">`;
            frontPreview.dataset.photo = item.photoFront;
        } else {
            frontPreview.innerHTML = '<span>📷 Foto Anverso</span>';
        }
        
        if (item.photoBack) {
            backPreview.innerHTML = `<img src="${item.photoBack}" alt="Reverso">`;
            backPreview.dataset.photo = item.photoBack;
        } else {
            backPreview.innerHTML = '<span>📷 Foto Reverso</span>';
        }
        
        this.showScreen('edit');
    }

    handleEditItem(event) {
        event.preventDefault();
        
        if (!this.currentEditingItem) return;
        
        const photoPreviewFront = document.getElementById('editPhotoPreviewFront');
        const photoPreviewBack = document.getElementById('editPhotoPreviewBack');
        
        // Actualizar item
        const itemIndex = this.items.findIndex(i => i.id === this.currentEditingItem.id);
        if (itemIndex !== -1) {
            this.items[itemIndex] = {
                ...this.currentEditingItem,
                type: document.getElementById('editItemType').value,
                countryCode: document.getElementById('editCountry').value,
                country: COUNTRIES[document.getElementById('editCountry').value].name,
                denomination: document.getElementById('editDenomination').value,
                year: parseInt(document.getElementById('editYear').value),
                condition: document.getElementById('editCondition').value,
                value: parseFloat(document.getElementById('editValue').value) || null,
                notes: document.getElementById('editNotes').value,
                catalogLink: document.getElementById('editCatalogLink').value,
                photoFront: photoPreviewFront.dataset.photo || null,
                photoBack: photoPreviewBack.dataset.photo || null,
                dateModified: new Date().toISOString()
            };
        }
        
        this.saveData();
        this.currentEditingItem = null;
        this.showScreen('country');
    }

    deleteItem() {
        if (!this.currentEditingItem) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
            this.items = this.items.filter(i => i.id !== this.currentEditingItem.id);
            this.saveData();
            this.currentEditingItem = null;
            this.showScreen('main');
        }
    }

    populateEditCountrySelect() {
        const select = document.getElementById('editCountry');
        select.innerHTML = '<option value="">Seleccionar país...</option>';
        Object.keys(COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${COUNTRIES[code].flag} ${COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }

    handleAddItem(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const photoPreview = document.getElementById('photoPreview');
        
        const photoPreviewFront = document.getElementById('photoPreviewFront');
        const photoPreviewBack = document.getElementById('photoPreviewBack');
        
        const item = {
            id: Date.now(),
            type: document.getElementById('itemType').value,
            countryCode: document.getElementById('country').value,
            country: COUNTRIES[document.getElementById('country').value].name,
            denomination: document.getElementById('denomination').value,
            year: parseInt(document.getElementById('year').value),
            condition: document.getElementById('condition').value,
            value: parseFloat(document.getElementById('value').value) || null,
            notes: document.getElementById('notes').value,
            catalogLink: document.getElementById('catalogLink').value,
            photoFront: photoPreviewFront.dataset.photo || null,
            photoBack: photoPreviewBack.dataset.photo || null,
            dateAdded: new Date().toISOString()
        };

        this.items.push(item);
        this.saveData();
        
        // Limpiar formulario
        event.target.reset();
        document.getElementById('photoPreviewFront').innerHTML = '<span>📷 Foto Anverso</span>';
        document.getElementById('photoPreviewBack').innerHTML = '<span>📷 Foto Reverso</span>';
        delete photoPreviewFront.dataset.photo;
        delete photoPreviewBack.dataset.photo;
        document.getElementById('catalogLink').value = '';
        
        this.showScreen('main');
    }

    searchByImage() {
        alert('Función de búsqueda por imagen próximamente. Se integrará con APIs de reconocimiento de monedas.');
    }

    saveData() {
        localStorage.setItem('coinCollection', JSON.stringify(this.items));
    }

    loadData() {
        const saved = localStorage.getItem('coinCollection');
        if (saved) {
            this.items = JSON.parse(saved);
        }
    }
}

// Inicializar la aplicación
const app = new CoinCollectionApp();