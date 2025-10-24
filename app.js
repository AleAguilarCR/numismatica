// Los países están definidos en countries.js

class CoinCollectionApp {
    constructor() {
        this.items = [];
        this.currentScreen = 'main';
        this.previousScreen = 'main';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.populateCountrySelect();
        
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        await this.loadData();
        this.renderMainScreen();
    }
    
    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseReady && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.log('Firebase ready after', attempts, 'attempts');
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
        document.getElementById('backFromPhotoEditor').addEventListener('click', () => this.showScreen(this.previousScreen));
        document.getElementById('backFromImageSearch').addEventListener('click', () => this.showScreen('main'));
        
        // Título como botón home
        document.getElementById('appTitle').addEventListener('click', () => this.showScreen('main'));
        
        // Editor de fotos
        document.getElementById('cropBtn').addEventListener('click', () => this.cropPhoto());
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotatePhoto());
        document.getElementById('savePhotoBtn').addEventListener('click', () => this.saveEditedPhoto());
        
        // Búsqueda por imagen
        document.getElementById('searchImageBtn').addEventListener('click', () => this.showScreen('imageSearch'));
        document.getElementById('searchPhotoPreview').addEventListener('click', () => this.selectSearchPhoto());
        document.getElementById('searchPhotoInput').addEventListener('change', (e) => this.handleSearchPhotoSelect(e));
        document.getElementById('searchBtn').addEventListener('click', () => this.searchByImage());

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
        // Guardar pantalla anterior
        this.previousScreen = this.currentScreen;
        
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen, .main-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Mostrar pantalla seleccionada
        if (screenName === 'main') {
            document.getElementById('mainScreen').classList.remove('hidden');
            this.renderMainScreen();
        } else if (screenName === 'country') {
            document.getElementById('countryScreen').classList.remove('hidden');
            // Refrescar lista si venimos de editar
            if (this.previousScreen === 'edit') {
                this.showCountryItems(this.currentCountryCode);
            }
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
        this.currentCountryCode = countryCode;
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
                // Guardar datos para el editor
                this.currentPhotoData = {
                    imageData: e.target.result,
                    side: side,
                    mode: mode
                };
                
                // Mostrar editor de fotos
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
            // Ajustar tamaño del canvas
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
        // Implementación básica de crop (centro de la imagen)
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
            // Para búsqueda por imagen
            const preview = document.getElementById('searchPhotoPreview');
            preview.innerHTML = `<img src="${editedImageData}" alt="Buscar" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            this.searchImageData = editedImageData;
            document.getElementById('searchBtn').disabled = false;
            this.showScreen('imageSearch');
        } else {
            // Para agregar/editar items
            const prefix = mode === 'edit' ? 'edit' : '';
            const preview = document.getElementById(`${prefix}photoPreview${side === 'front' ? 'Front' : 'Back'}`);
            preview.innerHTML = `<img src="${editedImageData}" alt="Preview">`;
            preview.dataset.photo = editedImageData;
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
                // Guardar datos para el editor
                this.currentPhotoData = {
                    imageData: e.target.result,
                    side: 'search',
                    mode: 'search'
                };
                
                // Mostrar editor de fotos para búsqueda
                this.showPhotoEditor(e.target.result);
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

    async handleEditItem(event) {
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
        
        if (window.db) {
            try {
                await window.db.collection('coins').doc(this.currentEditingItem.id).update(this.items[itemIndex]);
            } catch (error) {
                console.error('Error updating item:', error);
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
            }
        } else {
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
        }
        this.currentEditingItem = null;
        this.showScreen('country');
    }

    async deleteItem() {
        if (!this.currentEditingItem) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
            if (window.db) {
                try {
                    await window.db.collection('coins').doc(this.currentEditingItem.id).delete();
                    this.items = this.items.filter(i => i.id !== this.currentEditingItem.id);
                } catch (error) {
                    console.error('Error deleting item:', error);
                    this.items = this.items.filter(i => i.id !== this.currentEditingItem.id);
                    localStorage.setItem('coinCollection', JSON.stringify(this.items));
                }
            } else {
                this.items = this.items.filter(i => i.id !== this.currentEditingItem.id);
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
            }
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

    async handleAddItem(event) {
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

        if (window.db) {
            try {
                console.log('Adding item to Firebase:', item);
                await window.db.collection('coins').add(item);
                console.log('Item added successfully');
                // Real-time listener will update this.items automatically
            } catch (error) {
                console.error('Error adding item to Firebase:', error);
                // Fallback to localStorage
                this.items.push(item);
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
                this.renderMainScreen();
            }
        } else {
            console.log('Firebase not available, using localStorage');
            this.items.push(item);
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            this.renderMainScreen();
        }
        
        // Limpiar formulario
        event.target.reset();
        document.getElementById('photoPreviewFront').innerHTML = '<span>📷 Foto Anverso</span>';
        document.getElementById('photoPreviewBack').innerHTML = '<span>📷 Foto Reverso</span>';
        delete photoPreviewFront.dataset.photo;
        delete photoPreviewBack.dataset.photo;
        document.getElementById('catalogLink').value = '';
        
        this.showScreen(this.previousScreen);
    }

    async searchByImage() {
        if (!this.searchImageData) return;
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<p>Analizando imagen...</p>';
        
        try {
            let visionResults;
            
            try {
                console.log('Intentando usar Google Vision API...');
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
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Vision API Error: ${response.status}`);
            }
            
            const data = await response.json();
            return this.processVisionResults(data);
        } catch (error) {
            console.error('Vision API Error:', error);
            throw error;
        }
    }
    
    processVisionResults(visionData) {
        const result = visionData.responses[0];
        const extractedInfo = {
            texts: [],
            objects: [],
            webEntities: []
        };
        
        // Extraer texto detectado
        if (result.textAnnotations) {
            extractedInfo.texts = result.textAnnotations.map(text => text.description.toLowerCase());
        }
        
        // Extraer objetos detectados
        if (result.localizedObjectAnnotations) {
            extractedInfo.objects = result.localizedObjectAnnotations.map(obj => obj.name.toLowerCase());
        }
        
        // Extraer entidades web con umbral más bajo
        if (result.webDetection && result.webDetection.webEntities) {
            extractedInfo.webEntities = result.webDetection.webEntities
                .filter(entity => entity.score > 0.3)
                .map(entity => entity.description ? entity.description.toLowerCase() : '');
        }
        
        console.log('Información extraída:', extractedInfo);
        return extractedInfo;
    }
    
    async searchCoinsDatabase(visionResults) {
        const allTexts = [...visionResults.texts, ...visionResults.objects, ...visionResults.webEntities]
            .join(' ').toLowerCase();
        
        console.log('Textos detectados:', allTexts);
        
        // Analizar información de la moneda/billete
        const coinInfo = this.analyzeCoinInfo(allTexts);
        console.log('Información analizada:', coinInfo);
        
        if (!coinInfo.country && !coinInfo.denomination) {
            return this.fallbackSearch(allTexts);
        }
        
        try {
            // Buscar en Numista con parámetros específicos
            const results = await this.searchNumistaWithParams(coinInfo);
            if (results.length > 0) {
                return results;
            }
        } catch (error) {
            console.error('Error buscando en Numista:', error);
        }
        
        // Crear resultado basado en información detectada
        return this.createResultFromAnalysis(coinInfo, allTexts);
    }
    
    analyzeCoinInfo(text) {
        const info = {
            country: null,
            countryCode: null,
            denomination: null,
            year: null,
            type: 'moneda'
        };
        
        // Detectar país
        if (text.includes('costa rica')) {
            info.country = 'Costa Rica';
            info.countryCode = 'CR';
        } else if (text.includes('united states') || text.includes('america')) {
            info.country = 'Estados Unidos';
            info.countryCode = 'US';
        } else if (text.includes('mexico')) {
            info.country = 'México';
            info.countryCode = 'MX';
        }
        
        // Detectar denominación y tipo
        if (text.includes('mil') && text.includes('colones')) {
            info.denomination = '1000 colones';
            info.type = 'billete';
        } else if (text.includes('cinco colones') || (text.includes('5') && text.includes('colones'))) {
            info.denomination = '5 colones';
            info.type = 'billete';
        } else if (text.includes('1000') && text.includes('colones')) {
            info.denomination = '1000 colones';
            info.type = 'billete';
        } else if (text.includes('colones')) {
            // Buscar número antes de colones
            const match = text.match(/(\d+).*colones/);
            if (match) {
                info.denomination = `${match[1]} colones`;
                info.type = 'billete';
            }
        } else if (text.includes('dollar')) {
            info.denomination = 'dollar';
        } else if (text.includes('peso')) {
            info.denomination = 'peso';
        } else if (text.includes('euro')) {
            info.denomination = 'euro';
        }
        
        // Detectar año
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            info.year = yearMatch[0];
        }
        
        return info;
    }
    
    async searchNumistaWithParams(coinInfo) {
        const CLIENT_ID = '529122';
        const API_KEY = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        const results = [];
        
        // Construir consulta de búsqueda
        let query = '';
        if (coinInfo.denomination) query += coinInfo.denomination + ' ';
        if (coinInfo.country) query += coinInfo.country + ' ';
        if (coinInfo.year) query += coinInfo.year + ' ';
        
        query = query.trim();
        if (!query) return [];
        
        console.log('Buscando en Numista:', query);
        
        try {
            // Primero obtener token OAuth
            const accessToken = await this.getNumistaAccessToken(CLIENT_ID, API_KEY);
            
            if (!accessToken) {
                console.log('No se pudo obtener token de acceso');
                return [];
            }
            
            const searchUrl = `https://api.numista.com/api/v2/coins?q=${encodeURIComponent(query)}&lang=es&per_page=10`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Respuesta de Numista:', data);
                
                if (data.coins && data.coins.length > 0) {
                    data.coins.forEach(coin => {
                        results.push({
                            title: coin.title || `${coin.value} ${coin.currency}`,
                            country: coin.issuer?.name || coinInfo.country || 'Desconocido',
                            countryCode: coin.issuer?.code || coinInfo.countryCode || 'XX',
                            year: coin.min_year || coin.max_year || coinInfo.year || 'Desconocido',
                            type: coinInfo.type,
                            denomination: `${coin.value || ''} ${coin.currency || coinInfo.denomination || ''}`.trim(),
                            description: coin.composition || 'Información de Numista',
                            link: `https://numista.com/catalogue/pieces${coin.id}.html`,
                            confidence: 85
                        });
                    });
                }
            } else {
                console.error('Error en Numista API:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error consultando Numista:', error);
        }
        
        return results.slice(0, 5);
    }
    
    async getNumistaAccessToken(clientId, apiKey) {
        try {
            const response = await fetch('https://api.numista.com/api/v2/oauth_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'grant_type': 'client_credentials',
                    'client_id': clientId,
                    'client_secret': apiKey,
                    'scope': 'view_collection'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Token OAuth obtenido:', data.access_token ? 'Sí' : 'No');
                return data.access_token;
            } else {
                console.error('Error obteniendo token OAuth:', response.status, await response.text());
                return null;
            }
        } catch (error) {
            console.error('Error en autenticación OAuth:', error);
            return null;
        }
    }
    
    createResultFromAnalysis(coinInfo, allTexts) {
        if (!coinInfo.country && !coinInfo.denomination) {
            return this.fallbackSearch(allTexts);
        }
        
        const result = {
            title: `${coinInfo.denomination || 'Moneda'} - ${coinInfo.country || 'País desconocido'}`,
            country: coinInfo.country || 'Desconocido',
            countryCode: coinInfo.countryCode || 'XX',
            year: coinInfo.year || 'Desconocido',
            type: coinInfo.type,
            denomination: coinInfo.denomination || 'Valor desconocido',
            description: `${coinInfo.type === 'billete' ? 'Billete' : 'Moneda'} identificada automáticamente`,
            link: 'https://numista.com/catalogue/',
            confidence: 75
        };
        
        return [result];
    }
    
    extractSearchKeywords(text) {
        const keywords = [];
        
        console.log('Texto para extracción:', text);
        
        // Países comunes
        const countries = ['costa rica', 'united states', 'america', 'usa', 'germany', 'deutschland', 'france', 'spain', 'mexico', 'canada', 'australia', 'japan', 'china', 'russia', 'brazil', 'argentina', 'chile', 'peru', 'colombia', 'venezuela', 'ecuador', 'bolivia', 'uruguay', 'paraguay'];
        countries.forEach(country => {
            if (text.includes(country)) {
                keywords.push(country);
                console.log('País detectado:', country);
            }
        });
        
        // Denominaciones
        const denominations = ['colones', 'cinco colones', 'dollar', 'euro', 'peso', 'yen', 'pound', 'franc', 'mark', 'ruble', 'real', 'cent', 'centavo', 'quarter', 'dime', 'nickel', 'penny'];
        denominations.forEach(denom => {
            if (text.includes(denom)) {
                keywords.push(denom);
                console.log('Denominación detectada:', denom);
            }
        });
        
        // Números
        const numbers = text.match(/\b(\d{1,4})\b/g);
        if (numbers) {
            keywords.push(...numbers.slice(0, 3));
        }
        
        // Palabras relacionadas con monedas
        const coinWords = ['coin', 'liberty', 'republic', 'kingdom', 'empire', 'federal', 'national', 'banco', 'central'];
        coinWords.forEach(word => {
            if (text.includes(word)) keywords.push(word);
        });
        
        return [...new Set(keywords)];
    }
    
    async searchNumistaAPI(keywords) {
        console.log('Buscando en Numista con palabras clave:', keywords);
        
        const NUMISTA_API_KEY = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        
        if (!NUMISTA_API_KEY) {
            console.log('API key de Numista no configurada, usando fallback');
            throw new Error('Numista API key no configurada');
        }
        
        const results = [];
        
        for (const keyword of keywords.slice(0, 3)) {
            try {
                const searchUrl = `https://api.numista.com/api/v3/coins?q=${encodeURIComponent(keyword)}&lang=es&per_page=5`;
                console.log('URL de búsqueda:', searchUrl);
                
                const response = await fetch(searchUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Numista-API-Key': NUMISTA_API_KEY,
                        'User-Agent': 'CoinCollectionApp/1.0'
                    }
                });
                
                console.log(`Respuesta para '${keyword}':`, response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Datos recibidos para '${keyword}':`, data);
                    
                    if (data.coins && data.coins.length > 0) {
                        data.coins.forEach(coin => {
                            results.push({
                                title: coin.title || `${coin.value} ${coin.currency}`,
                                country: coin.issuer?.name || 'Desconocido',
                                countryCode: coin.issuer?.code || 'XX',
                                year: coin.min_year || coin.max_year || 'Desconocido',
                                type: 'moneda',
                                denomination: `${coin.value || ''} ${coin.currency || ''}`.trim(),
                                description: coin.composition || 'Información no disponible',
                                link: `https://numista.com/catalogue/pieces${coin.id}.html`,
                                confidence: this.calculateConfidence(keyword, coin, keywords)
                            });
                        });
                    }
                } else {
                    console.error(`Error HTTP ${response.status} para '${keyword}':`, await response.text());
                }
            } catch (error) {
                console.error(`Error buscando '${keyword}':`, error);
            }
        }
        
        console.log('Resultados totales encontrados:', results.length);
        
        const uniqueResults = results.filter((result, index, self) => 
            index === self.findIndex(r => r.link === result.link)
        );
        
        const finalResults = uniqueResults
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
            
        console.log('Resultados finales:', finalResults);
        return finalResults;
    }
    
    calculateConfidence(searchKeyword, coin, allKeywords) {
        let confidence = 30; // Base
        
        const coinText = `${coin.title} ${coin.issuer?.name} ${coin.value} ${coin.currency}`.toLowerCase();
        
        // Coincidencia con palabra de búsqueda
        if (coinText.includes(searchKeyword.toLowerCase())) {
            confidence += 40;
        }
        
        // Coincidencias adicionales
        allKeywords.forEach(keyword => {
            if (coinText.includes(keyword.toLowerCase())) {
                confidence += 10;
            }
        });
        
        return Math.min(confidence, 95);
    }
    
    fallbackSearch(allTexts) {
        const results = [];
        
        // Detectar país
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
        
        // Detectar denominación
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
        
        // Detectar año
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
            link: 'https://numista.com/catalogue/',
            confidence: 75
        });
        
        return results;
    }
    
    addSearchResultToCollection(resultIndex) {
        const result = this.currentSearchResults[resultIndex];
        if (!result) return;
        
        // Pre-llenar formulario con datos del resultado
        document.getElementById('itemType').value = result.type;
        document.getElementById('country').value = result.countryCode;
        document.getElementById('denomination').value = result.denomination;
        document.getElementById('year').value = result.year;
        document.getElementById('condition').value = 'Bueno'; // Valor por defecto
        document.getElementById('catalogLink').value = result.link;
        document.getElementById('notes').value = `Agregado desde búsqueda por imagen: ${result.description}`;
        
        // Si hay foto de búsqueda, usarla como anverso
        if (this.searchImageData) {
            const preview = document.getElementById('photoPreviewFront');
            preview.innerHTML = `<img src="${this.searchImageData}" alt="Preview">`;
            preview.dataset.photo = this.searchImageData;
        }
        
        // Ir a pantalla de agregar
        this.showScreen('add');
    }

    async saveData() {
        // Firebase will handle saving automatically
    }

    async loadData() {
        if (!window.db) {
            console.log('Firebase not ready, using localStorage');
            const saved = localStorage.getItem('coinCollection');
            if (saved) {
                this.items = JSON.parse(saved);
            }
            return;
        }
        
        try {
            console.log('Setting up Firebase listener...');
            // Set up real-time listener
            window.db.collection('coins').onSnapshot((querySnapshot) => {
                console.log('Firebase data received:', querySnapshot.size, 'items');
                this.items = [];
                querySnapshot.forEach((doc) => {
                    this.items.push({ id: doc.id, ...doc.data() });
                });
                console.log('Items loaded:', this.items.length);
                this.renderMainScreen();
            }, (error) => {
                console.error('Firebase listener error:', error);
                // Fallback to localStorage
                const saved = localStorage.getItem('coinCollection');
                if (saved) {
                    this.items = JSON.parse(saved);
                }
                this.renderMainScreen();
            });
        } catch (error) {
            console.error('Error setting up Firebase:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('coinCollection');
            if (saved) {
                this.items = JSON.parse(saved);
            }
            this.renderMainScreen();
        }
    }
}

// La aplicación se inicializará desde el HTML cuando el DOM esté listo