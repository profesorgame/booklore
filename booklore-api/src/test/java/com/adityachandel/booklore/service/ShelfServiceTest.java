package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.service.AuthenticationService;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.ShelfMapper;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.model.enums.IconType;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ShelfServiceTest {

    @Mock private ShelfRepository shelfRepository;
    @Mock private BookRepository bookRepository;
    @Mock private ShelfMapper shelfMapper;
    @Mock private BookMapper bookMapper;
    @Mock private AuthenticationService authenticationService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ShelfService shelfService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        shelfService = new ShelfService(
                shelfRepository,
                bookRepository,
                shelfMapper,
                bookMapper,
                authenticationService,
                userRepository
        );
    }

    @Test
    void createShelf_shouldPersistAutoEmailSettings() {
        BookLoreUser user = new BookLoreUser();
        user.setId(1L);
        BookLoreUser.UserPermissions permissions = new BookLoreUser.UserPermissions();
        permissions.setCanEmailBook(true);
        user.setPermissions(permissions);
        when(authenticationService.getAuthenticatedUser()).thenReturn(user);
        when(shelfRepository.existsByUserIdAndName(1L, "Favorites")).thenReturn(false);

        BookLoreUserEntity userEntity = new BookLoreUserEntity();
        userEntity.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(userEntity));

        ShelfCreateRequest request = ShelfCreateRequest.builder()
                .name("Favorites")
                .icon("bookmark")
                .iconType(IconType.PRIME_NG)
                .autoEmailEnabled(true)
                .autoEmailProviderId(5L)
                .autoEmailRecipientId(9L)
                .build();

        ShelfEntity savedEntity = new ShelfEntity();
        savedEntity.setId(11L);
        when(shelfRepository.save(any(ShelfEntity.class))).thenReturn(savedEntity);

        shelfService.createShelf(request);

        ArgumentCaptor<ShelfEntity> shelfCaptor = ArgumentCaptor.forClass(ShelfEntity.class);
        verify(shelfRepository).save(shelfCaptor.capture());
        ShelfEntity entity = shelfCaptor.getValue();
        assertEquals(true, entity.isAutoEmailEnabled());
        assertEquals(5L, entity.getAutoEmailProviderId());
        assertEquals(9L, entity.getAutoEmailRecipientId());
    }
}
