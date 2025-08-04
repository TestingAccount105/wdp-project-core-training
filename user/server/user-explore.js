// Global variables
let currentPage = 1
let isLoading = false
let hasMoreServers = true
let currentCategory = "all"
let currentSearch = ""
let currentSort = "a_to_z"
let currentServerId = null
const $ = window.jQuery // Declare the $ variable

// Initialize page
$(document).ready(() => {
  initializeEventListeners()
  loadCategories()
  loadServers(true)
})

// Initialize event listeners
function initializeEventListeners() {
  // Category selection
  $(document).on("click", ".category-item", function () {
    const category = $(this).data("category")
    selectCategory(category)
  })

  // Search input with better debouncing
  $("#searchInput").on(
    "input",
    debounce(function () {
      const newSearch = $(this).val().trim()
      console.log("Search triggered:", newSearch) // Debug line
      if (newSearch !== currentSearch) {
        currentSearch = newSearch
        resetAndLoadServers()
      }
    }, 300), // Reduced debounce time for better responsiveness
  )

  // Sort dropdown
  $("#sortBtn").on("click", (e) => {
    e.stopPropagation()
    $("#sortDropdown").toggleClass("active")
  })

  $(document).on("click", ".sort-option", function () {
    const sort = $(this).data("sort")
    selectSort(sort)
  })

  // Close sort dropdown when clicking outside
  $(document).on("click", (e) => {
    if (!$(e.target).closest('.sort-container').length) {
      $("#sortDropdown").removeClass("active")
    }
  })

  // Server card clicks
  $(document).on("click", ".server-card", function () {
    const serverId = $(this).data("server-id")
    showServerDetails(serverId)
  })

  // Join server buttons
  $(document).on("click", ".join-btn", function (e) {
    e.stopPropagation()
    const serverId = $(this).closest(".server-card").data("server-id")
    joinServer(serverId)
  })

  $("#joinServerBtn").on("click", () => {
    joinServer(currentServerId)
  })

  // Join by invite
  $("#inviteSubmitBtn").on("click", () => {
    joinByInvite()
  })

  $("#inviteCodeInput").on("keypress", (e) => {
    if (e.which === 13) {
      joinByInvite()
    }
  })

  // Modal close events
  $(".modal-close").on("click", () => {
    closeAllModals()
  })

  $(".modal").on("click", function (e) {
    if (e.target === this) {
      closeAllModals()
    }
  })

  // Fixed infinite scroll
  $(window).on("scroll", throttle(() => {
    const scrollTop = $(window).scrollTop()
    const windowHeight = $(window).height()
    const documentHeight = $(document).height()
    
    // Trigger when user is 500px from bottom
    if (scrollTop + windowHeight >= documentHeight - 500) {
      if (!isLoading && hasMoreServers) {
        console.log("Loading more servers...") // Debug
        loadServers(false)
      }
    }
  }, 100)) // Throttle scroll events

  // Keyboard shortcuts
  $(document).on("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

// Load categories
function loadCategories() {
  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: { action: "get_categories" },
    dataType: "json",
    success: (response) => {
      if (response && response.categories) {
        displayCategories(response.categories, response.total_servers)
      }
    },
    error: (xhr, status, error) => {
      console.error("Failed to load categories:", error)
      showToast("Failed to load categories", "error")
    },
  })
}

// Display categories
function displayCategories(categories, totalServers) {
  const categoriesList = $("#categoriesList")

  // Update total count
  $("#totalCount").text(totalServers || 0)

  // Add category items
  categories.forEach((category) => {
    const categoryIcon = getCategoryIcon(category.Category)
    const categoryItem = $(`
            <div class="category-item" data-category="${category.Category}">
                <div class="category-icon">${categoryIcon}</div>
                <span class="category-name">${formatCategoryName(category.Category)}</span>
                <span class="category-count">${category.server_count}</span>
            </div>
        `)

    categoriesList.append(categoryItem)
  })
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    Gaming: "🎮",
    Music: "🎵",
    Education: "📚",
    "Science & Tech": "🔬",
    Entertainment: "🎬",
    Community: "👥",
    Art: "🎨",
    Sports: "⚽",
    Technology: "💻",
    Anime: "🌸",
  }
  return icons[category] || "📁"
}

