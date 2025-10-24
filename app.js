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
        document.getElementById('backFromNumista').addEventListener('click', () => this.showScreen('add'));
        
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
        
        // Numista import
        document.getElementById('numistaBtnAdd').addEventListener('click', () => this.showScreen('numista'));
        document.getElementById('parseNumistaBtn').addEventListener('click', () => this.parseNumistaUrl());
    }

    showScreen(screenName) {
        // Prevenir recursión infinita
        if (this.currentScreen === screenName) {
            return;
        }
        
        // Guardar pantalla anterior
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenName;
        
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen, .main-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Mostrar pantalla seleccionada
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
        const emptyState = document.getElementById('emptyState');

        if (!countriesGrid || !emptyState) {
            console.error('Elementos no encontrados en renderMainScreen');
            return;
        }

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
            const itemId = this.currentEditingItem.id;
            
            if (window.db && typeof itemId === 'string') {
                try {
                    await window.db.collection('coins').doc(itemId).delete();
                    console.log('Item deleted from Firebase');
                } catch (error) {
                    console.error('Error deleting item:', error);
                    // Fallback a localStorage
                    this.items = this.items.filter(i => i.id !== itemId);
                    localStorage.setItem('coinCollection', JSON.stringify(this.items));
                }
            } else {
                // Eliminar de localStorage
                this.items = this.items.filter(i => i.id !== itemId);
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
        
        this.showScreen('main');
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
            type: 'moneda',
            currency: null,
            issuer: null
        };
        
        // Limpiar y normalizar texto
        const cleanText = this.cleanAndNormalizeText(text);
        console.log('Texto limpio:', cleanText);
        
        // Detectar país con mayor precisión
        info.country = this.detectCountry(cleanText);
        if (info.country) {
            info.countryCode = this.getCountryCode(info.country);
        }
        
        // Detectar denominación y moneda
        const denomInfo = this.detectDenomination(cleanText);
        info.denomination = denomInfo.denomination;
        info.currency = denomInfo.currency;
        info.type = denomInfo.type;
        
        // Detectar año con mejor precisión
        info.year = this.detectYear(cleanText);
        
        // Detectar emisor/banco
        info.issuer = this.detectIssuer(cleanText);
        
        return info;
    }
    
    cleanAndNormalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ') // Remover caracteres especiales
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
    }
    
    detectCountry(text) {
        // Buscar directamente en la base de datos de países
        for (const [code, countryData] of Object.entries(COUNTRIES)) {
            const countryName = countryData.name.toLowerCase();
            
            // Buscar nombre completo del país
            if (text.includes(countryName)) {
                console.log(`País detectado: ${countryData.name} (${code})`);
                return countryData.name;
            }
            
            // Buscar variaciones comunes
            const variations = this.getCountryVariations(countryName);
            for (const variation of variations) {
                if (text.includes(variation)) {
                    console.log(`País detectado: ${countryData.name} (variación: ${variation})`);
                    return countryData.name;
                }
            }
        }
        
        return null;
    }
    
    getCountryVariations(countryName) {
        const variations = [];
        
        // Agregar variaciones específicas según el país
        if (countryName.includes('honduras')) {
            variations.push('lempira', 'republica de honduras');
        } else if (countryName.includes('costa rica')) {
            variations.push('costarica', 'banco central de costa rica');
        } else if (countryName.includes('estados unidos')) {
            variations.push('united states', 'america', 'usa', 'federal reserve');
        } else if (countryName.includes('méxico')) {
            variations.push('mexico', 'estados unidos mexicanos');
        }
        
        return variations;
    }
    
    getCountryCode(country) {
        // Buscar el código en la base de datos de países
        for (const [code, countryData] of Object.entries(COUNTRIES)) {
            if (countryData.name === country) {
                return code;
            }
        }
        return 'XX';
    }
    
    detectDenomination(text) {
        const denomPatterns = {
            // Colones costarricenses
            'colones': {
                patterns: [
                    /(?:mil|1000)\s*colones/,
                    /(?:quinientos|500)\s*colones/,
                    /(?:cien|100)\s*colones/,
                    /(?:cincuenta|50)\s*colones/,
                    /(?:veinte|20)\s*colones/,
                    /(?:diez|10)\s*colones/,
                    /(?:cinco|5)\s*colones/,
                    /(\d+)\s*colones/
                ],
                currency: 'colones',
                type: 'billete'
            },
            // Dólares
            'dollar': {
                patterns: [
                    /(?:one hundred|100)\s*dollar/,
                    /(?:fifty|50)\s*dollar/,
                    /(?:twenty|20)\s*dollar/,
                    /(?:ten|10)\s*dollar/,
                    /(?:five|5)\s*dollar/,
                    /(?:one|1)\s*dollar/,
                    /(\d+)\s*dollar/
                ],
                currency: 'dollar',
                type: 'billete'
            },
            // Euros
            'euro': {
                patterns: [
                    /(?:quinientos|500)\s*euro/,
                    /(?:doscientos|200)\s*euro/,
                    /(?:cien|100)\s*euro/,
                    /(?:cincuenta|50)\s*euro/,
                    /(?:veinte|20)\s*euro/,
                    /(?:diez|10)\s*euro/,
                    /(?:cinco|5)\s*euro/,
                    /(\d+)\s*euro/
                ],
                currency: 'euro',
                type: 'billete'
            },
            // Lempiras hondureñas
            'lempira': {
                patterns: [
                    /(?:cien|100)\s*lempira/,
                    /(?:cincuenta|50)\s*lempira/,
                    /(?:veinte|20)\s*lempira/,
                    /(?:diez|10)\s*lempira/,
                    /(?:cinco|5)\s*lempira/,
                    /(?:un|1)\s*lempira/,
                    /(\d+)\s*lempira/,
                    /(?:diez|10)\s*centavos.*lempira/,
                    /(?:cinco|5)\s*centavos.*lempira/,
                    /(\d+)\s*centavos.*lempira/
                ],
                currency: 'lempira',
                type: 'moneda'
            },
            // Pesos
            'peso': {
                patterns: [
                    /(?:mil|1000)\s*peso/,
                    /(?:quinientos|500)\s*peso/,
                    /(?:cien|100)\s*peso/,
                    /(?:cincuenta|50)\s*peso/,
                    /(?:veinte|20)\s*peso/,
                    /(?:diez|10)\s*peso/,
                    /(\d+)\s*peso/
                ],
                currency: 'peso',
                type: 'billete'
            }
        };
        
        for (const [currencyName, config] of Object.entries(denomPatterns)) {
            for (const pattern of config.patterns) {
                const match = text.match(pattern);
                if (match) {
                    let value = match[1] || this.extractNumericValue(match[0]);
                    console.log(`Denominación detectada: ${value} ${config.currency}`);
                    return {
                        denomination: `${value} ${config.currency}`,
                        currency: config.currency,
                        type: config.type
                    };
                }
            }
        }
        
        return { denomination: null, currency: null, type: 'moneda' };
    }
    
    extractNumericValue(text) {
        const numberWords = {
            'mil': '1000',
            'quinientos': '500',
            'cien': '100',
            'cincuenta': '50',
            'veinte': '20',
            'diez': '10',
            'cinco': '5',
            'one hundred': '100',
            'fifty': '50',
            'twenty': '20',
            'ten': '10',
            'five': '5',
            'one': '1'
        };
        
        for (const [word, number] of Object.entries(numberWords)) {
            if (text.includes(word)) {
                return number;
            }
        }
        
        const numMatch = text.match(/\d+/);
        return numMatch ? numMatch[0] : null;
    }
    
    detectYear(text) {
        // Buscar años con mayor precisión
        const yearPatterns = [
            /\b(19[0-9]{2})\b/, // 1900-1999
            /\b(20[0-2][0-9])\b/, // 2000-2029
            /\b(18[0-9]{2})\b/  // 1800-1899
        ];
        
        for (const pattern of yearPatterns) {
            const match = text.match(pattern);
            if (match) {
                const year = parseInt(match[1]);
                if (year >= 1800 && year <= 2024) {
                    console.log(`Año detectado: ${year}`);
                    return year.toString();
                }
            }
        }
        
        return null;
    }
    
    detectIssuer(text) {
        const issuerPatterns = [
            'banco central',
            'federal reserve',
            'bank of england',
            'banque de france',
            'banco de espana',
            'reserve bank',
            'central bank'
        ];
        
        for (const pattern of issuerPatterns) {
            if (text.includes(pattern)) {
                console.log(`Emisor detectado: ${pattern}`);
                return pattern;
            }
        }
        
        return null;
    }
    
    async searchNumistaWithParams(coinInfo) {
        const API_KEY = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        const results = [];
        
        // Intentar múltiples estrategias de búsqueda
        const searchStrategies = this.buildSearchStrategies(coinInfo);
        
        for (const strategy of searchStrategies) {
            console.log(`Probando estrategia: ${strategy.name}`);
            console.log(`Parámetros:`, strategy.params);
            
            try {
                const searchUrl = this.buildNumistaUrl(strategy.params);
                console.log('URL de búsqueda:', searchUrl);
                
                const response = await fetch(searchUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Numista-API-Key': API_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Resultados para ${strategy.name}:`, data.count || 0);
                    
                    if (data.types && data.types.length > 0) {
                        data.types.forEach(type => {
                            const confidence = this.calculateSearchConfidence(type, coinInfo, strategy.weight);
                            results.push({
                                title: type.title || `${type.value} ${type.currency}`,
                                country: type.issuer?.name || coinInfo.country || 'Desconocido',
                                countryCode: type.issuer?.code || coinInfo.countryCode || 'XX',
                                year: type.min_year || type.max_year || coinInfo.year || 'Desconocido',
                                type: this.mapNumistaCategory(type.category) || coinInfo.type,
                                denomination: `${type.value || ''} ${type.currency || coinInfo.denomination || ''}`.trim(),
                                description: type.composition || type.obverse || 'Información de Numista',
                                link: type.id ? `https://en.numista.com/catalogue/pieces${type.id}.html` : `https://numista.com/catalogue/index.php?mode=simplifie&p=1&r=${encodeURIComponent(coinInfo.country || '')}&e=y&d=${encodeURIComponent(coinInfo.denomination || '')}&ca=3&no=${coinInfo.year || ''}`,
                                confidence: confidence,
                                strategy: strategy.name
                            });
                        });
                        
                        // Si encontramos resultados con alta confianza, no necesitamos más estrategias
                        if (results.some(r => r.confidence > 80)) {
                            break;
                        }
                    }
                } else {
                    console.log(`Error ${response.status} para estrategia ${strategy.name}`);
                }
            } catch (error) {
                console.error(`Error en estrategia ${strategy.name}:`, error);
            }
        }
        
        // Eliminar duplicados y ordenar por confianza
        const uniqueResults = this.removeDuplicateResults(results);
        return uniqueResults
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }
    
    buildSearchStrategies(coinInfo) {
        const strategies = [];
        
        // Estrategia 1: Búsqueda completa con todos los datos
        if (coinInfo.country && coinInfo.denomination && coinInfo.year) {
            strategies.push({
                name: 'Completa',
                params: {
                    q: `${coinInfo.denomination} ${coinInfo.country} ${coinInfo.year}`,
                    category: coinInfo.type === 'billete' ? 'banknote' : 'coin'
                },
                weight: 1.0
            });
        }
        
        // Estrategia 2: País + denominación
        if (coinInfo.country && coinInfo.denomination) {
            strategies.push({
                name: 'País + Denominación',
                params: {
                    q: `${coinInfo.denomination} ${coinInfo.country}`,
                    category: coinInfo.type === 'billete' ? 'banknote' : 'coin'
                },
                weight: 0.9
            });
        }
        
        // Estrategia 3: Solo denominación + año
        if (coinInfo.denomination && coinInfo.year) {
            strategies.push({
                name: 'Denominación + Año',
                params: {
                    q: coinInfo.denomination,
                    year: coinInfo.year,
                    category: coinInfo.type === 'billete' ? 'banknote' : 'coin'
                },
                weight: 0.8
            });
        }
        
        // Estrategia 4: Solo país + año
        if (coinInfo.country && coinInfo.year) {
            strategies.push({
                name: 'País + Año',
                params: {
                    issuer: coinInfo.countryCode,
                    year: coinInfo.year,
                    category: coinInfo.type === 'billete' ? 'banknote' : 'coin'
                },
                weight: 0.7
            });
        }
        
        // Estrategia 5: Solo denominación
        if (coinInfo.denomination) {
            strategies.push({
                name: 'Solo Denominación',
                params: {
                    q: coinInfo.denomination,
                    category: coinInfo.type === 'billete' ? 'banknote' : 'coin'
                },
                weight: 0.6
            });
        }
        
        return strategies;
    }
    
    buildNumistaUrl(params) {
        const baseUrl = 'https://api.numista.com/v3/types';
        const urlParams = new URLSearchParams({
            lang: 'es',
            count: '10',
            ...params
        });
        
        return `${baseUrl}?${urlParams.toString()}`;
    }
    
    calculateSearchConfidence(type, coinInfo, strategyWeight) {
        let confidence = 30 * strategyWeight; // Base por estrategia
        
        // Bonus por coincidencias exactas
        if (coinInfo.country && type.issuer?.name?.toLowerCase().includes(coinInfo.country.toLowerCase())) {
            confidence += 25;
        }
        
        if (coinInfo.denomination && type.title?.toLowerCase().includes(coinInfo.denomination.toLowerCase())) {
            confidence += 20;
        }
        
        if (coinInfo.year && (type.min_year <= coinInfo.year && type.max_year >= coinInfo.year)) {
            confidence += 15;
        }
        
        if (coinInfo.currency && type.currency?.toLowerCase().includes(coinInfo.currency.toLowerCase())) {
            confidence += 10;
        }
        
        return Math.min(Math.round(confidence), 95);
    }
    
    mapNumistaCategory(category) {
        const categoryMap = {
            'banknote': 'billete',
            'coin': 'moneda',
            'exonumia': 'token'
        };
        
        return categoryMap[category] || 'moneda';
    }
    
    removeDuplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = `${result.title}-${result.country}-${result.year}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
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
            link: `https://numista.com/catalogue/index.php?mode=simplifie&p=1&r=${encodeURIComponent(coinInfo.country || '')}&e=y&d=${encodeURIComponent(coinInfo.denomination || '')}&ca=3&no=${coinInfo.year || ''}`,
            confidence: 75
        };
        
        return [result];
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
            link: `https://numista.com/catalogue/index.php?mode=simplifie&p=1&r=${encodeURIComponent(country)}&e=y&d=${encodeURIComponent(denomination)}&ca=3&no=${year !== 'Desconocido' ? year : ''}`,
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
    
    parseNumistaUrl() {
        const url = document.getElementById('numistaUrl').value;
        if (!url || !url.includes('numista.com')) {
            alert('Por favor ingresa una URL válida de Numista');
            return;
        }
        
        this.showManualNumistaForm(url);
    }
    
    // Funciones eliminadas para evitar problemas CORS
    fetchNumistaData() { return null; }
    extractNumistaInfo() { return null; }
    displayNumistaPreview() { return null; }
    
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
        
        // Poblar dropdown de países
        this.populateManualCountrySelect();
    }
    
    populateManualCountrySelect() {
        const select = document.getElementById('manualCountry');
        if (!select) return;
        
        Object.keys(COUNTRIES).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${COUNTRIES[code].flag} ${COUNTRIES[code].name}`;
            select.appendChild(option);
        });
    }
    
    importManualNumista(url) {
        const countryCode = document.getElementById('manualCountry').value;
        const yearText = document.getElementById('manualYear').value;
        const imageFront = document.getElementById('manualImageFront').value;
        const imageBack = document.getElementById('manualImageBack').value;
        
        if (!countryCode) {
            alert('Por favor selecciona un país');
            return;
        }
        
        // Extraer primer año si es un rango
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
            country: COUNTRIES[countryCode].name,
            countryCode: countryCode,
            denomination: document.getElementById('manualDenomination').value,
            year: year,
            images: images,
            catalogLink: url
        };
        
        this.currentNumistaData = data;
        this.importFromNumista();
    }
    

    

    
    mapNumistaCountry(numistaCountry) {
        // Limpiar el texto del país
        const cleanCountry = numistaCountry.replace(/\([^)]*\)/g, '').trim();
        
        // Buscar coincidencia exacta en nuestra base de datos
        for (const [code, countryData] of Object.entries(COUNTRIES)) {
            if (countryData.name.toLowerCase() === cleanCountry.toLowerCase()) {
                return countryData.name;
            }
        }
        
        // Mapear nombres comunes de Numista
        const countryMappings = {
            'United States': 'Estados Unidos de América',
            'United Kingdom': 'Reino Unido', 
            'Germany': 'Alemania',
            'France': 'Francia',
            'Spain': 'España',
            'Mexico': 'México',
            'Brazil': 'Brasil',
            'Argentina': 'Argentina',
            'Chile': 'Chile',
            'Colombia': 'Colombia',
            'Peru': 'Perú',
            'Venezuela': 'Venezuela',
            'Ecuador': 'Ecuador',
            'Uruguay': 'Uruguay',
            'Paraguay': 'Paraguay',
            'Costa Rica': 'Costa Rica',
            'Honduras': 'Honduras',
            'Canada': 'Canadá',
            'Australia': 'Australia',
            'Japan': 'Japón',
            'China': 'China República Popular',
            'Russia': 'Rusia',
            'Italy': 'Italia',
            'Netherlands': 'Países Bajos',
            'Switzerland': 'Suiza',
            'Austria': 'Austria',
            'Belgium': 'Bélgica',
            'Portugal': 'Portugal',
            'Poland': 'Polonia',
            'Czech Republic': 'República Checa',
            'Hungary': 'Hungría',
            'Greece': 'Grecia',
            'Turkey': 'Turquía',
            'India': 'India',
            'South Africa': 'Sudáfrica',
            'Egypt': 'Egipto',
            'Israel': 'Israel',
            'Thailand': 'Tailandia',
            'Philippines': 'Filipinas',
            'Indonesia': 'Indonesia',
            'Malaysia': 'Malasia',
            'Singapore': 'Singapur',
            'South Korea': 'Corea del Sur',
            'North Korea': 'Corea del Norte',
            'Vietnam': 'Vietnam',
            'New Zealand': 'Nueva Zelanda'
        };
        
        const mapped = countryMappings[cleanCountry];
        if (mapped) return mapped;
        
        // Búsqueda parcial
        for (const [code, countryData] of Object.entries(COUNTRIES)) {
            if (countryData.name.toLowerCase().includes(cleanCountry.toLowerCase()) ||
                cleanCountry.toLowerCase().includes(countryData.name.toLowerCase())) {
                return countryData.name;
            }
        }
        
        return cleanCountry;
    }
    

    
    async importFromNumista() {
        if (!this.currentNumistaData) return;
        
        const data = this.currentNumistaData;
        
        // Pre-llenar formulario
        document.getElementById('itemType').value = data.type;
        if (data.countryCode && data.countryCode !== 'XX') {
            document.getElementById('country').value = data.countryCode;
        }
        document.getElementById('denomination').value = data.denomination || '';
        document.getElementById('year').value = data.year || '';
        document.getElementById('catalogLink').value = data.catalogLink;
        document.getElementById('notes').value = `Importado desde Numista: ${data.title || 'Item de Numista'}`;
        
        // Convertir y agregar imágenes
        if (data.images.length > 0) {
            try {
                // Convertir primera imagen
                const img1 = await this.convertImageToBase64(data.images[0]);
                if (img1) {
                    const frontPreview = document.getElementById('photoPreviewFront');
                    frontPreview.innerHTML = `<img src="${img1}" alt="Anverso">`;
                    frontPreview.dataset.photo = img1;
                }
                
                // Convertir segunda imagen si existe
                if (data.images.length > 1) {
                    const img2 = await this.convertImageToBase64(data.images[1]);
                    if (img2) {
                        const backPreview = document.getElementById('photoPreviewBack');
                        backPreview.innerHTML = `<img src="${img2}" alt="Reverso">`;
                        backPreview.dataset.photo = img2;
                    }
                }
            } catch (error) {
                console.error('Error convirtiendo imágenes:', error);
            }
        }
        
        // Ir a pantalla de agregar
        this.showScreen('add');
    }
    
    async convertImageToBase64(imageUrl) {
        // Por ahora, simplemente usar la URL directamente
        // Los proxies CORS no están funcionando correctamente
        console.log('Usando imagen directamente:', imageUrl);
        return imageUrl;
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