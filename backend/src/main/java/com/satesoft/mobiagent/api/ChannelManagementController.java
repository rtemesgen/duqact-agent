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
    public List<ChannelType> types(Authentication auth) {
        return channelTypes.findByUserIdOrderByCreatedAtAsc(currentUser(auth).getId());
    }

    @PostMapping("/types")
    public ChannelType createType(@RequestBody ChannelType input, Authentication auth) {
        ChannelType item = new ChannelType();
        copyType(input, item);
        item.setUserId(currentUser(auth).getId());
        item.setCreatedAt(Instant.now());
        return channelTypes.save(item);
    }

    @PutMapping("/types/{id}")
    public ChannelType updateType(@PathVariable Long id, @RequestBody ChannelType input, Authentication auth) {
        ChannelType item = ownedType(id, auth);
        copyType(input, item);
        return channelTypes.save(item);
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
    public ServiceChannel createService(@RequestBody ServiceChannel input, Authentication auth) {
        User user = currentUser(auth);
        ServiceChannel item = new ServiceChannel();
        copyService(input, item);
        item.setUserId(user.getId());
        item.setCreatedByName(user.getRole() == com.satesoft.mobiagent.user.Role.ADMIN ? "Admin" : user.getName());
        item.setCreatedAt(Instant.now());
        return serviceChannels.save(item);
    }

    @PutMapping("/service-channels/{id}")
    public ServiceChannel updateService(@PathVariable Long id, @RequestBody ServiceChannel input, Authentication auth) {
        ServiceChannel item = ownedService(id, auth);
        copyService(input, item);
        return serviceChannels.save(item);
    }

    @DeleteMapping("/service-channels/{id}")
    public void deleteService(@PathVariable Long id, Authentication auth) {
        serviceChannels.delete(ownedService(id, auth));
    }

    private void copyType(ChannelType input, ChannelType target) {
        target.setName(input.getName());
        target.setDescription(input.getDescription());
        target.setActive(input.getActive() == null ? Boolean.TRUE : input.getActive());
    }

    private void copyService(ServiceChannel input, ServiceChannel target) {
        target.setChannelTypeId(input.getChannelTypeId());
        target.setChannelName(input.getChannelName());
        target.setCountry(input.getCountry());
        target.setActive(input.getActive() == null ? Boolean.TRUE : input.getActive());
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

    public record ServiceChannelDto(Long id, Long channelTypeId, String channelTypeName, String channelName, String country, Boolean active, Instant createdAt, String createdByName) {
        static ServiceChannelDto from(ServiceChannel item, String typeName) {
            return new ServiceChannelDto(item.getId(), item.getChannelTypeId(), typeName, item.getChannelName(), item.getCountry(), item.getActive(), item.getCreatedAt(), item.getCreatedByName());
        }
    }
}
