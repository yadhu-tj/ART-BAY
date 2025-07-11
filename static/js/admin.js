/**
 * Admin Dashboard JavaScript
 * Handles all interactive functionality for the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar toggle for mobile
    initSidebar();
    
    // Initialize dashboard components based on active page
    const activePage = document.querySelector('.admin-nav-link.active');
    if (activePage) {
        const pageId = activePage.getAttribute('href').split('/').pop();
        
        switch(pageId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'users':
                loadUsersData();
                break;
            case 'artworks':
                loadArtworksData();
                break;
            case 'orders':
                loadOrdersData();
                break;
            case 'settings':
                initSettingsForm();
                break;
        }
    }
    
    // Initialize global components
    initAlerts();
});

/**
 * Initialize sidebar toggle functionality
 */
function initSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            document.getElementById('admin-content').classList.toggle('expanded');
        });
    }
}

/**
 * Load dashboard data and initialize dashboard components
 */
function loadDashboardData() {
    // Fetch and render dashboard metrics
    fetch('/admin/api/metrics')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert('Failed to load dashboard metrics: ' + data.error, 'danger');
                renderDashboardMetrics({ total_users: 0, total_artworks: 0, pending_artists: 0 });
            } else {
                renderDashboardMetrics(data);
            }
        })
        .catch(error => {
            console.error('Error loading metrics:', error);
            showAlert('Failed to load dashboard metrics', 'danger');
            renderDashboardMetrics({ total_users: 0, total_artworks: 0, pending_artists: 0 });
        });
}

/**
 * Render dashboard metrics to the UI
 */
function renderDashboardMetrics(metrics) {
    console.log('Rendering metrics:', metrics); // Debug log
    const cards = document.querySelectorAll('.admin-card');
    console.log('Cards found, count:', cards.length); // Debug log

    // Retry mechanism if cards aren't found immediately
    if (cards.length === 0) {
        setTimeout(() => {
            const retryCards = document.querySelectorAll('.admin-card');
            if (retryCards.length > 0) {
                renderCards(retryCards, metrics);
            } else {
                console.error('No .admin-card elements found after retry');
            }
        }, 100); // Retry after 100ms
        return;
    }

    renderCards(cards, metrics);
}

function renderCards(cards, metrics) {
    const usersCard = cards[0] ? cards[0].querySelector('.admin-card-body h3') : null;
    const artworksCard = cards[1] ? cards[1].querySelector('.admin-card-body h3') : null;
    const pendingArtistsCard = cards[2] ? cards[2].querySelector('.admin-card-body h3') : null;

    if (usersCard) usersCard.textContent = metrics.total_users || 0;
    if (artworksCard) artworksCard.textContent = metrics.total_artworks || 0;
    if (pendingArtistsCard) pendingArtistsCard.textContent = metrics.pending_artists || 0;

    cards.forEach(card => {
        if (!card.classList.contains('show')) {
            card.classList.add('show');
            // Fallback to force visibility if CSS transition fails
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
    console.log('Cards updated, count:', cards.length); // Debug log
}

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
                });
            }
        });
    });
    // Inside your initUserManagement function, add this code for the edit button functionality
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
    
    // Clear table
    usersTable.innerHTML = '<tr><td colspan="4" class="text-center">Loading users...</td></tr>';
    
    // Fetch users data
    fetch('/admin/api/users')
        .then(response => response.json())
        .then(users => {
            usersTable.innerHTML = '';
            
            if (users.length === 0) {
                usersTable.innerHTML = '<tr><td colspan="4" class="text-center">No users found</td></tr>';
                return;
            }
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.name}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-user-edit-btn"
                                data-email="${user.email}"
                                data-name="${user.name}"
                                data-role="${user.role}">Edit</button>
                        <button class="btn btn-sm btn-danger admin-user-delete-btn"
                                data-email="${user.email}">Delete</button>
                    </td>
                `;
                usersTable.appendChild(row);
            });
            
            // Re-initialize user management for new buttons
            initUserManagement();
        })
        .catch(error => {
            console.error('Error loading users:', error);
            usersTable.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading users</td></tr>';
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
            });
        });
    }
    
    // Artwork delete confirmation
    const deleteArtworkBtn = document.getElementById('admin_artwork_confirm_delete_button');
    if (deleteArtworkBtn) {
        deleteArtworkBtn.addEventListener('click', function() {
            const id = document.getElementById('admin_artwork_delete_id').value;
            
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
    
    // Clear table
    artworksTable.innerHTML = '<tr><td colspan="4" class="text-center">Loading artworks...</td></tr>';
    
    // Fetch artworks data
    fetch('/admin/api/artworks')
        .then(response => response.json())
        .then(artworks => {
            artworksTable.innerHTML = '';
            
            if (artworks.length === 0) {
                artworksTable.innerHTML = '<tr><td colspan="4" class="text-center">No artworks found</td></tr>';
                return;
            }
            
            artworks.forEach(artwork => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${artwork.title}</td>
                    <td>${artwork.artist || 'Unknown'}</td>
                    <td>₹${parseFloat(artwork.price).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-artwork-edit-btn"
                                data-id="${artwork.art_id}" 
                                data-title="${artwork.title}" 
                                data-price="${artwork.price}">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger admin-artwork-delete-btn" 
                                data-id="${artwork.art_id}">
                            Delete
                        </button>
                    </td>
                `;
                artworksTable.appendChild(row);
            });
            
            // Re-initialize artwork management for new buttons
            initArtworkManagement();
        })
        .catch(error => {
            console.error('Error loading artworks:', error);
            artworksTable.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading artworks</td></tr>';
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
    
    // Clear table
    ordersTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading orders...</td></tr>';
    
    // Fetch orders data
    fetch('/admin/api/orders')
        .then(response => response.json())
        .then(orders => {
            ordersTable.innerHTML = '';
            
            if (orders.length === 0) {
                ordersTable.innerHTML = '<tr><td colspan="5" class="text-center">No orders found</td></tr>';
                return;
            }
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.email}</td>
                    <td>₹${parseFloat(order.total_price).toFixed(2)}</td>
                    <td>${order.order_status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary admin-order-view-btn" 
                                data-id="${order.order_id}">
                            View
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
            ordersTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading orders</td></tr>';
        });
}

/**
 * Initialize settings form
 */
function initSettingsForm() {
    const settingsForm = document.getElementById('admin_settings_form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/admin/settings', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success || data.status === 'success') {
                    showAlert('Settings updated successfully', 'success');
                } else {
                    showAlert('Error: ' + (data.message || data.error), 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('An error occurred', 'danger');
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