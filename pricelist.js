/* Estilo Pinas — master price list (starting data).
   The live copy is saved in the shop database by the owner editor (/admin → Price list).
   This file is only used until the first save, and as the source for the printable document. */
window.EP_PRICES_DEFAULT = {
  "updated": "2026-11-18",
  "noteLabel": "Important price reminder",
  "noteTitle": "A quick note about our pricing",
  "note": [
    "At Estilo Pinas, our prices are updated regularly based on dealer availability and current market pricing.",
    "We work with direct dealers, which allows us to offer competitive prices. Since our stocks move quickly and many buyers source from the same dealers, prices and availability may change from time to time.",
    "If an item is no longer available from our current stock or dealer, sourcing it elsewhere may affect the final price.",
    "Before placing your order, feel free to message us for the latest stock availability and price confirmation.",
    "For those comparing prices, we also encourage checking the current mall retail price as a reference.",
    "Thank you for choosing Estilo Pinas!"
  ],
  "categories": [
    { "id": "iphone", "name": "iPhone", "items": [
      { "id": "iphone-air", "model": "iPhone Air", "spec": "", "variants": [
        { "label": "256GB", "price": 58500, "status": "available" } ] },
      { "id": "iphone-18-pro", "model": "iPhone 18 Pro", "spec": "", "variants": [
        { "label": "256GB", "price": 87000, "status": "available" } ] },
      { "id": "iphone-18-pro-max", "model": "iPhone 18 Pro Max", "spec": "", "variants": [
        { "label": "256GB", "price": 94000, "status": "available" },
        { "label": "512GB", "price": 115000, "status": "available" } ] },
      { "id": "iphone-17", "model": "iPhone 17", "spec": "", "variants": [
        { "label": "256GB", "price": 62000, "status": "available" },
        { "label": "512GB", "price": 76000, "status": "available" } ] },
      { "id": "iphone-17-pro", "model": "iPhone 17 Pro", "spec": "", "variants": [
        { "label": "256GB", "price": 73000, "status": "available" } ] },
      { "id": "iphone-17-pro-max", "model": "iPhone 17 Pro Max", "spec": "", "variants": [
        { "label": "256GB", "price": 76500, "status": "available" },
        { "label": "512GB", "price": 88500, "status": "available" },
        { "label": "1TB", "price": 104000, "status": "available" } ] }
    ]},
    { "id": "macbook", "name": "MacBook", "items": [
      { "id": "macbook-neo", "model": "MacBook Neo", "spec": "", "variants": [
        { "label": "512GB", "price": 53000, "status": "available" } ] },
      { "id": "macbook-air-m5", "model": "MacBook Air M5", "spec": "", "variants": [
        { "label": "13-inch | 16GB RAM | 512GB SSD", "price": 82000, "status": "available" } ] }
    ]},
    { "id": "ipad", "name": "iPad", "items": [
      { "id": "ipad-air-m4", "model": "iPad Air M4", "spec": "", "variants": [
        { "label": "13-inch | 128GB", "price": 58000, "status": "available" },
        { "label": "11-inch | 128GB", "price": 45500, "status": "available" } ] },
      { "id": "ipad-11-a16", "model": "iPad 11th Generation A16", "spec": "", "variants": [
        { "label": "128GB", "price": 28000, "status": "available" },
        { "label": "256GB", "price": 36000, "status": "available" } ] }
    ]}
  ]
};