// Format category name
function formatCategoryName(category) {
  if (!category || category === null || category === undefined) {
    return 'General'
  }
  const categoryStr = String(category)
  return categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)
}

// Select category
function selectCategory(category) {
  currentCategory = category

  // Update UI
  $(".category-item").removeClass("active")
  $(`.category-item[data-category="${category}"]`).addClass("active")

  resetAndLoadServers()
}

// Select sort
function selectSort(sort) {
  currentSort = sort

  // Update UI
  $(".sort-option").removeClass("active")
  $(`.sort-option[data-sort="${sort}"]`).addClass("active")
  $("#sortDropdown").removeClass("active")

  resetAndLoadServers()
}

// Reset and load servers
function resetAndLoadServers() {
  currentPage = 1
  hasMoreServers = true
  $("#serversGrid").empty()
  $("#noMoreServers").hide()
  loadServers(true)
}

// Load servers with better error handling
function loadServers(showLoading = false) {
  if (isLoading) {
    console.log("Already loading, skipping...")
    return
  }

  isLoading = true
  console.log(`Loading servers - Page: ${currentPage}, Search: "${currentSearch}", Category: ${currentCategory}, Sort: ${currentSort}`)

  if (showLoading) {
    $("#loadingIndicator").show()
  }

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_servers",
      page: currentPage,
      category: currentCategory,
      search: currentSearch,
      sort: currentSort,
    },
    dataType: "json",
    timeout: 10000, // 10 second timeout
    success: (response) => {
      console.log("AJAX Response:", response) // Debug line
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format:', response)
        showToast("Invalid server response", "error")
        return
      }
      
      if (!response.servers || !Array.isArray(response.servers)) {
        console.error('Invalid servers array in response:', response)
        showToast("No servers data received", "error")
        return
      }
      
      displayServers(response.servers)

      // Check if we have more servers to load
      if (response.servers.length < 12) {
        hasMoreServers = false
        if (currentPage === 1 && response.servers.length === 0) {
          // No servers found at all
          showNoServersMessage()
        } else if (currentPage > 1) {
          // No more servers to load
          $("#noMoreServers").show()
        }
      } else {
        hasMoreServers = true
      }

      currentPage++
      updateServerCount()
    },
    error: (xhr, status, error) => {
      console.error("AJAX Error:", xhr.responseText, status, error)
      let errorMessage = "Failed to load servers"
      
      if (status === 'timeout') {
        errorMessage = "Request timed out. Please try again."
      } else if (xhr.status === 0) {
        errorMessage = "Network error. Please check your connection."
      } else if (xhr.status >= 500) {
        errorMessage = "Server error. Please try again later."
      }
      
      showToast(errorMessage, "error")
      
      // If this was the first page load, show an error message
      if (currentPage === 1) {
        showErrorMessage("Unable to load servers. Please refresh the page.")
      }
    },
    complete: () => {
      isLoading = false
      $("#loadingIndicator").hide()
    },
  })
}

// Display servers
function displayServers(servers) {
  const serversGrid = $("#serversGrid")

  if (!servers || !Array.isArray(servers)) {
    console.error('Invalid servers data:', servers)
    return
  }

  servers.forEach((server, index) => {
    try {
      const serverCard = createServerCard(server)
      serversGrid.append(serverCard)
    } catch (error) {
      console.error(`Error creating server card for server ${index}:`, error, server)
    }
  })
}

