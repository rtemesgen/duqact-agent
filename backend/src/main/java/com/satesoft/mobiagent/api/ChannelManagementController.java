package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/channels")
public class ChannelManagementController {
    private final ChannelTypeRepository channelTypes;
    private final ServiceChannelRepository serviceChannels;
    private final UserRepository users;

    public ChannelManagementController(ChannelTypeRepository channelTypes, ServiceChannelRepository serviceChannels, UserRepository users) {
        this.channelTypes = channelTypes;
        this.serviceChannels = serviceChannels;
        this.users = users;
    }

    @GetMapping("/types")
    public List<ChannelTypeDto> types(Authentication auth) {
        return channelTypes.findByUserIdOrderByCreatedAtAsc(currentUser(auth).getId()).stream().map(ChannelTypeDto::from).toList();
    }

    @PostMapping("/types")
    public ChannelTypeDto createType(@RequestBody ChannelTypeRequest input, Authentication auth) {
        ChannelType item = new ChannelType();
        copyType(input, item);
        item.setUserId(currentUser(auth).getId());
        item.setCreatedAt(Instant.now());
        return ChannelTypeDto.from(channelTypes.save(item));
    }

    @PutMapping("/types/{id}")
    public ChannelTypeDto updateType(@PathVariable Long id, @RequestBody ChannelTypeRequest input, Authentication auth) {
        ChannelType item = ownedType(id, auth);
        copyType(input, item);
        return ChannelTypeDto.from(channelTypes.save(item));
    }

    @DeleteMapping("/types/{id}")
    public void deleteType(@PathVariable Long id, Authentication auth) {
        channelTypes.delete(ownedType(id, auth));
    }

    @GetMapping("/service-channels")
    public List<ServiceChannelDto> services(Authentication auth) {
        List<ChannelType> types = channelTypes.findByUserIdOrderByCreatedAtAsc(currentUser(auth).getId());
        return serviceChannels.findByUserIdOrderByCreatedAtAsc(currentUser(auth).getId()).stream()
                .map(channel -> ServiceChannelDto.from(channel, types.stream().filter(type -> type.getId().equals(channel.getChannelTypeId())).findFirst().map(ChannelType::getName).orElse("Unknown")))
                .toList();
    }

    @PostMapping("/service-channels")
    public ServiceChannelDto createService(@RequestBody ServiceChannelRequest input, Authentication auth) {
        User user = currentUser(auth);
        ServiceChannel item = new ServiceChannel();
        copyService(input, item);
        item.setUserId(user.getId());
        item.setCreatedByName(user.getRole() == com.satesoft.mobiagent.user.Role.ADMIN ? "Admin" : user.getName());
        item.setCreatedAt(Instant.now());
        return toServiceDto(serviceChannels.save(item));
    }

    @PutMapping("/service-channels/{id}")
    public ServiceChannelDto updateService(@PathVariable Long id, @RequestBody ServiceChannelRequest input, Authentication auth) {
        ServiceChannel item = ownedService(id, auth);
        copyService(input, item);
        return toServiceDto(serviceChannels.save(item));
    }

    @DeleteMapping("/service-channels/{id}")
    public void deleteService(@PathVariable Long id, Authentication auth) {
        serviceChannels.delete(ownedService(id, auth));
    }

    private void copyType(ChannelTypeRequest input, ChannelType target) {
        target.setName(input.name());
        target.setDescription(input.description());
        target.setActive(input.active() == null ? Boolean.TRUE : input.active());
    }

    private void copyService(ServiceChannelRequest input, ServiceChannel target) {
        target.setChannelTypeId(input.channelTypeId());
        target.setChannelName(input.channelName());
        target.setCountry(input.country());
        target.setActive(input.active() == null ? Boolean.TRUE : input.active());
    }

    private ChannelType ownedType(Long id, Authentication auth) {
        ChannelType item = channelTypes.findById(id).orElseThrow();
        if (!item.getUserId().equals(currentUser(auth).getId())) throw new IllegalArgumentException("Not found");
        return item;
    }

    private ServiceChannel ownedService(Long id, Authentication auth) {
        ServiceChannel item = serviceChannels.findById(id).orElseThrow();
        if (!item.getUserId().equals(currentUser(auth).getId())) throw new IllegalArgumentException("Not found");
        return item;
    }

    private User currentUser(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow();
    }

    private ServiceChannelDto toServiceDto(ServiceChannel item) {
        String typeName = channelTypes.findById(item.getChannelTypeId()).map(ChannelType::getName).orElse("Unknown");
        return ServiceChannelDto.from(item, typeName);
    }

    public record ChannelTypeRequest(String name, String description, Boolean active) {}
    public record ChannelTypeDto(Long id, Long userId, String name, String description, Boolean active, Instant createdAt) {
        static ChannelTypeDto from(ChannelType item) {
            return new ChannelTypeDto(item.getId(), item.getUserId(), item.getName(), item.getDescription(), item.getActive(), item.getCreatedAt());
        }
    }

    public record ServiceChannelRequest(Long channelTypeId, String channelName, String country, Boolean active) {}

    public record ServiceChannelDto(Long id, Long channelTypeId, String channelTypeName, String channelName, String country, Boolean active, Instant createdAt, String createdByName) {
        static ServiceChannelDto from(ServiceChannel item, String typeName) {
            return new ServiceChannelDto(item.getId(), item.getChannelTypeId(), typeName, item.getChannelName(), item.getCountry(), item.getActive(), item.getCreatedAt(), item.getCreatedByName());
        }
    }
}
