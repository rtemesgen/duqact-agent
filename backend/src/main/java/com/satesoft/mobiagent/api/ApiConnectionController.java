package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.ApiConnection;
import com.satesoft.mobiagent.domain.ApiConnectionRepository;
import com.satesoft.mobiagent.user.Role;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/api-connections")
public class ApiConnectionController {
    private final ApiConnectionRepository connections;
    private final UserRepository users;
    public ApiConnectionController(ApiConnectionRepository connections, UserRepository users) { this.connections = connections; this.users = users; }

    @GetMapping
    public List<ApiConnection> list(Authentication auth) {
        User user = currentUser(auth);
        return user.getRole() == Role.ADMIN ? connections.findAll() : connections.findByUserIdOrderByCreatedAtAsc(user.getId());
    }

    @PostMapping
    public ApiConnection create(@RequestBody ApiConnection input, Authentication auth) {
        User user = admin(auth);
        input.setUserId(user.getId());
        input.setCreatedAt(Instant.now());
        input.setUpdatedAt(Instant.now());
        return connections.save(input);
    }

    @PutMapping("/{id}")
    public ApiConnection update(@PathVariable Long id, @RequestBody ApiConnection input, Authentication auth) {
        admin(auth);
        ApiConnection item = connections.findById(id).orElseThrow();
        item.setName(input.getName());
        item.setEndpoint(input.getEndpoint());
        item.setStatus(input.getStatus());
        item.setDescription(input.getDescription());
        item.setUpdatedAt(Instant.now());
        return connections.save(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication auth) {
        admin(auth);
        connections.delete(connections.findById(id).orElseThrow());
    }

    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
    private User admin(Authentication auth) { User user = currentUser(auth); if (user.getRole() != Role.ADMIN) throw new IllegalArgumentException("Forbidden"); return user; }
}