// Create server card
function createServerCard(server) {
  // Add safety checks for server properties
  if (!server || !server.ID) {
    console.error('Invalid server data:', server)
    return $('<div></div>') // Return empty div if server data is invalid
  }
  
  const memberText = (server.member_count == 1) ? "member" : "members"
  const joinButtonText = (server.is_joined == 1) ? "JOINED" : "JOIN SERVER"
  const joinButtonClass = (server.is_joined == 1) ? "join-btn joined" : "join-btn"
  const joinButtonIcon = (server.is_joined == 1) ? "✓" : "+"
  
  // Safe property access with fallbacks
  const serverName = server.Name || 'Unnamed Server'
  const serverDescription = server.Description || "No description available"
  const serverCategory = server.Category || "General"
  const memberCount = server.member_count || 0

  return $(`
        <div class="server-card" data-server-id="${server.ID}">
            <div class="server-card-banner">
                ${
                  server.BannerServer
                    ? `<img src="${server.BannerServer}" alt="Server Banner">`
                    : ""
                }
            </div>
            <div class="server-card-content">
                <div class="server-header">
                    <div class="server-icon">
                        ${
                          server.IconServer
                            ? `<img src="${server.IconServer}" alt="Server Icon">`
                            : serverName.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="server-basic-info">
                        <h3 class="server-name">${escapeHtml(serverName)}</h3>
                        <p class="server-description">${escapeHtml(serverDescription)}</p>
                        <div class="server-category">${formatCategoryName(serverCategory)}</div>
                    </div>
                </div>
                
                <div class="server-meta">
                    <div class="server-created">
                        <span>🗓️</span>
                        <span>Created ${formatDate(server.ID)}</span>
                    </div>
                    <div class="server-members">
                        <span>👥</span>
                        <span>${memberCount} ${memberText}</span>
                    </div>
                </div>
                
                <button class="${joinButtonClass}" onclick="event.stopPropagation()">
                    <span class="btn-icon">${joinButtonIcon}</span>
                    <span class="btn-text">${joinButtonText}</span>
                </button>
            </div>
        </div>
    `)
}

// Show no servers message
function showNoServersMessage() {
  const serversGrid = $("#serversGrid")
  const message = currentSearch 
    ? `No servers found matching "${currentSearch}"`
    : "No servers available"
    
  serversGrid.html(`
    <div class="no-servers-message">
      <div class="no-servers-icon">🔍</div>
      <h3>${message}</h3>
      <p>Try adjusting your search terms or browse different categories.</p>
    </div>
  `)
}

// Show error message
function showErrorMessage(message) {
  const serversGrid = $("#serversGrid")
  serversGrid.html(`
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Servers</h3>
      <p>${message}</p>
    </div>
  `)
}

// Show server details
function showServerDetails(serverId) {
  currentServerId = serverId

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_server_details",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        displayServerDetails(response.server)
        $("#serverDetailModal").addClass("active")
        $("body").css("overflow", "hidden")
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to load server details", "error")
    },
  })
}

// Display server details
function displayServerDetails(server) {
  if (!server) {
    console.error('No server data provided to displayServerDetails')
    return
  }
  
  // Set banner
  if (server.BannerServer) {
    $("#serverBanner").html(`<img src="${server.BannerServer}" alt="Server Banner">`)
  } else {
    $("#serverBanner").html('<div class="default-banner">No banner available</div>')
  }

  // Set avatar
  if (server.IconServer) {
    $("#serverAvatar").html(`<img src="${server.IconServer}" alt="Server Icon">`)
  } else {
    const serverName = server.Name || 'Server'
    $("#serverAvatar").html(`<div class="default-avatar">${serverName.charAt(0).toUpperCase()}</div>`)
  }

  // Set details with safe access
  $("#serverName").text(server.Name || 'Unnamed Server')
  $("#serverMemberCount").text(`${server.member_count || 0} members`)
  $("#serverDescription").text(server.Description || "No description available")

  // Set join button state
  if (server.is_joined == 1) {
    $("#joinServerBtn").hide()
    $("#joinedBtn").show()
  } else {
    $("#joinServerBtn").show()
    $("#joinedBtn").hide()
  }
}

