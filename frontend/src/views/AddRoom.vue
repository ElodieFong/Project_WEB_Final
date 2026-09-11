<template>
  <div class="page-container">
    <div class="card">
      
      <div class="actions-header">
        <button class="back-btn" @click="goBack">
          Return
        </button>
      </div>

      <div class="logo-container">
        <img :src="seuLogo" alt="Southeast University Logo" class="logo" />
      </div>

      <h2>Add a new room</h2>

      <div class="form-content">
        <div class="input-group">
          <label>Room Number</label>
          <input
            v-model.number="roomNumber"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 101"
          />
        </div>

        <div class="input-group">
          <label>Price per night (¥)</label>
          <input
            v-model.number="price"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 350"
          />
        </div>

        <button class="confirm-btn" @click="addRoom">
          Add Room
        </button>

        <p v-if="message" :class="['message', { error: isError }]">
          {{ message }}
        </p>
      </div>

    </div>
  </div>
</template>

<script>
import { api } from "../api";
import seuLogo from "../assets/seu-logo.png";

export default {
  data() {
    return {
      roomNumber: "",
      price: "",
      message: "",
      isError: false,
      seuLogo
    };
  },

  methods: {
    async addRoom() {
      this.message = "";
      this.isError = false;

      if (!Number.isInteger(this.roomNumber) || this.roomNumber <= 0) {
        this.message = "Room number must be a positive integer";
        this.isError = true;
        return;
      }

      if (!Number.isInteger(this.price) || this.price <= 0) {
        this.message = "Price must be greater than 0";
        this.isError = true;
        return;
      }

      try {
        await api.post("/rooms", {
          room_number: this.roomNumber,
          price: this.price
        });

        this.message = "Room added successfully";
        this.isError = false;
        this.roomNumber = "";
        this.price = "";

      } catch (err) {
        this.isError = true; 
        this.message = err.response?.data?.message || "Failed to add room";
      }
    },

    goBack() {
      this.$router.push("/reception");
    }
  }
};
</script>

<style scoped>

.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f6f4f9;
  padding: 20px;
  font-family: "Segoe UI", Helvetica, Arial, sans-serif;
}

.card {
  width: 100%;
  max-width: 420px; 
  background-color: #ffffff;
  padding: 30px 25px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border-top: 6px solid #eebf3b; 
}

.actions-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.back-btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background-color: #f2f4f3;
  color: #2e5e4e;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #e6e8e7;
}

.logo-container {
  text-align: center;
  margin-bottom: 15px;
}

.logo {
  width: 90px;
  height: auto;
  display: block;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin: 0 0 25px 0;
  color: #2e5e4e;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 1.4rem;
}

.form-content {
  margin-top: 10px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2e5e4e;
  margin-bottom: 6px;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.3s;
}

input:focus {
  outline: none;
  border-color: #2e5e4e;
  box-shadow: 0 0 0 3px rgba(238, 191, 59, 0.2);
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  margin-top: 15px;
  background-color: #2e5e4e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.confirm-btn:hover {
  background-color: #eebf3b;
  color: #2e5e4e;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(238, 191, 59, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

/* MESSAGES */
.message {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.message.error {
  background-color: #ffebee;
  color: red;
  border: 1px solid #ffcdd2;
}
</style>