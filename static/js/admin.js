//
document.addEventListener('DOMContentLoaded', function() {
    initMobileSidebar();
    initAlerts();
    initTooltips();
    initModalHandling();
    
    // Core Logic: specific initializers
    // We DO NOT call loadXData() here anymore. We rely on Jinja for the first paint.
    initRefreshButtons();
    initServerSideSearch(); 
    
    // Initialize Management Actions (Edit/Delete buttons)
    initUserManagement();
    initArtworkManagement();
    initOrderManagement();
    initSettingsForm();
});

// --- 1. NEW SERVER-SIDE SEARCH LOGIC ---
function initServerSideSearch() {
    const searchConfig = {
        'admin_user_search_input': { api: '/admin/api/users', render: renderUsersTable },
        'admin_artwork_search_input': { api: '/admin/api/artworks', render: renderArtworksTable },
        'admin_order_search_input': { api: '/admin/api/orders', render: renderOrdersTable }
    };

    Object.keys(searchConfig).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Debounce the search to avoid spamming the server
            input.addEventListener('input', debounce(function(e) {
                const searchTerm = e.target.value.trim();
                const config = searchConfig[inputId];
                
                // Show loading spinner in the table
                showTableLoading(inputId);

                fetch(`${config.api}?search=${encodeURIComponent(searchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        config.render(data);
                        // Re-attach event listeners for the new buttons
                        if(inputId.includes('user')) initUserManagement();
                        if(inputId.includes('artwork')) initArtworkManagement();
                        if(inputId.includes('order')) initOrderManagement();
                    })
                    .catch(err => console.error('Search failed:', err));
            }, 500));
        }
    });
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// --- 2. RENDERING FUNCTIONS (Reused by Search & Refresh) ---

function renderUsersTable(users) {
    const tbody = document.querySelector('#admin_users_table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No users found</td></tr>`;
        return;
    }

    users.forEach(user => {
        const roleBadge = user.role === 'admin' ? 'primary' : (user.role === 'artist' ? 'success' : 'secondary');
        const row = `
            <tr>
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td><span class="badge badge-${roleBadge}">${user.role}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary admin-user-edit-btn" 
                            data-email="${user.email}" data-name="${user.name}" data-role="${user.role}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger admin-user-delete-btn" data-email="${user.email}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

function renderArtworksTable(artworks) {
    const tbody = document.querySelector('#admin_artworks_table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!artworks || artworks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No artworks found</td></tr>`;
        return;
    }

    artworks.forEach(art => {
        const row = `
            <tr>
                <td>${art.title}</td>
                <td>${art.artist_name || 'Unknown'}</td>
                <td><span class="badge badge-success">₹${parseFloat(art.price).toFixed(2)}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary admin-artwork-edit-btn"
                                data-id="${art.art_id}" data-title="${art.title}" data-price="${art.price}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger admin-artwork-delete-btn" data-id="${art.art_id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

//

function renderOrdersTable(orders) {
    const tbody = document.querySelector('#admin_orders_table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No orders found</td></tr>`;
        return;
    }

    orders.forEach(order => {
        // Determine badge color based on status
        let badgeClass = 'secondary';
        if (order.order_status === 'completed') badgeClass = 'success';
        if (order.order_status === 'pending') badgeClass = 'warning';
        if (order.order_status === 'cancelled') badgeClass = 'danger';

        const row = `
            <tr>
                <td>#${order.order_id}</td>
                <td>${order.email}</td>
                <td><span class="badge badge-success">₹${parseFloat(order.total_price).toFixed(2)}</span></td>
                <td><span class="badge badge-${badgeClass}">${order.order_status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary admin-order-view-btn" 
                            data-id="${order.order_id}" 
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}
// --- 3. REFRESH BUTTONS ---
function initRefreshButtons() {
    // Only refresh makes an API call now
    const bindRefresh = (btnId, api, renderFunc, reInitFunc) => {
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.addEventListener('click', () => {
                btn.classList.add('loading');
                fetch(api)
                    .then(res => res.json())
                    .then(data => {
                        renderFunc(data);
                        if(reInitFunc) reInitFunc();
                    })
                    .finally(() => btn.classList.remove('loading'));
            });
        }
    };

    bindRefresh('refresh-users', '/admin/api/users', renderUsersTable, initUserManagement);
    bindRefresh('refresh-artworks', '/admin/api/artworks', renderArtworksTable, initArtworkManagement);
    bindRefresh('refresh-orders', '/admin/api/orders', renderOrdersTable, initOrderManagement);
}

// ... Keep your existing initUserManagement, initArtworkManagement, etc. ...
// ... Keep initMobileSidebar, showAlert ...

/**
 * Initialize user management
 */
function initUserManagement() {
    // User search functionality
    const userSearchInput = document.getElementById('admin_user_search_input');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#admin_users_table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // User delete button click
    document.querySelectorAll('.admin-user-delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            
            if (confirm(`Are you sure you want to delete user with email: ${email}?`)) {
                // Show loading state
                this.classList.add('loading');
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-spinner fa-spin';
                }
                
                // Send delete request
                fetch('/admin/users/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Reload users data
                        loadUsersData();
                        
                        // Show success message
                        showAlert('User deleted successfully', 'success');
                    } else {
                        showAlert('Error: ' + (data.message || 'Failed to delete user'), 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('An error occurred while deleting the user', 'danger');
                })
                .finally(() => {
                    // Remove loading state
                    this.classList.remove('loading');
                    if (icon) {
                        icon.className = 'fas fa-trash';
                    }
                });
            }
        });
    });
    
    // User edit button click
    document.querySelectorAll('.admin-user-edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            const name = this.getAttribute('data-name');
            const role = this.getAttribute('data-role');
            
            // Populate the edit modal with user data
            document.getElementById('admin_user_edit_email').value = email;
            document.getElementById('admin_user_edit_name').value = name;
            
            // Set the correct role option as selected
            const roleSelect = document.getElementById('admin_user_edit_role');
            for (let i = 0; i < roleSelect.options.length; i++) {
                if (roleSelect.options[i].value === role) {
                    roleSelect.options[i].selected = true;
                    break;
                }
            }
            
            // Show the edit modal
            const modal = new bootstrap.Modal(document.getElementById('admin_user_edit_modal'));
            modal.show();
        });
    });
    
    // Add this code for the edit form submission
    const userEditForm = document.getElementById('admin_user_edit_form');
    if (userEditForm) {
        console.log('User edit form found:', userEditForm);
        userEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('admin_user_edit_email').value;
            const name = document.getElementById('admin_user_edit_name').value;
            const role = document.getElementById('admin_user_edit_role').value;
            
            console.log('Sending update request with data:', { email, name, role });
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';
            submitBtn.disabled = true;
            
            // Send update request
            fetch('/admin/users/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    role: role
                })
            })
            .then(response => {
                console.log('Response received:', response);
                return response.json();
            })
            .then(data => {
                console.log('Data received:', data);
                // Hide the modal
                const modalElement = document.getElementById('admin_user_edit_modal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal.hide();
                
                if (data.status === 'success') {
                    // Reload users data
                    loadUsersData();
                    
                    // Show success message
                    showAlert('User updated successfully', 'success');
                } else {
                    showAlert('Error: ' + (data.message || 'Failed to update user'), 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred while updating the user', 'danger');
            })
            .finally(() => {
                // Restore button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    } else {
        console.error('User edit form not found');
    }
}

// Make sure to call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize artwork management
    initArtworkManagement();
    
    // Initialize order management
    initOrderManagement();
    
    // Initialize user management
    initUserManagement();
    
    // Load users data if on the users page
    if (document.getElementById('admin_users_table')) {
        loadUsersData();
    }
});

/**
 * Load users data
 */
function loadUsersData() {
    const usersTable = document.querySelector('#admin_users_table tbody');
    if (!usersTable) return;
    
    // Show loading state
    usersTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Loading users...</p>
                </div>
            </td>
        </tr>
    `;
    
    // Fetch users data
    fetch('/admin/api/users')
        .then(response => response.json())
        .then(users => {
            usersTable.innerHTML = '';
            
            if (users.length === 0) {
                usersTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            <div class="py-4">
                                <i class="fas fa-users fa-2x text-muted mb-3"></i>
                                <p class="text-muted">No users found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            users.forEach(user => {
                const row = document.createElement('tr');
                const roleClass = user.role === 'admin' ? 'primary' : user.role === 'artist' ? 'success' : 'secondary';
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.name}</td>
                    <td>
                        <span class="badge badge-${roleClass}">${user.role}</span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-primary admin-user-edit-btn"
                                    data-email="${user.email}"
                                    data-name="${user.name}"
                                    data-role="${user.role}"
                                    title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger admin-user-delete-btn"
                                    data-email="${user.email}"
                                    title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                usersTable.appendChild(row);
            });
            
            // Re-initialize user management for new buttons
            initUserManagement();
        })
        .catch(error => {
            console.error('Error loading users:', error);
            usersTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="py-4">
                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                            <p class="text-danger">Error loading users</p>
                        </div>
                    </td>
                </tr>
            `;
        });
}

/**
 * Initialize artwork management
 */
function initArtworkManagement() {
    // Artwork search functionality
    const artworkSearchInput = document.getElementById('admin_artwork_search_input');
    if (artworkSearchInput) {
        artworkSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#admin_artworks_table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Artwork edit button click
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('admin-artwork-edit-btn')) {
            const id = e.target.getAttribute('data-id');
            const title = e.target.getAttribute('data-title');
            const price = e.target.getAttribute('data-price');
            
            document.getElementById('admin_artwork_edit_id').value = id;
            document.getElementById('admin_artwork_edit_title').value = title;
            document.getElementById('admin_artwork_edit_price').value = price;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('admin_artwork_edit_modal'));
            modal.show();
        }
    });
    
    // Artwork delete button click
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('admin-artwork-delete-btn')) {
            const id = e.target.getAttribute('data-id');
            
            document.getElementById('admin_artwork_delete_id').value = id;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('admin_artwork_delete_modal'));
            modal.show();
        }
    });
    
    // Artwork save button
    const saveArtworkBtn = document.getElementById('admin_artwork_save_button');
    if (saveArtworkBtn) {
        saveArtworkBtn.addEventListener('click', function() {
            const id = document.getElementById('admin_artwork_edit_id').value;
            const title = document.getElementById('admin_artwork_edit_title').value;
            const price = document.getElementById('admin_artwork_edit_price').value;
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';
            this.disabled = true;
            
            // Send update request
            fetch('/admin/artworks/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    title: title,
                    price: price
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success || data.status === 'success') {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('admin_artwork_edit_modal'));
                    modal.hide();
                    
                    // Reload artworks data
                    loadArtworksData();
                    
                    // Show success message
                    showAlert('Artwork updated successfully', 'success');
                } else {
                    showAlert('Error: ' + (data.message || data.error), 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred', 'danger');
            })
            .finally(() => {
                // Restore button state
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    }
    
    // Artwork delete confirmation
    const deleteArtworkBtn = document.getElementById('admin_artwork_confirm_delete_button');
    if (deleteArtworkBtn) {
        deleteArtworkBtn.addEventListener('click', function() {
            const id = document.getElementById('admin_artwork_delete_id').value;
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Deleting...';
            this.disabled = true;
            
            // Send delete request
            fetch('/admin/artworks/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success || data.status === 'success') {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('admin_artwork_delete_modal'));
                    modal.hide();
                    
                    // Reload artworks data
                    loadArtworksData();
                    
                    // Show success message
                    showAlert('Artwork deleted successfully', 'success');
                } else {
                    showAlert('Error: ' + (data.message || data.error), 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred', 'danger');
            })
            .finally(() => {
                // Restore button state
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    }
}

/**
 * Load artworks data
 */
function loadArtworksData() {
    const artworksTable = document.querySelector('#admin_artworks_table tbody');
    if (!artworksTable) return;
    
    // Show loading state
    artworksTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Loading artworks...</p>
                </div>
            </td>
        </tr>
    `;
    
    // Fetch artworks data
    fetch('/admin/api/artworks')
        .then(response => response.json())
        .then(artworks => {
            artworksTable.innerHTML = '';
            
            if (artworks.length === 0) {
                artworksTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            <div class="py-4">
                                <i class="fas fa-palette fa-2x text-muted mb-3"></i>
                                <p class="text-muted">No artworks found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            artworks.forEach(artwork => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${artwork.title}</td>
                    <td>${artwork.artist || 'Unknown'}</td>
                    <td>
                        <span class="badge badge-success">₹${parseFloat(artwork.price).toFixed(2)}</span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-primary admin-artwork-edit-btn"
                                    data-id="${artwork.art_id}" 
                                    data-title="${artwork.title}" 
                                    data-price="${artwork.price}"
                                    title="Edit Artwork">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger admin-artwork-delete-btn" 
                                    data-id="${artwork.art_id}"
                                    title="Delete Artwork">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                artworksTable.appendChild(row);
            });
            
            // Re-initialize artwork management for new buttons
            initArtworkManagement();
        })
        .catch(error => {
            console.error('Error loading artworks:', error);
            artworksTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="py-4">
                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                            <p class="text-danger">Error loading artworks</p>
                        </div>
                    </td>
                </tr>
            `;
        });
}

/**
 * Initialize order management
 */
function initOrderManagement() {
    // Order search functionality
    const orderSearchInput = document.getElementById('admin_order_search_input');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#admin_orders_table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Order view button click
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('admin-order-view-btn')) {
            const id = e.target.getAttribute('data-id');
            
            // Show loading state
            const originalText = e.target.innerHTML;
            e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            e.target.disabled = true;
            
            // Fetch order details
            fetch(`/admin/orders/details/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Populate order details modal
                        document.getElementById('admin_order_detail_id').textContent = data.order.order_id;
                        document.getElementById('admin_order_detail_status').textContent = data.order.order_status;
                        document.getElementById('admin_order_detail_total').textContent = parseFloat(data.order.total_price).toFixed(2);
                        document.getElementById('admin_order_detail_email').textContent = data.order.email;
                        
                        // Populate order items
                        const itemsTable = document.getElementById('admin_order_items');
                        itemsTable.innerHTML = '';
                        if (data.order.items && data.order.items.length > 0) {
                            data.order.items.forEach(item => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${item.title}</td>
                                    <td>₹${parseFloat(item.price).toFixed(2)}</td>
                                `;
                                itemsTable.appendChild(row);
                            });
                        } else {
                            itemsTable.innerHTML = '<tr><td colspan="2" class="text-center">No items found</td></tr>';
                        }
                        
                        // Show modal
                        const modal = new bootstrap.Modal(document.getElementById('admin_order_details_modal'));
                        modal.show();
                    } else {
                        showAlert('Error: ' + (data.message || data.error), 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('An error occurred', 'danger');
                })
                .finally(() => {
                    // Restore button state
                    e.target.innerHTML = originalText;
                    e.target.disabled = false;
                });
        }
    });
}

/**
 * Load orders data
 */
function loadOrdersData() {
    const ordersTable = document.querySelector('#admin_orders_table tbody');
    if (!ordersTable) return;
    
    // Show loading state
    ordersTable.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <div class="py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Loading orders...</p>
                </div>
            </td>
        </tr>
    `;
    
    // Fetch orders data
    fetch('/admin/api/orders')
        .then(response => response.json())
        .then(orders => {
            ordersTable.innerHTML = '';
            
            if (orders.length === 0) {
                ordersTable.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <div class="py-4">
                                <i class="fas fa-shopping-cart fa-2x text-muted mb-3"></i>
                                <p class="text-muted">No orders found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            orders.forEach(order => {
                const statusClass = order.order_status === 'completed' ? 'success' : 
                                  order.order_status === 'pending' ? 'warning' : 'info';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.email}</td>
                    <td>
                        <span class="badge badge-success">₹${parseFloat(order.total_price).toFixed(2)}</span>
                    </td>
                    <td>
                        <span class="badge badge-${statusClass}">${order.order_status}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-order-view-btn" 
                                data-id="${order.order_id}"
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                ordersTable.appendChild(row);
            });
            
            // Re-initialize order management for new buttons
            initOrderManagement();
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="py-4">
                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                            <p class="text-danger">Error loading orders</p>
                        </div>
                    </td>
                </tr>
            `;
        });
}

/**
 * Initialize settings form
 */
//
function initSettingsForm() {
    const settingsForm = document.getElementById('admin_settings_form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            // Checkbox fix: FormData doesn't send unchecked boxes, so we manually check
            if(!this.querySelector('[name="setting_artist_approval"]').checked) {
                formData.append('setting_artist_approval', 'off');
            } else {
                 formData.set('setting_artist_approval', 'on');
            }

            if(!this.querySelector('[name="setting_maintenance_mode"]').checked) {
                formData.append('setting_maintenance_mode', 'off');
            } else {
                 formData.set('setting_maintenance_mode', 'on');
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';
            submitBtn.disabled = true;
            
            fetch('/admin/settings/update', { // Updated URL
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showAlert('Settings updated successfully', 'success');
                } else {
                    showAlert('Error: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred', 'danger');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }
}

/**
 * Show an alert message
 */
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.admin-main .container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        document.body.appendChild(alertDiv);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

/**
 * Initialize alert dismissal
 */
function initAlerts() {
    document.querySelectorAll('.alert .btn-close').forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        });
    });
}