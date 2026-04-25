package com.satesoft.mobiagent.mno;

import com.satesoft.mobiagent.domain.MnoTransaction;
import org.springframework.stereotype.Component;

public interface MnoProviderAdapter {
    ProviderResult recordTransaction(MnoTransaction transaction);
    record ProviderResult(boolean successful, String message) {}
}

@Component
class StubMnoProviderAdapter implements MnoProviderAdapter {
    public ProviderResult recordTransaction(MnoTransaction transaction) {
        // This is where a real MTN/Airtel/etc. API integration would be called later.
        // For this assignment, it returns success so manual transaction recording works end to end.
        return new ProviderResult(true, "Stub MNO provider accepted the transaction");
    }
}