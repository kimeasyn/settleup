package com.settleup.service.ai;

import com.settleup.dto.AiCategoryDto;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class AiClassifierClient {

    @Value("${ai.classifier.url:http://category-classifier:8000}")
    private String classifierUrl;

    @Value("${ai.classifier.enabled:true}")
    private boolean enabled;

    private RestTemplate restTemplate;

    @PostConstruct
    public void init() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.restTemplate = new RestTemplate(factory);
    }

    public AiCategoryDto.ClassifierResponse predictCategory(String description) {
        if (!enabled) {
            return null;
        }
        try {
            var request = Map.of("description", description);
            var response = restTemplate.postForObject(
                    classifierUrl + "/predict", request,
                    AiCategoryDto.ClassifierResponse.class);
            return response;
        } catch (Exception e) {
            log.warn("AI 분류 서비스 호출 실패: {}", e.getMessage());
            return null;
        }
    }
}
