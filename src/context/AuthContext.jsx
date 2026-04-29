import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("Auth State Changed:", authUser ? "User Logged In" : "User Logged Out");
      setLoading(true);
      try {
        if (authUser) {
          // Hardcoded Role Logic for @admin and @staff
          if (authUser.email === 'admin@selva.com') {
            setRole('admin');
            console.log("Admin role assigned by email mapping.");
          } else if (authUser.email === 'staff@selva.com') {
            setRole('staff');
            console.log("Staff role assigned by email mapping.");
          } else {
            // Fallback to Firestore for any other users
            try {
              const userDoc = await getDoc(doc(db, "users", authUser.uid));
              if (userDoc.exists()) {
                setRole(userDoc.data().role);
              } else {
                setRole('staff');
              }
            } catch (docError) {
              setRole('staff');
            }
          }
          setUser(authUser);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Global Auth State Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const logout = () => signOut(auth);

  const value = {
    user,
    role,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
