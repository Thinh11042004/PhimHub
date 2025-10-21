import { useEffect } from 'react';

export default function TokenSetter() {
  useEffect(() => {
    // Set JWT token vào localStorage nếu chưa có
    const existingToken = localStorage.getItem('phimhub:token');
    const existingUser = localStorage.getItem('phimhub:user');
    
    if (!existingToken) {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiQW5oSGFpIiwiZW1haWwiOiJBMUBnbWFpbC5jb20iLCJpYXQiOjE3NjAxMDE4NDcsImV4cCI6MTc2MDcwNjY0N30.bK1HyPBWzSChuDYsTAWl09vvnimoFjA7KwXZNDpkt8Y';
      localStorage.setItem('phimhub:token', token);
      console.log('🔑 Token đã được set tự động');
    } else {
      console.log('🔑 Token đã tồn tại');
    }

    // Set user data nếu chưa có
    if (!existingUser) {
      const userData = {
        id: 1,
        username: "AnhHai",
        email: "A1@gmail.com",
        role: "user",
        avatar: "",
        fullname: "Anh Hai",
        phone: "0123456789"
      };
      localStorage.setItem('phimhub:user', JSON.stringify(userData));
      console.log('👤 User data đã được set tự động');
    } else {
      console.log('👤 User data đã tồn tại');
    }
  }, []);

  return null; // Component không render gì
}
