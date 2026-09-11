<template>
  <div class="login-page">
    <div v-if="!isLoading">
      <div class="logo-container">
        <img :src="seuLogo" alt="Southeast University Logo" class="logo" />
      </div>
      
      <h2>Southeast University</h2>
      <p class="subtitle">Visitors & Receptionists Portal</p>

      <div class="form">
        <input
          v-model="username"
          placeholder="Username"
          ref="usernameInput"
          @keydown.enter="focusPassword"
        />

        <input
          v-model="password"
          type="password"
          placeholder="Password"
          ref="passwordInput"
          @keydown.enter="login"
        />

        <button @click="login">
          Sign In
        </button>

        <p v-if="error" class="error">
          {{ error }}
        </p>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="logo-container">
        <img :src="seuLogo" alt="Southeast University Logo" class="logo animate-pulse" />
      </div>
      
      <div class="spinner"></div>
      
      <h3>Authenticating...</h3>
      <p>Please wait while we verify your credentials.</p>
    </div>
  </div>
</template>

<script>
// Handles user authentication and role-based redirection
import { api, setUser } from "../api";
import seuLogo from "../assets/seu-logo.png";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: "",
      isLoading: false,
      seuLogo
    };
  },
  methods: {
    // Moves focus to the password input field
    focusPassword() {
      this.$refs.passwordInput.focus();
    },
    // Authenticates the user and redirects based on role
    async login() {
      this.error = "";
      this.isLoading = true;

      try {
        const res = await api.post("/login", {
          username: this.username,
          password: this.password
        });
        setUser(res.data.user);

        setTimeout(() => {
          if (res.data.user.role === "visitor") {
            this.$router.push("/rooms");
          } else {
            this.$router.push("/reception");
          }
        }, 2000);

      } catch (err) {
        this.isLoading = false;
        this.error = err.response?.data?.message || "Login failed";
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  max-width: 420px;
  margin: 80px auto;
  padding: 36px 28px;
  background-color: #ffffff;
  border-radius: 10px;
  border-top: 6px solid #eebf3b;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-container {
  margin-bottom: 12px;
}

.logo {
  width: 100px;
  margin: 0 auto;
  display: block;
}

.login-page h2 {
  margin: 8px 0 4px;
  color: #2e5e4e;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 22px;
}

.form {
  margin-top: 18px;
}

.form input {
  width: 100%;
  margin: 10px 0;
  padding: 12px;
  font-size: 15px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.form input:focus {
  outline: none;
  border-color: #2e5e4e;
  box-shadow: 0 0 0 2px rgba(46, 94, 78, 0.2);
}

button {
  width: 100%;
  margin-top: 16px;
  padding: 13px;
  background-color: #2e5e4e;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background-color: #244c40;
}

.error {
  margin-top: 14px;
  color: red;
}

.loading-state {
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.loading-state h3 {
  color: #2e5e4e;
  margin-top: 20px;
  font-size: 1.1rem;
}

.loading-state p {
  color: #666;
  font-size: 0.9rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #eebf3b;
  border-right: 5px solid #2e5e4e;
  border-radius: 50%;
  margin: 20px auto;
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .8; transform: scale(0.95); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>