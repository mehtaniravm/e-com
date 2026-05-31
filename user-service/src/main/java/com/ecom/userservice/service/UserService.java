package com.ecom.userservice.service;

import com.ecom.userservice.dto.*;
import com.ecom.userservice.entity.Role;
import com.ecom.userservice.entity.User;
import com.ecom.userservice.exception.EmailAlreadyExistsException;
import com.ecom.userservice.exception.UserNotFoundException;
import com.ecom.userservice.repository.UserRepository;
import com.ecom.userservice.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.firstName(),
                request.lastName(),
                Role.USER
        );
        return UserDTO.from(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findByEmail(request.email()).orElseThrow();
        return new LoginResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(UUID id) {
        return UserDTO.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::from)
                .toList();
    }

    public UserDTO updateUser(UUID id, UserUpdateRequest request) {
        User user = findOrThrow(id);
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEnabled(request.enabled());
        if (request.role() != null) {
            user.setRole(request.role());
        }
        return UserDTO.from(userRepository.save(user));
    }

    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    private User findOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }
}
