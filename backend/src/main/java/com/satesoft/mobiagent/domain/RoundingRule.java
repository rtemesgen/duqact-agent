package com.satesoft.mobiagent.domain;

import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

@Embeddable
public class RoundingRule {
    private BigDecimal considerFigures;
    private BigDecimal roundTo;

    public BigDecimal getConsiderFigures() { return considerFigures; }
    public void setConsiderFigures(BigDecimal considerFigures) { this.considerFigures = considerFigures; }
    public BigDecimal getRoundTo() { return roundTo; }
    public void setRoundTo(BigDecimal roundTo) { this.roundTo = roundTo; }
}
