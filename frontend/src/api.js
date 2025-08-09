import axios from "axios";

const hostname = window.location.hostname;

const API = axios.create({
  baseURL: hostname === "localhost" ? "http://localhost:5000" : import.meta.env.VITE_API_URL,
  withCredentials: true, // send cookies
});


export default API;
