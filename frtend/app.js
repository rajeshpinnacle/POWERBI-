async function uploadFile() {
  const fileInput = document.getElementById('file');
  const tableInput = document.getElementById('table');
  const uploadButton = document.getElementById('uploadButton');
  const loading = document.getElementById('loading');
  const resetButton = document.getElementById('resetButton');
  const progressBar = document.getElementById('progress');
  const progressText = document.getElementById('progressPercentage');
  const file = fileInput.files[0];
  const tableName = tableInput.value;

  // Check if file is selected
  if (!file) {
    console.log("No file selected.");
    showMessage('❌ Please select a file!', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('tableName', tableName);

  try {
    // Show Loading Spinner and Disable Button
    loading.style.display = 'block';
    uploadButton.disabled = true;
    resetButton.style.display = 'none';

    // Start Progress Bar
    updateProgress(10);

    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    console.log("Server response:", response);

    const result = await response.json();
    console.log("Result from server:", result);

    // Handle response based on success or failure
    if (response.ok) {
      console.log("Upload successful.");
      // Complete Progress
      updateProgress(100);

      // Show success message and popup after 1 sec
      setTimeout(() => {
        showMessage(`🎉 Success: ${result.message}`, 'success');
        showPopup(`🎉 Success: Data uploaded successfully to ${tableName}`);
      }, 1000);

      // Show "Upload Another File" button
      setTimeout(() => {
        resetButton.style.display = 'block';
      }, 1500);
    } else {
      console.log("Error in upload:", result.message || 'Upload failed');
      showMessage(`❌ Error: ${result.message || 'Upload failed'}`, 'error');
    }
  } catch (error) {
    console.log("Error during upload:", error);
    showMessage(`❌ Error uploading file: ${error.message}`, 'error');
  } finally {
    // Hide Loading and Enable Upload Button Again
    loading.style.display = 'none';
    uploadButton.disabled = false;
  }
}

// Function to show message dynamically
function showMessage(msg, type) {
  const messageBox = document.getElementById('message');
  messageBox.innerText = msg;
  messageBox.className = type;
  messageBox.style.display = 'block';

  // Hide message after 5 seconds for errors
  if (type !== 'success') {
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }
}

// Show success popup dynamically
function showPopup(msg) {
  alert(msg);
}

// Update progress bar dynamically
function updateProgress(value) {
  const progressBar = document.getElementById('progress');
  const progressText = document.getElementById('progressPercentage');

  progressBar.style.width = value + '%';
  progressText.innerText = `${value}%`;

  if (value === 100) {
    setTimeout(() => {
      showMessage('🎉 File uploaded successfully!', 'success');
    }, 500);
  }
}

// Reset form to upload another file without refreshing the page
function resetForm() {
  document.getElementById('file').value = '';
  document.getElementById('table').selectedIndex = 0;
  updateProgress(0);
  document.getElementById('message').style.display = 'none';
  document.getElementById('resetButton').style.display = 'none';
}

// ✅ Redirect to login if not authenticated
window.onload = function () {
  if (localStorage.getItem('isAuthenticated') !== 'true') {
    window.location.href = 'login.html';
  }
};

// ✅ Navigate to Routes
function navigateTo(route) {
  if (route === '🏠 TMT') {
    window.open('http://52.35.69.115/TMT/ui#/', '_blank');
  } else if (route === '📥 Upload Excel') {
    window.location.href = 'index.html';
  } else if (route === '📊 PowerBI') {
    window.location.href = 'powerbi.html';
  } else if (route === '🌐 AWS') {
    window.open('https://ap-south-1.console.aws.amazon.com/rds/home?region=ap-south-1#database:id=database-1;is-cluster=false;tab=monitoring', '_blank');
  } else if (route === '👥 Team Credit') {
    window.location.href = 'team.html';
  }
}

// ✅ Logout and Clear Session
function logout() {
  localStorage.removeItem('isAuthenticated');
  window.location.href = 'login.html';
}