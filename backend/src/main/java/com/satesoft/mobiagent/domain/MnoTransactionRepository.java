package com.satesoft.mobiagent.domain;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MnoTransactionRepository extends JpaRepository<MnoTransaction, Long> { List<MnoTransaction> findByUserIdOrderByDateDesc(Long userId); }
