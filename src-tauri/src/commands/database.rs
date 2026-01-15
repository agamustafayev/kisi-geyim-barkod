use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn databazi_sifirla(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Delete all data except users and sizes
    db.conn.execute_batch(r#"
        -- Delete returns first (foreign key)
        DELETE FROM return_items;
        DELETE FROM returns;
        
        -- Delete sales and related
        DELETE FROM sale_items;
        DELETE FROM sales;
        
        -- Delete debt payments
        DELETE FROM debt_payments;
        
        -- Delete customers
        DELETE FROM customers;
        
        -- Delete stock and movements
        DELETE FROM stock_movements;
        DELETE FROM stock;
        
        -- Delete products
        DELETE FROM products;
        
        -- Delete categories
        DELETE FROM categories;
        
        -- Delete settings
        DELETE FROM settings;
        
        -- Reset autoincrement counters
        DELETE FROM sqlite_sequence WHERE name IN (
            'returns', 'return_items', 'sale_items', 'sales', 
            'debt_payments', 'customers', 'stock_movements', 
            'stock', 'products', 'categories', 'settings'
        );
        
        -- Keep users and sizes
    "#).map_err(|e| format!("Database sıfırlama xətası: {}", e))?;
    
    // Re-seed default categories
    let categories = ["Köynək", "Şalvar", "Pencək", "Jilet", "Kurtka", "Palto", "Kostyum", "Aksesuar"];
    for category in categories {
        db.conn.execute(
            "INSERT INTO categories (ad) VALUES (?1)",
            [category],
        ).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
