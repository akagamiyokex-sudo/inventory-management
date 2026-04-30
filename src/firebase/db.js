import { 
  addDoc,
  collection,
  doc, 
  setDoc, 
  updateDoc,
  getDocs, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot,
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

/**
 * Real-time listener for products
 */
export const subscribeProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("priority", "asc"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  }, (error) => {
    console.error("Product subscription error:", error);
  });
};

export const createProduct = async (data) => {
  // Ensure numeric fields are actually numbers
  const cleanData = {
    ...data,
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    category: Number(data.category) || 5,
    priority: Number(data.priority) || 0,
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, "products"), cleanData);
  return { id: docRef.id };
};

export const updateProduct = async (id, data) => {
  // Remove id and updatedAt if present to handle clean update
  const { id: _, updatedAt: __, ...rest } = data;
  
  // Explicitly sanitize all fields to ensure data integrity
  const cleanData = {
    ...rest,
    name_en: String(rest.name_en ?? ''),
    name_ta: String(rest.name_ta ?? ''),
    image_url: String(rest.image_url ?? ''),
    price: parseFloat(rest.price) || 0,
    stock: parseInt(rest.stock) || 0,
    category: parseInt(rest.category) || 5,
    priority: parseInt(rest.priority) || 0,
    updatedAt: serverTimestamp()
  };

  try {
    const productRef = doc(db, "products", id);
    await setDoc(productRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Firestore updateProduct error:", error);
    throw error;
  }
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


