package com.settleup.domain.settlement;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Converter(autoApply = false)
public class SettlementResultDataConverter implements AttributeConverter<SettlementResultData, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    public String convertToDatabaseColumn(SettlementResultData attribute) {
        if (attribute == null) return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error converting SettlementResultData to JSON", e);
            throw new RuntimeException("JSON 변환 실패", e);
        }
    }

    @Override
    public SettlementResultData convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return null;
        try {
            return objectMapper.readValue(dbData, SettlementResultData.class);
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to SettlementResultData", e);
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }
}
