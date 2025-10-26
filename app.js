// Los países están definidos en countries.js

window.CoinCollectionApp = window.CoinCollectionApp || class CoinCollectionApp {
    constructor() {
        this.items = [];
        this.currentScreen = 'main';
        this.previousScreen = 'main';
    }

    async init() {
        this.setupEventListeners();
        this.populateCountrySelect();
        await this.loadData();
        this.renderMainScreen();
    }

    setupEventListeners() {
        try {
            // Botones principales
            document.getElementById('addItemBtn')?.addEventListener('click', () => this.showScreen('add'));
            document.getElementById('searchImageBtn')?.addEventListener('click', () => this.searchByImage());
            document.getElementById('continentsBtn')?.addEventListener('click', () => this.showContinents());

            // Botones de navegación
            document.getElementById('backFromAdd')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromCountry')?.addEventListener('click', () => {
                this.showScreen('main');
            });
            document.getElementById('backFromContinents')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromEdit')?.addEventListener('click', () => this.showScreen('country'));
            document.getElementById('backFromPhotoEditor')?.addEventListener('click', () => this.showScreen(this.previousScreen));
            document.getElementById('backFromImageSearch')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromNumista')?.addEventListener('click', () => this.showScreen('add'));
            
            // Título como botón home
            document.getElementById('appTitle')?.addEventListener('click', () => this.showScreen('main'));
            
            // Editor de fotos
            document.getElementById('cropBtn')?.addEventListener('click', () => this.cropPhoto());
            document.getElementById('rotateBtn')?.addEventListener('click', () => this.rotatePhoto());
            document.getElementById('savePhotoBtn')?.addEventListener('click', () => this.saveEditedPhoto());
            
            // Búsqueda por imagen
            document.getElementById('searchPhotoPreview')?.addEventListener('click', () => this.selectSearchPhoto());
            document.getElementById('searchPhotoInput')?.addEventListener('change', (e) => this.handleSearchPhotoSelect(e));
            document.getElementById('searchBtn')?.addEventListener('click', () => this.performImageSearch());
            
            // Obtener imágenes de Numista
            document.getElementById('getNumistaImagesAdd')?.addEventListener('click', () => this.getNumistaImages('add'));
            document.getElementById('getNumistaImagesEdit')?.addEventListener('click', () => this.getNumistaImages('edit'));
            
            // Zoom de imagen
            document.getElementById('backFromImageZoom')?.addEventListener('click', () => this.showScreen('edit'));
            document.getElementById('changeImageBtn')?.addEventListener('click', () => this.changeCurrentImage());
            document.getElementById('deleteImageBtn')?.addEventListener('click', () => this.deleteCurrentImage());

            // Formulario agregar
            document.getElementById('addForm')?.addEventListener('submit', (e) => this.handleAddItem(e));
            document.getElementById('photoPreviewFront')?.addEventListener('click', () => this.selectPhoto('front'));
            document.getElementById('photoPreviewBack')?.addEventListener('click', () => this.selectPhoto('back'));
            document.getElementById('photoInputFront')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'front'));
            document.getElementById('photoInputBack')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'back'));
            
            // Formulario editar
            document.getElementById('editForm')?.addEventListener('submit', (e) => this.handleEditItem(e));
            document.getElementById('editPhotoPreviewFront')?.addEventListener('click', () => this.selectPhoto('front', 'edit'));
            document.getElementById('editPhotoPreviewBack')?.addEventListener('click', () => this.selectPhoto('back', 'edit'));
            document.getElementById('editPhotoInputFront')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'front', 'edit'));
            document.getElementById('editPhotoInputBack')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'back', 'edit'));
            document.getElementById('deleteItemBtn')?.addEventListener('click', () => this.deleteItem());
            
            // Numista import
            document.getElementById('numistaBtnAdd')?.addEventListener('click', () => this.showScreen('numista'));
            document.getElementById('parseNumistaBtn')?.addEventListener('click', () => this.parseNumistaUrl());
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    showScreen(screenName) {
        if (this.currentScreen === screenName) {
            return;
        }
        
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenName;
        
        document.querySelectorAll('.screen, .main-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        if (screenName === 'main') {
            const mainScreen = document.getElementById('mainScreen');
            if (mainScreen) {
                mainScreen.classList.remove('hidden');
                this.renderMainScreen();
            }
        } else if (screenName === 'country') {
            const countryScreen = document.getElementById('countryScreen');
            if (countryScreen) {
                countryScreen.classList.remove('hidden');
            }
        } else {
            const screen = document.getElementById(screenName + 'Screen');
            if (screen) {
                screen.classList.remove('hidden');
            }
        }
    }

    renderMainScreen() {
        const countriesGrid = document.getElementById('countriesGrid');

        if (!countriesGrid) {
            console.error('countriesGrid no encontrado en renderMainScreen');
            return;
        }
        
        console.log('Renderizando pantalla principal con', this.items.length, 'items');

        if (this.items.length === 0) {
            countriesGrid.innerHTML = '<div class="empty-state"><p>¡Comienza tu colección!</p><p>Agrega tu primera moneda o billete</p></div>';
            return;
        }

        const countryCount = {};
        this.items.forEach(item => {
            countryCount[item.countryCode] = (countryCount[item.countryCode] || 0) + 1;
        });

        countriesGrid.innerHTML = '';
        const sortedCountries = Object.keys(countryCount).sort((a, b) => {
            const nameA = window.COUNTRIES[a]?.name || '';
            const nameB = window.COUNTRIES[b]?.name || '';
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });
        
        sortedCountries.forEach(countryCode => {
            const country = window.COUNTRIES[countryCode];
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
        this.currentCountryCode = countryCode;
        const country = window.COUNTRIES[countryCode];
        
        if (!country) {
            console.error('País no encontrado:', countryCode);
            return;
        }
        
        const countryItems = this.items.filter(item => item.countryCode === countryCode);

        this.showScreen('country');
        
        const countryTitle = document.getElementById('countryTitle');
        if (countryTitle) {
            countryTitle.textContent = country.name;
        }
        
        const itemsList = document.getElementById('itemsList');
        if (!itemsList) return;
        
        itemsList.innerHTML = '';

        countryItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <img class="item-photo" src="${item.photoFront || ''}" alt="Foto" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; background: #f0f0f0; cursor: pointer; ${!item.photoFront ? 'display: none;' : ''}" data-item-id="${item.id}" data-side="front">
                <div class="item-photo-placeholder" style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 4px; display: ${item.photoFront ? 'none' : 'flex'}; align-items: center; justify-content: center; cursor: pointer;">📷</div>
                <div class="item-info">
                    <h3>${item.denomination}</h3>
                    <p><strong>Tipo:</strong> ${item.type}</p>
                    <p><strong>Año:</strong> ${item.year}</p>
                    <p><strong>Estado:</strong> ${item.condition}</p>
                    ${item.value ? `<p><strong>Valor:</strong> $${item.value}</p>` : ''}
                    ${item.catalogLink ? `<p><strong>Catálogo:</strong> <a href="${item.catalogLink}" target="_blank" rel="noopener">Ver enlace</a></p>` : ''}
                </div>
                <button class="btn btn-secondary edit-btn">Editar</button>
            `;
            

            
            const editBtn = itemCard.querySelector('.edit-btn');
            const itemPhoto = itemCard.querySelector('.item-photo');
            const itemPlaceholder = itemCard.querySelector('.item-photo-placeholder');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editItem(item.id));
            }
            if (itemPhoto) {
                itemPhoto.addEventListener('click', () => this.editItem(item.id));
            }
            if (itemPlaceholder) {
                itemPlaceholder.addEventListener('click', () => this.editItem(item.id));
            }
            
            itemsList.appendChild(itemCard);
        });
    }

    showContinents() {
        const continentsList = document.getElementById('continentsList');
        continentsList.innerHTML = '';

        const continents = {};
        this.items.forEach(item => {
            const country = window.COUNTRIES[item.countryCode];
            if (country) {
                if (!continents[country.continent]) {
                    continents[country.continent] = new Set();
                }
                continents[country.continent].add(item.countryCode);
            }
        });

        Object.keys(continents).forEach(continentName => {
            const section = document.createElement('div');
            section.className = 'continent-section';
            
            const countriesHtml = Array.from(continents[continentName])
                .map(countryCode => {
                    const country = window.COUNTRIES[countryCode];
                    const count = this.items.filter(item => item.countryCode === countryCode).length;
                    return `<div class="country-flag" data-country="${countryCode}">
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
            
            section.querySelectorAll('.country-flag').forEach(flagElement => {
                const countryCode = flagElement.dataset.country;
                flagElement.addEventListener('click', () => {
                    this.showCountryItems(countryCode);
                });
            });
            
            continentsList.appendChild(section);
        });

        this.showScreen('continents');
    }

    populateCountrySelect() {
        const select = document.getElementById('country');
        Object.keys(window.COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${window.COUNTRIES[code].flag} ${window.COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }

    selectPhoto(side, mode = 'add') {
        let inputId;
        if (mode === 'edit') {
            inputId = side === 'front' ? 'editPhotoInputFront' : 'editPhotoInputBack';
        } else {
            inputId = side === 'front' ? 'photoInputFront' : 'photoInputBack';
        }
        
        console.log('Buscando input con ID:', inputId);
        const input = document.getElementById(inputId);
        if (input) {
            input.click();
        } else {
            console.error('Input no encontrado:', inputId);
            // Listar todos los inputs disponibles para debug
            const allInputs = document.querySelectorAll('input[type="file"]');
            console.log('Inputs disponibles:', Array.from(allInputs).map(i => i.id));
        }
    }

    handlePhotoSelect(event, side, mode = 'add') {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentPhotoData = {
                    imageData: e.target.result,
                    side: side,
                    mode: mode
                };
                
                this.showPhotoEditor(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
    
    showPhotoEditor(imageData) {
        const canvas = document.getElementById('photoCanvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const maxWidth = 400;
            const maxHeight = 400;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            this.currentImage = img;
            this.currentCanvas = canvas;
        };
        
        img.src = imageData;
        this.showScreen('photoEditor');
    }
    
    cropPhoto() {
        const canvas = this.currentCanvas;
        const ctx = canvas.getContext('2d');
        const size = Math.min(canvas.width, canvas.height);
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = size;
        tempCanvas.height = size;
        
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        
        tempCtx.drawImage(canvas, x, y, size, size, 0, 0, size, size);
        
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(tempCanvas, 0, 0);
    }
    
    rotatePhoto() {
        const canvas = this.currentCanvas;
        const ctx = canvas.getContext('2d');
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.height;
        tempCanvas.height = canvas.width;
        
        tempCtx.translate(canvas.height / 2, canvas.width / 2);
        tempCtx.rotate(Math.PI / 2);
        tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        
        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
    }
    
    saveEditedPhoto() {
        const canvas = this.currentCanvas;
        const editedImageData = canvas.toDataURL('image/jpeg', 0.8);
        
        const { side, mode } = this.currentPhotoData;
        
        if (mode === 'search') {
            const preview = document.getElementById('searchPhotoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${editedImageData}" alt="Buscar" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
                this.searchImageData = editedImageData;
                document.getElementById('searchBtn').disabled = false;
            }
            this.showScreen('imageSearch');
        } else {
            let previewId;
            if (mode === 'edit') {
                previewId = side === 'front' ? 'editPhotoPreviewFront' : 'editPhotoPreviewBack';
            } else {
                previewId = side === 'front' ? 'photoPreviewFront' : 'photoPreviewBack';
            }
            
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = `<img src="${editedImageData}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 4px;">`;
                preview.dataset.photo = editedImageData;
                console.log('Foto guardada en:', previewId, 'Data length:', editedImageData.length);
            } else {
                console.error('Preview no encontrado:', previewId);
            }
            
            this.showScreen(mode === 'edit' ? 'edit' : 'add');
        }
    }
    
    selectSearchPhoto() {
        document.getElementById('searchPhotoInput').click();
    }
    
    handleSearchPhotoSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentPhotoData = {
                    imageData: e.target.result,
                    side: 'search',
                    mode: 'search'
                };
                
                this.showPhotoEditor(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    editItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        this.currentEditingItem = item;
        
        this.populateEditCountrySelect();
        
        document.getElementById('editItemType').value = item.type;
        document.getElementById('editCountry').value = item.countryCode;
        document.getElementById('editDenomination').value = item.denomination;
        document.getElementById('editYear').value = item.year;
        document.getElementById('editCondition').value = item.condition;
        document.getElementById('editValue').value = item.value || '';
        document.getElementById('editNotes').value = item.notes || '';
        document.getElementById('editCatalogLink').value = item.catalogLink || '';
        
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
        
        console.log('Antes de actualizar - Front dataset:', photoPreviewFront?.dataset?.photo);
        console.log('Antes de actualizar - Back dataset:', photoPreviewBack?.dataset?.photo);
        
        const itemIndex = this.items.findIndex(i => i.id === this.currentEditingItem.id);
        if (itemIndex !== -1) {
            const updatedItem = {
                ...this.currentEditingItem,
                type: document.getElementById('editItemType').value,
                countryCode: document.getElementById('editCountry').value,
                country: window.COUNTRIES[document.getElementById('editCountry').value].name,
                denomination: document.getElementById('editDenomination').value,
                year: parseInt(document.getElementById('editYear').value),
                condition: document.getElementById('editCondition').value,
                value: parseFloat(document.getElementById('editValue').value) || null,
                notes: document.getElementById('editNotes').value,
                catalogLink: document.getElementById('editCatalogLink').value,
                photoFront: photoPreviewFront.dataset.photo || this.currentEditingItem.photoFront || null,
                photoBack: photoPreviewBack.dataset.photo || this.currentEditingItem.photoBack || null,
                dateModified: new Date().toISOString()
            };
            
            this.items[itemIndex] = updatedItem;
            
            console.log('Item actualizado:', updatedItem);
            console.log('Imágenes guardadas - Front:', updatedItem.photoFront, 'Back:', updatedItem.photoBack);
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            
            // Intentar actualizar en API en segundo plano
            fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${this.currentEditingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            }).catch(() => {});
        }
        
        const countryCode = this.currentCountryCode;
        this.currentEditingItem = null;
        
        // Mostrar mensaje de éxito
        alert('✅ Item actualizado correctamente');
        
        // Navegar y actualizar la vista
        this.showScreen('country');
        if (countryCode) {
            this.showCountryItems(countryCode);
        }
    }

    async deleteItem() {
        if (!this.currentEditingItem) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
            const itemId = this.currentEditingItem.id;
            const countryCode = this.currentEditingItem.countryCode;
            
            try {
                if (typeof itemId === 'number') {
                    try {
                        await fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${itemId}`, {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.log('API delete error');
                    }
                }
                
                this.items = this.items.filter(i => i.id !== itemId);
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
                
                this.currentEditingItem = null;
                this.renderMainScreen();
                this.showCountryItems(countryCode);
                
            } catch (error) {
                console.error('Error eliminando item:', error);
            }
        }
    }

    populateEditCountrySelect() {
        const select = document.getElementById('editCountry');
        select.innerHTML = '<option value="">Seleccionar país...</option>';
        Object.keys(window.COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${window.COUNTRIES[code].flag} ${window.COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }

    handleAddItem(event) {
        event.preventDefault();
        
        const photoPreviewFront = document.getElementById('photoPreviewFront');
        const photoPreviewBack = document.getElementById('photoPreviewBack');
        
        const item = {
            id: Date.now(),
            type: document.getElementById('itemType').value,
            countryCode: document.getElementById('country').value,
            country: window.COUNTRIES[document.getElementById('country').value].name,
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
        
        // Intentar guardar en API en segundo plano
        fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        }).catch(() => {});
        
        localStorage.setItem('coinCollection', JSON.stringify(this.items));
        
        event.target.reset();
        document.getElementById('photoPreviewFront').innerHTML = '<span>📷 Foto Anverso</span>';
        document.getElementById('photoPreviewBack').innerHTML = '<span>📷 Foto Reverso</span>';
        delete photoPreviewFront.dataset.photo;
        delete photoPreviewBack.dataset.photo;
        document.getElementById('catalogLink').value = '';
        
        this.showScreen('main');
    }

    async searchByImage() {
        if (!this.searchImageData) return;
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<p>Analizando imagen...</p>';
        
        try {
            const visionResults = {
                texts: ['coin', 'dollar', 'liberty', 'united states', 'quarter', 'euro', 'peso', 'cent'],
                objects: ['coin', 'currency', 'money'],
                webEntities: ['currency', 'money', 'numismatics', 'collectible']
            };
            
            const coinResults = await this.searchCoinsDatabase(visionResults);
            
            if (coinResults.length === 0) {
                resultsDiv.innerHTML = '<p>No se encontraron monedas similares. Intenta con una imagen más clara.</p>';
                return;
            }
            
            resultsDiv.innerHTML = coinResults.map((result, index) => `
                <div class="search-result">
                    <h4>${result.title}</h4>
                    <p><strong>País:</strong> ${result.country}</p>
                    <p><strong>Año:</strong> ${result.year}</p>
                    <p><strong>Confianza:</strong> ${result.confidence}%</p>
                    <p><strong>Descripción:</strong> ${result.description}</p>
                    <p><a href="${result.link}" target="_blank" rel="noopener">Ver en catálogo</a></p>
                    <button class="btn btn-primary" onclick="app.addSearchResultToCollection(${index})">➕ Agregar a mi colección</button>
                </div>
            `).join('');
            
            this.currentSearchResults = coinResults;
            
        } catch (error) {
            console.error('Error en búsqueda:', error);
            resultsDiv.innerHTML = '<p>Error en la búsqueda. Verifica tu conexión e inténtalo de nuevo.</p>';
        }
    }

    async searchCoinsDatabase(visionResults) {
        const allTexts = [...visionResults.texts, ...visionResults.objects, ...visionResults.webEntities]
            .join(' ').toLowerCase();
        
        const results = [];
        
        let country = 'Desconocido';
        let countryCode = 'XX';
        if (allTexts.includes('costa rica')) {
            country = 'Costa Rica';
            countryCode = 'CR';
        } else if (allTexts.includes('united states') || allTexts.includes('america')) {
            country = 'Estados Unidos';
            countryCode = 'US';
        } else if (allTexts.includes('mexico')) {
            country = 'México';
            countryCode = 'MX';
        }
        
        let denomination = 'Valor desconocido';
        let type = 'moneda';
        if (allTexts.includes('cinco colones') || allTexts.includes('5')) {
            denomination = '5 Colones';
            type = 'billete';
        } else if (allTexts.includes('dollar')) {
            denomination = 'Dollar';
        } else if (allTexts.includes('peso')) {
            denomination = 'Peso';
        }
        
        const yearMatch = allTexts.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : 'Desconocido';
        
        results.push({
            title: `${denomination} - ${country}`,
            country: country,
            countryCode: countryCode,
            year: year,
            type: type,
            denomination: denomination,
            description: `${type === 'billete' ? 'Billete' : 'Moneda'} identificada automáticamente`,
            link: `https://numista.com/catalogue/index.php?mode=simplifie&p=1&r=${encodeURIComponent(country)}&e=y&d=${encodeURIComponent(denomination)}&ca=3&no=${year !== 'Desconocido' ? year : ''}`,
            confidence: 75
        });
        
        return results;
    }
    
    addSearchResultToCollection(resultIndex) {
        const result = this.currentSearchResults[resultIndex];
        if (!result) return;
        
        document.getElementById('itemType').value = result.type;
        document.getElementById('country').value = result.countryCode;
        document.getElementById('denomination').value = result.denomination;
        document.getElementById('year').value = result.year;
        document.getElementById('condition').value = 'Bueno';
        document.getElementById('catalogLink').value = result.link;
        document.getElementById('notes').value = `Agregado desde búsqueda por imagen: ${result.description}`;
        
        if (this.searchImageData) {
            const preview = document.getElementById('photoPreviewFront');
            preview.innerHTML = `<img src="${this.searchImageData}" alt="Preview">`;
            preview.dataset.photo = this.searchImageData;
        }
        
        this.showScreen('add');
    }
    
    parseNumistaUrl() {
        const url = document.getElementById('numistaUrl').value;
        if (!url || !url.includes('numista.com')) {
            alert('Por favor ingresa una URL válida de Numista');
            return;
        }
        
        this.showManualNumistaForm(url);
    }
    
    showManualNumistaForm(url) {
        const preview = document.getElementById('numistaPreview');
        preview.innerHTML = `
            <div class="manual-numista-form">
                <p><strong>Ingresa la información de Numista:</strong></p>
                <p><small>Copia los datos de la página de Numista y pégalos aquí</small></p>
                
                <div class="form-group">
                    <label>Tipo:</label>
                    <select id="manualType">
                        <option value="moneda">Moneda</option>
                        <option value="billete">Billete</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Emisor/País:</label>
                    <select id="manualCountry">
                        <option value="">Seleccionar país...</option>
                    </select>
                    <small>Selecciona el país emisor</small>
                </div>
                
                <div class="form-group">
                    <label>Valor/Denominación:</label>
                    <input type="text" id="manualDenomination" placeholder="ej: 5 colones (5 CRC)">
                    <small>Copia el campo "Valor" de Numista</small>
                </div>
                
                <div class="form-group">
                    <label>Años:</label>
                    <input type="text" id="manualYear" placeholder="ej: 1968 o 1968-1992">
                    <small>Copia el campo "Años" de Numista</small>
                </div>
                
                <div class="form-group">
                    <label>URL de Imagen Anverso (opcional):</label>
                    <input type="url" id="manualImageFront" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label>URL de Imagen Reverso (opcional):</label>
                    <input type="url" id="manualImageBack" placeholder="https://...">
                </div>
                
                <button class="btn btn-primary btn-full" onclick="app.importManualNumista('${url}')">Importar a Colección</button>
            </div>
        `;
        
        this.populateManualCountrySelect();
    }
    
    populateManualCountrySelect() {
        const select = document.getElementById('manualCountry');
        if (!select) return;
        
        Object.keys(window.COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${window.COUNTRIES[code].flag} ${window.COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }
    
    async importManualNumista(url) {
        const countryCode = document.getElementById('manualCountry').value;
        const yearText = document.getElementById('manualYear').value;
        const imageFront = document.getElementById('manualImageFront').value;
        const imageBack = document.getElementById('manualImageBack').value;
        
        if (!countryCode) {
            alert('Por favor selecciona un país');
            return;
        }
        
        let year = yearText;
        const yearMatch = yearText.match(/(\d{4})/);
        if (yearMatch) {
            year = yearMatch[1];
        }
        
        const images = [];
        if (imageFront) images.push(imageFront);
        if (imageBack) images.push(imageBack);
        
        const data = {
            title: 'Item de Numista',
            type: document.getElementById('manualType').value,
            country: window.COUNTRIES[countryCode].name,
            countryCode: countryCode,
            denomination: document.getElementById('manualDenomination').value,
            year: year,
            images: images,
            catalogLink: url
        };
        
        this.currentNumistaData = data;
        await this.importFromNumista();
    }
    
    async importFromNumista() {
        if (!this.currentNumistaData) return;
        
        const data = this.currentNumistaData;
        
        const itemType = document.getElementById('itemType');
        const country = document.getElementById('country');
        const denomination = document.getElementById('denomination');
        const year = document.getElementById('year');
        const catalogLink = document.getElementById('catalogLink');
        const notes = document.getElementById('notes');
        
        if (itemType) itemType.value = data.type || 'moneda';
        if (country && data.countryCode && data.countryCode !== 'XX') {
            country.value = data.countryCode;
        }
        if (denomination) denomination.value = data.denomination || '';
        if (year) year.value = data.year || '';
        if (catalogLink) catalogLink.value = data.catalogLink || '';
        if (notes) notes.value = `Importado desde Numista: ${data.title || 'Item de Numista'}`;
        
        if (data.images && data.images.length > 0) {
            if (data.images[0]) {
                const frontPreview = document.getElementById('photoPreviewFront');
                if (frontPreview) {
                    frontPreview.innerHTML = `<img src="${data.images[0]}" alt="Anverso" style="max-width:100%;max-height:150px;border-radius:4px;object-fit:cover;">`;
                    frontPreview.dataset.photo = data.images[0];
                }
            }
            
            if (data.images.length > 1 && data.images[1]) {
                const backPreview = document.getElementById('photoPreviewBack');
                if (backPreview) {
                    backPreview.innerHTML = `<img src="${data.images[1]}" alt="Reverso" style="max-width:100%;max-height:150px;border-radius:4px;object-fit:cover;">`;
                    backPreview.dataset.photo = data.images[1];
                }
            }
        }
        
        this.showScreen('add');
    }

    async loadData() {
        console.log('Cargando datos...');
        
        const saved = localStorage.getItem('coinCollection');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
                console.log('Datos cargados desde localStorage:', this.items.length, 'items');
            } catch (error) {
                console.error('Error parsing localStorage:', error);
                this.items = [];
            }
        }
        
        try {
            const API_URL = window.API_URL || 'https://numismatica-7pat.onrender.com';
            const response = await fetch(`${API_URL}/coins`);
            if (response.ok) {
                const apiItems = await response.json();
                console.log('Datos del API:', apiItems.length, 'items');
                
                if (apiItems.length > 0 && (this.items.length === 0 || apiItems.length > this.items.length)) {
                    this.items = apiItems;
                    localStorage.setItem('coinCollection', JSON.stringify(this.items));
                    console.log('Usando datos del API');
                } else {
                    console.log('Manteniendo datos de localStorage');
                }
            }
        } catch (error) {
            console.log('API error, usando localStorage:', error.message);
        }
        
        console.log('Total items cargados:', this.items.length);
        
        // Renderizar pantalla principal después de cargar datos
        if (this.currentScreen === 'main') {
            this.renderMainScreen();
        }
    }
    
    async performImageSearch() {
        if (!this.searchImageData) return;
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<p>Analizando imagen con Google Vision...</p>';
        
        try {
            let visionResults;
            
            try {
                visionResults = await this.analyzeImageWithVision(this.searchImageData);
                console.log('Vision API exitosa:', visionResults);
            } catch (visionError) {
                console.log('Vision API falló, usando búsqueda simulada:', visionError.message);
                visionResults = {
                    texts: ['coin', 'dollar', 'liberty', 'united states', 'quarter', 'euro', 'peso', 'cent'],
                    objects: ['coin', 'currency', 'money'],
                    webEntities: ['currency', 'money', 'numismatics', 'collectible']
                };
            }
            
            const coinResults = await this.searchCoinsDatabase(visionResults);
            
            if (coinResults.length === 0) {
                resultsDiv.innerHTML = '<p>No se encontraron monedas similares. Intenta con una imagen más clara.</p>';
                return;
            }
            
            resultsDiv.innerHTML = coinResults.map((result, index) => `
                <div class="search-result">
                    <h4>${result.title}</h4>
                    <p><strong>País:</strong> ${result.country}</p>
                    <p><strong>Año:</strong> ${result.year}</p>
                    <p><strong>Confianza:</strong> ${result.confidence}%</p>
                    <p><strong>Descripción:</strong> ${result.description}</p>
                    <p><a href="${result.link}" target="_blank" rel="noopener">Ver en catálogo</a></p>
                    <button class="btn btn-primary" onclick="app.addSearchResultToCollection(${index})">➕ Agregar a mi colección</button>
                </div>
            `).join('');
            
            this.currentSearchResults = coinResults;
            
        } catch (error) {
            console.error('Error en búsqueda:', error);
            resultsDiv.innerHTML = '<p>Error en la búsqueda. Verifica tu conexión e inténtalo de nuevo.</p>';
        }
    }
    
    async analyzeImageWithVision(imageData) {
        const API_KEY = 'AIzaSyBn9U_VRidIFe2jwG9BGYNgxZtuTZvAROw';
        const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
        
        const base64Image = imageData.split(',')[1];
        
        const requestBody = {
            requests: [{
                image: { content: base64Image },
                features: [
                    { type: 'TEXT_DETECTION', maxResults: 10 },
                    { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                    { type: 'WEB_DETECTION', maxResults: 5 }
                ]
            }]
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Vision API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.processVisionResults(data);
    }
    
    processVisionResults(visionData) {
        const result = visionData.responses[0];
        const extractedInfo = {
            texts: [],
            objects: [],
            webEntities: []
        };
        
        if (result.textAnnotations) {
            extractedInfo.texts = result.textAnnotations.map(text => text.description.toLowerCase());
        }
        
        if (result.localizedObjectAnnotations) {
            extractedInfo.objects = result.localizedObjectAnnotations.map(obj => obj.name.toLowerCase());
        }
        
        if (result.webDetection && result.webDetection.webEntities) {
            extractedInfo.webEntities = result.webDetection.webEntities
                .filter(entity => entity.score > 0.3)
                .map(entity => entity.description ? entity.description.toLowerCase() : '');
        }
        
        return extractedInfo;
    }
    

    
    getNumistaImages(mode) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
        
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:8px;max-width:400px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 1.5rem 0;text-align:center;color:#333;">Obtener Imágenes de Numista</h3>
                
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:bold;color:#555;">URL Imagen Anverso:</label>
                    <input type="url" id="modalFrontUrl" placeholder="https://..." style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:4px;font-size:14px;">
                </div>
                
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:bold;color:#555;">URL Imagen Reverso:</label>
                    <input type="url" id="modalBackUrl" placeholder="https://..." style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:4px;font-size:14px;">
                </div>
                
                <div style="display:flex;gap:1rem;">
                    <button id="modalApply" style="flex:1;padding:0.75rem;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Aplicar</button>
                    <button id="modalCancel" style="flex:1;padding:0.75rem;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const frontInput = modal.querySelector('#modalFrontUrl');
        const backInput = modal.querySelector('#modalBackUrl');
        const applyBtn = modal.querySelector('#modalApply');
        const cancelBtn = modal.querySelector('#modalCancel');
        
        applyBtn.addEventListener('click', () => {
            const frontUrl = frontInput.value.trim();
            const backUrl = backInput.value.trim();
            
            if (!frontUrl && !backUrl) {
                alert('Por favor ingresa al menos una URL de imagen');
                return;
            }
            
            if (frontUrl) {
                const frontId = mode === 'edit' ? 'editPhotoPreviewFront' : 'photoPreviewFront';
                const frontPreview = document.getElementById(frontId);
                if (frontPreview) {
                    frontPreview.innerHTML = `<img src="${frontUrl}" alt="Anverso" style="max-width:100%;max-height:150px;border-radius:4px;object-fit:cover;">`;
                    frontPreview.dataset.photo = frontUrl;
                }
            }
            
            if (backUrl) {
                const backId = mode === 'edit' ? 'editPhotoPreviewBack' : 'photoPreviewBack';
                const backPreview = document.getElementById(backId);
                if (backPreview) {
                    backPreview.innerHTML = `<img src="${backUrl}" alt="Reverso" style="max-width:100%;max-height:150px;border-radius:4px;object-fit:cover;">`;
                    backPreview.dataset.photo = backUrl;
                }
            }
            
            document.body.removeChild(modal);
            alert('✅ Imágenes aplicadas correctamente');
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Focus en el primer campo
        setTimeout(() => frontInput.focus(), 100);
    }
    
    showImageZoom(itemId, side) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        this.currentZoomItem = { item, side };
        
        const imageUrl = side === 'front' ? item.photoFront : item.photoBack;
        const title = side === 'front' ? 'Anverso' : 'Reverso';
        
        document.getElementById('zoomImage').src = imageUrl;
        document.getElementById('imageZoomTitle').textContent = `${title} - ${item.denomination}`;
        
        this.showScreen('imageZoom');
    }
    
    changeCurrentImage() {
        if (!this.currentZoomItem) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
        
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:8px;max-width:300px;width:90%;">
                <h3 style="margin:0 0 1.5rem 0;text-align:center;">Cambiar Imagen</h3>
                <button class="btn btn-primary btn-full" id="uploadImageBtn" style="margin-bottom:1rem;">📁 Subir Imagen</button>
                <button class="btn btn-secondary btn-full" id="numistaImageBtn" style="margin-bottom:1rem;">🌐 Desde Numista</button>
                <button class="btn btn-secondary btn-full" id="cancelChangeBtn">Cancelar</button>
                <input type="file" id="hiddenImageInput" accept="image/*" hidden>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#uploadImageBtn').addEventListener('click', () => {
            modal.querySelector('#hiddenImageInput').click();
        });
        
        modal.querySelector('#hiddenImageInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.updateCurrentImage(event.target.result);
                    document.body.removeChild(modal);
                };
                reader.readAsDataURL(file);
            }
        });
        
        modal.querySelector('#numistaImageBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.getNumistaImageForZoom();
        });
        
        modal.querySelector('#cancelChangeBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    getNumistaImageForZoom() {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
        
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:8px;max-width:400px;width:90%;">
                <h3 style="margin:0 0 1.5rem 0;text-align:center;">URL de Numista</h3>
                <input type="url" id="numistaImageUrl" placeholder="https://..." style="width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:4px;margin-bottom:1rem;">
                <div style="display:flex;gap:1rem;">
                    <button id="applyNumistaImage" class="btn btn-primary" style="flex:1;">Aplicar</button>
                    <button id="cancelNumistaImage" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#applyNumistaImage').addEventListener('click', () => {
            const url = modal.querySelector('#numistaImageUrl').value.trim();
            if (url) {
                this.updateCurrentImage(url);
            }
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancelNumistaImage').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    updateCurrentImage(newImageUrl) {
        if (!this.currentZoomItem) return;
        
        const { item, side } = this.currentZoomItem;
        const itemIndex = this.items.findIndex(i => i.id === item.id);
        
        if (itemIndex !== -1) {
            if (side === 'front') {
                this.items[itemIndex].photoFront = newImageUrl;
            } else {
                this.items[itemIndex].photoBack = newImageUrl;
            }
            
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            
            // Actualizar imagen en zoom
            document.getElementById('zoomImage').src = newImageUrl;
            
            // Sincronizar con API
            fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.items[itemIndex])
            }).catch(() => {});
        }
    }
    
    deleteCurrentImage() {
        if (!this.currentZoomItem) return;
        
        if (confirm('¿Estás seguro de que quieres borrar esta imagen?')) {
            const { item, side } = this.currentZoomItem;
            const itemIndex = this.items.findIndex(i => i.id === item.id);
            
            if (itemIndex !== -1) {
                if (side === 'front') {
                    this.items[itemIndex].photoFront = null;
                } else {
                    this.items[itemIndex].photoBack = null;
                }
                
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
                
                // Sincronizar con API
                fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.items[itemIndex])
                }).catch(() => {});
                
                // Volver a la pantalla de edición
                this.editItem(item.id);
            }
        }
    }
};