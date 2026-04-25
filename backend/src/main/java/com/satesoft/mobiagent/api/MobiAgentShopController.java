package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.MobiAgentShop;
import com.satesoft.mobiagent.domain.MobiAgentShopRepository;
import com.satesoft.mobiagent.domain.ShopWorkerAssignment;
import com.satesoft.mobiagent.domain.ShopWorkerAssignmentRepository;
import com.satesoft.mobiagent.user.Role;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/shops")
public class MobiAgentShopController {
    private final MobiAgentShopRepository shops;
    private final ShopWorkerAssignmentRepository assignments;
    private final UserRepository users;

    public MobiAgentShopController(MobiAgentShopRepository shops, ShopWorkerAssignmentRepository assignments, UserRepository users) {
        this.shops = shops; this.assignments = assignments; this.users = users;
    }

    @GetMapping
    public List<ShopDto> list(Authentication auth) {
        User user = currentUser(auth);
        if (user.getRole() == Role.ADMIN) return shops.findAll().stream().map(this::dto).toList();
        var assignedShopIds = assignments.findByUserId(user.getId()).stream().map(ShopWorkerAssignment::getShopId).toList();
        return shops.findAll().stream()
                .filter(shop -> user.getId().equals(shop.getOwnerUserId()) || assignedShopIds.contains(shop.getId()))
                .map(this::dto).toList();
    }

    @PostMapping
    public ShopDto create(@RequestBody ShopRequest request, Authentication auth) {
        admin(auth);
        MobiAgentShop item = new MobiAgentShop();
        apply(request, item);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        return dto(shops.save(item));
    }

    @PutMapping("/{id}")
    public ShopDto update(@PathVariable Long id, @RequestBody ShopRequest request, Authentication auth) {
        admin(auth);
        MobiAgentShop item = shops.findById(id).orElseThrow();
        apply(request, item);
        item.setUpdatedAt(Instant.now());
        return dto(shops.save(item));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication auth) {
        admin(auth);
        shops.delete(shops.findById(id).orElseThrow());
    }

    @GetMapping("/{id}/workers")
    public List<WorkerDto> workers(@PathVariable Long id, Authentication auth) {
        ShopDto shop = list(auth).stream().filter(item -> item.id().equals(id)).findFirst().orElseThrow();
        return assignments.findByShopIdOrderByCreatedAtAsc(shop.id()).stream().map(this::workerDto).toList();
    }

    @PostMapping("/{id}/workers")
    public WorkerDto assignWorker(@PathVariable Long id, @RequestBody WorkerRequest request, Authentication auth) {
        admin(auth);
        shops.findById(id).orElseThrow();
        ShopWorkerAssignment item = new ShopWorkerAssignment();
        item.setShopId(id);
        item.setUserId(request.userId());
        item.setJobTitle(request.jobTitle());
        item.setPhone(request.phone());
        item.setCreatedAt(Instant.now());
        return workerDto(assignments.save(item));
    }

    @DeleteMapping("/{id}/workers/{assignmentId}")
    public void removeWorker(@PathVariable Long id, @PathVariable Long assignmentId, Authentication auth) {
        admin(auth);
        ShopWorkerAssignment item = assignments.findById(assignmentId).orElseThrow();
        if (!item.getShopId().equals(id)) throw new IllegalArgumentException("Not found");
        assignments.delete(item);
    }

    private void apply(ShopRequest request, MobiAgentShop item) {
        item.setBusinessName(request.businessName());
        item.setLocation(request.location());
        item.setCountry(request.country());
        item.setOwnerUserId(request.ownerUserId());
        item.setAgentId(request.agentId());
        item.setRemarks(request.remarks());
    }
    private ShopDto dto(MobiAgentShop item) {
        String ownerName = users.findById(item.getOwnerUserId()).map(User::getName).orElse("Unassigned");
        long workerCount = assignments.findByShopIdOrderByCreatedAtAsc(item.getId()).size();
        return new ShopDto(item.getId(), item.getBusinessName(), item.getLocation(), item.getCountry(), item.getOwnerUserId(), ownerName, item.getAgentId(), item.getRemarks(), item.getCreatedAt(), item.getUpdatedAt(), workerCount);
    }
    private WorkerDto workerDto(ShopWorkerAssignment item) {
        User user = users.findById(item.getUserId()).orElseThrow();
        return new WorkerDto(item.getId(), item.getShopId(), item.getUserId(), user.getName(), item.getJobTitle(), item.getPhone(), item.getCreatedAt());
    }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
    private void admin(Authentication auth) { if (currentUser(auth).getRole() != Role.ADMIN) throw new IllegalArgumentException("Forbidden"); }

    public record ShopRequest(String businessName, String location, String country, Long ownerUserId, String agentId, String remarks) {}
    public record ShopDto(Long id, String businessName, String location, String country, Long ownerUserId, String ownerName, String agentId, String remarks, Instant createdAt, Instant updatedAt, long workerCount) {}
    public record WorkerRequest(Long userId, String jobTitle, String phone) {}
    public record WorkerDto(Long id, Long shopId, Long userId, String userName, String jobTitle, String phone, Instant createdAt) {}
}
