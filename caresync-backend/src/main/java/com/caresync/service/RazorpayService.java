package com.caresync.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RazorpayService {
    
    @Value("${razorpay.key-id}")
    private String keyId;
    
    @Value("${razorpay.key-secret}")
    private String keySecret;
    
    /**
     * Create a Razorpay order
     */
    public Order createOrder(BigDecimal amount, String currency, String receipt) throws RazorpayException {
        RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // Amount in paise
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        
        return razorpayClient.orders.create(orderRequest);
    }
    
    /**
     * Verify payment signature
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String generatedSignature = org.apache.commons.codec.digest.HmacUtils
                    .hmacSha256Hex(keySecret, orderId + "|" + paymentId);
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
    
    public String getKeyId() {
        return keyId;
    }
}
