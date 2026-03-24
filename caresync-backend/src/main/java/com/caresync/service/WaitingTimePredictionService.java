package com.caresync.service;

import com.caresync.entity.Queue;
import com.caresync.entity.QueueToken;
import com.caresync.repository.QueueRepository;
import com.caresync.repository.QueueTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WaitingTimePredictionService {
    
    @Autowired
    private QueueTokenRepository tokenRepository;
    
    @Autowired
    private QueueRepository queueRepository;
    
    
    public PredictionResult predictWaitingTime(Long queueId, LocalDate tokenDate, Integer tokenNumber) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));

        DayOfWeek dayOfWeek = tokenDate.getDayOfWeek();

        // Count already completed tokens today — these are done, no wait needed for them
        long completedToday = tokenRepository.countByQueueAndTokenDateAndTokenStatus(
            queue, tokenDate, QueueToken.TokenStatus.COMPLETED);

        // Tokens actually ahead in queue right now
        int effectivePosition = Math.max(0, tokenNumber - (int) completedToday - 1);

        // Get historical data for this queue
        List<QueueToken> historicalTokens = getHistoricalTokens(queue, dayOfWeek);

        if (historicalTokens.isEmpty()) {
            return getBasicEstimation(queue, effectivePosition + 1);
        }

        // Calculate average time per token for this day of week
        double avgTimePerToken = calculateAverageTimePerToken(historicalTokens);

        // Calculate day-of-week factor
        double dayFactor = calculateDayOfWeekFactor(historicalTokens, dayOfWeek);

        // Calculate token position factor
        double positionFactor = calculatePositionFactor(historicalTokens, effectivePosition + 1);

        // Predict waiting time based on effective position (tokens still ahead)
        double predictedMinutes = avgTimePerToken * (effectivePosition + 1) * dayFactor * positionFactor;

        // Calculate confidence based on data availability
        double confidence = calculateConfidence(historicalTokens.size());

        // Get peak hours information
        Map<String, Object> peakInfo = analyzePeakHours(historicalTokens);

        return new PredictionResult(
            (int) Math.round(predictedMinutes),
            avgTimePerToken,
            confidence,
            dayOfWeek.toString(),
            peakInfo
        );
    }
    
    /**
     * Get historical tokens for analysis
     */
    private List<QueueToken> getHistoricalTokens(Queue queue, DayOfWeek dayOfWeek) {
        LocalDate endDate = LocalDate.now().minusDays(1);
        LocalDate startDate = endDate.minusDays(60); // Last 60 days
        
        List<QueueToken> allTokens = new ArrayList<>();
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (date.getDayOfWeek() == dayOfWeek) {
                List<QueueToken> dayTokens = tokenRepository.findByQueueAndTokenDateOrderByTokenNumberAsc(queue, date);
                allTokens.addAll(dayTokens.stream()
                    .filter(t -> t.getTokenStatus() == QueueToken.TokenStatus.COMPLETED)
                    .filter(t -> t.getCalledAt() != null && t.getCompletedAt() != null)
                    .collect(Collectors.toList()));
            }
        }
        
        return allTokens;
    }
    
    /**
     * Calculate average time per token
     */
    private double calculateAverageTimePerToken(List<QueueToken> tokens) {
        if (tokens.isEmpty()) return 15.0; // Default 15 minutes
        
        List<Double> timesPerToken = new ArrayList<>();
        
        // Group by date
        Map<LocalDate, List<QueueToken>> tokensByDate = tokens.stream()
            .collect(Collectors.groupingBy(QueueToken::getTokenDate));
        
        for (Map.Entry<LocalDate, List<QueueToken>> entry : tokensByDate.entrySet()) {
            List<QueueToken> dayTokens = entry.getValue();
            if (dayTokens.size() < 2) continue;
            
            // Sort by token number
            dayTokens.sort(Comparator.comparing(QueueToken::getTokenNumber));
            
            QueueToken firstToken = dayTokens.get(0);
            QueueToken lastToken = dayTokens.get(dayTokens.size() - 1);
            
            if (firstToken.getCalledAt() != null && lastToken.getCompletedAt() != null) {
                long totalMinutes = Duration.between(firstToken.getCalledAt(), lastToken.getCompletedAt()).toMinutes();
                int tokenCount = lastToken.getTokenNumber() - firstToken.getTokenNumber() + 1;
                
                if (tokenCount > 0) {
                    timesPerToken.add((double) totalMinutes / tokenCount);
                }
            }
        }
        
        if (timesPerToken.isEmpty()) return 15.0;
        
        // Return median to avoid outliers
        Collections.sort(timesPerToken);
        int middle = timesPerToken.size() / 2;
        return timesPerToken.get(middle);
    }
    
    /**
     * Calculate day of week factor (some days are busier)
     */
    private double calculateDayOfWeekFactor(List<QueueToken> tokens, DayOfWeek targetDay) {
        Map<DayOfWeek, List<QueueToken>> tokensByDay = tokens.stream()
            .collect(Collectors.groupingBy(t -> t.getTokenDate().getDayOfWeek()));
        
        if (!tokensByDay.containsKey(targetDay)) return 1.0;
        
        // Calculate average tokens per day
        double avgTokensPerDay = tokensByDay.values().stream()
            .mapToInt(List::size)
            .average()
            .orElse(1.0);
        
        double tokensOnTargetDay = tokensByDay.get(targetDay).size();
        
        // Return factor (1.0 = average, >1.0 = busier, <1.0 = less busy)
        return tokensOnTargetDay / avgTokensPerDay;
    }
    
    /**
     * Calculate position factor (early vs late tokens)
     */
    private double calculatePositionFactor(List<QueueToken> tokens, int targetTokenNumber) {
        // Early tokens (1-10) tend to be faster
        // Middle tokens (11-30) are average
        // Late tokens (31+) tend to be slower due to delays
        
        if (targetTokenNumber <= 10) {
            return 0.9; // 10% faster
        } else if (targetTokenNumber <= 30) {
            return 1.0; // Average
        } else {
            return 1.15; // 15% slower
        }
    }
    
    /**
     * Calculate confidence score
     */
    private double calculateConfidence(int dataPoints) {
        if (dataPoints >= 100) return 0.95;
        if (dataPoints >= 50) return 0.85;
        if (dataPoints >= 20) return 0.70;
        if (dataPoints >= 10) return 0.55;
        return 0.40;
    }
    
    /**
     * Analyze peak hours
     */
    private Map<String, Object> analyzePeakHours(List<QueueToken> tokens) {
        Map<Integer, Integer> tokensByHour = new HashMap<>();
        
        for (QueueToken token : tokens) {
            if (token.getCalledAt() != null) {
                int hour = token.getCalledAt().getHour();
                tokensByHour.put(hour, tokensByHour.getOrDefault(hour, 0) + 1);
            }
        }
        
        // Find peak hour
        int peakHour = tokensByHour.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(10);
        
        Map<String, Object> peakInfo = new HashMap<>();
        peakInfo.put("peakHour", peakHour);
        peakInfo.put("peakHourRange", peakHour + ":00 - " + (peakHour + 1) + ":00");
        peakInfo.put("isPeakTime", false); // Will be calculated based on current time
        
        return peakInfo;
    }
    
    /**
     * Basic estimation when no historical data available
     */
    private PredictionResult getBasicEstimation(Queue queue, int tokenNumber) {
        int estimatedTime = queue.getEstimatedTimePerPatient() != null ? 
                           queue.getEstimatedTimePerPatient() : 15;
        
        int totalMinutes = estimatedTime * tokenNumber;
        
        Map<String, Object> peakInfo = new HashMap<>();
        peakInfo.put("peakHour", 10);
        peakInfo.put("peakHourRange", "10:00 - 11:00");
        peakInfo.put("isPeakTime", false);
        
        return new PredictionResult(
            totalMinutes,
            (double) estimatedTime,
            0.30, // Low confidence
            LocalDate.now().getDayOfWeek().toString(),
            peakInfo
        );
    }
    
    /**
     * Prediction result DTO
     */
    public static class PredictionResult {
        private int predictedWaitingMinutes;
        private double averageTimePerToken;
        private double confidence;
        private String dayOfWeek;
        private Map<String, Object> peakHoursInfo;
        
        public PredictionResult(int predictedWaitingMinutes, double averageTimePerToken, 
                               double confidence, String dayOfWeek, Map<String, Object> peakHoursInfo) {
            this.predictedWaitingMinutes = predictedWaitingMinutes;
            this.averageTimePerToken = averageTimePerToken;
            this.confidence = confidence;
            this.dayOfWeek = dayOfWeek;
            this.peakHoursInfo = peakHoursInfo;
        }
        
        // Getters
        public int getPredictedWaitingMinutes() { return predictedWaitingMinutes; }
        public double getAverageTimePerToken() { return averageTimePerToken; }
        public double getConfidence() { return confidence; }
        public String getDayOfWeek() { return dayOfWeek; }
        public Map<String, Object> getPeakHoursInfo() { return peakHoursInfo; }
        
        public String getFormattedWaitingTime() {
            int hours = predictedWaitingMinutes / 60;
            int minutes = predictedWaitingMinutes % 60;
            
            if (hours > 0) {
                return hours + "h " + minutes + "m";
            }
            return minutes + " minutes";
        }
        
        public String getConfidenceLevel() {
            if (confidence >= 0.85) return "High";
            if (confidence >= 0.65) return "Medium";
            return "Low";
        }
    }
}
