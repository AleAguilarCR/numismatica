import sqlite3
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Coin(BaseModel):
    type: str
    countryCode: str
    country: str
    denomination: str
    year: int
    condition: str
    value: Optional[float] = None
    notes: Optional[str] = None
    catalogLink: Optional[str] = None
    photoFront: Optional[str] = None
    photoBack: Optional[str] = None
    dateAdded: str

def init_db():
    conn = sqlite3.connect('coins.db')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS coins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            countryCode TEXT,
            country TEXT,
            denomination TEXT,
            year INTEGER,
            condition TEXT,
            value REAL,
            notes TEXT,
            catalogLink TEXT,
            photoFront TEXT,
            photoBack TEXT,
            dateAdded TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/coins")
async def get_coins():
    conn = sqlite3.connect('coins.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coins")
    coins = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return coins

@app.post("/coins")
async def add_coin(coin: Coin):
    conn = sqlite3.connect('coins.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO coins (type, countryCode, country, denomination, year, condition, value, notes, catalogLink, photoFront, photoBack, dateAdded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (coin.type, coin.countryCode, coin.country, coin.denomination, coin.year, coin.condition, coin.value, coin.notes, coin.catalogLink, coin.photoFront, coin.photoBack, coin.dateAdded))
    coin_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": coin_id, **coin.dict()}

@app.delete("/coins/{coin_id}")
async def delete_coin(coin_id: int):
    conn = sqlite3.connect('coins.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM coins WHERE id = ?", (coin_id,))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Coin not found")
    conn.commit()
    conn.close()
    return {"message": "Coin deleted"}

@app.put("/coins/{coin_id}")
async def update_coin(coin_id: int, coin: Coin):
    conn = sqlite3.connect('coins.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE coins SET type=?, countryCode=?, country=?, denomination=?, year=?, condition=?, value=?, notes=?, catalogLink=?, photoFront=?, photoBack=?, dateAdded=?
        WHERE id=?
    ''', (coin.type, coin.countryCode, coin.country, coin.denomination, coin.year, coin.condition, coin.value, coin.notes, coin.catalogLink, coin.photoFront, coin.photoBack, coin.dateAdded, coin_id))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Coin not found")
    conn.commit()
    conn.close()
    return {"id": coin_id, **coin.dict()}

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)