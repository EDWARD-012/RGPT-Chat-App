import { useEffect } from 'react'; // <-- Import useEffect
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function LoginPage() {

  // This hook checks if the user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // If a token exists, redirect to the chat page
      window.location.href = '/chat';
    }
  }, []); // The empty array means this runs only once when the page loads

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      // Send the token to your Django backend
      const response = await axios.post('http://127.0.0.1:8000/api/auth/google/', {
        token: credentialResponse.credential
      });
      
      const backendToken = response.data.token;
      
      // 1. Save the token in the browser's local storage
      localStorage.setItem('authToken', backendToken);
      
      // 2. Redirect the user to the chat page
      window.location.href = '/chat';

    } catch (error) {
      console.error("Login failed with backend:", error);
    }
  };

  const handleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-700 to-blue-600 text-white">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to RGPT 💬
      </h1>
      <p className="text-lg text-blue-200 mb-8">
        Your personalized AI chat companion.
      </p>
      
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </div>
  );
}