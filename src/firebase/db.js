import { 
  addDoc,
  collection,
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  query, 
  orderBy, 
  runTransaction,
  serverTimestamp 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "./config";

// --- USER OPERATIONS ---

export const getUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Creates a Firebase Auth account using the secondary app (admin stays logged in),
 * then saves the staff profile to the Firestore `users` collection using the UID.
 */
export const createStaffUser = async ({ name, email, phone, role, password }) => {
  // Step 1: Create Auth account via secondary app so admin is NOT signed out
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const newUser = userCredential.user;

  // Step 2: Sign out from secondary app immediately
  await signOut(secondaryAuth);

  // Step 3: Save staff profile to Firestore with UID as document ID
  await setDoc(doc(db, "users", newUser.uid), {
    name,
    email,
    phone,
    role,
    uid: newUser.uid,
    createdAt: serverTimestamp()
  });

  return { id: newUser.uid };
};

export const deleteUser = async (userId) => {
  await deleteDoc(doc(db, "users", userId));
};

// --- PRODUCT OPERATIONS ---

export const getProducts = async () => {
  const q = query(collection(db, "products"), orderBy("priority", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createProduct = async (data) => {
  const docRef = await addDoc(collection(db, "products"), data);
  return { id: docRef.id };
};

export const updateProduct = async (id, data) => {
  // Ensure we don't try to update the ID field itself
  const { id: _, ...cleanData } = data;
  await setDoc(doc(db, "products", id), cleanData, { merge: true });
};

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

// --- SALES OPERATIONS ---

export const createSale = async (saleData, staffId) => {
  // saleData format: { products: [{id, name, quantity, price}], total_amount }
  
  try {
    const saleId = await runTransaction(db, async (transaction) => {
      // 1. Verify stock for all products
      for (const item of saleData.products) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) throw new Error(`Product ${item.name} not found`);
        const currentStock = productDoc.data().stock;
        
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        
        // 2. Reduce stock
        transaction.update(productRef, {
          stock: currentStock - item.quantity
        });
      }
      
      // 3. Create sale record
      const saleRef = doc(collection(db, "sales"));
      transaction.set(saleRef, {
        ...saleData,
        staff_id: staffId,
        date: serverTimestamp()
      });
      return saleRef.id;
    });

    return { success: true, saleId };
  } catch (error) {
    console.error("Sale transaction failed:", error);
    return { success: false, error: error.message };
  }
};

// --- DB SEEDING ---

const DEFAULT_PRODUCTS = [
  // ──────────────── CATEGORY 5: VEGETABLES ────────────────
  // Priority 1-6: Featured / Most Sold
  { id: 'onion',       name_en: 'Onion',         name_ta: 'வெங்காயம்',           price: 40,  category: 5, stock: 100, priority: 1,  image_url: 'https://images.unsplash.com/photo-1541345023926-55d6e0853f4d?auto=format&fit=crop&q=80&w=400' },
  { id: 'small-onion', name_en: 'Small Onion',   name_ta: 'சின்ன வெங்காயம்',     price: 80,  category: 5, stock: 50,  priority: 2,  image_url: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&q=80&w=400' },
  { id: 'coconut',     name_en: 'Coconut',        name_ta: 'தேங்காய்',            price: 25,  category: 5, stock: 200, priority: 3,  image_url: 'https://images.unsplash.com/photo-1550142349-98308573132e?auto=format&fit=crop&q=80&w=400' },
  { id: 'big-onion',   name_en: 'Big Onion',      name_ta: 'பெரிய வெங்காயம்',    price: 35,  category: 5, stock: 150, priority: 4,  image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa63a?auto=format&fit=crop&q=80&w=400' },
  { id: 'garlic',      name_en: 'Garlic',         name_ta: 'பூண்டு',              price: 120, category: 5, stock: 30,  priority: 5,  image_url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=400' },
  { id: 'ginger',      name_en: 'Ginger',         name_ta: 'இஞ்சி',              price: 150, category: 5, stock: 20,  priority: 6,  image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400' },

  // More Vegetables
  { id: 'tomato',      name_en: 'Tomato',         name_ta: 'தக்காளி',            price: 30,  category: 5, stock: 120, priority: 7,  image_url: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?auto=format&fit=crop&q=80&w=400' },
  { id: 'potato',      name_en: 'Potato',         name_ta: 'உருளைக்கிழங்கு',    price: 25,  category: 5, stock: 100, priority: 8,  image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400' },
  { id: 'carrot',      name_en: 'Carrot',         name_ta: 'கேரட்',              price: 40,  category: 5, stock: 60,  priority: 9,  image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400' },
  { id: 'beans',       name_en: 'Beans',          name_ta: 'பீன்ஸ்',             price: 60,  category: 5, stock: 40,  priority: 10, image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&q=80&w=400' },
  { id: 'capsicum',    name_en: 'Capsicum',       name_ta: 'குடை மிளகாய்',       price: 80,  category: 5, stock: 35,  priority: 11, image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&q=80&w=400' },
  { id: 'brinjal',     name_en: 'Brinjal',        name_ta: 'கத்தரிக்காய்',       price: 35,  category: 5, stock: 50,  priority: 12, image_url: 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?auto=format&fit=crop&q=80&w=400' },
  { id: 'drumstick',   name_en: 'Drumstick',      name_ta: 'முருங்கைக்காய்',     price: 50,  category: 5, stock: 30,  priority: 13, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
  { id: 'bitter-gourd',name_en: 'Bitter Gourd',   name_ta: 'பாகற்காய்',          price: 45,  category: 5, stock: 25,  priority: 14, image_url: 'https://images.unsplash.com/photo-1604735577074-9d21e6cc6fc6?auto=format&fit=crop&q=80&w=400' },
  { id: 'snake-gourd', name_en: 'Snake Gourd',    name_ta: 'புடலங்காய்',         price: 30,  category: 5, stock: 40,  priority: 15, image_url: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?auto=format&fit=crop&q=80&w=400' },
  { id: 'spinach',     name_en: 'Spinach',        name_ta: 'கீரை',               price: 20,  category: 5, stock: 60,  priority: 16, image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400' },
  { id: 'ladies-finger',name_en: 'Ladies Finger', name_ta: 'வெண்டைக்காய்',      price: 40,  category: 5, stock: 45,  priority: 17, image_url: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?auto=format&fit=crop&q=80&w=400' },
  { id: 'green-chilli',name_en: 'Green Chilli',   name_ta: 'பச்சை மிளகாய்',     price: 60,  category: 5, stock: 30,  priority: 18, image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400' },

  // ──────────────── CATEGORY 6: MUSHROOM ────────────────
  { id: 'button-mushroom', name_en: 'Button Mushroom', name_ta: 'பட்டன் காளான்',  price: 80,  category: 6, stock: 20, priority: 19, image_url: 'https://images.unsplash.com/photo-1638296648573-45a4454540f4?auto=format&fit=crop&q=80&w=400' },
  { id: 'oyster-mushroom', name_en: 'Oyster Mushroom', name_ta: 'சிப்பி காளான்',  price: 100, category: 6, stock: 15, priority: 20, image_url: 'https://images.unsplash.com/photo-1607603750909-408681227901?auto=format&fit=crop&q=80&w=400' },
  { id: 'milky-mushroom',  name_en: 'Milky Mushroom',  name_ta: 'பால் காளான்',    price: 90,  category: 6, stock: 12, priority: 21, image_url: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&q=80&w=400' },

  // ──────────────── CATEGORY 7: DAIRY ────────────────
  { id: 'milk',        name_en: 'Milk (500ml)',   name_ta: 'பால் (500மில்)',      price: 25,  category: 7, stock: 100, priority: 22, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400' },
  { id: 'curd',        name_en: 'Curd (500g)',    name_ta: 'தயிர் (500கி)',       price: 30,  category: 7, stock: 60,  priority: 23, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400' },
  { id: 'paneer',      name_en: 'Paneer (200g)',  name_ta: 'பனீர் (200கி)',       price: 80,  category: 7, stock: 30,  priority: 24, image_url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=400' },
  { id: 'butter',      name_en: 'Butter (100g)',  name_ta: 'வெண்ணெய் (100கி)',    price: 55,  category: 7, stock: 40,  priority: 25, image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400' },
  { id: 'ghee',        name_en: 'Ghee (500ml)',   name_ta: 'நெய் (500மில்)',      price: 380, category: 7, stock: 20,  priority: 26, image_url: 'https://images.unsplash.com/photo-1631217073612-f4bce9b5d9e8?auto=format&fit=crop&q=80&w=400' },
  { id: 'cheese',      name_en: 'Cheese (200g)',  name_ta: 'பாலாடை (200கி)',     price: 120, category: 7, stock: 15,  priority: 27, image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=400' },

  // ──────────────── CATEGORY 8: GROCERIES ────────────────
  { id: 'rice',        name_en: 'Rice (1kg)',        name_ta: 'அரிசி (1கி)',            price: 60,  category: 8, stock: 80,  priority: 28, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { id: 'toor-dal',    name_en: 'Toor Dal (500g)',   name_ta: 'துவரம் பருப்பு (500கி)', price: 70,  category: 8, stock: 50,  priority: 29, image_url: 'https://images.unsplash.com/photo-1612257999756-67a36fe67bec?auto=format&fit=crop&q=80&w=400' },
  { id: 'wheat-flour', name_en: 'Wheat Flour (1kg)', name_ta: 'கோதுமை மாவு (1கி)',     price: 45,  category: 8, stock: 60,  priority: 30, image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400' },
  { id: 'sugar',       name_en: 'Sugar (1kg)',       name_ta: 'சர்க்கரை (1கி)',         price: 45,  category: 8, stock: 70,  priority: 31, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400' },
  { id: 'salt',        name_en: 'Salt (1kg)',        name_ta: 'உப்பு (1கி)',            price: 20,  category: 8, stock: 100, priority: 32, image_url: 'https://images.unsplash.com/photo-1568921653067-8914f98c9f7f?auto=format&fit=crop&q=80&w=400' },
  { id: 'coconut-oil', name_en: 'Coconut Oil (1L)',  name_ta: 'தேங்காய் எண்ணெய் (1லி)',price: 200, category: 8, stock: 25,  priority: 33, image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' },
  { id: 'sunflower-oil',name_en:'Sunflower Oil (1L)',name_ta: 'சூரியகாந்தி எண்ணெய் (1லி)',price:150, category: 8, stock: 30,  priority: 34, image_url: 'https://images.unsplash.com/photo-1614526673975-2e3e4b5b4b8e?auto=format&fit=crop&q=80&w=400' },
  { id: 'turmeric',    name_en: 'Turmeric (100g)',   name_ta: 'மஞ்சள் தூள் (100கி)',    price: 30,  category: 8, stock: 40,  priority: 35, image_url: 'https://images.unsplash.com/photo-1615485291234-9d694218aeb3?auto=format&fit=crop&q=80&w=400' },
  { id: 'red-chilli',  name_en: 'Red Chilli (100g)', name_ta: 'மிளகாய் தூள் (100கி)',   price: 40,  category: 8, stock: 35,  priority: 36, image_url: 'https://images.unsplash.com/photo-1634467524884-897d0af5e104?auto=format&fit=crop&q=80&w=400' },
];

export const seedDatabase = async () => {
  for (const product of DEFAULT_PRODUCTS) {
    await setDoc(doc(db, "products", product.id), product);
  }
  console.log(`Database seeded with ${DEFAULT_PRODUCTS.length} products!`);
};
