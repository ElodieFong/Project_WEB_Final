// Axios instance and authentication helpers for API communication
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000"
});

export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

export function getRole() {
  const user = getUser();
  return user ? user.role : null;
}

export function logout() {
  localStorage.removeItem("user");
}