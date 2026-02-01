import sqlite3

conn = sqlite3.connect('marketplace.db')
cursor = conn.cursor()

# Check current state
cursor.execute("SELECT id, order_number, payment_status, total FROM orders")
orders = cursor.fetchall()
print("Orders:", orders)

cursor.execute("SELECT id, business_name, total_sales, total_earnings, balance FROM vendors")
vendors = cursor.fetchall()
print("Vendors:", vendors)

# Fix payment status
cursor.execute("UPDATE orders SET payment_status = 'PAID', paid_at = datetime('now') WHERE payment_status = 'PENDING'")
print(f"Updated {cursor.rowcount} orders to PAID")

# Fix vendor sales
cursor.execute("UPDATE vendors SET total_sales = 25, total_earnings = 22.50, balance = 22.50")
print(f"Updated {cursor.rowcount} vendors")

conn.commit()

# Verify
cursor.execute("SELECT id, order_number, payment_status, total FROM orders")
print("Orders after:", cursor.fetchall())

cursor.execute("SELECT id, business_name, total_sales, total_earnings, balance FROM vendors")
print("Vendors after:", cursor.fetchall())

conn.close()
print("Done!")
