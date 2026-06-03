package com.mindrift.user.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "clerk_id", nullable = false, unique = true)
    private String clerkId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String username;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(nullable = false)
    @Convert(converter = UserRoleConverter.class)
    private UserRole role = UserRole.ROLE_PLAYER;

    @Column(nullable = false)
    @Convert(converter = UserStatusConverter.class)
    private UserStatus status = UserStatus.ACTIVE;
}
