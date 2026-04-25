package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.user.Role;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    public UserController(UserRepository users) { this.users = users; }
    @GetMapping public List<UserDto> all() { return users.findAll().stream().map(UserDto::from).toList(); }
    @PatchMapping("/{id}/role") public UserDto role(@PathVariable Long id, @RequestBody RoleRequest request) {
        User user = users.findById(id).orElseThrow(); user.setRole(request.role()); return UserDto.from(users.save(user));
    }
    public record RoleRequest(Role role) {}
    public record UserDto(Long id, String name, String email, Role role) { static UserDto from(User u) { return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole()); } }
}
