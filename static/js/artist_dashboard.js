
// Use an immediately invoked function expression (IIFE) to avoid global namespace pollution
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize the dashboard
        ArtistDashboard.init();
    });

    // Namespace for Artist Dashboard functionality
    window.ArtistDashboard = {
        // Initialize all dashboard functionality
        init: function() {
            this.setupFlashMessages();
            this.setupDeleteConfirmation();
            this.setupImagePreview();
            this.setupTableSorting();
            this.setupResponsiveTable();
            this.setupEditPriceForm(); // Added for edit price functionality
        },

        // Handle flash message dismissal
        setupFlashMessages: function() {
            const closeButtons = document.querySelectorAll('.artist_dashboard__flash-close');
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const flashMessage = this.closest('.artist_dashboard__flash-message');
                    flashMessage.style.opacity = '0';
                    setTimeout(() => {
                        flashMessage.style.display = 'none';
                    }, 300);
                });
            });

            // Auto-hide flash messages after 5 seconds
            setTimeout(() => {
                const flashMessages = document.querySelectorAll('.artist_dashboard__flash-message');
                flashMessages.forEach(message => {
                    message.style.opacity = '0';
                    setTimeout(() => {
                        message.style.display = 'none';
                    }, 300);
                });
            }, 5000);
        },

        // Confirm before deleting artwork
        setupDeleteConfirmation: function() {
            const deleteForms = document.querySelectorAll('.artist_dashboard__delete-form');
            deleteForms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault(); // Prevent default form submission
                    
                    const confirmed = confirm('Are you sure you want to delete this artwork? This action cannot be undone.');
                    if (confirmed) {
                        // If confirmed, submit the form using fetch API
                        fetch(form.action, {
                            method: 'POST',
                            body: new FormData(form)
                        })
                        .then(response => {
                            if (response.redirected) {
                                window.location.href = response.url;
                            } else {
                                return response.text().then(text => {
                                    throw new Error(text || 'Failed to delete artwork');
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Delete error:', error);
                            ArtistDashboard.showToast('Error deleting artwork. Please try again.', 'error');
                        });
                    }
                });
            });
        },

        // Image preview on hover
        setupImagePreview: function() {
            const artImages = document.querySelectorAll('.artist_dashboard__art-image img');
            artImages.forEach(img => {
                img.addEventListener('mouseenter', function() {
                    this.style.zIndex = '100';
                    this.style.transform = 'scale(1.5)';
                    this.style.transition = 'transform 0.3s ease';
                    this.style.position = 'relative';
                });
                
                img.addEventListener('mouseleave', function() {
                    this.style.zIndex = '1';
                    this.style.transform = 'scale(1)';
                });
            });
        },

        // Table sorting functionality
        setupTableSorting: function() {
            const tableHeaders = document.querySelectorAll('.artist_dashboard__table th');
            tableHeaders.forEach((header, index) => {
                if (index < 2) { // Only add sorting to Title and Price columns
                    header.style.cursor = 'pointer';
                    header.addEventListener('click', function() {
                        this.sortTable(index);
                    }.bind(this));
                    
                    // Add sort indicator
                    const sortIndicator = document.createElement('span');
                    sortIndicator.className = 'artist_dashboard__sort-indicator';
                    sortIndicator.innerHTML = ' ↕️';
                    header.appendChild(sortIndicator);
                }
            });
        },
        
        // Sort table function
        sortTable: function(columnIndex) {
            const table = document.querySelector('.artist_dashboard__table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            // Skip if it's the empty state row
            if (rows.length === 1 && rows[0].querySelector('.artist_dashboard__empty-state')) {
                return;
            }
            
            // Get current sort direction
            const th = table.querySelectorAll('th')[columnIndex];
            const isAscending = th.getAttribute('data-sort') !== 'asc';
            
            // Update sort direction
            document.querySelectorAll('th').forEach(header => {
                header.removeAttribute('data-sort');
            });
            th.setAttribute('data-sort', isAscending ? 'asc' : 'desc');
            
            // Update sort indicators
            document.querySelectorAll('.artist_dashboard__sort-indicator').forEach(indicator => {
                indicator.innerHTML = ' ↕️';
            });
            th.querySelector('.artist_dashboard__sort-indicator').innerHTML = isAscending ? ' ↑' : ' ↓';
            
            // Sort the rows
            rows.sort((a, b) => {
                let aValue = a.querySelectorAll('td')[columnIndex].textContent.trim();
                let bValue = b.querySelectorAll('td')[columnIndex].textContent.trim();
                
                // Handle price sorting (remove currency symbol)
                if (columnIndex === 1) {
                    aValue = parseFloat(aValue.replace(/[₹,]/g, ''));
                    bValue = parseFloat(bValue.replace(/[₹,]/g, ''));
                }
                
                if (aValue < bValue) return isAscending ? -1 : 1;
                if (aValue > bValue) return isAscending ? 1 : -1;
                return 0;
            });
            
            // Reorder the rows
            rows.forEach(row => {
                tbody.appendChild(row);
            });
        },
        
        // Make table responsive
        setupResponsiveTable: function() {
            const handleResize = () => {
                const table = document.querySelector('.artist_dashboard__table');
                if (!table) return;
                
                if (window.innerWidth < 768) {
                    table.classList.add('artist_dashboard__table--mobile');
                    
                    // Add data labels to cells for mobile view
                    const headerTexts = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
                    
                    table.querySelectorAll('tbody tr').forEach(row => {
                        if (!row.querySelector('.artist_dashboard__empty-state')) {
                            row.querySelectorAll('td').forEach((cell, i) => {
                                if (!cell.getAttribute('data-label') && headerTexts[i]) {
                                    cell.setAttribute('data-label', headerTexts[i]);
                                }
                            });
                        }
                    });
                } else {
                    table.classList.remove('artist_dashboard__table--mobile');
                }
            };
            
            // Initial call and event listener
            handleResize();
            window.addEventListener('resize', handleResize);
        },

        // Handle edit price form submission
        setupEditPriceForm: function() {
            const editForm = document.getElementById('edit-price-form');
            if (editForm) {
                editForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    console.log('Edit price form submitted'); // Debug log

                    try {
                        const response = await fetch(editForm.action, {
                            method: 'POST',
                            body: new FormData(editForm),
                        });

                        if (response.redirected) {
                            this.showToast('Price updated successfully!', 'success');
                            window.location.href = response.url;
                        } else {
                            const error = await response.text();
                            console.error('Edit price failed:', error);
                            this.showToast('Price update failed. Please try again.', 'error');
                        }
                    } catch (error) {
                        console.error('Edit price error:', error);
                        this.showToast('Network error occurred. Please try again.', 'error');
                    }
                }.bind(this));
            }
        },

        // Show toast messages for user feedback
        showToast: function(message, type) {
            const toast = document.createElement('div');
            toast.classList.add('artist_dashboard__toast', `artist_dashboard__toast--${type}`);
            toast.innerText = message;
            document.body.appendChild(toast);

            // Apply basic styling for toast
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '4px';
            toast.style.color = '#fff';
            toast.style.zIndex = '1000';
            toast.style.opacity = '1';
            toast.style.transition = 'opacity 0.5s ease';

            // Style based on type
            if (type === 'success') {
                toast.style.backgroundColor = '#28a745';
            } else if (type === 'error') {
                toast.style.backgroundColor = '#dc3545';
            }

            // Remove toast after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }
    };
})();