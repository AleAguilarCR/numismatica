# Coin Collection PWA

## Desplegar en Render

1. **Crear cuenta en render.com**

2. **Conectar repositorio GitHub:**
   - Subir estos archivos a GitHub
   - En Render: "New" → "Web Service"
   - Conectar tu repositorio

3. **Configuración automática:**
   - Render detecta `render.yaml`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python backend.py`

4. **Actualizar URL:**
   - Copiar la URL de tu servicio (ej: `https://coin-collection-abc123.onrender.com`)
   - Reemplazar en `index.html` línea 9:
   ```javascript
   window.API_URL = 'https://tu-url-de-render.onrender.com';
   ```

5. **Características:**
   - ✅ SQLite persistente
   - ✅ Sincronización automática
   - ✅ Gratis hasta 750 horas/mes
   - ✅ HTTPS automático
   - ✅ Backup automático

## Desarrollo local

```bash
pip install -r requirements.txt
python backend.py
```

Abrir `index.html` en el navegador.