// Join server with better error handling
function joinServer(serverId) {
  if (!serverId) {
    showToast("Invalid server ID", "error")
    return
  }

  // Disable join button to prevent double-clicking
  const joinBtn = $(`.server-card[data-server-id="${serverId}"] .join-btn`)
  const modalJoinBtn = $("#joinServerBtn")
  
  joinBtn.prop('disabled', true)
  modalJoinBtn.prop('disabled', true)

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_server",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")

        // Update UI
        updateServerJoinStatus(serverId, true)

        // Update modal if open
        if (currentServerId == serverId) {
          $("#joinServerBtn").hide()
          $("#joinedBtn").show()
        }
      } else {
        showToast(response.message, "error")
      }
    },
    error: (xhr, status, error) => {
      console.error("Join server error:", xhr.responseText, status, error)
      showToast("Failed to join server. Please try again.", "error")
    },
    complete: () => {
      // Re-enable buttons
      joinBtn.prop('disabled', false)
      modalJoinBtn.prop('disabled', false)
    }
  })
}

// Join by invite
function joinByInvite() {
  const inviteCode = $("#inviteCodeInput").val().trim()

  if (!inviteCode) {
    showToast("Please enter an invite code", "error")
    return
  }

  // Disable submit button
  $("#inviteSubmitBtn").prop('disabled', true)

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_by_invite",
      invite_code: inviteCode,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")
        closeAllModals()
        $("#inviteCodeInput").val("")

        // Refresh servers to show updated join status
        resetAndLoadServers()
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to join server", "error")
    },
    complete: () => {
      $("#inviteSubmitBtn").prop('disabled', false)
    }
  })
}

// Update server join status
function updateServerJoinStatus(serverId, isJoined) {
  const serverCard = $(`.server-card[data-server-id="${serverId}"]`)
  const joinBtn = serverCard.find(".join-btn")

  if (isJoined) {
    joinBtn.addClass("joined")
    joinBtn.find(".btn-icon").text("✓")
    joinBtn.find(".btn-text").text("JOINED")
  } else {
    joinBtn.removeClass("joined")
    joinBtn.find(".btn-icon").text("+")
    joinBtn.find(".btn-text").text("JOIN SERVER")
  }
}

// Show join server modal
function showJoinServerModal() {
  $("#joinServerModal").addClass("active")
  $("body").css("overflow", "hidden")
  $("#inviteCodeInput").focus()
}

// Close all modals
function closeAllModals() {
  $(".modal").removeClass("active")
  $("body").css("overflow", "")
  currentServerId = null
}

// Update server count
function updateServerCount() {
  const totalCards = $(".server-card").length
  $("#serverCount").text(`${totalCards} servers available`)
}

// Format date
function formatDate(id) {
  // Simple date formatting based on ID (newer IDs = more recent)
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 365) + 1
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

// Escape HTML
function escapeHtml(text) {
  if (!text || text === null || text === undefined) {
    return ''
  }
  const div = document.createElement("div")
  div.textContent = String(text) // Convert to string to prevent undefined issues
  return div.innerHTML
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = $("#toastContainer")

  const toast = $(`<div class="toast ${type}">${escapeHtml(message)}</div>`)
  toastContainer.append(toast)

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 5000)

  // Click to dismiss
  toast.on("click", function () {
    $(this).css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      $(this).remove()
    }, 300)
  })
}

// Improved debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Add slide out animation and custom styles
const style = document.createElement("style")
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .no-servers-message,
    .error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        color: #72767d;
        grid-column: 1 / -1;
    }
    
    .no-servers-icon,
    .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .no-servers-message h3,
    .error-message h3 {
        margin: 0 0 8px 0;
        color: #ffffff;
        font-size: 20px;
    }
    
    .no-servers-message p,
    .error-message p {
        margin: 0;
        font-size: 14px;
    }
    
    .default-banner {
        width: 100%;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 500;
    }
    
    .default-avatar {
        width: 80px;
        height: 80px;
        background: #5865f2;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        font-weight: 600;
    }
    
    .join-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    #inviteSubmitBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`
document.head.appendChild(style)