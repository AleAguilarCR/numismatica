// Los países están definidos en countries.js

window.CoinCollectionApp = window.CoinCollectionApp || class CoinCollectionApp {
    constructor() {
        this.items = [];
        this.currentScreen = 'main';
        this.previousScreen = 'main';
        this.editMode = true;
    }

    async init() {
        this.currentFilter = 'todo';
        this.currentContinentsFilter = 'todo';
        this.setupEventListeners();
        this.populateCountrySelect();
        
        // Cargar datos primero
        await this.loadData();
        console.log('Items cargados en init:', this.items.length);
        
        // Luego configurar UI
        this.updateEditModeUI();
        this.renderMainScreen();
        
        // Debug: verificar que los items se cargaron
        if (this.items.length > 0) {
            console.log('Primer item:', this.items[0]);
        }
        
        // Configurar sincronización periódica
        this.startPeriodicSync();
    }

    setupEventListeners() {
        try {
            // Botones principales
            document.getElementById('addItemBtn')?.addEventListener('click', () => this.showScreen('add'));
            document.getElementById('searchImageBtn')?.addEventListener('click', () => this.searchByImage());
            document.getElementById('continentsBtn')?.addEventListener('click', () => this.showContinents());
            document.getElementById('importNumistaBtn')?.addEventListener('click', () => this.showScreen('numistaImport'));


            // Botones de navegación
            document.getElementById('backFromAdd')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromCountry')?.addEventListener('click', () => {
                this.showScreen(this.previousScreen);
            });
            document.getElementById('backFromContinents')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromEdit')?.addEventListener('click', () => {
                if (this.previousScreen === 'continents') {
                    this.showScreen('continents');
                } else {
                    this.showScreen('country');
                }
            });
            document.getElementById('backFromPhotoEditor')?.addEventListener('click', () => this.showScreen(this.previousScreen));
            document.getElementById('backFromImageSearch')?.addEventListener('click', () => this.showScreen('main'));
            document.getElementById('backFromNumista')?.addEventListener('click', () => this.showScreen('add'));
            document.getElementById('backFromNumistaImport')?.addEventListener('click', () => this.showScreen('main'));
            const fetchBtn = document.getElementById('fetchNumistaCollectionBtn');
            if (fetchBtn) {
                fetchBtn.addEventListener('click', () => {
                    console.log('Botón Numista clickeado');
                    this.fetchNumistaCollection();
                });
            }
            document.getElementById('importCountriesBtn')?.addEventListener('click', () => this.addMissingCountriesFromCollection());
            document.getElementById('listCountriesBtn')?.addEventListener('click', () => this.listCountries());
            document.getElementById('syncStatusBtn')?.addEventListener('click', () => this.showSyncStatus());
            document.getElementById('debugCountriesBtn')?.addEventListener('click', () => this.debugCountryMapping());
            
            // Título como botón home
            document.getElementById('appTitle')?.addEventListener('click', () => this.showScreen('main'));
            
            // Filtros
            document.getElementById('typeFilter')?.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderMainScreen();
            });
            document.getElementById('continentsTypeFilter')?.addEventListener('change', (e) => {
                this.currentContinentsFilter = e.target.value;
                this.showContinents();
            });
            // Mapa mundial - usar delegación de eventos
            document.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'showMapBtn') {
                    console.log('Botón del mapa clickeado via delegación');
                    e.preventDefault();
                    this.showWorldMap();
                }
                if (e.target && e.target.id === 'backFromWorldMap') {
                    e.preventDefault();
                    this.showScreen('continents');
                }
            });
            
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
            
            // Zoom de imagen - configurar después de que el DOM esté listo
            setTimeout(() => {
                const backBtn = document.getElementById('backFromImageZoom');
                const changeBtn = document.getElementById('changeImageBtn');
                const prevBtn = document.getElementById('prevImageBtn');
                const nextBtn = document.getElementById('nextImageBtn');
                
                if (backBtn) backBtn.addEventListener('click', () => {
                    if (this.currentZoomItem && this.currentZoomItem.item && this.editMode) {
                        this.editItem(this.currentZoomItem.item.id);
                    } else {
                        this.showScreen('country');
                    }
                });
                if (changeBtn) changeBtn.addEventListener('click', () => this.changeCurrentImage());
                if (prevBtn) prevBtn.addEventListener('click', () => this.switchZoomImage('prev'));
                if (nextBtn) nextBtn.addEventListener('click', () => this.switchZoomImage('next'));
            }, 100);

            // Formulario agregar
            document.getElementById('addForm')?.addEventListener('submit', (e) => this.handleAddItem(e));
            document.getElementById('photoPreviewFront')?.addEventListener('click', () => this.selectPhoto('front'));
            document.getElementById('photoPreviewBack')?.addEventListener('click', () => this.selectPhoto('back'));
            document.getElementById('photoInputFront')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'front'));
            document.getElementById('photoInputBack')?.addEventListener('change', (e) => this.handlePhotoSelect(e, 'back'));
            
            // Formulario editar
            document.getElementById('editForm')?.addEventListener('submit', (e) => this.handleEditItem(e));
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
                this.updateEditModeUI();
                // Forzar renderizado después de un pequeño delay
                setTimeout(() => this.renderMainScreen(), 100);
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
        console.log('Modo edición:', this.editMode);

        // Filtrar items según el filtro seleccionado
        const filteredItems = this.currentFilter === 'todo' ? 
            this.items : 
            this.items.filter(item => item.type === this.currentFilter);

        console.log('Items filtrados:', filteredItems.length);

        if (filteredItems.length === 0) {
            const filterText = this.currentFilter === 'todo' ? '' : ` de ${this.currentFilter === 'moneda' ? 'monedas' : 'billetes'}`;
            if (this.items.length === 0) {
                countriesGrid.innerHTML = `<div class="empty-state"><p>¡Comienza tu colección!</p><p>Agrega tu primera moneda o billete</p></div>`;
            } else {
                countriesGrid.innerHTML = `<div class="empty-state"><p>No hay items${filterText} para mostrar</p><p>Usa el filtro "Todo" para ver todos los items</p></div>`;
            }
            return;
        }

        const countryCount = {};
        filteredItems.forEach(item => {
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
            const countryName = country?.name || `País ${countryCode}`;
            const countryFlag = country?.flag || '🏴';
            
            const flagElement = document.createElement('div');
            flagElement.className = 'country-flag';
            flagElement.style.cursor = 'pointer';
            flagElement.innerHTML = `
                <div class="flag-emoji">
                    <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" 
                         alt="${countryName}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                         style="width: 40px; height: auto; border-radius: 4px;">
                    <span style="display: none; font-size: 2.5rem;">${countryFlag}</span>
                </div>
                <div class="country-name">${countryName}</div>
                <div class="count">${countryCount[countryCode]}</div>
            `;
            flagElement.addEventListener('click', () => this.showCountryItems(countryCode));
            countriesGrid.appendChild(flagElement);
        });
    }

    showCountryItems(countryCode) {
        this.currentCountryCode = countryCode;
        const country = window.COUNTRIES[countryCode];
        const countryName = country?.name || `País ${countryCode}`;
        
        const countryItems = this.items.filter(item => item.countryCode === countryCode);

        this.showScreen('country');
        
        const countryTitle = document.getElementById('countryTitle');
        if (countryTitle) {
            countryTitle.textContent = countryName;
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
                    ${item.catalogLink ? `<p><strong>Catálogo:</strong> <a href="${item.catalogLink}" target="_blank" rel="noopener">Ver enlace</a> <button class="btn-link" onclick="window.open('${item.catalogLink}', '_blank')">→</button></p>` : ''}
                </div>
                <button class="btn btn-secondary edit-btn">Editar</button>
            `;
            
            const editBtn = itemCard.querySelector('.edit-btn');
            const itemPhoto = itemCard.querySelector('.item-photo');
            const itemPlaceholder = itemCard.querySelector('.item-photo-placeholder');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editItem(item.id));
                editBtn.style.display = this.editMode ? 'block' : 'none';
            }
            if (itemPhoto) {
                itemPhoto.addEventListener('click', () => this.showImageZoom(item.id, 'front'));
            }
            if (itemPlaceholder) {
                itemPlaceholder.addEventListener('click', () => this.editMode ? this.editItem(item.id) : null);
            }
            
            itemsList.appendChild(itemCard);
        });
    }

    showContinents() {
        const continentsList = document.getElementById('continentsList');
        continentsList.innerHTML = '';

        // Filtrar items según el filtro seleccionado
        const filteredItems = this.currentContinentsFilter === 'todo' ? 
            this.items : 
            this.items.filter(item => item.type === this.currentContinentsFilter);

        const continents = {};
        filteredItems.forEach(item => {
            const country = window.COUNTRIES[item.countryCode];
            if (country) {
                if (!continents[country.continent]) {
                    continents[country.continent] = new Set();
                }
                continents[country.continent].add(item.countryCode);
            }
        });

        // Ordenar continentes alfabéticamente
        const sortedContinents = Object.keys(continents).sort((a, b) => 
            a.localeCompare(b, 'es', { sensitivity: 'base' })
        );

        sortedContinents.forEach(continentName => {
            const section = document.createElement('div');
            section.className = 'continent-section';
            
            // Ordenar países alfabéticamente dentro del continente
            const sortedCountries = Array.from(continents[continentName])
                .sort((a, b) => {
                    const nameA = window.COUNTRIES[a]?.name || '';
                    const nameB = window.COUNTRIES[b]?.name || '';
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                });
            
            const countriesHtml = sortedCountries
                .map(countryCode => {
                    const country = window.COUNTRIES[countryCode];
                    const count = filteredItems.filter(item => item.countryCode === countryCode).length;
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
        
        // Posicionar al inicio de la página
        window.scrollTo(0, 0);
    }

    showWorldMap() {
        console.log('showWorldMap llamado');
        this.renderWorldMap();
        this.showScreen('worldMap');
        this.setupMapDrag();
    }
    
    setupMapDrag() {
        const svg = document.getElementById('worldMapSvg');
        const container = document.getElementById('mapContainer');
        if (!svg || !container) return;
        
        let isDragging = false;
        let startX, startY, currentX = 0, currentY = 0;
        
        svg.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;
            svg.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            
            const zoom = this.mapZoom || 1;
            svg.style.transform = `scale(${zoom}) translate(${currentX/zoom}px, ${currentY/zoom}px)`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            svg.style.cursor = 'grab';
        });
    }

    renderWorldMap() {
        const svg = document.getElementById('worldMapSvg');
        if (!svg) {
            console.error('SVG del mapa no encontrado');
            return;
        }

        console.log('Renderizando mapa con', this.items.length, 'items');

        // Analizar países por tipo
        const countryTypes = {};
        this.items.forEach(item => {
            if (!countryTypes[item.countryCode]) {
                countryTypes[item.countryCode] = { moneda: false, billete: false };
            }
            if (item.type === 'moneda') {
                countryTypes[item.countryCode].moneda = true;
            } else if (item.type === 'billete') {
                countryTypes[item.countryCode].billete = true;
            }
        });
        
        console.log('Tipos por país:', countryTypes);
        
        console.log('Países en el mapa:', Object.keys(countryTypes));

        // Coordenadas de países (cx, cy para círculos)
        const countryPositions = {
            'US': { cx: 200, cy: 200 }, 'CA': { cx: 180, cy: 150 }, 'MX': { cx: 180, cy: 250 },
            'BR': { cx: 320, cy: 350 }, 'AR': { cx: 300, cy: 420 }, 'CL': { cx: 280, cy: 400 },
            'CO': { cx: 260, cy: 300 }, 'PE': { cx: 270, cy: 350 }, 'VE': { cx: 290, cy: 280 },
            'EC': { cx: 250, cy: 320 }, 'BO': { cx: 290, cy: 370 }, 'UY': { cx: 330, cy: 430 },
            'PY': { cx: 310, cy: 390 }, 'CR': { cx: 200, cy: 280 }, 'PA': { cx: 220, cy: 290 },
            'GT': { cx: 180, cy: 270 }, 'HN': { cx: 190, cy: 275 }, 'NI': { cx: 195, cy: 280 },
            'SV': { cx: 185, cy: 275 }, 'CU': { cx: 220, cy: 240 }, 'DO': { cx: 250, cy: 245 },
            'GB': { cx: 480, cy: 170 }, 'FR': { cx: 500, cy: 200 }, 'DE': { cx: 520, cy: 180 },
            'ES': { cx: 480, cy: 220 }, 'IT': { cx: 520, cy: 220 }, 'PT': { cx: 460, cy: 220 },
            'CH': { cx: 510, cy: 200 }, 'AT': { cx: 530, cy: 190 }, 'BE': { cx: 500, cy: 185 },
            'NL': { cx: 505, cy: 175 }, 'PL': { cx: 540, cy: 170 }, 'RU': { cx: 650, cy: 150 },
            'CN': { cx: 700, cy: 220 }, 'JP': { cx: 780, cy: 220 }, 'KR': { cx: 760, cy: 210 },
            'IN': { cx: 650, cy: 250 }, 'AU': { cx: 750, cy: 400 }, 'NZ': { cx: 800, cy: 450 },
            'ZA': { cx: 540, cy: 400 }, 'EG': { cx: 550, cy: 250 }, 'MA': { cx: 470, cy: 240 },
            'DZ': { cx: 500, cy: 240 }, 'TN': { cx: 520, cy: 230 }
        };

        // Mapa mundial con imagen de fondo
        let svgContent = `
            <image href="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg" 
                   x="0" y="0" width="1000" height="500" opacity="0.8"/>
        `;
        
        // Solo agregar puntos si hay items
        if (Object.keys(countryTypes).length > 0) {
            Object.entries(countryPositions).forEach(([countryCode, pos]) => {
                if (countryTypes[countryCode]) {
                    const hasMonedas = countryTypes[countryCode].moneda;
                    const hasBilletes = countryTypes[countryCode].billete;
                    const countryName = window.COUNTRIES[countryCode]?.name || countryCode;
                    const count = this.items.filter(item => item.countryCode === countryCode).length;
                    
                    let fillColor, strokeColor;
                    if (hasMonedas && hasBilletes) {
                        fillColor = '#8844ff';
                        strokeColor = '#6622cc';
                    } else if (hasMonedas) {
                        fillColor = '#ff4444';
                        strokeColor = '#cc2222';
                    } else if (hasBilletes) {
                        fillColor = '#4444ff';
                        strokeColor = '#2222cc';
                    }
                    
                    svgContent += `
                        <circle cx="${pos.cx}" cy="${pos.cy}" r="8" 
                                fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" 
                                style="cursor: pointer;" 
                                onclick="app.showCountryItems('${countryCode}')">
                            <title>${countryName}: ${count} items</title>
                        </circle>
                    `;
                }
            });
        }
        
        svg.innerHTML = svgContent;
        console.log('Mapa renderizado con', svgContent.length, 'caracteres de contenido');
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
        
        // Limpiar eventos anteriores
        frontPreview.replaceWith(frontPreview.cloneNode(true));
        backPreview.replaceWith(backPreview.cloneNode(true));
        
        // Obtener referencias nuevas después del clonado
        const newFrontPreview = document.getElementById('editPhotoPreviewFront');
        const newBackPreview = document.getElementById('editPhotoPreviewBack');
        
        if (item.photoFront) {
            newFrontPreview.innerHTML = `<img src="${item.photoFront}" alt="Anverso" style="cursor: pointer;">`;
            newFrontPreview.dataset.photo = item.photoFront;
            newFrontPreview.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showImageZoom(item.id, 'front');
            });
        } else {
            newFrontPreview.innerHTML = '<span>📷 Foto Anverso</span>';
            newFrontPreview.addEventListener('click', () => this.selectPhoto('front', 'edit'));
        }
        
        if (item.photoBack) {
            newBackPreview.innerHTML = `<img src="${item.photoBack}" alt="Reverso" style="cursor: pointer;">`;
            newBackPreview.dataset.photo = item.photoBack;
            newBackPreview.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showImageZoom(item.id, 'back');
            });
        } else {
            newBackPreview.innerHTML = '<span>📷 Foto Reverso</span>';
            newBackPreview.addEventListener('click', () => this.selectPhoto('back', 'edit'));
        }
        
        this.showScreen('edit');
    }

    async handleEditItem(event) {
        event.preventDefault();
        
        if (!this.currentEditingItem) return;
        
        const photoPreviewFront = document.getElementById('editPhotoPreviewFront');
        const photoPreviewBack = document.getElementById('editPhotoPreviewBack');
        
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
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            
            try {
                await fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${this.currentEditingItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedItem)
                });
                console.log('Item actualizado en API');
            } catch (error) {
                console.error('Error actualizando en API:', error);
            }
        }
        
        const countryCode = this.currentCountryCode;
        this.currentEditingItem = null;
        
        alert('✅ Item actualizado correctamente');
        
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

    async handleAddItem(event) {
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
        
        fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        }).then(() => {
            console.log('Item guardado en API');
        }).catch(error => {
            console.error('Error guardando en API:', error);
        });
        
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
        this.showScreen('imageSearch');
    }

    async loadData() {
        console.log('Cargando datos...');
        
        try {
            const API_URL = window.API_URL || 'https://numismatica-7pat.onrender.com';
            console.log('Conectando a:', `${API_URL}/coins`);
            const response = await fetch(`${API_URL}/coins`);
            console.log('Respuesta del API:', response.status, response.statusText);
            if (response.ok) {
                const apiItems = await response.json();
                console.log('Datos del API:', apiItems.length, 'items');
                this.items = apiItems;
                localStorage.setItem('coinCollection', JSON.stringify(this.items));
                console.log('Datos sincronizados desde API');
            } else {
                const errorText = await response.text();
                console.log('Error del API:', errorText);
                throw new Error(`API error: ${response.status}`);
            }
        } catch (error) {
            console.log('API error, usando localStorage:', error.message);
            const saved = localStorage.getItem('coinCollection');
            if (saved) {
                try {
                    this.items = JSON.parse(saved);
                    console.log('Datos cargados desde localStorage:', this.items.length, 'items');
                } catch (parseError) {
                    console.error('Error parsing localStorage:', parseError);
                    this.items = [];
                }
            } else {
                this.items = [];
            }
        }
        
        console.log('Total items cargados:', this.items.length);
    }

    showImageZoom(itemId, side) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;
        
        this.currentZoomItem = { item, side };
        
        const imageUrl = side === 'front' ? item.photoFront : item.photoBack;
        const title = side === 'front' ? 'Anverso' : 'Reverso';
        
        document.getElementById('zoomImage').src = imageUrl;
        document.getElementById('imageZoomTitle').textContent = `${title} - ${item.denomination}`;
        
        // Mostrar/ocultar botones de navegación
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        const hasFront = item.photoFront;
        const hasBack = item.photoBack;
        
        if (prevBtn && nextBtn) {
            prevBtn.style.display = (hasFront && hasBack) ? 'block' : 'none';
            nextBtn.style.display = (hasFront && hasBack) ? 'block' : 'none';
        }
        
        this.showScreen('imageZoom');
    }
    
    switchZoomImage(direction) {
        if (!this.currentZoomItem) return;
        
        const { item, side } = this.currentZoomItem;
        const hasFront = item.photoFront;
        const hasBack = item.photoBack;
        
        if (!hasFront || !hasBack) return;
        
        const newSide = side === 'front' ? 'back' : 'front';
        this.showImageZoom(item.id, newSide);
    }
    

    
    changeCurrentImage() {
        if (!this.currentZoomItem) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
        
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:8px;max-width:300px;width:90%;">
                <h3 style="margin:0 0 1.5rem 0;text-align:center;">Actualizar Imagen</h3>
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
            
            document.getElementById('zoomImage').src = newImageUrl;
            
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
                
                fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.items[itemIndex])
                }).catch(e => console.log('Error PUT:', e));
                
                this.editItem(item.id);
            }
        }
    }
    
    async fetchNumistaCollection() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        const apiKey = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        const clientId = '529122';
        
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>🔑 Obteniendo token OAuth...</h3><p>Autenticando con Numista...</p></div>';
        
        try {
            // Paso 1: Obtener token OAuth usando client credentials
            console.log('Solicitando token OAuth...');
            const tokenResponse = await fetch(`https://api.numista.com/v3/oauth_token?grant_type=client_credentials&scope=view_collection`, {
                method: 'GET',
                headers: {
                    'Numista-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });
            
            console.log('Token response status:', tokenResponse.status);
            
            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('Token error response:', errorText);
                if (tokenResponse.status === 429) {
                    throw new Error('Cuota mensual de Numista excedida (2000 requests/mes)');
                } else if (tokenResponse.status === 401) {
                    throw new Error('Cuota mensual agotada o credenciales inválidas');
                }
                throw new Error(`OAuth error ${tokenResponse.status}: ${errorText}`);
            }
            
            const tokenData = await tokenResponse.json();
            console.log('Token obtenido exitosamente, user_id:', tokenData.user_id);
            
            resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>📥 Obteniendo colección...</h3><p>Conectando con Numista...</p></div>';
            
            // Paso 2: Usar el token para obtener la colección
            console.log('Solicitando colección con token...');
            const response = await fetch(`https://api.numista.com/v3/users/${clientId}/collected_items`, {
                method: 'GET',
                headers: {
                    'Numista-API-Key': apiKey,
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json'
                }
            });
            
            console.log('Collection response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Collection error response:', errorText);
                if (response.status === 429) {
                    throw new Error('Cuota mensual de Numista excedida (2000 requests/mes)');
                } else if (response.status === 401) {
                    throw new Error('Cuota mensual agotada o token expirado');
                }
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
            
            const collectionData = await response.json();
            console.log('Colección obtenida:', collectionData);
            this.displayNumistaCollection(collectionData);
            
        } catch (error) {
            console.error('Error fetching collection:', error);
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>❌ Error de Conexión</h3>
                    <p>No se pudo conectar con Numista</p>
                    <p><small>Error: ${error.message}</small></p>
                    <br>
                    <div style="background: #e8f4fd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #2196F3;">
                        <h4>🚀 Importación Manual Disponible</h4>
                        <p>Puedes importar items individuales fácilmente:</p>
                        <ol style="text-align: left; max-width: 400px; margin: 1rem auto; line-height: 1.8;">
                            <li>Ve a <a href="https://en.numista.com" target="_blank" style="color: #1976D2; font-weight: bold;">Numista.com</a></li>
                            <li>Busca tu moneda o billete</li>
                            <li>Copia la URL de la página del item</li>
                            <li>Usa "Incluir desde Numista" al agregar items</li>
                        </ol>
                    </div>
                    <button class="btn btn-primary" onclick="app.showScreen('add')" style="margin-top: 1rem; padding: 0.75rem 2rem;">Agregar Item</button>
                </div>
            `;
        }
    }
    
    displayNumistaCollection(collectionData) {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        
        if (!collectionData.items || collectionData.items.length === 0) {
            resultsDiv.innerHTML = '<p>No se encontraron items en tu colección de Numista</p>';
            return;
        }
        
        this.numistaItems = collectionData.items;
        const items = collectionData.items.slice(0, 10);
        
        // Analizar países para debug
        const countryAnalysis = {};
        collectionData.items.forEach(item => {
            const issuerName = item.type?.issuer?.name || 'Desconocido';
            const issuerCode = item.type?.issuer?.code || 'N/A';
            const mappedCode = this.mapNumistaCountry(issuerCode, issuerName);
            
            if (!countryAnalysis[issuerName]) {
                countryAnalysis[issuerName] = {
                    count: 0,
                    issuerCode: issuerCode,
                    mappedCode: mappedCode,
                    inDatabase: !!window.COUNTRIES[mappedCode]
                };
            }
            countryAnalysis[issuerName].count++;
        });
        
        console.log('Análisis de países Numista:', countryAnalysis);
        
        resultsDiv.innerHTML = `
            <h3>Colección de Numista (${collectionData.item_count} items)</h3>
            <p>Mostrando los primeros 10 items:</p>
            <button class="btn btn-success btn-full" id="importAllBtn" style="margin-bottom: 1rem;">📥 Importar Todos (${collectionData.items.length})</button>
            <button class="btn btn-info btn-full" id="analyzeCountriesBtn" style="margin-bottom: 1rem;">🔍 Analizar Países</button>
            <div class="numista-items">
                ${items.map(item => `
                    <div class="numista-item" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 4px;">
                        <h4>${item.type?.title || 'Título no disponible'}</h4>
                        <p><strong>País:</strong> ${item.type?.issuer?.name || 'Desconocido'}</p>
                        <p><strong>Código:</strong> ${item.type?.issuer?.code || 'N/A'}</p>
                        <p><strong>Categoría:</strong> ${item.type?.category || 'N/A'}</p>
                        <p><strong>Cantidad:</strong> ${item.quantity || 1}</p>
                        <p><strong>Estado:</strong> ${item.grade || 'N/A'}</p>
                        <button class="btn btn-primary" onclick="app.importNumistaItem('${item.type?.id}', ${item.quantity || 1}, '${item.grade || 'Bueno'}')">Importar</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Agregar event listeners
        setTimeout(() => {
            document.getElementById('importAllBtn')?.addEventListener('click', () => {
                this.importAllNumistaItems();
            });
            document.getElementById('analyzeCountriesBtn')?.addEventListener('click', () => {
                this.showCountryAnalysis(countryAnalysis);
            });
        }, 100);
    }
    
    async importNumistaItem(pieceId, quantity = 1, grade = 'Bueno') {
        const apiKey = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        
        try {
            const response = await fetch(`https://api.numista.com/v3/types/${pieceId}?lang=es`, {
                headers: {
                    'Numista-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            const pieceData = await response.json();
            
            // Verificar si ya existe
            const existingItem = this.items.find(item => 
                item.notes && item.notes.includes(`Numista ID: ${pieceId}`)
            );
            
            if (existingItem) {
                const action = await this.handleDuplicateItem(pieceData.title);
                if (action === 'ignore') {
                    return { success: true, action: 'ignored' };
                } else if (action === 'cancel') {
                    return { success: false, action: 'cancelled' };
                }
            }
            
            // Mapear país usando código y nombre
            let countryCode = this.mapNumistaCountry(pieceData.issuer?.code, pieceData.issuer?.name);
            let newCountryAdded = null;
            
            // Si aún no existe el país, usar XX
            if (!window.COUNTRIES[countryCode]) {
                countryCode = 'XX';
            }
            
            const countryName = window.COUNTRIES[countryCode]?.name || pieceData.issuer?.name || 'Desconocido';
            
            // Corregir items existentes con código XX
            this.fixExistingXXItems(pieceData.issuer?.name, countryCode);
            

            
            const item = {
                id: existingItem ? existingItem.id : Date.now() + Math.random(),
                type: pieceData.category === 'banknote' ? 'billete' : 'moneda',
                countryCode: countryCode,
                country: countryName,
                denomination: pieceData.value?.text || pieceData.title,
                year: pieceData.min_year || new Date().getFullYear(),
                condition: this.mapNumistaGrade(grade),
                value: null,
                notes: `Importado de Numista: ${pieceData.title} (Numista ID: ${pieceId})`,
                catalogLink: `https://en.numista.com/catalogue/pieces${pieceId}.html`,
                photoFront: pieceData.obverse?.picture || null,
                photoBack: pieceData.reverse?.picture || null,
                dateAdded: existingItem ? existingItem.dateAdded : new Date().toISOString(),
                dateModified: existingItem ? new Date().toISOString() : undefined
            };
            
            if (existingItem) {
                const index = this.items.findIndex(i => i.id === existingItem.id);
                this.items[index] = item;
                
                // Intentar actualizar en API, si falla crear nuevo
                try {
                    const response = await fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${existingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    });
                    
                    if (!response.ok) {
                        // Si el PUT falla (404), crear como nuevo item
                        fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        }).catch(e => console.log('Error POST:', e));
                    }
                } catch (error) {
                    console.log('Error actualizando, creando nuevo:', error);
                }
            } else {
                this.items.push(item);
                
                fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                }).catch(() => {});
            }
            
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            
            return { 
                success: true, 
                action: existingItem ? 'replaced' : 'added',
                newCountry: newCountryAdded
            };
            
        } catch (error) {
            console.error('Error importing item:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleDuplicateItem(title) {
        if (this.duplicateAction) {
            return this.duplicateAction;
        }
        
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
            
            modal.innerHTML = `
                <div style="background:white;padding:2rem;border-radius:8px;max-width:400px;width:90%;">
                    <h3 style="margin:0 0 1rem 0;">Item Duplicado</h3>
                    <p>El item "${title}" ya existe en tu colección.</p>
                    <p>¿Qué deseas hacer?</p>
                    <div style="margin:1rem 0;">
                        <label style="display:block;margin-bottom:0.5rem;">
                            <input type="checkbox" id="applyToAll" style="margin-right:0.5rem;">
                            Hacer lo mismo para otros items repetidos
                        </label>
                    </div>
                    <div style="display:flex;gap:1rem;">
                        <button id="replaceBtn" class="btn btn-primary" style="flex:1;">Reemplazar</button>
                        <button id="ignoreBtn" class="btn btn-secondary" style="flex:1;">Ignorar</button>
                        <button id="cancelBtn" class="btn btn-danger" style="flex:1;">Cancelar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const applyToAll = modal.querySelector('#applyToAll');
            
            modal.querySelector('#replaceBtn').addEventListener('click', () => {
                if (applyToAll.checked) this.duplicateAction = 'replace';
                document.body.removeChild(modal);
                resolve('replace');
            });
            
            modal.querySelector('#ignoreBtn').addEventListener('click', () => {
                if (applyToAll.checked) this.duplicateAction = 'ignore';
                document.body.removeChild(modal);
                resolve('ignore');
            });
            
            modal.querySelector('#cancelBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve('cancel');
            });
        });
    }
    
    async importAllNumistaItems() {
        if (!this.numistaItems || this.numistaItems.length === 0) {
            alert('No hay items para importar');
            return;
        }
        
        this.duplicateAction = null;
        let imported = 0;
        let replaced = 0;
        let ignored = 0;
        let errors = 0;
        let newCountries = 0;
        const ignoredItems = [];
        const addedCountries = [];
        
        const progressDiv = document.getElementById('numistaCollectionResults');
        
        for (let i = 0; i < this.numistaItems.length; i++) {
            const item = this.numistaItems[i];
            const progress = Math.round(((i + 1) / this.numistaItems.length) * 100);
            
            progressDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <h3>Importando Colección</h3>
                    <div style="background: #f0f0f0; border-radius: 10px; padding: 3px; margin: 1rem 0;">
                        <div style="background: #2196F3; height: 20px; border-radius: 8px; width: ${progress}%; transition: width 0.3s;"></div>
                    </div>
                    <p><strong>${i + 1}</strong> de <strong>${this.numistaItems.length}</strong> items (${progress}%)</p>
                    <div style="font-size: 0.9em; color: #666;">
                        ✅ Importados: ${imported} | 🔄 Reemplazados: ${replaced} | ⏭️ Ignorados: ${ignored} | ❌ Errores: ${errors}<br>
                        🌍 Nuevos países: ${newCountries}
                    </div>
                    <p style="font-size: 0.8em; margin-top: 1rem;">Procesando: ${item.type?.title || 'Item desconocido'}</p>
                </div>
            `;
            
            const result = await this.importNumistaItem(
                item.type?.id,
                item.quantity,
                item.grade || 'Bueno'
            );
            
            if (result.success) {
                if (result.action === 'added') imported++;
                else if (result.action === 'replaced') replaced++;
                else if (result.action === 'ignored') {
                    ignored++;
                    ignoredItems.push(item.type?.title || 'Item desconocido');
                }
                
                if (result.newCountry) {
                    newCountries++;
                    addedCountries.push(result.newCountry);
                }
            } else {
                if (result.action === 'cancelled') break;
                errors++;
            }
        }
        
        // Actualizar la pantalla principal
        await this.loadData();
        this.renderMainScreen();
        
        // Mostrar reporte detallado
        progressDiv.innerHTML = `
            <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <h3>✅ Importación Completada</h3>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                    <h4>Resumen</h4>
                    <div>✅ <strong>Importados:</strong> ${imported}</div>
                    <div>🔄 <strong>Reemplazados:</strong> ${replaced}</div>
                    <div>⏭️ <strong>Ignorados:</strong> ${ignored}</div>
                    <div>❌ <strong>Errores:</strong> ${errors}</div>
                    <div>🌍 <strong>Nuevos países:</strong> ${newCountries}</div>
                </div>
                
                ${addedCountries.length > 0 ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
                        <h4>🌍 Países agregados (${addedCountries.length})</h4>
                        <div style="max-height: 100px; overflow-y: auto; font-size: 0.9em;">
                            ${addedCountries.map(country => `<div>• ${country}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${ignoredItems.length > 0 ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                        <h4>⏭️ Items ignorados (${ignoredItems.length})</h4>
                        <div style="max-height: 150px; overflow-y: auto; font-size: 0.9em;">
                            ${ignoredItems.map(title => `<div>• ${title}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.duplicateAction = null;
    }
    
    mapNumistaCountry(numistaCode, issuerName) {
        if (!numistaCode && !issuerName) return 'XX';
        
        // Buscar por código directo (ISO)
        if (numistaCode) {
            const directCode = numistaCode.toUpperCase();
            if (window.COUNTRIES[directCode]) {
                return directCode;
            }
            
            // Mapeo extendido de códigos Numista a ISO
            const mapping = {
                'united-states': 'US', 'costa-rica': 'CR', 'mexico': 'MX', 'canada': 'CA',
                'spain': 'ES', 'france': 'FR', 'germany': 'DE', 'united-kingdom': 'GB',
                'argentina': 'AR', 'brazil': 'BR', 'chile': 'CL', 'colombia': 'CO',
                'peru': 'PE', 'venezuela': 'VE', 'ecuador': 'EC', 'bolivia': 'BO',
                'uruguay': 'UY', 'paraguay': 'PY', 'panama': 'PA', 'guatemala': 'GT',
                'honduras': 'HN', 'nicaragua': 'NI', 'el-salvador': 'SV', 'cuba': 'CU',
                'dominican-republic': 'DO', 'italy': 'IT', 'portugal': 'PT',
                'netherlands': 'NL', 'belgium': 'BE', 'switzerland': 'CH',
                'austria': 'AT', 'poland': 'PL', 'russia': 'RU', 'china': 'CN',
                'japan': 'JP', 'south-korea': 'KR', 'india': 'IN', 'australia': 'AU',
                'new-zealand': 'NZ', 'south-africa': 'ZA', 'egypt': 'EG',
                'morocco': 'MA', 'tunisia': 'TN', 'algeria': 'DZ',
                // Mapeos adicionales comunes
                'european-union': 'EU', 'soviet-union': 'SU', 'yugoslavia': 'YU',
                'czechoslovakia': 'CS', 'east-germany': 'DD', 'west-germany': 'DE',
                'hong-kong': 'HK', 'macao': 'MO', 'taiwan': 'TW',
                'puerto-rico': 'PR', 'guam': 'GU', 'virgin-islands': 'VI'
            };
            
            const code = numistaCode.toLowerCase();
            if (mapping[code]) return mapping[code];
        }
        
        // Búsqueda por nombre con umbral más bajo
        if (issuerName) {
            const match = this.findBestCountryMatch(issuerName);
            if (match.similarity >= 0.7) {
                return match.code;
            }
            
            // Mapeo directo por nombre común
            const nameMapping = this.getDirectNameMapping();
            const cleanName = issuerName.toLowerCase().trim();
            
            for (const [pattern, code] of Object.entries(nameMapping)) {
                if (cleanName.includes(pattern)) {
                    return code;
                }
            }
        }
        
        return 'XX';
    }
    
    getDirectNameMapping() {
        return {
            'estados unidos': 'US', 'united states': 'US', 'usa': 'US', 'america': 'US',
            'reino unido': 'GB', 'united kingdom': 'GB', 'gran bretaña': 'GB', 'england': 'GB',
            'alemania': 'DE', 'germany': 'DE', 'deutschland': 'DE',
            'francia': 'FR', 'france': 'FR',
            'españa': 'ES', 'spain': 'ES',
            'italia': 'IT', 'italy': 'IT',
            'suiza': 'CH', 'switzerland': 'CH', 'schweiz': 'CH', 'suisse': 'CH',
            'austria': 'AT', 'österreich': 'AT',
            'bélgica': 'BE', 'belgium': 'BE', 'belgique': 'BE',
            'países bajos': 'NL', 'netherlands': 'NL', 'holanda': 'NL', 'holland': 'NL',
            'portugal': 'PT',
            'grecia': 'GR', 'greece': 'GR',
            'turquía': 'TR', 'turkey': 'TR',
            'rusia': 'RU', 'russia': 'RU', 'russian': 'RU',
            'china': 'CN', 'people\'s republic': 'CN',
            'japón': 'JP', 'japan': 'JP',
            'corea del sur': 'KR', 'south korea': 'KR', 'korea': 'KR',
            'india': 'IN',
            'australia': 'AU',
            'canadá': 'CA', 'canada': 'CA',
            'méxico': 'MX', 'mexico': 'MX',
            'brasil': 'BR', 'brazil': 'BR',
            'argentina': 'AR',
            'chile': 'CL',
            'colombia': 'CO',
            'perú': 'PE', 'peru': 'PE',
            'venezuela': 'VE',
            'ecuador': 'EC',
            'bolivia': 'BO',
            'uruguay': 'UY',
            'paraguay': 'PY',
            'costa rica': 'CR',
            'panamá': 'PA', 'panama': 'PA',
            'guatemala': 'GT',
            'honduras': 'HN',
            'nicaragua': 'NI',
            'el salvador': 'SV', 'salvador': 'SV',
            'cuba': 'CU',
            'república dominicana': 'DO', 'dominican': 'DO',
            'hong kong': 'HK',
            'macao': 'MO', 'macau': 'MO',
            'taiwan': 'TW',
            'puerto rico': 'PR',
            'sudáfrica': 'ZA', 'south africa': 'ZA',
            'egipto': 'EG', 'egypt': 'EG',
            'marruecos': 'MA', 'morocco': 'MA',
            'túnez': 'TN', 'tunisia': 'TN',
            'argelia': 'DZ', 'algeria': 'DZ'
        };
    }
    
    showCountryAnalysis(countryAnalysis) {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        
        const sortedCountries = Object.entries(countryAnalysis)
            .sort(([,a], [,b]) => b.count - a.count);
        
        const unmappedCountries = sortedCountries.filter(([,data]) => data.mappedCode === 'XX');
        const mappedCountries = sortedCountries.filter(([,data]) => data.mappedCode !== 'XX');
        
        resultsDiv.innerHTML = `
            <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <h3>🔍 Análisis de Países de Numista</h3>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                    <h4>📊 Resumen</h4>
                    <div><strong>Total países únicos:</strong> ${sortedCountries.length}</div>
                    <div><strong>Países mapeados:</strong> ${mappedCountries.length}</div>
                    <div><strong>Países sin mapear:</strong> ${unmappedCountries.length}</div>
                    <div><strong>Total items:</strong> ${Object.values(countryAnalysis).reduce((sum, data) => sum + data.count, 0)}</div>
                </div>
                
                ${unmappedCountries.length > 0 ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                        <h4>⚠️ Países sin mapear (${unmappedCountries.length})</h4>
                        <div style="max-height: 200px; overflow-y: auto; font-size: 0.9em;">
                            ${unmappedCountries.map(([name, data]) => 
                                `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #eee;">
                                    <span><strong>${name}</strong> (${data.issuerCode})</span>
                                    <span>${data.count} items</span>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
                    <h4>✅ Países mapeados (${mappedCountries.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto; font-size: 0.9em;">
                        ${mappedCountries.slice(0, 15).map(([name, data]) => {
                            const country = window.COUNTRIES[data.mappedCode];
                            return `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #eee;">
                                <span><strong>${name}</strong> → ${country?.flag || ''} ${country?.name || data.mappedCode}</span>
                                <span>${data.count} items</span>
                            </div>`;
                        }).join('')}
                        ${mappedCountries.length > 15 ? `<div><em>... y ${mappedCountries.length - 15} más</em></div>` : ''}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="app.importAllNumistaItems()" style="margin-right: 0.5rem;">📥 Importar Todos</button>
                    <button class="btn btn-secondary" onclick="app.displayNumistaCollection({items: app.numistaItems, item_count: app.numistaItems.length})">← Volver</button>
                </div>
            </div>
        `;
    }
    
    async importCountriesFromNumista() {
        const apiKey = '7uX6sQn1IUvCrV11BfAvVEb20Hx3Hikl9EyPPBvg';
        const resultsDiv = document.getElementById('numistaCollectionResults');
        
        resultsDiv.innerHTML = '<p>Analizando países de Numista...</p>';
        
        try {
            const response = await fetch('https://api.numista.com/v3/issuers?lang=es', {
                headers: {
                    'Numista-API-Key': apiKey,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Analizar diferencias
            const numistaCountries = new Map();
            const newCountries = {};
            const existingCountries = [];
            const invalidCodes = [];
            
            data.issuers.forEach(issuer => {
                const code = issuer.code?.toUpperCase();
                const name = issuer.name;
                
                if (!code || code.length !== 2) {
                    invalidCodes.push({ code: code || 'N/A', name });
                    return;
                }
                
                numistaCountries.set(code, name);
                
                if (window.COUNTRIES[code]) {
                    existingCountries.push({ code, numista: name, local: window.COUNTRIES[code].name });
                } else {
                    newCountries[code] = {
                        name: name,
                        flag: this.getCountryFlag(code),
                        continent: 'Desconocido'
                    };
                }
            });
            
            // Países en base local pero no en Numista
            const localOnly = Object.keys(window.COUNTRIES).filter(code => 
                code.length === 2 && !numistaCountries.has(code)
            );
            
            // Agregar nuevos países
            Object.assign(window.COUNTRIES, newCountries);
            this.populateCountrySelect();
            this.populateEditCountrySelect();
            
            // Mostrar reporte detallado
            resultsDiv.innerHTML = `
                <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                    <h3>📊 Reporte de Países</h3>
                    
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                        <h4>✅ Nuevos países agregados (${Object.keys(newCountries).length})</h4>
                        ${Object.keys(newCountries).length > 0 ? 
                            Object.entries(newCountries).map(([code, country]) => 
                                `<div><strong>${code}:</strong> ${country.name}</div>`
                            ).join('') : 
                            '<div>Ningún país nuevo</div>'
                        }
                    </div>
                    
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
                        <h4>🔄 Países existentes (${existingCountries.length})</h4>
                        <div style="max-height: 150px; overflow-y: auto; font-size: 0.9em;">
                            ${existingCountries.slice(0, 10).map(country => 
                                `<div><strong>${country.code}:</strong> ${country.local} ${country.numista !== country.local ? `(Numista: ${country.numista})` : ''}</div>`
                            ).join('')}
                            ${existingCountries.length > 10 ? `<div><em>... y ${existingCountries.length - 10} más</em></div>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                        <h4>⚠️ Solo en base local (${localOnly.length})</h4>
                        <div style="max-height: 100px; overflow-y: auto; font-size: 0.9em;">
                            ${localOnly.slice(0, 10).map(code => 
                                `<div><strong>${code}:</strong> ${window.COUNTRIES[code].name}</div>`
                            ).join('')}
                            ${localOnly.length > 10 ? `<div><em>... y ${localOnly.length - 10} más</em></div>` : ''}
                        </div>
                    </div>
                    
                    ${invalidCodes.length > 0 ? `
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #f8d7da; border-radius: 4px;">
                            <h4>❌ Códigos inválidos (${invalidCodes.length})</h4>
                            <div style="max-height: 100px; overflow-y: auto; font-size: 0.9em;">
                                ${invalidCodes.slice(0, 5).map(item => 
                                    `<div><strong>${item.code}:</strong> ${item.name}</div>`
                                ).join('')}
                                ${invalidCodes.length > 5 ? `<div><em>... y ${invalidCodes.length - 5} más</em></div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                        <strong>Total Numista:</strong> ${numistaCountries.size} | 
                        <strong>Total Local:</strong> ${Object.keys(window.COUNTRIES).length} | 
                        <strong>Agregados:</strong> ${Object.keys(newCountries).length}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error importing countries:', error);
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>❌ Error</h3>
                    <p>No se pudieron obtener los países de Numista</p>
                    <p><small>Error: ${error.message}</small></p>
                </div>
            `;
        }
    }
    
    mapNumistaGrade(numistaGrade) {
        if (!numistaGrade) return 'F';
        
        // Mapeo directo de códigos Numista
        const directMap = {
            'G': 'G', 'VG': 'VG', 'F': 'F', 'VF': 'VF', 'XF': 'XF', 'AU': 'AU'
        };
        
        const grade = numistaGrade.toUpperCase().trim();
        if (directMap[grade]) return grade;
        
        // Mapeo por texto completo
        const gradeMap = {
            'POOR': 'G', 'FAIR': 'G', 'GOOD': 'G',
            'VERY GOOD': 'VG', 'FINE': 'F', 'VERY FINE': 'VF',
            'EXTREMELY FINE': 'XF', 'ABOUT UNCIRCULATED': 'AU',
            'UNCIRCULATED': 'AU', 'MINT STATE': 'AU'
        };
        
        return gradeMap[grade] || grade || 'F';
    }
    
    getCountryFlag(countryCode) {
        const flags = {
            'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲',
            'AO': '🇦🇴', 'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼',
            'AX': '🇦🇽', 'AZ': '🇦🇿', 'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫',
            'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮', 'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳',
            'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸', 'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼',
            'BY': '🇧🇾', 'BZ': '🇧🇿', 'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫', 'CG': '🇨🇬',
            'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳', 'CO': '🇨🇴',
            'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
            'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿', 'EC': '🇪🇨',
            'EE': '🇪🇪', 'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'FI': '🇫🇮',
            'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷', 'GA': '🇬🇦', 'GB': '🇬🇧',
            'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮', 'GL': '🇬🇱',
            'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹',
            'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HK': '🇭🇰', 'HM': '🇭🇲', 'HN': '🇭🇳', 'HR': '🇭🇷',
            'HT': '🇭🇹', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲', 'IN': '🇮🇳',
            'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹', 'JE': '🇯🇪', 'JM': '🇯🇲',
            'JO': '🇯🇴', 'JP': '🇯🇵', 'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲',
            'KN': '🇰🇳', 'KP': '🇰🇵', 'KR': '🇰🇷', 'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿', 'LA': '🇱🇦',
            'LB': '🇱🇧', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹',
            'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾', 'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪',
            'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰', 'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳',
            'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸', 'MT': '🇲🇹', 'MU': '🇲🇺',
            'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿', 'NA': '🇳🇦', 'NC': '🇳🇨',
            'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵',
            'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿', 'OM': '🇴🇲', 'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫',
            'PG': '🇵🇬', 'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷',
            'PS': '🇵🇸', 'PT': '🇵🇹', 'PW': '🇵🇼', 'PY': '🇵🇾', 'QA': '🇶🇦', 'RE': '🇷🇪', 'RO': '🇷🇴',
            'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼', 'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩',
            'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮', 'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱',
            'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸', 'ST': '🇸🇹', 'SV': '🇸🇻',
            'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿', 'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫', 'TG': '🇹🇬',
            'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴',
            'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿', 'UA': '🇺🇦', 'UG': '🇺🇬',
            'UM': '🇺🇲', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪',
            'VG': '🇻🇬', 'VI': '🇻🇮', 'VN': '🇻🇳', 'VU': '🇻🇺', 'WF': '🇼🇫', 'WS': '🇼🇸', 'XK': '🇽🇰',
            'YE': '🇾🇪', 'YT': '🇾🇹', 'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
        };
        return flags[countryCode] || '🏴';
    }
    
    mapCountryByName(issuerName) {
        if (!issuerName) return 'XX';
        
        const name = issuerName.toLowerCase();
        const nameMapping = {
            'estados unidos': 'US', 'united states': 'US', 'usa': 'US',
            'reino unido': 'GB', 'united kingdom': 'GB', 'gran bretaña': 'GB',
            'alemania': 'DE', 'germany': 'DE', 'deutschland': 'DE',
            'francia': 'FR', 'france': 'FR',
            'españa': 'ES', 'spain': 'ES',
            'italia': 'IT', 'italy': 'IT',
            'suiza': 'CH', 'switzerland': 'CH',
            'austria': 'AT',
            'bélgica': 'BE', 'belgium': 'BE',
            'países bajos': 'NL', 'netherlands': 'NL', 'holanda': 'NL',
            'portugal': 'PT',
            'grecia': 'GR', 'greece': 'GR',
            'turquía': 'TR', 'turkey': 'TR',
            'rusia': 'RU', 'russia': 'RU',
            'china': 'CN',
            'japón': 'JP', 'japan': 'JP',
            'corea del sur': 'KR', 'south korea': 'KR',
            'india': 'IN',
            'australia': 'AU',
            'canadá': 'CA', 'canada': 'CA',
            'méxico': 'MX', 'mexico': 'MX',
            'brasil': 'BR', 'brazil': 'BR',
            'argentina': 'AR',
            'chile': 'CL',
            'colombia': 'CO',
            'perú': 'PE', 'peru': 'PE',
            'venezuela': 'VE',
            'ecuador': 'EC',
            'bolivia': 'BO',
            'uruguay': 'UY',
            'paraguay': 'PY'
        };
        
        for (const [countryName, code] of Object.entries(nameMapping)) {
            if (name.includes(countryName)) {
                return code;
            }
        }
        
        return 'XX';
    }
    
    findBestCountryMatch(numistaName) {
        if (!numistaName) return { code: 'XX', similarity: 0 };
        
        let bestMatch = { code: 'XX', similarity: 0 };
        const cleanNumistaName = this.cleanCountryName(numistaName);
        
        for (const [code, country] of Object.entries(window.COUNTRIES)) {
            const cleanLocalName = this.cleanCountryName(country.name);
            const similarity = this.calculateSimilarity(cleanNumistaName, cleanLocalName);
            
            if (similarity > bestMatch.similarity) {
                bestMatch = { code, similarity };
            }
        }
        
        return bestMatch;
    }
    
    cleanCountryName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z\s]/g, '') // Solo letras y espacios
            .replace(/\s+/g, ' ') // Espacios múltiples a uno
            .trim();
    }
    
    calculateSimilarity(str1, str2) {
        // Algoritmo de similitud simple basado en palabras comunes
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        // Buscar la palabra más larga en común
        let maxMatch = 0;
        
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1.length >= 3 && word2.length >= 3) {
                    const similarity = this.levenshteinSimilarity(word1, word2);
                    maxMatch = Math.max(maxMatch, similarity);
                }
            }
        }
        
        // Bonus si una cadena contiene completamente a la otra
        if (str1.includes(str2) || str2.includes(str1)) {
            maxMatch = Math.max(maxMatch, 0.95);
        }
        
        return maxMatch;
    }
    
    levenshteinSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
    }
    
    generateCountryCode(issuerName) {
        if (!issuerName) return 'XX';
        
        // Limpiar el nombre y tomar las primeras letras
        const cleanName = issuerName
            .replace(/[^a-zA-Z\s]/g, '') // Solo letras y espacios
            .trim()
            .toUpperCase();
        
        // Intentar diferentes estrategias para generar código
        const words = cleanName.split(/\s+/);
        
        let code;
        if (words.length >= 2) {
            // Primeras letras de las primeras dos palabras
            code = words[0].charAt(0) + words[1].charAt(0);
        } else if (words[0] && words[0].length >= 2) {
            // Primeras dos letras de la primera palabra
            code = words[0].substring(0, 2);
        } else {
            // Fallback
            code = 'XX';
        }
        
        // Asegurar que el código no exista ya
        let finalCode = code;
        let counter = 1;
        while (window.COUNTRIES[finalCode] && counter < 100) {
            finalCode = code + counter;
            counter++;
        }
        
        return finalCode;
    }
    
    async askToAddCountry(countryName) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
            
            modal.innerHTML = `
                <div style="background:white;padding:2rem;border-radius:8px;max-width:400px;width:90%;">
                    <h3 style="margin:0 0 1rem 0;">País no encontrado en base de datos local</h3>
                    <p>"<strong>${countryName}</strong>"</p>
                    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
                        <button id="addCountryYes" class="btn btn-primary" style="flex:1;">Agregar</button>
                        <button id="addCountryNo" class="btn btn-secondary" style="flex:1;">Ignorar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#addCountryYes').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
            
            modal.querySelector('#addCountryNo').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        });
    }
    
    listCountries() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        const countries = Object.entries(window.COUNTRIES)
            .sort(([,a], [,b]) => a.name.localeCompare(b.name, 'es'))
            .map(([code, country]) => `<div style="padding: 0.25rem 0;"><strong>${code}:</strong> ${country.name} ${country.flag}</div>`)
            .join('');
        
        resultsDiv.innerHTML = `
            <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <h3>📜 Lista de Países (${Object.keys(window.COUNTRIES).length})</h3>
                <div style="font-size: 0.9em; line-height: 1.4;">
                    ${countries}
                </div>
            </div>
        `;
    }
    
    async addMissingCountriesFromCollection() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        resultsDiv.innerHTML = '<p>Analizando países faltantes en tu colección...</p>';
        
        const missingCountries = new Map();
        
        // Revisar items con código XX y extraer países
        this.items.forEach(item => {
            if (item.countryCode === 'XX' && item.country && item.country !== 'Desconocido') {
                // Generar código basado en el nombre del país
                const code = this.generateCountryCode(item.country);
                missingCountries.set(code, item.country);
            }
        });
        
        if (missingCountries.size === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>✅ No hay países faltantes</h3>
                    <p>Todos los países en tu colección ya están en la base de datos.</p>
                </div>
            `;
            return;
        }
        
        let added = 0;
        const addedCountries = [];
        
        for (const [code, countryName] of missingCountries) {
            const shouldAdd = await this.askToAddCountry(countryName);
            if (shouldAdd) {
                window.COUNTRIES[code] = {
                    name: countryName,
                    flag: this.getCountryFlag(code),
                    continent: 'Desconocido'
                };
                
                // Actualizar items con este país
                this.items.forEach(item => {
                    if (item.countryCode === 'XX' && item.country === countryName) {
                        item.countryCode = code;
                    }
                });
                
                added++;
                addedCountries.push(`${code}: ${countryName}`);
            }
        }
        
        if (added > 0) {
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            this.populateCountrySelect();
            this.populateEditCountrySelect();
            this.renderMainScreen();
        }
        
        resultsDiv.innerHTML = `
            <div style="padding: 1rem;">
                <h3>✅ Proceso Completado</h3>
                <p><strong>Países agregados:</strong> ${added} de ${missingCountries.size}</p>
                ${addedCountries.length > 0 ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                        <h4>Países agregados:</h4>
                        ${addedCountries.map(country => `<div>• ${country}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    fixExistingXXItems(issuerName, correctCode) {
        if (!issuerName || correctCode === 'XX') return;
        
        // Buscar items con código XX que coincidan con el emisor
        const xxItems = this.items.filter(item => 
            item.countryCode === 'XX' && 
            item.country && 
            item.country.toLowerCase().includes(issuerName.toLowerCase().substring(0, 5))
        );
        
        if (xxItems.length > 0) {
            console.log(`Corrigiendo ${xxItems.length} items de XX a ${correctCode}`);
            
            xxItems.forEach(item => {
                item.countryCode = correctCode;
                item.country = window.COUNTRIES[correctCode]?.name || item.country;
            });
            
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            this.renderMainScreen();
        }
    }
    
    // Función manual para corregir Suiza
    fixSwitzerlandItems() {
        const xxItems = this.items.filter(item => 
            item.countryCode === 'XX' || 
            (item.country && (item.country.toLowerCase().includes('suiza') || item.country.toLowerCase().includes('switzerland')))
        );
        
        if (xxItems.length > 0) {
            xxItems.forEach(item => {
                item.countryCode = 'CH';
                item.country = 'Suiza';
            });
            
            localStorage.setItem('coinCollection', JSON.stringify(this.items));
            
            // Actualizar en backend
            xxItems.forEach(item => {
                fetch(`${window.API_URL || 'https://numismatica-7pat.onrender.com'}/coins/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                }).catch(() => {});
            });
            
            this.renderMainScreen();
            alert(`✅ Corregidos ${xxItems.length} items de Suiza`);
        } else {
            alert('No se encontraron items de Suiza para corregir');
        }
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
        
        setTimeout(() => frontInput.focus(), 100);
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
    
    zoomMap(factor) {
        const svg = document.getElementById('worldMapSvg');
        if (!svg) return;
        
        this.mapZoom = (this.mapZoom || 1) * factor;
        this.mapZoom = Math.max(0.5, Math.min(4, this.mapZoom));
        
        svg.style.transform = `scale(${this.mapZoom})`;
    }
    
    resetMapZoom() {
        const svg = document.getElementById('worldMapSvg');
        if (!svg) return;
        
        this.mapZoom = 1;
        svg.style.transform = 'scale(1) translate(0px, 0px)';
    }
    
    startPeriodicSync() {
        // Sincronizar cada 30 segundos
        setInterval(async () => {
            const currentLength = this.items.length;
            await this.loadData();
            if (this.items.length !== currentLength && this.currentScreen === 'main') {
                this.renderMainScreen();
            }
        }, 30000);
    }
    

    
    updateEditModeUI() {
        // Todos los botones siempre visibles
    }
    
    // Función de utilidad para debug de países
    debugCountryMapping() {
        if (!this.numistaItems) {
            console.log('No hay items de Numista cargados');
            return;
        }
        
        const mapping = {};
        this.numistaItems.forEach(item => {
            const issuerName = item.type?.issuer?.name;
            const issuerCode = item.type?.issuer?.code;
            const mapped = this.mapNumistaCountry(issuerCode, issuerName);
            
            if (!mapping[issuerName]) {
                mapping[issuerName] = {
                    code: issuerCode,
                    mapped: mapped,
                    count: 0
                };
            }
            mapping[issuerName].count++;
        });
        
        console.table(mapping);
        return mapping;
    }
    
    async showSyncStatus() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>🔄 Verificando sincronización...</h3></div>';
        
        try {
            const API_URL = window.API_URL || 'https://numismatica-7pat.onrender.com';
            const response = await fetch(`${API_URL}/coins`);
            
            if (response.ok) {
                const serverItems = await response.json();
                const localItems = JSON.parse(localStorage.getItem('coinCollection') || '[]');
                
                const serverCount = serverItems.length;
                const localCount = localItems.length;
                const lastSync = localStorage.getItem('lastSyncTime') || 'Nunca';
                
                // Comparar IDs para encontrar diferencias
                const serverIds = new Set(serverItems.map(item => item.id));
                const localIds = new Set(localItems.map(item => item.id));
                
                const onlyInServer = serverItems.filter(item => !localIds.has(item.id));
                const onlyInLocal = localItems.filter(item => !serverIds.has(item.id));
                
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                        <h3>📊 Estado de Sincronización</h3>
                        
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                            <h4>📈 Resumen</h4>
                            <div><strong>Base de datos central:</strong> ${serverCount} items</div>
                            <div><strong>Almacenamiento local:</strong> ${localCount} items</div>
                            <div><strong>Última sincronización:</strong> ${lastSync}</div>
                            <div><strong>Estado:</strong> ${serverCount === localCount ? '✅ Sincronizado' : '⚠️ Diferencias detectadas'}</div>
                        </div>
                        
                        ${onlyInServer.length > 0 ? `
                            <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
                                <h4>📥 Solo en servidor (${onlyInServer.length})</h4>
                                <div style="max-height: 150px; overflow-y: auto; font-size: 0.9em;">
                                    ${onlyInServer.slice(0, 10).map(item => 
                                        `<div>• ${item.denomination} (${item.country}) - ${item.year}</div>`
                                    ).join('')}
                                    ${onlyInServer.length > 10 ? `<div><em>... y ${onlyInServer.length - 10} más</em></div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${onlyInLocal.length > 0 ? `
                            <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                                <h4>📤 Solo en local (${onlyInLocal.length})</h4>
                                <div style="max-height: 150px; overflow-y: auto; font-size: 0.9em;">
                                    ${onlyInLocal.slice(0, 10).map(item => 
                                        `<div>• ${item.denomination} (${item.country}) - ${item.year}</div>`
                                    ).join('')}
                                    ${onlyInLocal.length > 10 ? `<div><em>... y ${onlyInLocal.length - 10} más</em></div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="app.forceSyncFromServer()" style="margin-right: 0.5rem;">🔄 Sincronizar desde servidor</button>
                            <button class="btn btn-secondary" onclick="app.showServerData()">👁️ Ver datos del servidor</button>
                        </div>
                    </div>
                `;
                
                localStorage.setItem('lastSyncTime', new Date().toLocaleString());
                
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>❌ Error de Conexión</h3>
                    <p>No se pudo conectar con la base de datos central</p>
                    <p><small>Error: ${error.message}</small></p>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                        <strong>Datos locales:</strong> ${this.items.length} items
                    </div>
                </div>
            `;
        }
    }
    
    async forceSyncFromServer() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>🔄 Sincronizando...</h3></div>';
        
        await this.loadData();
        this.renderMainScreen();
        
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>✅ Sincronización Completada</h3>
                <p>Datos actualizados desde el servidor</p>
                <p><strong>Total items:</strong> ${this.items.length}</p>
            </div>
        `;
    }
    
    async showServerData() {
        const resultsDiv = document.getElementById('numistaCollectionResults');
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>📡 Obteniendo datos del servidor...</h3></div>';
        
        try {
            const API_URL = window.API_URL || 'https://numismatica-7pat.onrender.com';
            const response = await fetch(`${API_URL}/coins`);
            
            if (response.ok) {
                const serverItems = await response.json();
                
                // Agrupar por país
                const countryCount = {};
                serverItems.forEach(item => {
                    countryCount[item.countryCode] = (countryCount[item.countryCode] || 0) + 1;
                });
                
                const sortedCountries = Object.entries(countryCount)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 20);
                
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                        <h3>📡 Base de Datos Central</h3>
                        
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 4px;">
                            <h4>📊 Estadísticas Generales</h4>
                            <div><strong>Total items:</strong> ${serverItems.length}</div>
                            <div><strong>Países únicos:</strong> ${Object.keys(countryCount).length}</div>
                            <div><strong>Última actualización:</strong> ${new Date().toLocaleString()}</div>
                        </div>
                        
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
                            <h4>🌍 Top 20 Países</h4>
                            <div style="max-height: 200px; overflow-y: auto; font-size: 0.9em;">
                                ${sortedCountries.map(([code, count]) => {
                                    const country = window.COUNTRIES[code];
                                    const name = country?.name || code;
                                    const flag = country?.flag || '🏴';
                                    return `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                                        <span>${flag} ${name}</span>
                                        <strong>${count}</strong>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 4px;">
                            <h4>📋 Últimos 10 Items</h4>
                            <div style="max-height: 200px; overflow-y: auto; font-size: 0.9em;">
                                ${serverItems.slice(-10).reverse().map(item => 
                                    `<div style="padding: 0.25rem 0; border-bottom: 1px solid #eee;">
                                        <strong>${item.denomination}</strong> - ${item.country} (${item.year})
                                        <br><small>ID: ${item.id} | Tipo: ${item.type}</small>
                                    </div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                `;
                
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>❌ Error</h3>
                    <p>No se pudo obtener los datos del servidor</p>
                    <p><small>Error: ${error.message}</small></p>
                </div>
            `;
        }
    }
};