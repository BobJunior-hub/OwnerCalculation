import { useEffect,useState } from "react";


export const useUsers = () =>
  {
    const [currentUser, setCurrentUser] = useState(null);
    const getCurrentUser = () => {
  try {
    const userStr =  sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error loading user data:', e);
  }
  return null;
};

useEffect(() => {
  const user = getCurrentUser();
  setCurrentUser(user);
}, []);

const isOwnerDepartment = currentUser?.department?.toLowerCase() === 'owner';
const ownerUsername = currentUser?.username || null;

return { currentUser, isOwnerDepartment, ownerUsername };
};
