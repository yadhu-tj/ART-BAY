document.addEventListener('DOMContentLoaded', () => {

    // --- TAB SWITCHING ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- PROFILE PICTURE UPLOAD ---
    const avatarContainer = document.querySelector('.avatar-container');
    const fileInput = document.getElementById('profile-pic-input');
    const avatarImg = document.querySelector('.avatar-img'); // For users with img
    // We might have a placeholder instead of img, so handle that

    if (avatarContainer && fileInput) {
        avatarContainer.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                // Determine upload endpoint (using relative path or from layout global var if exists)
                // Assuming /profile/upload-pic defined in backend
                const response = await fetch('/profile/upload-pic', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.status === 'success') {
                    // Update header/auth check? 
                    // Update image src
                    const newSrc = result.image_url + '?t=' + new Date().getTime(); // Prevent cache

                    // If we have an existing img, update src
                    if (avatarImg) {
                        avatarImg.src = newSrc;
                    } else {
                        // If we had a placeholder, replace it with an img
                        // But getting the element ref might be tricky if it wasn't there.
                        // Simplest: just reload page or better: replace innerHTML of container
                        avatarContainer.innerHTML = `
                            <img src="${newSrc}" alt="Profile Picture" class="avatar-img">
                            <div class="avatar-overlay">
                                <i class="fas fa-camera"></i>
                            </div>
                        `;
                    }
                    alert('Profile picture updated!');
                    // reload to update navbar?
                    // location.reload();
                } else {
                    alert('Upload failed: ' + result.message);
                }
            } catch (err) {
                console.error('Error uploading:', err);
                alert('An error occurred during upload.');
            }
        });
    }

    // --- INLINE NAME EDIT ---
    const nameContainer = document.querySelector('.user-name-container');
    let isEditing = false;

    if (nameContainer) {
        // Use event delegation for the icon click
        nameContainer.addEventListener('click', (e) => {
            // Check if closest element is our icon
            if (e.target.closest('.edit-name-icon')) {
                startEditing();
            }
        });

        function startEditing() {
            if (isEditing) return;
            isEditing = true;

            const nameElement = nameContainer.querySelector('.user-name');
            const currentName = nameElement.textContent.trim();

            // Create inputs
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'name-edit-input';

            const saveBtn = document.createElement('button');
            saveBtn.innerHTML = '<i class="fas fa-check"></i>';
            saveBtn.className = 'save-name-btn';

            // Swap Content
            nameContainer.innerHTML = '';
            nameContainer.appendChild(input);
            nameContainer.appendChild(saveBtn);

            input.focus();

            // Save Handler
            const saveName = async () => {
                const newName = input.value.trim();
                if (!newName) {
                    alert('Name cannot be empty');
                    return;
                }

                try {
                    const response = await fetch('/profile/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name: newName })
                    });

                    const result = await response.json();

                    if (result.status === 'success') {
                        location.reload();
                    } else {
                        alert('Update failed: ' + result.message);
                        resetView(currentName);
                    }
                } catch (err) {
                    console.error('Error updating name:', err);
                    alert('Error updating name.');
                    resetView(currentName);
                }
            };

            const resetView = (name) => {
                nameContainer.innerHTML = `
                    <h2 class="user-name">${name}</h2>
                    <i class="fas fa-pencil-alt edit-name-icon" title="Edit Name"></i>
                `;
                isEditing = false;
            }

            saveBtn.addEventListener('click', saveName);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveName();
            });
        }
    }

    // --- SHIPPING ADDRESS ---
    const addAddressBtn = document.getElementById('add-new-address-card');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', () => {
            // Simple prompt for now, or a modal. Let's do a modal injection.
            const modalHtml = `
                <div class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000; display:flex; justify-content:center; align-items:center;">
                    <div class="glass-card" style="width:400px; background:#222; border:1px solid #444;">
                        <h3>Add New Address</h3>
                        <form id="new-address-form" style="display:flex; flex-direction:column; gap:10px;">
                            <input type="text" name="name" placeholder="Full Name" class="form-input" required>
                            <input type="text" name="address" placeholder="Address Line" class="form-input" required>
                            <input type="text" name="city" placeholder="City" class="form-input" required>
                            <input type="text" name="zipcode" placeholder="Zip Code" class="form-input" required>
                            <input type="text" name="country" placeholder="Country" class="form-input" required>
                            <input type="text" name="phone" placeholder="Phone" class="form-input" required>
                            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
                                <button type="button" class="dark-btn" style="background:#444;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                                <button type="submit" class="dark-btn" style="background:var(--accent-orange); border:none;">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            document.getElementById('new-address-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                try {
                    // Reuse checkout/submit-shipping or create new specific profile endpoint?
                    // Usually safer to create new one or ensure checkout one works without cart context.
                    // Let's assume we need a new one: /profile/add-address
                    const response = await fetch('/profile/add-address', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (result.status === 'success') {
                        alert('Address added!');
                        location.reload();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (err) {
                    console.error(err);
                    alert("Failed to add address");
                }
            });
        });
    }

    // --- PASSWORD CHANGE ---
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('current-password').value;
            const newPass = document.getElementById('new-password').value;
            const confirmPass = document.getElementById('confirm-password').value;

            if (newPass !== confirmPass) {
                alert("New passwords don't match!");
                return;
            }

            try {
                const response = await fetch('/profile/security/password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_password: currentPass,
                        new_password: newPass
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    alert('Password updated successfully!');
                    passwordForm.reset();
                } else {
                    alert(result.message);
                }
            } catch (err) {
                console.error('Error changing password:', err);
                alert('Error processing request.');
            }
        });
    }

});
