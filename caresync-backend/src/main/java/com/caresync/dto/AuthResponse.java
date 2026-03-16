package com.caresync.dto;

import com.caresync.entity.User;

public class AuthResponse {
    private String token;
    private User.Role role;
    private String message;
    private Boolean isApproved;

    // Constructors
    public AuthResponse() {}

    public AuthResponse(String token, User.Role role) {
        this.token = token;
        this.role = role;
        this.message = "Authentication successful";
        this.isApproved = true;
    }

    public AuthResponse(String token, User.Role role, String message) {
        this.token = token;
        this.role = role;
        this.message = message;
        this.isApproved = true;
    }

    public AuthResponse(String token, User.Role role, String message, Boolean isApproved) {
        this.token = token;
        this.role = role;
        this.message = message;
        this.isApproved = isApproved;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getIsApproved() { return isApproved; }
    public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }
}