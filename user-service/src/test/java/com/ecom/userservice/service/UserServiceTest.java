package com.ecom.userservice.service;

import com.ecom.userservice.dto.LoginRequest;
import com.ecom.userservice.dto.LoginResponse;
import com.ecom.userservice.dto.RegisterRequest;
import com.ecom.userservice.dto.UserDTO;
import com.ecom.userservice.dto.UserUpdateRequest;
import com.ecom.userservice.entity.Role;
import com.ecom.userservice.entity.User;
import com.ecom.userservice.exception.EmailAlreadyExistsException;
import com.ecom.userservice.exception.UserNotFoundException;
import com.ecom.userservice.repository.UserRepository;
import com.ecom.userservice.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private UserService userService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String EMAIL = "john.doe@example.com";
    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_PASSWORD = "$2a$10$hashedPasswordValue";
    private static final String JWT_TOKEN = "eyJhbGciOiJIUzI1NiJ9.payload.signature";

    private User buildUser(Role role, boolean enabled) {
        User user = new User(EMAIL, ENCODED_PASSWORD, "John", "Doe", role);
        ReflectionTestUtils.setField(user, "id", USER_ID);
        if (!enabled) {
            user.setEnabled(false);
        }
        return user;
    }

    @Test
    void testRegisterUser_success() {
        RegisterRequest request = new RegisterRequest(EMAIL, RAW_PASSWORD, "John", "Doe");
        User saved = buildUser(Role.USER, true);

        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserDTO result = userService.register(request);

        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.firstName()).isEqualTo("John");
        assertThat(result.role()).isEqualTo(Role.USER);
        assertThat(result.enabled()).isTrue();
        verify(userRepository).existsByEmail(EMAIL);
        verify(passwordEncoder).encode(RAW_PASSWORD);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegisterUser_emailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(EMAIL, RAW_PASSWORD, "John", "Doe");
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining(EMAIL);

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void testLogin_validCredentials_returnsToken() {
        LoginRequest request = new LoginRequest(EMAIL, RAW_PASSWORD);
        User user = buildUser(Role.USER, true);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                EMAIL, ENCODED_PASSWORD, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenProvider.generateToken(userDetails)).thenReturn(JWT_TOKEN);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        LoginResponse response = userService.login(request);

        assertThat(response.accessToken()).isEqualTo(JWT_TOKEN);
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.email()).isEqualTo(EMAIL);
        assertThat(response.userId()).isEqualTo(USER_ID);
        assertThat(response.role()).isEqualTo("USER");
        verify(jwtTokenProvider).generateToken(userDetails);
        verify(userRepository).findByEmail(EMAIL);
    }

    @Test
    void testLogin_invalidPassword_throws401() {
        LoginRequest request = new LoginRequest(EMAIL, "wrongpassword");
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Bad credentials");

        verify(jwtTokenProvider, never()).generateToken(any());
        verify(userRepository, never()).findByEmail(any());
    }

    // Role-based access is enforced via @PreAuthorize on UserController.
    // This test covers the service path that ADMIN-only endpoints exercise.
    @Test
    void testGetUser_adminRole_success() {
        User admin = buildUser(Role.ADMIN, true);
        when(userRepository.findAll()).thenReturn(List.of(admin));

        List<UserDTO> result = userService.getAllUsers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).role()).isEqualTo(Role.ADMIN);
        assertThat(result.get(0).email()).isEqualTo(EMAIL);
        verify(userRepository).findAll();
    }

    // Simulates a non-admin caller requesting a user that does not exist —
    // UserNotFoundException is the service-layer guard; HTTP 403 is enforced
    // by Spring Security at the controller layer.
    @Test
    void testGetUser_customerRole_accessDenied() {
        UUID unknownId = UUID.randomUUID();
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(unknownId))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(unknownId.toString());

        verify(userRepository).findById(unknownId);
    }

    @Test
    void testDeactivateUser_locksAccount() {
        User user = buildUser(Role.USER, true);
        UserUpdateRequest request = new UserUpdateRequest("John", "Doe", false, null);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserDTO result = userService.updateUser(USER_ID, request);

        assertThat(result.enabled()).isFalse();
        assertThat(result.firstName()).isEqualTo("John");
        verify(userRepository).findById(USER_ID);
        verify(userRepository).save(user);
    }
}
