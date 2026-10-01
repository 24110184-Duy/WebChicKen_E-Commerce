package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.modules.identity.dao.AddressDAO;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.service.CustomerService;
import java.util.Objects;

public class CustomerServiceImpl implements CustomerService {

    private final CustomerDAO customerDAO;
    private final UserDAO userDAO;
    private final AddressDAO addressDAO;

    public CustomerServiceImpl(CustomerDAO customerDAO, UserDAO userDAO, AddressDAO addressDAO) {
        this.customerDAO = Objects.requireNonNull(customerDAO, "customerDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.addressDAO = Objects.requireNonNull(addressDAO, "addressDAO must not be null");
    }

    // TODO: implement methods
}
