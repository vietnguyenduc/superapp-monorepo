# DATABASE MAP

---

# TABLES

users  
transactions  
assets  
holdings  

---

# TABLE DETAILS

## users

id  
email  
created_at  

---

## transactions

id  
user_id  
asset_id  
quantity  
price  
date  

---

# RELATIONSHIPS

users → transactions  

transactions → assets  

transactions → holdings